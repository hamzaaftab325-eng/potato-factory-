import { synthesizeSound } from "./audio-synthesis.js";

const KINDS = ["wash", "cut", "fry", "tumble", "pack", "music", "truck"];

// Original procedural foley, not recordings. All events live on the same clock
// as the machine animation. Circular filters and wrapped tails preserve the loop.
export class FactorySound {
  constructor(ctx, { defer = false } = {}) {
    this.ctx = ctx;
    this.sources = [];
    this.buses = [];
    this.panners = [];
    this.filters = [];
    this.focusLevels = [];
    this.focus = 0;
    this.music = false;
    this.master = ctx.createGain();
    this.master.gain.value = 0.58;
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -10;
    limiter.knee.value = 10;
    limiter.ratio.value = 2.5;
    limiter.attack.value = 0.016;
    limiter.release.value = 0.22;
    this.master.connect(limiter);
    limiter.connect(ctx.destination);
    this.stems = KINDS.map((kind, k) => {
      const bus = ctx.createGain(),
        pan = ctx.createStereoPanner();
      const filter = ctx.createBiquadFilter?.();
      if (filter) {
        filter.type = "lowpass";
        filter.frequency.value = 9000;
        filter.Q.value = 0.45;
        bus.connect(filter);
        filter.connect(pan);
      } else bus.connect(pan);
      this.filters.push(filter);
      pan.connect(this.master);
      this.buses.push(bus);
      this.panners.push(pan);
      return defer ? null : this.synthesize(kind, k);
    });
    this.setFocus(0, true);
  }

  static async create(ctx) {
    const sound = new FactorySound(ctx, { defer: true });
    if (typeof Worker !== "undefined") {
      let worker;
      try {
        worker = new Worker(new URL("./audio-worker.js", import.meta.url), {
          type: "module",
        });
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(
            () => reject(new Error("Sound preparation timed out")),
            60000,
          );
          worker.onerror = (error) => {
            clearTimeout(timeout);
            reject(error);
          };
          worker.onmessage = ({ data }) => {
            if (data.error) {
              clearTimeout(timeout);
              reject(new Error(data.error));
              return;
            }
            const buffer = ctx.createBuffer(
              2,
              data.left.length,
              data.sampleRate,
            );
            buffer.getChannelData(0).set(data.left);
            buffer.getChannelData(1).set(data.right);
            sound.stems[data.index] = buffer;
            if (data.index === KINDS.length - 1) {
              clearTimeout(timeout);
              resolve();
            }
          };
          worker.postMessage({ sampleRate: ctx.sampleRate, kinds: KINDS });
        });
        worker.terminate();
        return sound;
      } catch {
        worker?.terminate();
        // Browsers that restrict workers still retain the original sound path.
      }
    }
    for (let i = 0; i < KINDS.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 0));
      sound.stems[i] = sound.synthesize(KINDS[i], i);
    }
    return sound;
  }

  synthesize(kind, seed) {
    return synthesizeSound(this.ctx, kind, seed);
  }

  setFocus(stage, immediate = false) {
    this.focus = stage;
    const parameter = (param, value) => {
      if (immediate) param.value = value;
      else param.setTargetAtTime(value, this.ctx.currentTime, 0.38);
    };
    this.buses.forEach((g, i) => {
      const value =
        i === 5
          ? this.music
            ? 0.55
            : 0
          : i === 6
            ? stage === 7
              ? 0
              : stage >= 5.5
                ? 0.85
                : stage === 0
                  ? 0.3
                  : 0.07
            : stage === 7
              ? 0
              : stage >= 5.5
                ? 0.06
                : stage === 0
                  ? 0.4
                  : 0.12 + 1.03 * Math.max(0, 1 - Math.abs(i + 1 - stage));
      this.focusLevels[i] = value;
      parameter(g.gain, value);
      const distance = i + 1 - stage;
      parameter(
        this.panners[i].pan,
        i === 5 || i === 6
          ? 0
          : stage === 0
            ? [-0.4, -0.23, 0, 0.23, 0.4][i]
            : Math.max(-0.6, Math.min(0.6, distance * 0.2)),
      );
    });
  }
  setSpatial(camera, right, truckPosition) {
    const sources = [
      [-10, 1.6, 0],
      [-5.3, 2, 0],
      [-0.5, 1.6, 0],
      [5.95, 2, 0],
      [12.5, 2, 0],
      null,
      truckPosition,
    ];
    for (let i = 0; i < sources.length; i++) {
      const source = sources[i];
      if (!source) continue;
      const dx = source[0] - camera.x,
        dy = source[1] - camera.y,
        dz = source[2] - camera.z;
      const distance = Math.hypot(dx, dy, dz);
      const near = 1 / (1 + Math.max(0, distance - 6) / 26);
      const pan = Math.max(
        -0.75,
        Math.min(
          0.75,
          (dx * right.x + dy * right.y + dz * right.z) / Math.max(1, distance),
        ),
      );
      this.panners[i].pan.setTargetAtTime(pan, this.ctx.currentTime, 0.18);
      this.buses[i].gain.setTargetAtTime(
        this.focusLevels[i] * near,
        this.ctx.currentTime,
        0.25,
      );
      this.filters[i]?.frequency.setTargetAtTime(
        1600 + 7400 * near,
        this.ctx.currentTime,
        0.25,
      );
    }
  }
  setMusic(enabled) {
    this.music = enabled;
    this.setFocus(this.focus);
  }
  start(time) {
    this.stop();
    this.startedAt = this.ctx.currentTime;
    this.stems.forEach((buffer, i) => {
      const s = this.ctx.createBufferSource(),
        gate = this.ctx.createGain();
      s.buffer = buffer;
      s.loop = true;
      gate.gain.value = 0;
      gate.gain.setTargetAtTime(1, this.startedAt, 0.012);
      s.connect(gate);
      gate.connect(this.buses[i]);
      s.gate = gate;
      s.onended = () => {
        s.disconnect();
        gate.disconnect();
      };
      s.start(
        this.startedAt,
        ((time % buffer.duration) + buffer.duration) % buffer.duration,
      );
      this.sources.push(s);
    });
  }
  stop() {
    const now = this.ctx.currentTime;
    for (const s of this.sources) {
      s.gate.gain.cancelScheduledValues?.(now);
      s.gate.gain.setTargetAtTime(0, now, 0.008);
      s.stop(now + 0.04);
    }
    this.sources = [];
  }
}

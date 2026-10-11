import {
  LOOP_SECONDS,
  BAG_SECONDS,
  CASE_SECONDS,
  CUTS_PER_SECOND,
  deliveryMotion,
} from "./timing.js";

const TAU = Math.PI * 2;

// Original procedural foley, not recordings. All events live on the same clock
// as the machine animation. Circular filters and wrapped tails preserve the loop.
export class FactorySound {
  constructor(ctx) {
    this.ctx = ctx;
    this.sources = [];
    this.buses = [];
    this.panners = [];
    this.focus = 0;
    this.music = false;
    this.master = ctx.createGain();
    this.master.gain.value = 0.7;
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -10;
    limiter.knee.value = 10;
    limiter.ratio.value = 2.5;
    limiter.attack.value = 0.016;
    limiter.release.value = 0.22;
    this.master.connect(limiter);
    limiter.connect(ctx.destination);
    this.stems = ["wash", "cut", "fry", "tumble", "pack", "music", "truck"].map(
      (kind, k) => {
        const bus = ctx.createGain(),
          pan = ctx.createStereoPanner();
        bus.connect(pan);
        pan.connect(this.master);
        this.buses.push(bus);
        this.panners.push(pan);
        return this.synthesize(kind, k);
      },
    );
    this.setFocus(0, true);
  }

  synthesize(kind, seed) {
    const sr = this.ctx.sampleRate,
      n = Math.round(LOOP_SECONDS * sr);
    const buffer = this.ctx.createBuffer(2, n, sr);
    const out = new Float32Array(n),
      side = new Float32Array(n);
    let state = 9837 + seed * 61813;
    const rnd = () => {
      state = (state * 1664525 + 1013904223) >>> 0;
      return state / 4294967296;
    };
    const noise = () => rnd() * 2 - 1;
    const wrap = (i) => ((i % n) + n) % n;
    const event = (at, duration, render, pan = 0) => {
      const start = Math.round(at * sr),
        length = Math.round(duration * sr);
      for (let i = 0; i < length; i++) {
        const value = render(i / sr, i);
        const index = wrap(start + i);
        out[index] += value;
        side[index] += value * pan;
      }
    };
    // A periodic noise bed passed through two real one-pole filters. Pre-roll
    // uses the end of that same bed, avoiding a filter-state jump at the seam.
    const bandNoise = (highpass, lowpass) => {
      const raw = new Float32Array(n),
        data = new Float32Array(n);
      for (let i = 0; i < n; i++) raw[i] = noise();
      const ah = 1 - Math.exp((-TAU * highpass) / sr);
      const al = 1 - Math.exp((-TAU * Math.min(sr * 0.43, lowpass)) / sr);
      let bass = 0,
        low = 0;
      for (let i = -Math.min(n, Math.round(sr * 0.7)); i < n; i++) {
        const value = raw[wrap(i)];
        bass += ah * (value - bass);
        low += al * (value - bass - low);
        if (i >= 0) data[i] = low;
      }
      return data;
    };
    const bed = (data, level, speed = 1, depth = 0.06, phase = 0) => {
      for (let i = 0; i < n; i++)
        out[i] +=
          data[i] *
          level *
          (1 + depth * Math.sin((TAU * speed * i) / n + phase));
    };
    const softBurst = (at, duration, level, cutoff, decay, pan = 0) => {
      let low = 0,
        bass = 0;
      const coefficient = 1 - Math.exp((-TAU * cutoff) / sr);
      const high = 1 - Math.exp((-TAU * 150) / sr);
      event(
        at,
        duration,
        (t) => {
          const value = noise();
          bass += high * (value - bass);
          low += coefficient * (value - bass - low);
          const attack = 1 - Math.exp(-t * 1100);
          const end = Math.min(1, (duration - t) / 0.008);
          return low * level * attack * Math.exp(-t * decay) * end;
        },
        pan,
      );
    };
    const contact = (at, level, frequency = 145, pan = 0) => {
      softBurst(at, 0.09, level, 2100, 74, pan);
      event(
        at,
        0.1,
        (t) =>
          level *
          0.31 *
          Math.sin(TAU * frequency * t) *
          (1 - Math.exp(-t * 1700)) *
          Math.exp(-t * 84),
        pan,
      );
    };

    if (kind === "wash") {
      // Broad water texture and irregular droplets; no electronic pitch sweeps.
      bed(bandNoise(140, 2700), 0.095, 5, 0.07);
      bed(bandNoise(45, 430), 0.1, 3, 0.12, 1.1);
      for (let i = 0; i < 104; i++) {
        const at = rnd() * LOOP_SECONDS;
        softBurst(
          at,
          0.04 + rnd() * 0.1,
          0.035 + rnd() * 0.026,
          1800 + rnd() * 1600,
          34,
          noise() * 0.5,
        );
      }
      for (let i = 0; i < 24; i++)
        contact((i * 2) / 3 + 0.19, 0.014, 126 + rnd() * 60);
    }
    if (kind === "cut") {
      // Low enclosed-machine body. Knife contact is a short wet shear, not a
      // ringing metal click. Eight contacts correspond to the fixed knife ring.
      bed(bandNoise(55, 620), 0.08, 8, 0.09);
      bed(bandNoise(380, 1350), 0.017, 16, 0.1);
      for (let i = 0; i < LOOP_SECONDS * CUTS_PER_SECOND; i++) {
        const at = i / CUTS_PER_SECOND;
        softBurst(at, 0.062, 0.066 + rnd() * 0.021, 2550, 57, noise() * 0.13);
        contact(at + 0.008, 0.013, 178);
        softBurst(at + 0.044, 0.05, 0.022, 1450, 60);
      }
    }
    if (kind === "fry") {
      // Layered oil movement, thousands of fine crackles, and occasional larger
      // bubbles. Band-limited hiss leaves room for the other machines.
      bed(bandNoise(480, 4300), 0.07, 3, 0.12, 1);
      bed(bandNoise(75, 700), 0.07, 5, 0.13);
      for (let i = 0; i < 560; i++) {
        const at = rnd() * LOOP_SECONDS;
        softBurst(
          at,
          0.018 + rnd() * 0.028,
          0.018 + rnd() * 0.047,
          2700 + rnd() * 1100,
          120,
          noise() * 0.7,
        );
      }
      for (let i = 0; i < 62; i++) {
        const at = rnd() * LOOP_SECONDS;
        softBurst(at, 0.075 + rnd() * 0.06, 0.04, 1450, 35, noise() * 0.4);
      }
    }
    if (kind === "tumble") {
      bed(bandNoise(38, 290), 0.09, 8, 0.23);
      bed(bandNoise(700, 2650), 0.014, 16, 0.25);
      for (let i = 0; i < 48; i++) {
        const at = i / 3;
        softBurst(at + rnd() * 0.045, 0.26, 0.068, 2600, 14, noise() * 0.5);
        for (let j = 0; j < 4; j++)
          contact(at + 0.05 + rnd() * 0.17, 0.011, 180 + rnd() * 140);
      }
      for (let i = 0; i < 8; i++) contact(i * 2 + 0.58, 0.018, 94);
    }
    if (kind === "pack") {
      bed(bandNoise(65, 430), 0.043, 8, 0.12);
      for (let lane = 0; lane < 3; lane++) {
        const offset = lane / 3,
          pan = (lane - 1) * 0.38;
        for (let i = 0; i < LOOP_SECONDS / BAG_SECONDS; i++) {
          const at = (i - offset) * BAG_SECONDS;
          // Film advances, pneumatic jaws travel, contact, release. The exact
          // closure/release phases match jawClosure() and the vacuum carriage.
          softBurst(at + 0.09, 0.34, 0.048, 2200, 6, pan);
          softBurst(at + 0.64, 0.16, 0.034, 2850, 11, pan);
          contact(at + 0.84, 0.059, 136, pan);
          contact(at + 1.12, 0.024, 188, pan);
          softBurst(at + 1.28, 0.19, 0.039, 1800, 14, pan);
          contact(at + 1.26, 0.018, 105, pan);
          softBurst(at + 1.51, 0.25, 0.026, 2100, 8, pan);
        }
        for (let i = 0; i < LOOP_SECONDS / CASE_SECONDS; i++) {
          const at = (i - lane / 12) * CASE_SECONDS;
          softBurst(at + 1.7, 0.24, 0.034, 1250, 9, pan);
          softBurst(at + 3.0, 0.28, 0.029, 2000, 10, pan);
          softBurst(at + 7.57, 0.36, 0.046, 1750, 4, pan);
          contact(at + 7.92, 0.035, 103, pan);
        }
      }
    }
    if (kind === "music") {
      // Sparse original felt-key chords over a very soft 120 BPM brushed pulse.
      // Sustains wrap over the 16-second boundary instead of restarting abruptly.
      const chords = [
        [130.8128, 195.9977, 246.9417, 293.6648],
        [110, 164.8138, 195.9977, 246.9417],
        [87.3071, 130.8128, 174.6141, 220],
        [97.9989, 146.8324, 195.9977, 246.9417],
      ];
      for (let bar = 0; bar < 4; bar++) {
        for (let j = 0; j < 4; j++) {
          const f = chords[bar][j],
            at = bar * 4 + j * 0.018;
          event(
            at,
            5.3,
            (t) => {
              const attack = 1 - Math.exp(-t * 48);
              return (
                0.023 *
                attack *
                (Math.sin(TAU * f * t) * Math.exp(-t * 1.25) +
                  0.17 * Math.sin(TAU * f * 2.003 * t) * Math.exp(-t * 3.2))
              );
            },
            (j - 1.5) * 0.34,
          );
        }
        for (let j = 0; j < 2; j++) {
          const f = chords[bar][2 + j] * 2;
          event(
            bar * 4 + 1.5 + j * 1.5,
            2.1,
            (t) =>
              0.019 *
              Math.sin(TAU * f * t) *
              (1 - Math.exp(-t * 65)) *
              Math.exp(-t * 2.8),
            j ? -0.35 : 0.35,
          );
        }
      }
      for (let i = 0; i < 16; i++) {
        event(
          i,
          0.28,
          (t) =>
            0.024 *
            Math.sin(TAU * 55 * t) *
            (1 - Math.exp(-t * 150)) *
            Math.exp(-t * 24),
        );
        softBurst(i + 0.5, 0.12, 0.021, 2300, 29, i % 2 ? -0.3 : 0.3);
      }
    }

    if (kind === "truck") {
      const engine = bandNoise(28, 310),
        road = bandNoise(210, 1350);
      for (let i = 0; i < n; i++) {
        const t = i / sr,
          motion = deliveryMotion(t);
        const envelope = Math.max(
          0.04,
          Math.min(1, 1 - Math.abs(motion.x) / 22),
        );
        const throttle = motion.driving ? 0.82 : 0.28;
        out[i] +=
          envelope *
          (engine[i] * 0.11 * throttle +
            road[i] * 0.038 * (motion.driving ? 1 : 0));
        out[i] +=
          envelope *
          throttle *
          (0.014 * Math.sin(TAU * 33.75 * t) +
            0.007 * Math.sin(TAU * 67.5 * t));
        side[i] += out[i] * Math.max(-0.6, Math.min(0.6, motion.x / 16));
      }
      for (const at of [0.1, 5.98]) contact(at, 0.027, 121);
      softBurst(5.62, 0.3, 0.045, 1400, 12);
      softBurst(7.12, 0.33, 0.035, 2150, 8);
      softBurst(15.62, 0.35, 0.055, 1600, 8);
      for (let i = 0; i < 8; i++)
        contact(1.72 + i * 0.44, 0.017, 108 + (i % 2) * 22);
    }

    // Restrained stereo room, followed by DC removal and a conservative peak
    // ceiling. Reflections are different at each ear; no metallic comb echo.
    const left = buffer.getChannelData(0),
      right = buffer.getChannelData(1);
    const delayA = Math.round(0.0131 * sr),
      delayB = Math.round(0.0237 * sr),
      delayC = Math.round(0.0473 * sr);
    let mean = 0;
    for (let i = 0; i < n; i++) mean += out[i] / n;
    let peak = 0;
    for (let i = 0; i < n; i++) {
      const dry = out[i] - mean;
      left[i] =
        dry +
        side[i] * 0.45 +
        out[wrap(i - delayA)] * 0.085 +
        out[wrap(i - delayC)] * 0.035;
      right[i] =
        dry -
        side[i] * 0.45 +
        out[wrap(i - delayB)] * 0.075 +
        out[wrap(i - delayC - 83)] * 0.032;
      peak = Math.max(peak, Math.abs(left[i]), Math.abs(right[i]));
    }
    const scale = peak > 0.24 ? 0.24 / peak : 1;
    for (let i = 0; i < n; i++) {
      left[i] *= scale;
      right[i] *= scale;
    }
    return buffer;
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
              ? 1.0
              : 0
            : stage === 6 || stage === 7
              ? 0
              : stage === 0
                ? 0.72
                : 0.12 + 1.03 * Math.max(0, 1 - Math.abs(i + 1 - stage));
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
        ((time % LOOP_SECONDS) + LOOP_SECONDS) % LOOP_SECONDS,
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

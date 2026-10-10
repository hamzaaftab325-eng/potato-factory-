// Each machine gets its own procedural, sample-accurate 16-second stem.
// Events wrap into the buffer so reverb tails cross the loop boundary.
export class FactorySound {
  constructor(ctx) {
    this.ctx = ctx;
    this.sources = [];
    this.buses = [];
    this.focus = 0;
    this.music = false;
    this.master = ctx.createGain();
    this.master.gain.value = 0.68;
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -14;
    limiter.knee.value = 8;
    limiter.ratio.value = 4;
    limiter.attack.value = 0.004;
    limiter.release.value = 0.18;
    this.master.connect(limiter);
    limiter.connect(ctx.destination);
    this.stems = ["wash", "cut", "fry", "tumble", "pack", "music"].map(
      (kind, k) => {
        const bus = ctx.createGain(),
          pan = ctx.createStereoPanner();
        pan.pan.value = [-0.65, -0.38, -0.08, 0.3, 0.65, 0][k];
        bus.connect(pan);
        pan.connect(this.master);
        this.buses.push(bus);
        return this.synthesize(kind, k);
      },
    );
    this.setFocus(0, true);
  }
  synthesize(kind, seed) {
    const sr = this.ctx.sampleRate,
      n = 16 * sr,
      b = this.ctx.createBuffer(1, n, sr),
      out = b.getChannelData(0);
    let state = 938 + seed * 537,
      low = 0,
      prev = 0;
    const rnd = () => {
      state = (state * 1664525 + 1013904223) >>> 0;
      return state / 2147483648 - 1;
    };
    const event = (at, duration, fn) => {
      let off = Math.round(at * sr);
      for (let i = 0; i < duration * sr; i++) {
        const t = i / sr;
        out[(((off + i) % n) + n) % n] += fn(t, i);
      }
    };
    const tau = 2 * Math.PI;
    for (let i = 0; i < n; i++) {
      const t = i / sr,
        raw = rnd();
      low += 0.025 * (raw - low);
      const high = raw - prev;
      prev = raw;
      const loop = Math.sin((tau * t) / 16);
      if (kind === "wash")
        out[i] = low * 0.24 + high * 0.016 + Math.sin(tau * 72 * t) * 0.012;
      if (kind === "cut")
        out[i] =
          Math.sin(tau * 96 * t) * 0.018 + Math.sin(tau * 192 * t) * 0.006;
      if (kind === "fry")
        out[i] = (raw - low) * 0.07 * (0.91 + 0.09 * loop) + low * 0.15;
      if (kind === "tumble")
        out[i] =
          low * 0.15 +
          Math.sin(tau * 48 * t) * 0.018 +
          Math.sin(tau * 144 * t) * 0.007;
      if (kind === "pack")
        out[i] = low * 0.065 + Math.sin(tau * 60 * t) * 0.009;
    }
    if (kind === "wash") {
      for (let i = 0; i < 64; i++)
        event(
          i * 0.25 + 0.05,
          0.2,
          (t) =>
            (rnd() * 0.023 + Math.sin(tau * (460 * t + 240 * t * t)) * 0.018) *
            Math.exp(-t * 20),
        );
      for (let i = 0; i < 32; i++)
        event(i * 0.5, 0.13, (t) => rnd() * 0.028 * Math.exp(-t * 26));
    }
    if (kind === "cut") {
      // Four knife passes per second, matching the four visible rotor knives.
      for (let i = 0; i < 64; i++) {
        event(i * 0.25, 0.105, (t) => {
          const scrape = rnd() * 0.1 * Math.exp(-t * 52);
          const tick =
            (Math.sin(tau * 1820 * t) + 0.35 * Math.sin(tau * 2890 * t)) *
            0.045 *
            Math.exp(-t * 85);
          return scrape + tick;
        });
        event(i * 0.25 + 0.08, 0.07, (t) => rnd() * 0.015 * Math.exp(-t * 65));
      }
    }
    if (kind === "fry") {
      // Fine sizzle plus scattered oil pops, with no musical beat.
      for (let i = 0; i < 210; i++) {
        const at = ((i * 0.61803398875) % 1) * 16,
          frequency = 900 + ((i * 113) % 2400);
        event(
          at,
          0.05,
          (t) =>
            (rnd() * 0.04 + Math.sin(tau * frequency * t) * 0.035) *
            Math.exp(-t * 95),
        );
      }
      for (let i = 0; i < 32; i++)
        event(
          i * 0.5 + 0.18,
          0.18,
          (t) =>
            Math.sin(tau * (230 * t - 110 * t * t)) * 0.026 * Math.exp(-t * 24),
        );
    }
    if (kind === "tumble") {
      for (let i = 0; i < 96; i++) {
        const at = i / 6;
        event(
          at,
          0.14,
          (t) =>
            (rnd() * 0.038 + Math.sin(tau * 410 * t) * 0.014) *
            Math.exp(-t * 38),
        );
        event(at + 0.03, 0.24, (t) => rnd() * 0.018 * Math.exp(-t * 13));
      }
      for (let i = 0; i < 8; i++)
        event(
          i * 2,
          0.24,
          (t) => Math.sin(tau * 125 * t) * 0.027 * Math.exp(-t * 18),
        );
    }
    if (kind === "pack")
      for (let f = 0; f < 3; f++)
        for (let i = 0; i < 32; i++) {
          // A jaw closes at phase .5. Lines are offset by one third of a cycle.
          const at = (i + 0.5 - f / 3) / 2;
          event(
            at - 0.065,
            0.07,
            (t) => rnd() * 0.046 * Math.sin((Math.PI * t) / 0.07),
          );
          event(
            at,
            0.09,
            (t) =>
              (Math.sin(tau * 670 * t) * 0.04 + rnd() * 0.055) *
              Math.exp(-t * 75),
          );
          event(at + 0.075, 0.13, (t) => rnd() * 0.026 * Math.exp(-t * 20));
          event(
            at + 0.15,
            0.18,
            (t) => rnd() * 0.024 * Math.sin((Math.PI * t) / 0.18),
          );
        }
    if (kind === "music") {
      const chords = [
        [130.8128, 164.8138, 195.9977],
        [110, 130.8128, 164.8138],
        [87.3071, 110, 130.8128],
        [97.9989, 123.4708, 146.8324],
      ];
      for (let j = 0; j < 4; j++)
        for (let i = 0; i < 16; i++) {
          const at = j * 4 + i * 0.25,
            f = chords[j][i % 3] * (i % 4 === 0 ? 1 : 2);
          event(
            at,
            1.6,
            (t) =>
              Math.sin(tau * f * t) *
              0.034 *
              (1 - Math.exp(-t * 100)) *
              Math.exp(-t * 4),
          );
          if (i % 4 === 0)
            event(
              at,
              0.38,
              (t) =>
                Math.sin(tau * (46 * t + 3 * (1 - Math.exp(-t * 25)))) *
                0.035 *
                Math.exp(-t * 12),
            );
        }
    }
    // Very short room reflections are wrapped to preserve the seam.
    const dry = out.slice(),
      d1 = Math.round(sr * 0.019),
      d2 = Math.round(sr * 0.041);
    for (let i = 0; i < n; i++)
      out[i] = Math.tanh(
        dry[i] + dry[(i - d1 + n) % n] * 0.12 + dry[(i - d2 + n) % n] * 0.07,
      );
    return b;
  }
  setFocus(stage, immediate = false) {
    this.focus = stage;
    this.buses.forEach((g, i) => {
      const value =
        i === 5
          ? this.music
            ? 0.55
            : 0
          : stage === 6
            ? 0
            : stage === 0
              ? 0.72
              : i === stage - 1
                ? 1.15
                : 0.12;
      if (immediate) g.gain.value = value;
      else g.gain.setTargetAtTime(value, this.ctx.currentTime, 0.25);
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
      const s = this.ctx.createBufferSource();
      s.buffer = buffer;
      s.loop = true;
      s.connect(this.buses[i]);
      s.start(this.startedAt, ((time % 16) + 16) % 16);
      this.sources.push(s);
    });
  }
  stop() {
    for (const s of this.sources) {
      s.stop();
      s.disconnect();
    }
    this.sources = [];
  }
}

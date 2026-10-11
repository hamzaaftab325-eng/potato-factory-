import test from "node:test";
import assert from "node:assert/strict";
import { FactorySound } from "../src/factory/audio.js";

function param() {
  return {
    value: 0,
    setTargetAtTime(value) {
      this.value = value;
    },
  };
}
function node() {
  return { gain: param(), pan: param(), connect() {}, disconnect() {} };
}
function context() {
  return {
    currentTime: 12,
    sampleRate: 44100,
    destination: node(),
    createGain: node,
    createStereoPanner: node,
    createDynamicsCompressor() {
      return {
        ...node(),
        threshold: param(),
        knee: param(),
        ratio: param(),
        attack: param(),
        release: param(),
      };
    },
    createBuffer(channels, length, sampleRate) {
      const data = new Float32Array(length);
      return {
        duration: length / sampleRate,
        length,
        sampleRate,
        getChannelData() {
          return data;
        },
      };
    },
    createBufferSource() {
      return {
        ...node(),
        start(at, offset) {
          this.at = at;
          this.offset = offset;
        },
        stop() {
          this.stopped = true;
        },
      };
    },
  };
}

test("machine and logistics sound layers start at their exact animation phases", () => {
  const ctx = context(),
    sound = new FactorySound(ctx);
  assert.equal(sound.stems.length, 7);
  sound.stems.forEach((buffer, i) => {
    const duration = i === 6 ? 64 : 16;
    assert.equal(buffer.duration, duration);
    assert.equal(buffer.length, duration * ctx.sampleRate);
    let peak = 0;
    for (const value of buffer.getChannelData(0)) {
      assert.ok(Number.isFinite(value));
      peak = Math.max(peak, Math.abs(value));
    }
    assert.ok(peak > 0.005 && peak < 0.3, `headroom: ${peak}`);
  });
  sound.start(21.25);
  assert.equal(sound.sources.length, 7);
  sound.sources.forEach((s, i) => {
    assert.equal(s.at, 12);
    assert.equal(s.offset, i === 6 ? 21.25 : 5.25);
    assert.equal(s.loop, true);
  });
  const sources = [...sound.sources];
  sound.stop();
  assert.equal(sound.sources.length, 0);
  assert.ok(sources.every((s) => s.stopped));
  sound.stop();
});

test("machine focus changes levels, music is optional, and pack views silence machinery", () => {
  const sound = new FactorySound(context());
  assert.equal(sound.buses[5].gain.value, 0);
  sound.setFocus(3);
  assert.equal(sound.buses[2].gain.value, 1.15);
  assert.equal(sound.buses[0].gain.value, 0.12);
  sound.setMusic(true);
  assert.equal(sound.buses[5].gain.value, 0.55);
  sound.setFocus(7);
  assert.ok(sound.buses.slice(0, 5).every((b) => b.gain.value === 0));
  assert.equal(sound.buses[5].gain.value, 0.55);
  assert.equal(sound.buses[6].gain.value, 0);
  sound.setFocus(6);
  assert.equal(sound.buses[6].gain.value, 0.85);
  sound.setMusic(false);
  assert.equal(sound.buses[5].gain.value, 0);
});

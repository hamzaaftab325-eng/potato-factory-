import test from "node:test";
import assert from "node:assert/strict";
import { FrameClock } from "../src/factory/frame-clock.js";

test("frame deadlines retain the target cadence on different monitor rates", () => {
  for (const hz of [60, 75, 120, 144]) {
    for (const fps of [30, 60]) {
      const clock = new FrameClock();
      let frames = 0;
      for (let tick = 0; tick < hz * 4; tick++)
        frames += Number(clock.due(tick / hz, fps));
      assert.ok(
        Math.abs(frames - fps * 4) <= 1,
        `${hz}Hz / ${fps}fps: ${frames}`,
      );
    }
  }
});
test("long stalls, forced frames and cadence changes do not queue catch-up renders", () => {
  const clock = new FrameClock();
  assert.equal(clock.due(0, 60), true);
  assert.equal(clock.due(0.001, 60), false);
  assert.equal(clock.due(30, 60), true);
  assert.equal(clock.due(30.001, 60), false);
  assert.equal(clock.due(30.002, 60, true), true);
  assert.equal(clock.due(30.003, 30), true);
  assert.equal(clock.due(30.004, 30), false);
});

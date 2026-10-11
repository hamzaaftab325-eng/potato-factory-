import test from "node:test";
import assert from "node:assert/strict";
import {
  drawingBudget,
  AdaptiveRenderBudget,
  zoomDistance,
} from "../src/factory/render-budget.js";

test("AUTO does not supersample a native 1080p desktop to UHD", () => {
  const auto = drawingBudget({ width: 1920, height: 1080, dpr: 1 });
  const detail = drawingBudget({
    width: 1920,
    height: 1080,
    dpr: 1,
    detail: true,
  });
  assert.equal(auto.width, 1920);
  assert.equal(auto.height, 1080);
  assert.equal(detail.width, 3840);
  assert.equal(detail.height, 2160);
  assert.equal(
    (auto.width * auto.height) / (detail.width * detail.height),
    0.25,
  );
});

test("portrait, ultrawide and high-DPI buffers stay inside their pixel/GPU ceilings", () => {
  for (const [width, height, dpr, maxTextureSize] of [
    [390, 844, 3, 8192],
    [5120, 1440, 2, 4096],
    [7680, 4320, 1, 2048],
  ]) {
    for (const detail of [false, true]) {
      const result = drawingBudget({
        width,
        height,
        dpr,
        maxTextureSize,
        detail,
      });
      assert.ok(result.width <= Math.min(detail ? 3840 : 2560, maxTextureSize));
      assert.ok(
        result.height <= Math.min(detail ? 2160 : 1440, maxTextureSize),
      );
      assert.ok(Math.abs(result.width / result.height - width / height) < 0.01);
    }
  }
});

function frames(budget, interval, cost, duration) {
  let changes = 0;
  for (let t = 0; t < duration; t += interval)
    changes += Number(budget.sample(interval, cost));
  return changes;
}

test("sustained missed frames reduce workload; recovery is gradual and bounded", () => {
  const budget = new AdaptiveRenderBudget(60);
  assert.equal(frames(budget, 1000 / 30, 22, 2400), 0);
  assert.ok(frames(budget, 1000 / 30, 22, 12000) > 0);
  assert.equal(budget.scale, 0.55);
  const low = budget.scale;
  frames(budget, 1000 / 60, 4, 1600);
  assert.equal(budget.scale, low);
  frames(budget, 1000 / 60, 4, 30000);
  assert.ok(budget.scale > low && budget.scale <= 1);
});

test("mobile 30fps cadence and isolated tab/OS stalls do not trigger downscaling", () => {
  const mobile = new AdaptiveRenderBudget(30);
  frames(mobile, 1000 / 30, 8, 16000);
  assert.equal(mobile.scale, 1);
  assert.equal(mobile.sample(30000, 1), false);
  assert.equal(mobile.scale, 1);
});

test("zoom is reversible and constrained to readable camera distances", () => {
  assert.ok(Math.abs(zoomDistance(zoomDistance(1, 1.2), 1 / 1.2) - 1) < 1e-12);
  assert.equal(zoomDistance(1, 100), 0.4);
  assert.equal(zoomDistance(1, 0.01), 1.8);
});

test("persistent sub-4fps playback also recovers its rendering budget", () => {
  const budget = new AdaptiveRenderBudget(60);
  assert.ok(frames(budget, 500, 400, 25000) > 0);
  assert.equal(budget.scale, 0.55);
});

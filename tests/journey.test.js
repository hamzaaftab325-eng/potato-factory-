import test from "node:test";
import assert from "node:assert/strict";
import {
  CAMERAS,
  cameraAt,
  chooseSurface,
  journeyPosition,
} from "../src/lib/journey.js";

test("scroll progression follows readable step centres on desktop and mobile", () => {
  const rects = Array.from({ length: 6 }, (_, i) => ({
    top: 250 + i * 700,
    height: 700,
  }));
  let previous = 1;
  for (let scroll = 0; scroll <= 4900; scroll += 10) {
    const p = journeyPosition(
      rects.map((r) => ({ ...r, top: r.top - scroll })),
      900,
    );
    assert.ok(Number.isFinite(p) && p >= 1 && p <= 6);
    assert.ok(p >= previous);
    previous = p;
  }
  assert.equal(journeyPosition([{ top: 450, height: 504 }], 900, true), 1);
  assert.equal(journeyPosition([], 0), 1);
  assert.equal(journeyPosition(rects, 900), 1);
});

test("camera path reaches each stage and stays finite through every transition", () => {
  for (let i = 0; i < CAMERAS.length; i++) {
    assert.deepEqual(cameraAt(i, 1), CAMERAS[i]);
  }
  for (let p = 0; p <= 6; p += 0.005) {
    const c = cameraAt(p, 2);
    assert.ok([...c.target, c.radius, c.yaw, c.elev].every(Number.isFinite));
    // The expanded end-of-line shipping area needs a wider establishing hero view.
    // Keep a ceiling so accidental camera blow-outs are still caught.
    assert.ok(c.radius >= 7 && c.radius <= 110);
    const next = cameraAt(p + 0.005, 2);
    assert.ok(c.target.every((v, i) => Math.abs(v - next.target[i]) < 0.18));
  }
  assert.deepEqual(cameraAt(NaN), cameraAt(0));
  assert.equal(cameraAt(4, 0).target[2], -1.3);
  assert.equal(cameraAt(4, 2).target[2], 1.3);
});

test("one renderer serves the visible surface and turns off away from the experience", () => {
  const off = { top: 2000, bottom: 2500 };
  assert.equal(
    chooseSurface(
      { hero: { top: 0, bottom: 900 }, story: off, product: off },
      900,
    ),
    "hero",
  );
  assert.equal(
    chooseSurface(
      {
        hero: { top: -2000, bottom: -1100 },
        story: { top: -300, bottom: 1800 },
        product: off,
      },
      900,
    ),
    "story",
  );
  assert.equal(
    chooseSurface(
      { hero: off, story: off, product: { top: 600, bottom: 1200 } },
      900,
    ),
    "product",
  );
  assert.equal(
    chooseSurface(
      { hero: { top: -1000, bottom: -1 }, story: off, product: off },
      900,
    ),
    null,
  );
});

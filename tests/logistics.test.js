import test from "node:test";
import assert from "node:assert/strict";
import {
  logisticsAt,
  DOCK,
  CAMPUS_SECONDS,
  LOGISTICS_TIME_SCALE,
} from "../src/factory/timing.js";

test("loading is interlocked with the dock, bridge and secured vehicle", () => {
  for (let time = 0; time < CAMPUS_SECONDS; time += 0.037) {
    const state = logisticsAt(time);
    if (state.loading) {
      assert.equal(state.secured, true);
      assert.equal(state.moving, false);
      assert.equal(state.bridge, 1);
      assert.equal(state.dockDoor, 1);
      assert.ok(state.doorOpen.every((v) => v === 1));
    }
    if (state.clearing) {
      assert.equal(state.bridge, 0);
      assert.equal(state.dockDoor, 0);
      assert.equal(state.secured, false);
      assert.ok(state.doorOpen.every((v) => v === 1));
    }
    if (state.readyToDepart) {
      assert.equal(state.doorsClosed, true);
      assert.equal(state.unlocked, 0);
      assert.equal(state.bridge, 0);
    }
  }
});

test("rear leaves close at a separate stationary stop with full swing clearance", () => {
  for (let phase = DOCK.closeStart; phase < DOCK.closeEnd; phase += 0.01) {
    const state = logisticsAt(phase * LOGISTICS_TIME_SCALE);
    assert.equal(state.moving, false);
    assert.equal(state.pullClear, 1);
  }
  // Maximum rearward leaf sweep, including its hinge and thickness, clears
  // the warehouse facade at x=35.5 throughout closure.
  assert.ok(DOCK.clearX - 3.72 - 1.4 - 0.065 > 35.5 + 0.5);
  const a = logisticsAt(22.25),
    b = logisticsAt(22.25 + CAMPUS_SECONDS);
  for (const key of ["bridge", "dockDoor", "secured", "doorsClosed", "loading"])
    assert.equal(a[key], b[key]);
});

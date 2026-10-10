import test from "node:test";
import assert from "node:assert/strict";
import { chipGeometry, bagGeometry } from "../src/factory/geometry.js";

for (const [name, create] of [
  ["curved chip", chipGeometry],
  ["sculpted packaging", bagGeometry],
]) {
  test(`${name} has finite positions, valid UVs and front/back thickness`, () => {
    const g = create();
    g.computeBoundingBox();
    for (const [name, attr] of Object.entries(g.attributes)) {
      assert.ok([...attr.array].every(Number.isFinite), `${name} is finite`);
    }
    const count = g.attributes.position.count;
    assert.ok(count > 400);
    assert.ok([...g.index.array].every((index) => index >= 0 && index < count));
    assert.ok(g.boundingBox.max.z - g.boundingBox.min.z > 0.01);
    assert.ok(g.boundingBox.max.x > 0 && g.boundingBox.min.x < 0);
    assert.ok(g.attributes.normal.count === count);
    const uv = g.attributes.uv.array;
    assert.ok([...uv].every((v) => v >= -0.01 && v <= 1.01));
    g.dispose();
  });
}

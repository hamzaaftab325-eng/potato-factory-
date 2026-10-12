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

test("Python slices retain thin raw faces and six distinct cooked silhouettes", () => {
  const outlines = new Set();
  for (let variant = 0; variant < 6; variant++) {
    const raw = chipGeometry(variant, false),
      fried = chipGeometry(variant);
    raw.computeBoundingBox();
    fried.computeBoundingBox();
    const thickness = (raw.boundingBox.max.z - raw.boundingBox.min.z) * 0.33;
    assert.ok(
      thickness > 0.0013 && thickness < 0.002,
      `raw slice ${thickness} m`,
    );
    assert.ok(fried.boundingBox.max.z - fried.boundingBox.min.z > 0.02);
    assert.equal(
      raw.attributes.position.count,
      fried.attributes.position.count,
    );
    outlines.add(fried.attributes.position.getY(130).toFixed(6));
    raw.dispose();
    fried.dispose();
  }
  assert.equal(outlines.size, 6);
});

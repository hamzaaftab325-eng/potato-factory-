import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

// Combine rigid parts inside an animated assembly, preserving explicitly moving
// descendants. Wheel, fork, cargo and door pivots keep their own transforms.
export function batchRigidParts(root, moving = []) {
  const preserved = new Set(moving);
  root.updateWorldMatrix(true, true);
  const inverse = root.matrixWorld.clone().invert();
  const batches = new Map();
  root.traverse((o) => {
    if (
      !o.isMesh ||
      o.isInstancedMesh ||
      Array.isArray(o.material) ||
      o.material.transparent
    )
      return;
    for (let p = o; p && p !== root; p = p.parent) if (preserved.has(p)) return;
    const k = `${o.material.uuid}/${o.castShadow}/${o.receiveShadow}`;
    if (!batches.has(k)) batches.set(k, []);
    batches.get(k).push(o);
  });
  for (const objects of batches.values()) {
    if (objects.length < 2) continue;
    const parts = objects.map((o) => {
      let g = o.geometry.clone();
      if (g.index) g = g.toNonIndexed();
      g.applyMatrix4(inverse.clone().multiply(o.matrixWorld));
      for (const a of Object.keys(g.attributes))
        if (!["position", "normal", "uv"].includes(a)) g.deleteAttribute(a);
      if (!g.attributes.uv)
        g.setAttribute(
          "uv",
          new THREE.BufferAttribute(
            new Float32Array(g.attributes.position.count * 2),
            2,
          ),
        );
      return g;
    });
    const geometry = mergeGeometries(parts, false);
    if (geometry) {
      const combined = new THREE.Mesh(geometry, objects[0].material);
      combined.castShadow = objects[0].castShadow;
      combined.receiveShadow = objects[0].receiveShadow;
      root.add(combined);
      objects.forEach((o) => o.removeFromParent());
    }
    parts.forEach((g) => g.dispose());
  }
}

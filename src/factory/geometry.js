import * as THREE from "three";
import assets from "./generated/food-assets.js";
const TAU = Math.PI * 2;

export function potatoGeometry(widthSegments = 28, heightSegments = 20) {
  const g = new THREE.SphereGeometry(1, widthSegments, heightSegments);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i),
      y = p.getY(i),
      z = p.getZ(i);
    const r =
      1 +
      0.055 * Math.sin(x * 5 + y * 3) * Math.cos(z * 5) +
      0.028 * Math.sin(y * 9 - z * 4);
    p.setXYZ(i, x * r + 0.07 * y * y, y * r, z * r * (1 - 0.07 * y));
  }
  g.computeVertexNormals();
  return g;
}

// Python bakes six deterministic potato cross-sections, paired raw/cooked
// surfaces, smoothed normals and UVs. Runtime only decodes shared typed buffers.
const decoded = new Map();
function unpack(text, Type = Float32Array) {
  if (!decoded.has(text)) {
    const bytes = Uint8Array.from(atob(text), (c) => c.charCodeAt(0));
    decoded.set(text, new Type(bytes.buffer));
  }
  return decoded.get(text);
}
export function chipGeometry(variant = 0, cooked = true, detail = true) {
  const set = detail ? assets.chips : assets.chipsLow;
  const source = set[((variant % set.length) + set.length) % set.length];
  const g = new THREE.BufferGeometry();
  for (const [name, size] of Object.entries({
    position: 3,
    normal: 3,
    rawPosition: 3,
    rawNormal: 3,
    uv: 2,
    color: 3,
  })) {
    const key =
      !cooked && name === "position"
        ? "rawPosition"
        : !cooked && name === "normal"
          ? "rawNormal"
          : name;
    g.setAttribute(name, new THREE.BufferAttribute(unpack(source[key]), size));
  }
  g.setIndex(new THREE.BufferAttribute(unpack(source.index, Uint16Array), 1));
  g.computeBoundingBox();
  g.computeBoundingSphere();
  return g;
}

export function bagGeometry(detail = true) {
  const p = [],
    uv = [],
    idx = [],
    W = detail ? 48 : 20,
    H = detail ? 64 : 28;
  for (let b = 0; b < 2; b++)
    for (let j = 0; j <= H; j++)
      for (let i = 0; i <= W; i++) {
        const u = i / W,
          v = j / H,
          x = (u - 0.5) * 0.75,
          y = (v - 0.5) * 1.07 + 0.001 * Math.sin(u * TAU * 4);
        const edgeDistance = Math.min(u, 1 - u),
          endDistance = Math.min(v, 1 - v),
          seam = endDistance < 0.048,
          blend = Math.min(1, Math.max(0, (endDistance - 0.048) / 0.065)),
          shoulder = blend * blend * (3 - 2 * blend);
        const inflate =
          Math.pow(Math.max(0, Math.sin(u * Math.PI)), 0.6) *
          Math.pow(Math.max(0, Math.sin(v * Math.PI)), 0.64);
        const folds =
          (0.009 * Math.sin(u * 36 + v * 19) * Math.exp(-edgeDistance * 14) +
            0.005 * Math.sin(u * 22 - v * 26) * Math.exp(-endDistance * 18)) *
          shoulder;
        const gusset = 0.012 * Math.exp(-edgeDistance * 28) * inflate;
        const depth = seam
          ? 0.006
          : Math.max(
              0.006,
              0.142 * inflate * shoulder + folds + 0.008 - gusset,
            );
        const crimp = seam ? 0.00065 * Math.cos(u * TAU * 20) : 0;
        const rearFin = b
          ? 0.005 * Math.exp(-Math.abs(u - 0.5) * 85) * shoulder
          : 0;
        const notch = 0.013 * Math.exp(-(((v - 0.912) / 0.009) ** 2));
        const z = (b ? -1 : 1) * depth + crimp - rearFin;
        p.push(x * (1 - 0.065 * Math.sin(v * Math.PI) - notch), y, z);
        uv.push(b ? 1 - u : u, v);
      }
  const stride = (W + 1) * (H + 1);
  for (let b = 0; b < 2; b++)
    for (let j = 0; j < H; j++)
      for (let i = 0; i < W; i++) {
        const a = b * stride + j * (W + 1) + i,
          c = a + W + 1;
        idx.push(
          ...(b
            ? [a, c, c + 1, a, c + 1, a + 1]
            : [a, a + 1, c + 1, a, c + 1, c]),
        );
      }
  for (let j = 0; j < H; j++)
    for (let i of [0, W]) {
      const a = j * (W + 1) + i,
        c = a + W + 1;
      idx.push(a, a + stride, c, c, a + stride, c + stride);
    }
  for (let i = 0; i < W; i++)
    for (let j of [0, H]) {
      const a = j * (W + 1) + i;
      idx.push(a, a + 1, a + stride, a + 1, a + stride + 1, a + stride);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(p, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  const faceCount = W * H * 6;
  g.addGroup(0, faceCount, 0);
  g.addGroup(faceCount, faceCount, 1);
  g.addGroup(faceCount * 2, idx.length - faceCount * 2, 2);
  g.computeVertexNormals();
  return g;
}

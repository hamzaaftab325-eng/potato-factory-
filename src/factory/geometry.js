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

export function bagGeometry() {
  const p = [],
    uv = [],
    idx = [],
    W = 28,
    H = 40;
  for (let b = 0; b < 2; b++)
    for (let j = 0; j <= H; j++)
      for (let i = 0; i <= W; i++) {
        const u = i / W,
          v = j / H,
          x = (u - 0.5) * 0.75,
          y = (v - 0.5) * 1.07 + 0.003 * Math.sin(u * TAU * 6);
        const inflate =
          Math.pow(Math.max(0, Math.sin(u * Math.PI)), 0.52) *
          Math.pow(Math.max(0, Math.sin(v * Math.PI)), 0.56);
        const seam = v < 0.052 || v > 0.948;
        const crimp = seam ? 0.0022 * Math.cos(u * TAU * 31) : 0;
        const folds =
          0.012 *
            Math.sin(u * 34 + v * 13) *
            Math.exp(-Math.min(u, 1 - u) * 10) +
          0.009 *
            Math.sin(u * 22 + v * 42) *
            Math.exp(-Math.min(v, 1 - v) * 15);
        const z =
          (b ? -1 : 1) * (seam ? 0.007 : 0.154 * inflate + folds + 0.009) +
          crimp -
          (b ? 0.009 * Math.exp(-Math.abs(u - 0.5) * 100) * inflate : 0);
        p.push(x * (1 - 0.085 * Math.sin(v * Math.PI)), y, z);
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

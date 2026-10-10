import * as THREE from "three";
const TAU = Math.PI * 2;

export function chipGeometry() {
  const pos = [],
    uv = [],
    colors = [],
    index = [],
    N = 32,
    R = 6;
  const vertex = (ring, j, back) => {
    let r = ring / R,
      a = (j / N) * TAU,
      edge = 1 + 0.045 * Math.sin(a * 5) + 0.025 * Math.cos(a * 9);
    let x = Math.cos(a) * r * 0.218 * edge,
      y = Math.sin(a) * r * 0.173 * edge;
    let z =
      0.049 * Math.sin(x * 12) +
      0.025 * Math.cos(y * 18) +
      0.047 * (x / 0.218) ** 2;
    z += (back ? -1 : 1) * (0.0055 + 0.002 * Math.sin(a * 7) * r);
    pos.push(x, y, z);
    uv.push(x / 0.46 + 0.5, y / 0.38 + 0.5);
    const mottled =
        0.92 + 0.08 * Math.sin(x * 134 + y * 86) * Math.cos(y * 137),
      rim = 1 - 0.2 * r ** 8;
    colors.push(mottled, mottled * rim, mottled * rim * 0.88);
  };
  for (let b = 0; b < 2; b++)
    for (let ring = 0; ring <= R; ring++)
      for (let j = 0; j <= N; j++) vertex(ring, j, b);
  const stride = (R + 1) * (N + 1);
  for (let b = 0; b < 2; b++)
    for (let ring = 0; ring < R; ring++)
      for (let j = 0; j < N; j++) {
        let a = b * stride + ring * (N + 1) + j,
          c = a + N + 1;
        index.push(
          ...(b
            ? [a, c + 1, c, a, a + 1, c + 1]
            : [a, c, c + 1, a, c + 1, a + 1]),
        );
      }
  for (let j = 0; j < N; j++) {
    let a = R * (N + 1) + j,
      b = a + stride;
    index.push(a, b, a + 1, a + 1, b, b + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  g.setIndex(index);
  g.computeVertexNormals();
  return g;
}

export function bagGeometry() {
  const p = [],
    uv = [],
    idx = [],
    W = 20,
    H = 32;
  for (let b = 0; b < 2; b++)
    for (let j = 0; j <= H; j++)
      for (let i = 0; i <= W; i++) {
        const u = i / W,
          v = j / H,
          x = (u - 0.5) * 0.75,
          y = (v - 0.5) * 1.07;
        const inflate =
          Math.pow(Math.max(0, Math.sin(u * Math.PI)), 0.35) *
          Math.pow(Math.max(0, Math.sin(v * Math.PI)), 0.48);
        const seam = v < 0.06 || v > 0.94;
        const crimp = seam ? 0.004 * Math.cos(u * TAU * 23) : 0;
        const folds =
          0.012 *
            Math.sin(u * 34 + v * 13) *
            Math.exp(-Math.min(u, 1 - u) * 10) +
          0.009 *
            Math.sin(u * 22 + v * 42) *
            Math.exp(-Math.min(v, 1 - v) * 15);
        const z =
          (b ? -1 : 1) * (seam ? 0.008 : 0.125 * inflate + folds + 0.009) +
          crimp;
        p.push(x * (1 - 0.06 * Math.sin(v * Math.PI)), y, z);
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
  g.computeVertexNormals();
  return g;
}

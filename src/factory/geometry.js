import * as THREE from "three";
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

export function chipGeometry() {
  const pos = [],
    uv = [],
    colors = [],
    index = [],
    N = 40,
    R = 8;
  const vertex = (ring, j, back) => {
    let r = ring / R,
      a = (j / N) * TAU,
      edge = 1 + 0.038 * Math.sin(a * 5 + 0.4) + 0.022 * Math.cos(a * 9);
    // Broad, thin oval slices with an irregular toasted edge and a gentle
    // saddle curl. The broad face stays readable on the conveyor and in oil.
    let x = Math.cos(a) * r * 0.178 * edge,
      y = Math.sin(a) * r * 0.156 * edge;
    let z =
      0.006 * Math.sin(x * 19 + y * 7) +
      0.017 * (x / 0.178) ** 2 -
      0.01 * (y / 0.156) ** 2 +
      0.008 * Math.sin(a * 3 + 0.6) * r ** 5 +
      0.0015 * Math.sin(x * 113) * Math.cos(y * 107) * Math.sin(r * Math.PI);
    z += (back ? -1 : 1) * (0.0022 + 0.0004 * Math.sin(a * 7) * r);
    pos.push(x, y, z);
    uv.push(x / 0.38 + 0.5, y / 0.34 + 0.5);
    const mottled =
        0.97 + 0.03 * Math.sin(x * 134 + y * 86) * Math.cos(y * 137),
      rim = 1 - 0.12 * r ** 10;
    colors.push(mottled, mottled * rim, mottled * (1 - 0.22 * r ** 10));
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

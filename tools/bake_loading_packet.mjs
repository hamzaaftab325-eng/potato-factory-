// Optional offline bake of the shared collection model; not required by Vercel.
import fs from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import * as THREE from "three";
import { bagGeometry, chipGeometry } from "../src/factory/geometry.js";
import { createBagMaterials } from "../src/factory/packaging.js";
import { createProductPacket } from "../src/factory/product-packet.js";
const require = createRequire(import.meta.url);
let canvasLibrary;
try {
  canvasLibrary = require("@napi-rs/canvas");
} catch {
  const runtimeModules = process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
  if (!runtimeModules)
    throw new Error(
      "Install the optional @napi-rs/canvas package to regenerate the baked loader asset.",
    );
  canvasLibrary = createRequire(runtimeModules + "/package.json")(
    "@napi-rs/canvas",
  );
}
const { createCanvas, GlobalFonts } = canvasLibrary;
const root = fileURLToPath(new URL("../", import.meta.url)).replace(/\/$/, "");
for (const [file, family] of [
  ["instrument-serif-latin-400-normal", "Instrument Serif"],
  ["instrument-serif-latin-400-italic", "Instrument Serif"],
  ["dm-sans-latin-400-normal", "DM Sans"],
]) {
  const packageDir = file.startsWith("instrument")
    ? "instrument-serif"
    : "dm-sans";
  const src = `${root}/node_modules/@fontsource/${packageDir}/files/${file}.woff2`;
  GlobalFonts.registerFromPath(src, family);
}
globalThis.document = { createElement: () => createCanvas(1, 1) };
const canvas = createCanvas(900, 875),
  ctx = canvas.getContext("2d"),
  W = 900,
  H = 875;
const image = ctx.createImageData(W, H),
  depth = new Float32Array(W * H).fill(Infinity);
const camera = new THREE.PerspectiveCamera(32, W / H, 0.1, 10);
camera.position.set(0.12, 0.18, 2.95);
camera.lookAt(0, -0.01, 0);
camera.updateMatrixWorld();
const packet = createProductPacket({
  geometry: bagGeometry(),
  materials: createBagMaterials(0, { paper: null }, 1),
});
packet.position.y = 0.025;
const models = [packet];
for (let i = 0; i < 3; i++) {
  const chip = new THREE.Mesh(
    chipGeometry(i + 1),
    new THREE.MeshStandardMaterial({ color: "#efd08a", vertexColors: true }),
  );
  chip.scale.setScalar(0.55);
  chip.position.set(
    ...[
      [-0.43, -0.18, 0.18],
      [0.43, -0.32, 0.25],
      [0.36, 0.41, 0.12],
    ][i],
  );
  chip.rotation.set(-1.1 + i * 0.15, 0.12, -0.42 + i * 0.38);
  models.push(chip);
}
const light = new THREE.Vector3(-2, 3, 4).normalize(),
  half = light
    .clone()
    .add(new THREE.Vector3(0, 0, 1))
    .normalize();
for (const model of models) {
  model.updateMatrixWorld();
  const g = model.geometry,
    pos = g.attributes.position,
    norm = g.attributes.normal,
    uv = g.attributes.uv,
    colors = g.attributes.color;
  const mvp = new THREE.Matrix4()
    .multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)
    .multiply(model.matrixWorld);
  const normalMatrix = new THREE.Matrix3().getNormalMatrix(model.matrixWorld);
  const vertices = [];
  for (let i = 0; i < pos.count; i++) {
    const c = new THREE.Vector4(
        pos.getX(i),
        pos.getY(i),
        pos.getZ(i),
        1,
      ).applyMatrix4(mvp),
      normal = new THREE.Vector3(norm.getX(i), norm.getY(i), norm.getZ(i))
        .applyMatrix3(normalMatrix)
        .normalize();
    vertices.push({
      x: ((c.x / c.w) * 0.5 + 0.5) * W,
      y: (0.5 - (c.y / c.w) * 0.5) * H,
      z: c.z / c.w,
      iw: 1 / c.w,
      n: normal,
      u: uv.getX(i),
      v: uv.getY(i),
      color: colors
        ? [colors.getX(i), colors.getY(i), colors.getZ(i)]
        : [1, 1, 1],
    });
  }
  const materials = [model.material].flat();
  const textures = materials.map((m) =>
    m.map?.image
      ? m.map.image
          .getContext("2d")
          .getImageData(0, 0, m.map.image.width, m.map.image.height)
      : null,
  );
  let groupIndex = 0;
  for (let j = 0; j < g.index.count; j += 3) {
    while (
      groupIndex + 1 < g.groups.length &&
      j >= g.groups[groupIndex].start + g.groups[groupIndex].count
    )
      groupIndex++;
    const mi = g.groups.length ? g.groups[groupIndex].materialIndex : 0,
      material = materials[mi],
      tex = textures[mi];
    const a = vertices[g.index.getX(j)],
      b = vertices[g.index.getX(j + 1)],
      c = vertices[g.index.getX(j + 2)];
    const den = (b.y - c.y) * (a.x - c.x) + (c.x - b.x) * (a.y - c.y);
    if (Math.abs(den) < 1e-6) continue;
    const minX = Math.max(0, Math.floor(Math.min(a.x, b.x, c.x))),
      maxX = Math.min(W - 1, Math.ceil(Math.max(a.x, b.x, c.x))),
      minY = Math.max(0, Math.floor(Math.min(a.y, b.y, c.y))),
      maxY = Math.min(H - 1, Math.ceil(Math.max(a.y, b.y, c.y)));
    for (let y = minY; y <= maxY; y++)
      for (let x = minX; x <= maxX; x++) {
        const l0 =
            ((b.y - c.y) * (x + 0.5 - c.x) + (c.x - b.x) * (y + 0.5 - c.y)) /
            den,
          l1 =
            ((c.y - a.y) * (x + 0.5 - c.x) + (a.x - c.x) * (y + 0.5 - c.y)) /
            den,
          l2 = 1 - l0 - l1;
        if (l0 < 0 || l1 < 0 || l2 < 0) continue;
        const z = l0 * a.z + l1 * b.z + l2 * c.z,
          k = y * W + x;
        if (z >= depth[k]) continue;
        depth[k] = z;
        const q = l0 * a.iw + l1 * b.iw + l2 * c.iw,
          weights = [(l0 * a.iw) / q, (l1 * b.iw) / q, (l2 * c.iw) / q],
          v = [a, b, c];
        const n = new THREE.Vector3();
        for (let t = 0; t < 3; t++) n.addScaledVector(v[t].n, weights[t]);
        n.normalize();
        let rgb;
        if (tex) {
          const u = weights.reduce((s, w, i) => s + w * v[i].u, 0),
            vv = weights.reduce((s, w, i) => s + w * v[i].v, 0),
            tx = Math.max(
              0,
              Math.min(tex.width - 1, Math.round(u * (tex.width - 1))),
            ),
            ty = Math.max(
              0,
              Math.min(tex.height - 1, Math.round((1 - vv) * (tex.height - 1))),
            ),
            at = (ty * tex.width + tx) * 4;
          rgb = [tex.data[at], tex.data[at + 1], tex.data[at + 2]];
        } else {
          const col = material.color.clone().convertLinearToSRGB();
          rgb = [col.r * 255, col.g * 255, col.b * 255].map(
            (z, i) => z * weights.reduce((s, w, j) => s + w * v[j].color[i], 0),
          );
        }
        const shade = 0.68 + 0.32 * Math.max(0, n.dot(light)),
          spec = 0.1 * Math.pow(Math.max(0, n.dot(half)), 36);
        for (let t = 0; t < 3; t++)
          image.data[k * 4 + t] = Math.min(255, rgb[t] * shade + spec * 255);
        image.data[k * 4 + 3] = 255;
      }
  }
}
ctx.putImageData(image, 0, 0);
fs.mkdirSync(`${root}/public/loader`, { recursive: true });
fs.writeFileSync(
  `${root}/public/loader/collection-packet.png`,
  canvas.toBuffer("image/png"),
);
console.log(
  "Baked the original product pouch and chip geometry, using the original packet canvas artwork.",
);

import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { SSAOPass } from "three/addons/postprocessing/SSAOPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { FXAAShader } from "three/addons/shaders/FXAAShader.js";
import { Reflector } from "three/addons/objects/Reflector.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { addFactoryDetails } from "./details.js";
import { FactorySound } from "./audio.js";
import { chipGeometry, bagGeometry, potatoGeometry } from "./geometry.js";
import { addProcessMachines } from "./machines.js";
import { addShippingLine } from "./shipping.js";
import { addDeliveryScene } from "./delivery.js";
import { createBagMaterials } from "./packaging.js";
import { createSurfaceTextures } from "./surfaces.js";
import { LOOP_SECONDS, bagPhase, jawClosure } from "./timing.js";
import { cameraAt, FLAVOURS } from "../lib/journey.js";

export function createFactory(canvas, options = {}) {
  const TAU = Math.PI * 2,
    LOOP = LOOP_SECONDS;
  let reducedMotion = Boolean(options.reducedMotion);
  let width = 1,
    height = 1,
    disposed = false,
    dirty = true;
  let ready = false,
    raf = 0,
    frameCount = 0,
    lastRendered = 0;
  let contextLost = false;
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio || 1, window.innerWidth < 700 ? 1.5 : 2),
  );
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#082326");
  scene.fog = new THREE.FogExp2("#082326", 0.009);
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 180),
    v3 = (x, y, z) => new THREE.Vector3(x, y, z);
  let seed = 132;
  function random() {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  }
  const textures = createSurfaceTextures(
    random,
    Math.min(8, renderer.capabilities.getMaxAnisotropy()),
  );
  const metalTex = textures.metal,
    potatoTex = textures.potato,
    chipTex = textures.chip;
  function mat(color, metalness = 0.0, roughness = 0.5, extra = {}) {
    return new THREE.MeshStandardMaterial({
      color,
      metalness,
      roughness,
      ...extra,
    });
  }
  const M = {
    steel: mat("#b2bec0", 0.92, 0.28, { roughnessMap: metalTex }),
    chrome: mat("#d1d9d6", 0.95, 0.18),
    dark: mat("#1c3037", 0.65, 0.37),
    rubber: mat("#1a2425", 0.02, 0.83, {
      bumpMap: textures.belt,
      bumpScale: 0.0018,
    }),
    yellow: mat("#eeb629", 0.45, 0.29),
    red: mat("#ba3430", 0.35, 0.32),
    green: mat("#739333", 0.32, 0.35),
    copper: mat("#b17433", 0.8, 0.28),
    potato: mat("#cdb692", 0, 0.86, { map: potatoTex }),
    peeled: mat("#e3d0a7", 0, 0.52, { bumpMap: potatoTex, bumpScale: 0.0015 }),
    raw: mat("#dfce9f", 0, 0.53),
    chip: mat("#e8b340", 0, 0.58, { map: chipTex }),
    redChip: mat("#dc8434", 0, 0.6, { map: chipTex }),
    herbChip: mat("#d9b344", 0, 0.62, { map: chipTex }),
    led: mat("#61eed6", 0.3, 0.3, {
      emissive: "#39bdb3",
      emissiveIntensity: 2,
    }),
    black: mat("#0b1519", 0.3, 0.7),
    water: new THREE.MeshPhysicalMaterial({
      color: "#69aaa9",
      metalness: 0.15,
      roughness: 0.14,
      transparent: true,
      opacity: 0.67,
      clearcoat: 1,
    }),
    oil: new THREE.MeshPhysicalMaterial({
      color: "#875416",
      metalness: 0.15,
      roughness: 0.17,
      clearcoat: 1,
    }),
    glass: new THREE.MeshPhysicalMaterial({
      color: "#badbd8",
      metalness: 0,
      roughness: 0.05,
      transparent: true,
      opacity: 0.17,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
    floor: mat("#10282d", 0.3, 0.44),
  };
  M.motor = mat("#16384b", 0.75, 0.27);
  M.potato.bumpMap = potatoTex;
  M.potato.bumpScale = 0.008;
  for (const m of [M.chip, M.redChip, M.herbChip]) {
    m.bumpMap = chipTex;
    m.bumpScale = 0.004;
  }
  M.steel.bumpMap = metalTex;
  M.steel.bumpScale = 0.0015;
  M.steel.roughness = 0.31;
  M.steel.color.set("#aebdbc");
  M.chip.color.set("#f9dc92");
  M.chip.vertexColors = true;
  M.redChip.vertexColors = true;
  M.herbChip.vertexColors = true;
  M.redChip.color.set("#f1c09a");
  M.herbChip.color.set("#f2e3ad");
  M.yellow = new THREE.MeshPhysicalMaterial({
    color: "#e9ad1f",
    metalness: 0.4,
    roughness: 0.28,
    clearcoat: 0.65,
    clearcoatRoughness: 0.2,
  });
  M.red = new THREE.MeshPhysicalMaterial({
    color: "#a72c23",
    metalness: 0.35,
    roughness: 0.28,
    clearcoat: 0.6,
  });
  M.green = new THREE.MeshPhysicalMaterial({
    color: "#64792d",
    metalness: 0.35,
    roughness: 0.3,
    clearcoat: 0.6,
  });
  M.dark.color.set("#152125");
  M.floor.color.set("#082326");
  M.floor.roughness = 0.31;
  // Procedural studio environment: broad reflection cards, no external HDR assets.
  const env = new THREE.Scene();
  env.background = new THREE.Color("#39464c");
  for (let [x, y, z, w, h, c, p] of [
    [-8, 8, 2, 7, 5, "#fff0d5", 7],
    [9, 5, -6, 5, 7, "#c4e8ff", 5],
    [0, 12, 0, 10, 8, "#ffffff", 6],
    [0, 3, 10, 14, 3, "#fff5e2", 4],
  ]) {
    let o = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(c).multiplyScalar(p),
        side: THREE.DoubleSide,
      }),
    );
    o.position.set(x, y, z);
    o.lookAt(0, 0, 0);
    env.add(o);
  }
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(env, 0.04).texture;
  pmrem.dispose();
  scene.environmentIntensity = 1.2;
  scene.add(new THREE.HemisphereLight("#b8e9e2", "#101417", 0.38));
  function light(color, power, x, y, z) {
    let l = new THREE.DirectionalLight(color, power);
    l.position.set(x, y, z);
    scene.add(l);
    return l;
  }
  const key = light("#fff0d8", 3.25, -5, 19, 10);
  key.castShadow = true;
  key.shadow.mapSize.set(
    window.innerWidth < 700 ? 1536 : 2048,
    window.innerWidth < 700 ? 1536 : 2048,
  );
  Object.assign(key.shadow.camera, {
    left: -27,
    right: 27,
    top: 16,
    bottom: -16,
    near: 1,
    far: 60,
  });
  key.shadow.bias = -0.00015;
  key.shadow.normalBias = 0.03;
  light("#b4e1e9", 1.1, 10, 9, -12);
  light("#fff5dc", 1.2, 3, 7, 13);
  const geoCache = new Map();
  function roundGeo(w, h, d, r = 0.05) {
    let k = [w, h, d, r].join(",");
    if (geoCache.has(k)) return geoCache.get(k);
    r = Math.min(r, w / 5, h / 5, d / 3);
    w -= 2 * r;
    h -= 2 * r;
    const s = new THREE.Shape(),
      x = -w / 2,
      y = -h / 2;
    s.moveTo(x + r, y);
    s.lineTo(x + w - r, y);
    s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r);
    s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h);
    s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r);
    s.quadraticCurveTo(x, y, x + r, y);
    let g = new THREE.ExtrudeGeometry(s, {
      depth: d - 2 * r,
      steps: 1,
      bevelEnabled: true,
      bevelThickness: r,
      bevelSize: r,
      bevelSegments: 4,
      curveSegments: 6,
    });
    g.translate(0, 0, -d / 2 + r);
    geoCache.set(k, g);
    return g;
  }
  const cylGeo = new THREE.CylinderGeometry(1, 1, 1, 24),
    sphereGeo = new THREE.SphereGeometry(1, 28, 20),
    unitBox = new THREE.BoxGeometry(1, 1, 1);
  function mesh(g, m, x = 0, y = 0, z = 0, parent = scene) {
    let o = new THREE.Mesh(g, m);
    o.position.set(x, y, z);
    o.castShadow = o.receiveShadow = true;
    parent.add(o);
    return o;
  }
  function box(x, y, z, w, h, d, m, parent = scene, r = 0.035) {
    return mesh(roundGeo(w, h, d, r), m, x, y, z, parent);
  }
  function cylinder(x, y, z, r, h, m, parent = scene, axis = "y") {
    let o = mesh(cylGeo, m, x, y, z, parent);
    o.scale.set(r, h, r);
    if (axis === "z") o.rotation.x = Math.PI / 2;
    if (axis === "x") o.rotation.z = Math.PI / 2;
    return o;
  }
  function sphere(x, y, z, sx, sy, sz, m, parent = scene) {
    let o = mesh(sphereGeo, m, x, y, z, parent);
    o.scale.set(sx, sy, sz);
    return o;
  }
  function pipe(points, r = 0.055, m = M.chrome, parent = scene) {
    return mesh(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(points.map((p) => v3(...p))),
        32,
        r,
        8,
        false,
      ),
      m,
      0,
      0,
      0,
      parent,
    );
  }
  const boltMatrices = [],
    dummy = new THREE.Object3D();
  function bolt(x, y, z, axis = "z") {
    dummy.position.set(x, y, z);
    dummy.rotation.set(
      axis === "z" ? Math.PI / 2 : 0,
      0,
      axis === "x" ? Math.PI / 2 : 0,
    );
    dummy.scale.set(0.045, 0.035, 0.045);
    dummy.updateMatrix();
    boltMatrices.push(dummy.matrix.clone());
  }
  function panel(x, y, z, w, h, m = M.steel) {
    box(x, y, z, w, h, 0.1, m);
    for (let dx of [-w / 2 + 0.12, w / 2 - 0.12])
      for (let dy of [-h / 2 + 0.12, h / 2 - 0.12])
        bolt(x + dx, y + dy, z + 0.065);
  }
  function motor(x, y, z, axis = "z") {
    let g = new THREE.Group();
    g.position.set(x, y, z);
    if (axis === "x") g.rotation.y = Math.PI / 2;
    scene.add(g);
    cylinder(0, 0, 0, 0.23, 0.52, M.motor, g, "z");
    for (let i = 0; i < 9; i++)
      cylinder(0, 0, -0.24 + i * 0.055, 0.26, 0.022, M.motor, g, "z");
    box(0, 0.26, 0, 0.28, 0.12, 0.27, M.dark, g);
    cylinder(0, 0, 0.36, 0.1, 0.2, M.chrome, g, "z");
    box(0, -0.29, 0, 0.62, 0.1, 0.5, M.steel, g);
    for (let x1 of [-0.23, 0.23]) bolt(x + x1, y - 0.24, z + 0.18);
    return g;
  }
  function feet(x, z, w = 1.4, d = 1.5, top = 1.2) {
    for (let dx of [-w / 2, w / 2])
      for (let dz of [-d / 2, d / 2]) {
        const legTop = Math.max(0.84, top - 0.05);
        cylinder(x + dx, 0.612, z + dz, 0.115, 0.062, M.rubber);
        cylinder(x + dx, 0.705, z + dz, 0.033, 0.14, M.chrome);
        cylinder(x + dx, 0.747, z + dz, 0.064, 0.028, M.steel);
        box(
          x + dx,
          (0.77 + legTop) / 2,
          z + dz,
          0.085,
          legTop - 0.77,
          0.085,
          M.steel,
        );
        box(x + dx, top - 0.05, z + dz, 0.16, 0.1, 0.16, M.steel);
      }
    box(x, 0.83, z, w, 0.055, 0.065, M.steel);
  }
  const beltAnims = [],
    spinAnims = [],
    flows = [],
    drums = [],
    sealers = [],
    sprays = [];
  function conveyor(a, b, z = 0, width = 1.1, y = 1.25) {
    let len = b - a,
      x = (a + b) / 2;
    box(x, y - 0.16, z, len, 0.27, width, M.dark);
    box(x, y + 0.016, z, len, 0.055, width - 0.08, M.rubber);
    for (let s of [-1, 1]) {
      box(x, y + 0.13, z + s * (width / 2 + 0.055), len, 0.095, 0.1, M.chrome);
      box(x, y - 0.08, z + s * (width / 2 + 0.06), len, 0.2, 0.09, M.steel);
      for (let xx = a + 0.15; xx < b; xx += 0.6)
        bolt(xx, y - 0.08, z + s * (width / 2 + 0.12));
    }
    for (let xx of [a + 0.13, b - 0.13]) {
      cylinder(xx, y - 0.08, z, 0.17, width, M.steel, scene, "z");
      if (xx === b - 0.13) motor(xx, y - 0.1, z + width / 2 + 0.36);
      else {
        box(xx, y - 0.08, z + width / 2 + 0.14, 0.24, 0.24, 0.15, M.steel);
        cylinder(
          xx,
          y - 0.08,
          z + width / 2 + 0.25,
          0.08,
          0.06,
          M.chrome,
          scene,
          "z",
        );
      }
    }
    for (let xx = a + 0.5; xx < b; xx += 2) {
      feet(xx, z, 0.22, width - 0.05, y);
    }
    let n = Math.ceil(len / 0.16),
      inst = new THREE.InstancedMesh(unitBox, M.dark, n);
    inst.castShadow = false;
    inst.receiveShadow = true;
    scene.add(inst);
    beltAnims.push({ a, b, z, y, width, n, inst });
    return { a, b, z, y, width };
  }
  const chipG = chipGeometry(),
    potatoG = potatoGeometry();
  [M.chip, M.redChip, M.herbChip, M.raw].forEach((m) => {
    m.vertexColors = true;
    m.roughness = 0.48;
  });
  const fluidClock = { value: 0 };
  function liquid(x, y, z, w, d, m) {
    m.onBeforeCompile = (s) => {
      s.uniforms.factoryTime = fluidClock;
      s.vertexShader = "uniform float factoryTime;\n" + s.vertexShader;
      s.vertexShader = s.vertexShader.replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
    float phase=factoryTime*3.14159265359;
    transformed.z+=.006*sin(position.x*13.0+phase)+.004*cos(position.y*17.0-phase*2.0);`,
      );
      s.vertexShader = s.vertexShader.replace(
        "#include <beginnormal_vertex>",
        `#include <beginnormal_vertex>
    objectNormal=normalize(vec3(-.078*cos(position.x*13.0+factoryTime*3.14159265359),.068*sin(position.y*17.0-factoryTime*6.28318530718),1.0));`,
      );
    };
    const o = mesh(new THREE.PlaneGeometry(w, d, 64, 24), m, x, y, z);
    o.rotation.x = -Math.PI / 2;
    return o;
  }
  function foodFlow(
    a,
    b,
    z,
    y,
    n,
    type = "chip",
    material = M.chip,
    width = 0.7,
  ) {
    let inst = new THREE.InstancedMesh(
      type === "chip" ? chipG : potatoG,
      material,
      n,
    );
    inst.castShadow = true;
    inst.receiveShadow = true;
    scene.add(inst);
    const meta = [];
    for (let i = 0; i < n; i++)
      meta.push({
        offset: i / n,
        lane: (random() - 0.5) * width,
        scale: 0.8 + random() * 0.4,
        angle: random() * TAU,
        variant: random(),
      });
    flows.push({ a, b, z, y, n, type, inst, meta });
  }
  // Ground and the rounded presentation plinth.
  box(0, -0.31, 0, 170, 0.12, 170, M.floor, scene, 0.02);
  box(3.3, 0.13, 0, 38.0, 0.78, 8.9, M.dark, scene, 0.24);
  box(3.3, 0.48, 0, 37.7, 0.1, 8.7, M.steel, scene, 0.12);
  box(3.3, 0.55, 0, 37.45, 0.03, 8.5, M.dark, scene, 0.1);
  for (let s of [-1, 1]) {
    box(3.3, 0.575, s * 3.92, 36.8, 0.02, 0.028, M.yellow);
    box(3.3 + s * 18.4, 0.575, 0, 0.028, 0.02, 7.84, M.yellow);
  }
  for (let x = -14; x <= 20; x += 2) {
    box(x, 0.582, 3.52, 0.62, 0.015, 0.17, M.yellow).rotation.y = -0.5;
  }
  function label(text, x, y, z, w = 1.5) {
    let c = document.createElement("canvas");
    c.width = 1024;
    c.height = 256;
    let a = c.getContext("2d");
    a.fillStyle = "#193139";
    a.fillRect(0, 0, 1024, 256);
    a.fillStyle = "#ecc869";
    a.font = "500 76px DM Sans";
    a.textAlign = "center";
    a.fillText(text, 512, 157);
    const map = new THREE.CanvasTexture(c);
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    let m = new THREE.MeshBasicMaterial({ map });
    let o = mesh(new THREE.PlaneGeometry(w, w / 4), m, x, y, z);
    o.rotation.x = -Math.PI / 2;
    return o;
  }
  for (let [text, x] of [
    ["01  /  PREPARE", -10],
    ["02  /  SLICE", -5.9],
    ["03  /  FRY", -0.5],
    ["04  /  FLAVOUR", 5.3],
    ["05  /  PACK", 10.4],
    ["CASE & DISPATCH", 17.65],
  ])
    label(text, x, 0.59, 3.08, 2.35);
  const process = addProcessMachines({
    scene,
    M,
    box,
    cylinder,
    sphere,
    pipe,
    mesh,
    motor,
    feet,
    bolt,
    conveyor,
    foodFlow,
    liquid,
    sprays,
    spinAnims,
    chipG,
    potatoG,
    textures,
    random,
  });
  const { peeler } = process;
  const bubbles = [];
  const bubbleBatch = new THREE.InstancedMesh(
    new THREE.SphereGeometry(1, 12, 8),
    new THREE.MeshPhysicalMaterial({
      color: "#e1b656",
      metalness: 0.12,
      roughness: 0.16,
      clearcoat: 1,
    }),
    240,
  );
  bubbleBatch.receiveShadow = true;
  scene.add(bubbleBatch);
  for (let i = 0; i < 240; i++)
    bubbles.push({
      x: -2.5 + random() * 4,
      z: (random() - 0.5) * 1.8,
      phase: random(),
      s: 0.55 + random() * 1.1,
    });
  // 04: distribution manifold and three independently driven seasoning drums.
  for (let z of [-2.25, 0, 2.25]) {
    conveyor(4.05, 5.0, z, 0.95, 1.28);
    foodFlow(4.05, 5, z, 1.34, 12, "chip", M.chip, 0.63);
  }
  const flavourColors = [M.yellow, M.red, M.green],
    chipColors = [M.chip, M.redChip, M.herbChip];
  function tubeGeo() {
    const positions = [],
      normals = [];
    const push = (p, n) => {
      positions.push(...p);
      normals.push(...n);
    };
    const N = 64;
    for (let i = 0; i < N; i++) {
      let a = (i * TAU) / N,
        b = ((i + 1) * TAU) / N;
      for (let radius of [0.7, 0.79]) {
        let sign = radius === 0.79 ? 1 : -1;
        const verts = [
          [radius * Math.cos(a), radius * Math.sin(a), -0.825],
          [radius * Math.cos(b), radius * Math.sin(b), -0.825],
          [radius * Math.cos(b), radius * Math.sin(b), 0.825],
          [radius * Math.cos(a), radius * Math.sin(a), 0.825],
        ];
        for (let j of radius === 0.79
          ? [0, 1, 2, 0, 2, 3]
          : [0, 2, 1, 0, 3, 2]) {
          let ang = j === 0 || j === 3 ? a : b;
          push(verts[j], [sign * Math.cos(ang), sign * Math.sin(ang), 0]);
        }
      }
      for (let z of [-0.825, 0.825]) {
        let verts = [
          [0.7 * Math.cos(a), 0.7 * Math.sin(a), z],
          [0.79 * Math.cos(a), 0.79 * Math.sin(a), z],
          [0.79 * Math.cos(b), 0.79 * Math.sin(b), z],
          [0.7 * Math.cos(b), 0.7 * Math.sin(b), z],
        ];
        for (let j of z > 0 ? [0, 1, 2, 0, 2, 3] : [0, 2, 1, 0, 3, 2])
          push(verts[j], [0, 0, Math.sign(z)]);
      }
    }
    let g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    g.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
    return g;
  }
  const drumG = tubeGeo();
  for (let f = 0; f < 3; f++) {
    let z = (f - 1) * 2.25,
      x = 5.95;
    feet(x, z, 1.95, 1.24, 1.65);
    box(x, 0.99, z, 2.1, 0.13, 1.65, M.dark);
    let g = new THREE.Group();
    g.position.set(x, 2.01, z);
    g.rotation.y = Math.PI / 2;
    g.rotation.x = 0;
    g.rotation.z = -0.06;
    scene.add(g);
    let shell = mesh(drumG, M.steel, 0, 0, 0, g);
    // Narrow enamel identification bands leave the food drum in stainless steel.
    for (const zz of [-0.61, 0.61]) {
      const band = mesh(
        new THREE.CylinderGeometry(0.796, 0.796, 0.18, 64, 1, true),
        flavourColors[f],
        0,
        0,
        zz,
        shell,
      );
      band.rotation.x = Math.PI / 2;
    }
    for (let zz of [-0.77, 0.77]) {
      let rim = mesh(
        new THREE.TorusGeometry(0.775, 0.036, 8, 48),
        M.chrome,
        0,
        0,
        zz,
        g,
      );
    }
    for (let i = 0; i < 6; i++) {
      let a = (i * TAU) / 6;
      let rib = box(
        Math.cos(a) * 0.66,
        Math.sin(a) * 0.66,
        0,
        0.06,
        0.08,
        1.53,
        M.steel,
        shell,
      );
      rib.rotation.z = a;
    }
    drums.push({ g, shell, x, z, f });
    motor(x, 1.14, z + 0.94);
    for (let xx of [x - 0.63, x + 0.63])
      cylinder(xx, 1.34, z, 0.21, 1.64, M.dark, scene, "z");
    let bowl = cylinder(x, 3.34, z, 0.36, 0.43, M.steel);
    cylinder(x, 3.02, z, 0.18, 0.32, M.chrome);
    for (let zz of [-0.48, 0.48])
      cylinder(x, 2.68, z + zz, 0.032, 1.75, M.chrome);
    pipe(
      [
        [x, 2.9, z],
        [x + 0.9, 2.89, z],
        [x + 0.93, 2.2, z],
        [x + 0.66, 2.17, z],
      ],
      0.04,
      M.chrome,
    );
    const tumblers = [],
      tBatch = new THREE.InstancedMesh(chipG, chipColors[f], 32);
    tBatch.castShadow = tBatch.receiveShadow = true;
    g.add(tBatch);
    for (let i = 0; i < 32; i++) {
      let o = new THREE.Object3D();
      o.scale.setScalar(0.55 + random() * 0.18);
      tumblers.push({
        o,
        phase: random() * TAU,
        rad: 0.15 + random() * 0.34,
        depth: (random() - 0.5) * 1.45,
      });
    }
    drums[f].tumblers = tumblers;
    drums[f].chipBatch = tBatch;
    conveyor(6.84, 7.75, z, 1.15, 1.29);
    foodFlow(6.85, 7.7, z, 1.36, 28, "chip", chipColors[f], 0.76);
  }
  // 05: multihead weighing, film roll, forming collar, draw rollers and sealing jaws.
  const bagG = bagGeometry();
  function bagMaterial(f) {
    return createBagMaterials(
      f,
      textures,
      Math.min(8, renderer.capabilities.getMaxAnisotropy()),
    );
  }
  const packAnims = [],
    bagMaterials = [0, 1, 2].map(bagMaterial);
  const sealFace = new THREE.PlaneGeometry(0.79, 0.125, 48, 1);
  for (let i = 0; i < sealFace.attributes.position.count; i++)
    sealFace.attributes.position.setZ(i, i % 2 ? 0.006 : 0);
  sealFace.computeVertexNormals();
  for (let f = 0; f < 3; f++) {
    let z = (f - 1) * 2.25,
      x = 10.0,
      paint = flavourColors[f],
      bagMat = bagMaterials[f];
    feet(x, z, 1.35, 1.3, 1.2);
    box(x, 1.05, z, 1.5, 0.16, 1.64, M.steel);
    for (let dx of [-0.67, 0.67])
      for (let dz of [-0.71, 0.71])
        box(x + dx, 2.25, z + dz, 0.075, 2.48, 0.075, M.chrome);
    box(x, 3.5, z, 1.6, 0.15, 1.76, M.steel);
    box(x, 3.32, z - 0.58, 0.95, 0.95, 0.31, M.dark);
    cylinder(x, 3.62, z, 0.28, 0.44, M.steel);
    let roll = cylinder(x, 3.53, z - 0.47, 0.36, 1.08, paint, scene, "x");
    spinAnims.push({ o: roll, axis: "x", turns: 8 });
    for (let dx of [-0.58, 0.58])
      cylinder(x + dx, 3.53, z - 0.47, 0.11, 0.08, M.dark, scene, "x");
    let film = box(x, 3.02, z - 0.16, 0.69, 0.7, 0.015, bagMat[0]);
    film.rotation.x = -0.25;
    cylinder(x, 2.7, z, 0.23, 0.28, M.chrome);
    mesh(
      new THREE.CylinderGeometry(0.41, 0.235, 0.27, 48, 1, true),
      M.steel,
      x,
      2.83,
      z,
    );
    cylinder(x, 2.36, z, 0.2, 0.55, paint);
    for (let dx of [-0.3, 0.3]) cylinder(x + dx, 2.19, z, 0.11, 0.55, M.rubber);
    let a = box(x, 1.87, z - 0.22, 0.87, 0.17, 0.18, M.steel),
      b = box(x, 1.87, z + 0.22, 0.87, 0.17, 0.18, M.steel);
    mesh(sealFace, M.chrome, 0, 0, 0.092, a);
    mesh(sealFace, M.chrome, 0, 0, -0.092, b).rotation.y = Math.PI;
    sealers.push({ a, b, z, f });
    let formed = mesh(bagG, bagMat, x, 1.67, z);
    formed.scale.set(0.72, 0.72, 0.8);
    packAnims.push({ o: formed, f });
    panel(x + 0.62, 2.89, z + 0.8, 0.32, 0.67, M.dark);
    box(x + 0.62, 3.02, z + 0.865, 0.2, 0.17, 0.022, M.led);
    box(x + 0.62, 2.73, z + 0.865, 0.09, 0.05, 0.02, M.red);
    conveyor(10.45, 14.0, z, 1.05, 1.03);
    let bags = [];
    for (let i = 0; i < 4; i++) {
      let g = new THREE.Group();
      scene.add(g);
      let o = mesh(bagG, bagMat, 0, 0, 0, g);
      o.rotation.x = -Math.PI / 2;
      o.scale.setScalar(0.69);
      bags.push(g);
    }
    packAnims.push({ bags, f, z });
  }
  const shipping = addShippingLine({
    scene,
    M,
    box,
    mesh,
    cylinder,
    pipe,
    conveyor,
    feet,
    bagG,
    bagMaterials,
    textures,
  });
  // Hardware, process panels, yellow safety stanchions.
  for (let x of [-12, -8, -4, 0, 4, 8, 12]) {
    box(x, 0.95, -4.15, 1.23, 0.7, 0.46, M.dark);
    panel(x, 1.0, -3.88, 1.06, 0.55);
    box(x, 1.05, -3.8, 0.42, 0.22, 0.025, M.black);
    box(x, 1.05, -3.78, 0.29, 0.025, 0.01, M.led);
    pipe(
      [
        [x, 0.7, -4],
        [x, 0.7, -3.2],
        [x, 0.9, -2.6],
      ],
      0.045,
      M.rubber,
    );
  }
  for (let x of [-14.8, 21.7])
    for (let z of [-3.89, 3.89]) {
      cylinder(x, 0.95, z, 0.05, 0.77, M.chrome);
      cylinder(x, 1.37, z, 0.085, 0.18, M.led);
    }
  const detail = addFactoryDetails({
    scene,
    M,
    box,
    cylinder,
    sphere,
    pipe,
    mesh,
    motor,
    bolt,
    chipG,
    random,
    spinAnims,
  });
  const bolts = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(1, 1, 1, 6),
    M.chrome,
    boltMatrices.length,
  );
  boltMatrices.forEach((m, i) => bolts.setMatrixAt(i, m));
  scene.add(bolts);
  // Lightweight, deterministic droplets and seasoning dust; all return after 16 seconds.
  const pointCount = 240,
    pointPositions = new Float32Array(pointCount * 3),
    pointG = new THREE.BufferGeometry();
  pointG.setAttribute("position", new THREE.BufferAttribute(pointPositions, 3));
  let points = new THREE.Points(
    pointG,
    new THREE.PointsMaterial({
      color: "#afdcd3",
      size: 0.033,
      transparent: true,
      opacity: 0.64,
    }),
  );
  scene.add(points);
  const dustN = 120,
    dustP = new Float32Array(dustN * 3),
    dustG = new THREE.BufferGeometry();
  dustG.setAttribute("position", new THREE.BufferAttribute(dustP, 3));
  scene.add(
    new THREE.Points(
      dustG,
      new THREE.PointsMaterial({
        color: "#efc878",
        size: 0.022,
        transparent: true,
        opacity: 0.8,
      }),
    ),
  );
  const steamN = 68,
    steamP = new Float32Array(steamN * 3),
    steamG = new THREE.BufferGeometry();
  steamG.setAttribute("position", new THREE.BufferAttribute(steamP, 3));
  const steamCanvas = document.createElement("canvas");
  steamCanvas.width = steamCanvas.height = 64;
  const sc = steamCanvas.getContext("2d"),
    gradient = sc.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, "rgba(216,233,226,.35)");
  gradient.addColorStop(1, "rgba(216,233,226,0)");
  sc.fillStyle = gradient;
  sc.fillRect(0, 0, 64, 64);
  scene.add(
    new THREE.Points(
      steamG,
      new THREE.PointsMaterial({
        map: new THREE.CanvasTexture(steamCanvas),
        size: 0.75,
        transparent: true,
        opacity: 0.25,
        depthWrite: false,
      }),
    ),
  );
  // One clock drives all machines and sample-accurate audio. Offscreen rendering
  // and audio stop together; returning resumes the same phase.
  let playing = !reducedMotion,
    visible = true,
    pageVisible = !document.hidden;
  let audioOn = false,
    musicOn = false,
    inspect = false,
    ctx = null,
    sound = null;
  let anchor = performance.now() / 1000,
    held = 0,
    audioAnchor = 0;
  let mode = "factory",
    stage = 0,
    flavour = 0,
    journey = 0;
  let desired = cameraAt(0),
    target = v3(...desired.target);
  let radius = desired.radius,
    yaw = desired.yaw,
    elevation = desired.elev;
  const active = () => playing && visible && pageVisible && !contextLost;
  function now() {
    return !active()
      ? held
      : audioOn && ctx && ctx.state === "running"
        ? ctx.currentTime - audioAnchor
        : performance.now() / 1000 - anchor;
  }
  function align(t) {
    held = t;
    anchor = performance.now() / 1000 - t;
    audioAnchor = ctx ? ctx.currentTime - t : 0;
  }
  function syncAudio(t) {
    sound?.stop();
    if (audioOn && active() && ctx?.state === "running") {
      sound.start(t);
      audioAnchor = sound.startedAt - t;
    }
  }
  function changeActivity(update) {
    const t = now();
    update();
    align(t);
    syncAudio(t);
    dirty = true;
  }
  async function setAudio(enabled) {
    const t = now();
    if (enabled) {
      if (!ctx) {
        const Audio = window.AudioContext || window.webkitAudioContext;
        if (!Audio) throw new Error("Audio is unavailable in this browser.");
        ctx = new Audio();
        sound = new FactorySound(ctx);
        sound.setFocus(
          mode === "delivery" ? 7 : mode === "product" ? 6 : stage,
          true,
        );
        sound.setMusic(musicOn);
      }
      await ctx.resume();
      if (disposed) return;
    }
    audioOn = enabled;
    align(t);
    syncAudio(t);
  }
  function updateCamera() {
    desired =
      mode === "product"
        ? { target: [0, 2.7, 0], radius: 10.1, yaw: 0.12, elev: 0.13 }
        : mode === "delivery"
          ? { target: [-2.1, 1.6, 0], radius: 18.4, yaw: -0.45, elev: 0.31 }
          : cameraAt(journey, flavour);
    dirty = true;
  }
  function setJourney(value) {
    journey = Math.max(0, Math.min(5, value));
    const next = Math.round(journey);
    if (next !== stage) {
      stage = next;
    }
    sound?.setFocus(mode === "delivery" ? 7 : mode === "product" ? 6 : journey);
    if (!inspect && mode === "factory") updateCamera();
  }
  function setMode(next) {
    if (mode === next) return;
    mode = ["factory", "product", "delivery"].includes(next) ? next : "factory";
    inspect = false;
    if (mode === "delivery") {
      align(0);
      syncAudio(0);
      delivery.update(0);
    }
    const product = mode === "product";
    factoryObjects.forEach((o) => {
      o.visible = mode === "factory";
    });
    studioFloor.visible = mode === "factory" && width > 700;
    delivery.group.visible = mode === "delivery";
    productGroup.visible = product;
    scene.background.set(product ? "#eee8dc" : "#082326");
    scene.fog.color.copy(scene.background);
    scene.fog.density = product ? 0.004 : 0.009;
    sound?.setFocus(mode === "delivery" ? 7 : product ? 6 : stage);
    updateCamera();
    target.set(...desired.target);
    radius = desired.radius;
    yaw = desired.yaw;
    elevation = desired.elev;
  }
  function setFlavour(next) {
    flavour = Math.max(0, Math.min(2, next));
    productBags.forEach((b, i) => {
      b.visible = i === flavour;
    });
    productChips.forEach((c) => {
      c.material = chipColors[flavour];
    });
    ingredients.forEach((g, i) => {
      g.visible = i === flavour;
    });
    for (const [i, m] of [M.yellow, M.red, M.green].entries()) {
      m.emissive.set(FLAVOURS[i].color);
      m.emissiveIntensity = i === flavour ? 0.07 : 0;
    }
    if (!inspect) updateCamera();
    dirty = true;
  }
  function setInspect(enabled) {
    inspect = enabled;
    if (!enabled) updateCamera();
  }
  let dragging = false,
    px = 0,
    py = 0;
  const inputEvents = new AbortController();
  const on = (name, callback, settings = {}) =>
    canvas.addEventListener(name, callback, {
      ...settings,
      signal: inputEvents.signal,
    });
  on("pointerdown", (e) => {
    if (!inspect) return;
    dragging = true;
    px = e.clientX;
    py = e.clientY;
    canvas.setPointerCapture(e.pointerId);
  });
  on("pointermove", (e) => {
    if (!dragging || !inspect) return;
    desired.yaw -= (e.clientX - px) * 0.006;
    desired.elev = Math.max(
      0.05,
      Math.min(1.1, desired.elev + (e.clientY - py) * 0.004),
    );
    px = e.clientX;
    py = e.clientY;
    dirty = true;
  });
  on("pointerup", () => {
    dragging = false;
  });
  on("pointercancel", () => {
    dragging = false;
  });
  on("keydown", (e) => {
    if (!inspect) return;
    if (e.key === "Escape") {
      setInspect(false);
      options.onInspectExit?.();
    }
    if (!e.key.startsWith("Arrow")) return;
    e.preventDefault();
    if (e.key === "ArrowLeft") desired.yaw -= 0.12;
    if (e.key === "ArrowRight") desired.yaw += 0.12;
    if (e.key === "ArrowUp") desired.elev = Math.min(1.1, desired.elev + 0.07);
    if (e.key === "ArrowDown")
      desired.elev = Math.max(0.05, desired.elev - 0.07);
    dirty = true;
  });
  on("webglcontextlost", (e) => {
    e.preventDefault();
    changeActivity(() => {
      contextLost = true;
    });
    options.onContextLost?.();
  });
  on("webglcontextrestored", () => {
    changeActivity(() => {
      contextLost = false;
    });
    options.onReady?.();
  });
  // Keep stationary engineering in material batches. Thousands of parts do not
  // need thousands of draw calls; moving machinery remains independently driven.
  const protectedNodes = new Set([
    ...spinAnims.map((a) => a.o),
    ...detail.dynamic,
    ...process.dynamic,
    ...shipping.dynamic,
    ...bubbles.map((a) => a.o),
    ...drums.map((a) => a.g),
    ...sealers.flatMap((a) => [a.a, a.b]),
    ...packAnims.flatMap((a) => (a.o ? [a.o] : a.bags)),
  ]);
  peeler.updateMatrixWorld(true);
  const localGroups = new Map();
  for (const o of [...peeler.children]) {
    if (!o.isMesh) continue;
    if (!localGroups.has(o.material)) localGroups.set(o.material, []);
    localGroups.get(o.material).push(o);
  }
  for (const [material, objects] of localGroups) {
    if (objects.length < 2) continue;
    const parts = objects.map((o) => {
      let g = o.geometry.clone();
      if (g.index) g = g.toNonIndexed();
      o.updateMatrix();
      g.applyMatrix4(o.matrix);
      return g;
    });
    const g = mergeGeometries(parts, false);
    if (g) {
      const o = new THREE.Mesh(g, material);
      o.castShadow = o.receiveShadow = true;
      peeler.add(o);
      objects.forEach((o) => o.removeFromParent());
    }
    parts.forEach((g) => g.dispose());
  }
  scene.updateMatrixWorld(true);
  const batches = new Map();
  scene.traverse((o) => {
    if (
      !o.isMesh ||
      o.isInstancedMesh ||
      Array.isArray(o.material) ||
      o.material.transparent
    )
      return;
    for (let q = o; q; q = q.parent) if (protectedNodes.has(q)) return;
    const k = o.material.uuid + "-" + o.castShadow + "-" + o.receiveShadow;
    if (!batches.has(k))
      batches.set(k, {
        material: o.material,
        cast: o.castShadow,
        receive: o.receiveShadow,
        objects: [],
      });
    batches.get(k).objects.push(o);
  });
  for (const b of batches.values()) {
    if (b.objects.length < 2) continue;
    const parts = b.objects.map((o) => {
      let g = o.geometry.clone();
      if (g.index) g = g.toNonIndexed();
      g.applyMatrix4(o.matrixWorld);
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
    const g = mergeGeometries(parts, false);
    if (!g) {
      parts.forEach((g) => g.dispose());
      continue;
    }
    const o = new THREE.Mesh(g, b.material);
    o.castShadow = b.cast;
    o.receiveShadow = b.receive;
    scene.add(o);
    b.objects.forEach((o) => o.removeFromParent());
    parts.forEach((g) => g.dispose());
  }
  const mirrorShader = {
    uniforms: THREE.UniformsUtils.clone(Reflector.ReflectorShader.uniforms),
    vertexShader: Reflector.ReflectorShader.vertexShader,
    fragmentShader:
      `uniform vec3 color;uniform sampler2D tDiffuse;varying vec4 vUv;void main(){vec2 uv=vUv.xy/vUv.w;vec3 r=vec3(0.0);for(int i=-2;i<=2;i++){for(int j=-2;j<=2;j++){r+=texture2D(tDiffuse,uv+vec2(float(i),float(j))*.0016).rgb;}}r/=25.0;gl_FragColor=vec4(mix(color,r,.09),1.0);#include <tonemapping_fragment>
#include <colorspace_fragment>}`.replace(";#include", ";\n#include"),
  };
  const studioFloor = new Reflector(new THREE.PlaneGeometry(160, 160), {
    color: "#082326",
    textureWidth: window.innerWidth < 700 ? 256 : 768,
    textureHeight: window.innerWidth < 700 ? 256 : 768,
    clipBias: 0.003,
    multisample: 0,
    shader: mirrorShader,
  });
  studioFloor.rotation.x = -Math.PI / 2;
  studioFloor.position.y = -0.244;
  scene.add(studioFloor);
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const ao = new SSAOPass(scene, camera, 1, 1, 16);
  ao.kernelRadius = 0.3;
  ao.minDistance = 0.0005;
  ao.maxDistance = 0.016;
  composer.addPass(ao);
  const aoExcluded = [studioFloor];
  scene.traverse((o) => {
    if (o.material?.transparent) aoExcluded.push(o);
  });
  const renderAO = ao.render.bind(ao);
  ao.render = (...args) => {
    const vis = aoExcluded.map((o) => o.visible);
    aoExcluded.forEach((o) => (o.visible = false));
    renderAO(...args);
    aoExcluded.forEach((o, i) => (o.visible = vis[i]));
  };
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.17, 0.38, 2.6);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
  const grade = new ShaderPass({
    uniforms: { tDiffuse: { value: null } },
    vertexShader:
      "varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}",
    fragmentShader: `uniform sampler2D tDiffuse;varying vec2 vUv;void main(){vec3 c=texture2D(tDiffuse,vUv).rgb;float lum=dot(c,vec3(.2126,.7152,.0722));c=mix(vec3(lum),c,1.07);c=mix(c*vec3(.92,1.01,1.04),c*vec3(1.035,1.015,.975),smoothstep(.12,.8,lum));vec2 v=(vUv-.5)*vec2(1.0,.85);c*=1.0-.28*dot(v,v);gl_FragColor=vec4(c,1.0);}`,
  });
  composer.addPass(grade);
  const fxaa = new ShaderPass(FXAAShader);
  composer.addPass(fxaa);
  const factoryObjects = scene.children.filter((o) => !o.isLight);
  const delivery = addDeliveryScene({
    scene,
    M,
    box,
    mesh,
    cylinder,
    pipe,
    textures,
  });
  const productGroup = new THREE.Group();
  productGroup.visible = false;
  scene.add(productGroup);
  const productBags = [],
    productChips = [],
    ingredients = [];
  const productFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(100, 100),
    mat("#eee8dc", 0.05, 0.82),
  );
  productFloor.rotation.x = -Math.PI / 2;
  productFloor.receiveShadow = true;
  productGroup.add(productFloor);
  for (let i = 0; i < 3; i++) {
    const bag = mesh(bagG, bagMaterial(i), 0, 2.41, 0, productGroup);
    bag.scale.setScalar(4.25);
    bag.rotation.set(-0.03, -0.14, -0.07);
    bag.visible = i === 0;
    productBags.push(bag);
    const ingredient = new THREE.Group();
    ingredient.visible = i === 0;
    productGroup.add(ingredient);
    ingredients.push(ingredient);
    for (let n = 0; n < 13; n++) {
      const g =
        i === 0
          ? new THREE.OctahedronGeometry(0.07, 0)
          : i === 1
            ? new THREE.SphereGeometry(0.045, 8, 6)
            : new THREE.SphereGeometry(0.075, 12, 6);
      const m =
        i === 0
          ? mat("#f9f8ed", 0.1, 0.3)
          : i === 1
            ? M.redChip
            : mat("#5b733b", 0, 0.8);
      const piece = mesh(
        g,
        m,
        1.7 + (random() - 0.5) * 0.75,
        0.07 + random() * 0.055,
        1.2 + (random() - 0.5) * 0.8,
        ingredient,
      );
      if (i === 2) piece.scale.set(0.45, 0.15, 1);
      piece.rotation.set(random() * TAU, random() * TAU, random() * TAU);
    }
  }
  for (let i = 0; i < 3; i++) {
    const c = mesh(
      chipG,
      chipColors[0],
      1.55 + i * 0.3,
      0.28 + i * 0.24,
      0.9 + i * 0.14,
      productGroup,
    );
    c.scale.setScalar(2.3 - i * 0.15);
    c.rotation.set(-1.05 + i * 0.15, i * 0.5, 0.15 + i * 0.5);
    productChips.push(c);
  }
  function resize() {
    width = Math.max(1, canvas.clientWidth || canvas.parentElement.clientWidth);
    height = Math.max(
      1,
      canvas.clientHeight || canvas.parentElement.clientHeight,
    );
    renderer.setSize(width, height, false);
    composer.setSize(width, height);
    fxaa.uniforms.resolution.value.set(
      1 / (width * renderer.getPixelRatio()),
      1 / (height * renderer.getPixelRatio()),
    );
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    ao.enabled = window.innerWidth > 700;
    studioFloor.visible = mode === "factory" && window.innerWidth > 700;
    dirty = true;
  }
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();
  const temp = new THREE.Object3D();
  let last = performance.now() / 1000;
  function frame() {
    if (disposed) return;
    raf = requestAnimationFrame(frame);
    const real = performance.now() / 1000,
      dt = Math.min(0.1, real - last);
    last = real;
    if (!visible || !pageVisible || contextLost) return;
    const cameraMoving =
      target.distanceTo(v3(...desired.target)) > 0.004 ||
      Math.abs(radius - desired.radius) > 0.004 ||
      Math.abs(yaw - desired.yaw) > 0.0005 ||
      Math.abs(elevation - desired.elev) > 0.0005;
    if (!active() && !dirty && !cameraMoving && frameCount >= 2) return;
    const fps = window.innerWidth < 700 ? 30 : 60;
    if (active() && !dirty && real - lastRendered < 1 / fps - 0.002) return;
    lastRendered = real;
    let t = ((now() % LOOP) + LOOP) % LOOP,
      p = t / LOOP,
      beat = TAU * t * 2;
    const smooth = reducedMotion ? 1 : 1 - Math.exp(-dt * 6);
    target.lerp(v3(...desired.target), smooth);
    radius += (desired.radius - radius) * smooth;
    yaw += (desired.yaw - yaw) * smooth;
    elevation += (desired.elev - elevation) * smooth;
    const swing =
      active() && !reducedMotion && !inspect ? 0.022 * Math.sin(p * TAU) : 0;
    const portrait = camera.aspect < 1;
    const viewYaw =
      yaw + swing + (mode === "factory" && portrait && stage === 0 ? 0.48 : 0);
    const rr =
      radius *
      (mode === "product"
        ? Math.max(1, 0.95 / camera.aspect)
        : mode === "delivery"
          ? Math.max(1, 1.2 / camera.aspect)
          : stage === 0
            ? Math.max(1, 1.55 / camera.aspect)
            : Math.max(1, 0.98 / camera.aspect));
    camera.position
      .copy(target)
      .add(
        v3(
          Math.sin(viewYaw) * rr * Math.cos(elevation),
          Math.sin(elevation) * rr,
          Math.cos(viewYaw) * rr * Math.cos(elevation),
        ),
      );
    camera.lookAt(target);
    if (mode === "delivery") delivery.update(t);
    if (mode === "product") {
      productBags.forEach((b) => {
        b.position.y = 2.41 + (reducedMotion ? 0 : 0.025 * Math.sin(p * TAU));
        b.rotation.y =
          -0.14 + (reducedMotion || inspect ? 0 : 0.05 * Math.sin(p * TAU));
      });
    }
    if (mode === "factory") {
      for (let b of beltAnims) {
        let len = b.b - b.a;
        for (let i = 0; i < b.n; i++) {
          temp.position.set(
            b.a + ((i / b.n + p * 8) % 1) * len,
            b.y + 0.06,
            b.z,
          );
          temp.rotation.set(0, 0, 0);
          temp.scale.set(0.017, 0.012, b.width - 0.12);
          temp.updateMatrix();
          b.inst.setMatrixAt(i, temp.matrix);
        }
        b.inst.instanceMatrix.needsUpdate = true;
      }
      for (let f of flows) {
        for (let i = 0; i < f.n; i++) {
          let m = f.meta[i],
            u = (m.offset + p * (f.type === "potato" ? 4 : 8)) % 1;
          temp.position.set(
            f.a + u * (f.b - f.a),
            f.y + (f.type === "chip" ? 0.008 * Math.sin(beat + m.angle) : 0.0),
            f.z + m.lane,
          );
          if (f.type === "chip") {
            temp.rotation.set(
              -Math.PI / 2,
              0.1 * Math.sin(beat * 0.5 + m.angle),
              m.angle,
            );
            temp.scale.set(
              m.scale * (0.58 + m.variant * 0.1),
              m.scale * (0.58 + Math.sin(m.angle) * 0.05),
              m.scale * 0.62,
            );
          } else {
            temp.rotation.set(m.angle, beat * 0.25, m.angle * 0.5);
            temp.scale.set(0.12 * m.scale, 0.092 * m.scale, 0.095 * m.scale);
          }
          temp.updateMatrix();
          f.inst.setMatrixAt(i, temp.matrix);
        }
        f.inst.instanceMatrix.needsUpdate = true;
      }
      for (let a of spinAnims) {
        if (a.o === peeler) a.o.rotation.y = p * TAU * a.turns;
        else
          a.o.rotation[a.axis] =
            p * TAU * a.turns + (a.axis === "x" ? Math.PI / 2 : 0);
      }
      for (let d of drums) {
        d.shell.rotation.z = p * TAU * 8;
        for (let i = 0; i < d.tumblers.length; i++) {
          let c = d.tumblers[i],
            u = (c.phase / TAU + p * 8) % 1,
            a = u * TAU;
          if (u < 0.58) {
            let aa = -Math.PI / 2 + (u / 0.58) * Math.PI;
            c.o.position.set(
              Math.cos(aa) * c.rad,
              Math.sin(aa) * c.rad - 0.12,
              c.depth,
            );
          } else {
            let q = (u - 0.58) / 0.42;
            c.o.position.set(
              Math.sin(q * Math.PI) * c.rad * 0.18,
              c.rad * (1 - 2 * q * q) - 0.12,
              c.depth,
            );
          }
          c.o.rotation.set(a * 0.5, a, a);
          c.o.updateMatrix();
          d.chipBatch.setMatrixAt(i, c.o.matrix);
        }
        d.chipBatch.instanceMatrix.needsUpdate = true;
      }
      for (let i = 0; i < bubbles.length; i++) {
        const b = bubbles[i],
          a = (p * 32 + b.phase) % 1,
          s = b.s * Math.sin(a * Math.PI) * 0.025;
        temp.position.set(b.x, 1.543 + a * 0.025, b.z);
        temp.rotation.set(0, 0, 0);
        temp.scale.set(s, s * 0.43, s);
        temp.updateMatrix();
        bubbleBatch.setMatrixAt(i, temp.matrix);
      }
      bubbleBatch.instanceMatrix.needsUpdate = true;
      for (let s of sealers) {
        let phase = bagPhase(t, s.f),
          gap = 0.29 - 0.18 * jawClosure(phase);
        s.a.position.z = s.z - gap;
        s.b.position.z = s.z + gap;
      }
      for (let a of packAnims) {
        if (a.o) {
          let phase = bagPhase(t, a.f);
          a.o.scale.y = 0.38 + 0.34 * Math.min(1, phase / 0.31);
          a.o.position.y = 1.8 - 0.18 * Math.min(1, phase / 0.31);
        } else
          a.bags.forEach((g, i) => {
            let u = (i / 4 + t / 8 + a.f / 12) % 1;
            g.position.set(10.65 + u * 3.2, 1.18, a.z);
            g.rotation.set(0, 0.025 * Math.sin(beat + i), 0);
          });
      }
      for (let i = 0; i < pointCount; i++) {
        let s = sprays[i % sprays.length],
          u = (p * 32 + i * 0.618) % 1;
        pointPositions[i * 3] =
          s.x + 0.025 * Math.sin(i * 7) + Math.sin(i) * u * 0.12;
        pointPositions[i * 3 + 1] = s.y - u * 0.64;
        pointPositions[i * 3 + 2] = s.z + Math.cos(i * 9) * u * 0.12;
      }
      pointG.attributes.position.needsUpdate = true;
      for (let i = 0; i < dustN; i++) {
        let f = i % 3,
          u = (p * 32 + i * 0.754) % 1;
        dustP[i * 3] = 6.65 - u * 0.25 + 0.07 * Math.sin(i * 9);
        dustP[i * 3 + 1] = 2.19 - u * 0.55;
        dustP[i * 3 + 2] = (f - 1) * 2.25 + 0.15 * Math.cos(i * 9) * u;
      }
      dustG.attributes.position.needsUpdate = true;
      for (let i = 0; i < steamN; i++) {
        let u = (p * 4 + i * 0.618) % 1;
        steamP[i * 3] = -0.4 + Math.sin(i * 12) * 1.65 + u * 0.22;
        steamP[i * 3 + 1] = 1.7 + u * 1.02;
        steamP[i * 3 + 2] = Math.cos(i * 8) * 0.65;
      }
      steamG.attributes.position.needsUpdate = true;
      detail.update(t);
      process.update(t);
      shipping.update(t);
      fluidClock.value = t;
    }
    composer.render();
    dirty = false;
    if (++frameCount >= 2 && !ready) {
      ready = true;
      options.onReady?.();
    }
  }
  function setVisible(next) {
    if (visible === next) return;
    changeActivity(() => {
      visible = next;
    });
  }
  function setPageVisible(next) {
    if (pageVisible === next) return;
    changeActivity(() => {
      pageVisible = next;
    });
  }
  function dispose() {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(raf);
    observer.disconnect();
    inputEvents.abort();
    sound?.stop();
    ctx?.close().catch(() => {});
    const geometries = new Set(),
      materials = new Set(),
      textures = new Set();
    scene.traverse((o) => {
      if (o.geometry) geometries.add(o.geometry);
      for (const m of [o.material].flat().filter(Boolean)) {
        materials.add(m);
        for (const v of Object.values(m)) if (v?.isTexture) textures.add(v);
      }
    });
    geoCache.forEach((g) => geometries.add(g));
    textures.add(scene.environment);
    geometries.forEach((g) => g.dispose());
    materials.forEach((m) => m.dispose());
    textures.forEach((t) => t?.dispose());
    studioFloor.getRenderTarget().dispose();
    ao.dispose();
    bloom.dispose();
    composer.dispose();
    renderer.dispose();
  }
  raf = requestAnimationFrame(frame);
  return {
    setJourney,
    setMode,
    setFlavour,
    setVisible,
    setPageVisible,
    setAudio,
    setInspect,
    resize,
    dispose,
    setPlaying(next) {
      changeActivity(() => {
        playing = next;
      });
    },
    setReducedMotion(next) {
      changeActivity(() => {
        reducedMotion = next;
        if (next) playing = false;
      });
    },
    setMusic(next) {
      musicOn = next;
      sound?.setMusic(next);
    },
    get state() {
      return {
        playing,
        audioOn,
        musicOn,
        inspect,
        stage,
        flavour,
        mode,
        visible,
        time: now(),
        sources: sound?.sources.length || 0,
      };
    },
  };
}

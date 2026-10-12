import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { FXAAShader } from "three/addons/shaders/FXAAShader.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { addFactoryDetails } from "./details.js";
import { FactorySound } from "./audio.js";
import { chipGeometry, bagGeometry, potatoGeometry } from "./geometry.js";
import { addProcessMachines } from "./machines.js";
import {
  cookingMaterial,
  cookingAttribute,
  peelingMaterial,
} from "./food-material.js";
import { addIndustrialServices } from "./industrial.js";
import { addShippingLine } from "./shipping.js";
import { createSurfaceTextures } from "./surfaces.js";
import { LOOP_SECONDS, bagPhase, jawClosure } from "./timing.js";
import { cameraAt, FLAVOURS, CAMERAS } from "../lib/journey.js";
import { addFactoryCampus, droneCamera } from "./campus.js";
import { createBagMaterials } from "./packaging.js";
import { addFryingEffects, addProcessEffects } from "./effects.js";
import {
  AdaptiveRenderBudget,
  drawingBudget,
  zoomDistance,
} from "./render-budget.js";

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
  const budget = new AdaptiveRenderBudget(window.innerWidth < 700 ? 30 : 60);
  let zoom = 1,
    desiredZoom = 1,
    lastShadow = -Infinity;
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(1);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#082326");
  scene.fog = new THREE.FogExp2("#082326", 0.004);
  const camera = new THREE.PerspectiveCamera(40, 1, 0.15, 280),
    v3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const cameraTarget = new THREE.Vector3(),
    cameraOffset = new THREE.Vector3();
  const viewFrustum = new THREE.Frustum(),
    viewMatrix = new THREE.Matrix4();
  let seed = 132;
  function random() {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  }
  const textures = createSurfaceTextures(
    random,
    Math.min(8, renderer.capabilities.getMaxAnisotropy()),
    () => {
      dirty = true;
    },
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
    potato: mat("#ffffff", 0, 0.86, { map: potatoTex }),
    peeled: mat("#efdfb7", 0, 0.52, { bumpMap: potatoTex, bumpScale: 0.0015 }),
    raw: mat("#eddcaf", 0, 0.55),
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
      color: "#bb8833",
      transparent: true,
      opacity: 0.82,
      depthWrite: false,
      metalness: 0,
      roughness: 0.27,
      clearcoat: 0.35,
      clearcoatRoughness: 0.21,
      specularIntensity: 0.42,
      bumpMap: textures.oil,
      bumpScale: 0.0012,
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
  M.blue = new THREE.MeshPhysicalMaterial({
    color: "#336b88",
    metalness: 0.32,
    roughness: 0.38,
    clearcoat: 0.35,
  });
  M.teal = new THREE.MeshPhysicalMaterial({
    color: "#1d6668",
    metalness: 0.35,
    roughness: 0.4,
    clearcoat: 0.3,
  });
  M.graphite = mat("#394447", 0.45, 0.5);
  for (const paint of [M.blue, M.teal, M.graphite]) {
    paint.roughnessMap = textures.enamel;
    paint.bumpMap = textures.enamel;
    paint.bumpScale = 0.00035;
  }
  M.motor = mat("#16384b", 0.75, 0.27);
  M.potato.bumpMap = potatoTex;
  M.potato.bumpScale = 0.0014;
  for (const m of [M.chip, M.redChip, M.herbChip]) {
    m.bumpMap = chipTex;
    m.bumpScale = 0.0008;
  }
  M.steel.bumpMap = metalTex;
  M.steel.bumpScale = 0.0015;
  M.steel.roughness = 0.43;
  M.steel.roughnessMap = textures.steelRoughness;
  M.rubber.roughnessMap = textures.rubberRoughness;
  for (const material of [M.chip, M.redChip, M.herbChip]) {
    material.normalMap = textures.chipNormal;
    material.normalScale = new THREE.Vector2(0.4, 0.4);
    material.roughnessMap = textures.chipRoughness;
    material.bumpMap = null;
  }
  M.steel.color.set("#d0d9d8");
  M.chip.color.set("#fff5dc");
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
  // Coordinated enamel colours identify each machine through the full line.
  for (const [name, color] of Object.entries({
    washPaint: "#267cc9",
    peelPaint: "#20a58d",
    cutPaint: "#7457b5",
    rinsePaint: "#2d9fae",
    fryPaint: "#df8a32",
    coolPaint: "#38949e",
    casePaint: "#596cb5",
  })) {
    M[name] = new THREE.MeshPhysicalMaterial({
      color,
      metalness: 0.22,
      roughness: 0.34,
      clearcoat: 0.45,
      clearcoatRoughness: 0.25,
      roughnessMap: textures.enamel,
      bumpMap: textures.enamel,
      bumpScale: 0.00035,
    });
  }
  function machinePaint(x, z = 0) {
    if (x < -9.2) return M.washPaint;
    if (x < -6.4) return M.peelPaint;
    if (x < -4.4) return M.cutPaint;
    if (x < -2.8) return M.rinsePaint;
    if (x < 1.9) return M.fryPaint;
    if (x < 4.3) return M.coolPaint;
    if (x < 13.3) return [M.yellow, M.red, M.green][z < -1 ? 0 : z > 1 ? 2 : 1];
    return M.casePaint;
  }
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
  scene.environmentIntensity = 1.08;
  scene.add(new THREE.HemisphereLight("#b8e9e2", "#101417", 0.38));
  function light(color, power, x, y, z) {
    let l = new THREE.DirectionalLight(color, power);
    l.position.set(x, y, z);
    scene.add(l);
    return l;
  }
  const key = light("#fff0d8", 3.15, -18, 42, 28);
  key.target.position.set(10, 0, 0);
  scene.add(key.target);
  key.castShadow = true;
  key.shadow.mapSize.set(
    window.innerWidth < 700 ? 1024 : 2048,
    window.innerWidth < 700 ? 1024 : 2048,
  );
  Object.assign(key.shadow.camera, {
    left: -60,
    right: 85,
    top: 38,
    bottom: -38,
    near: 1,
    far: 140,
  });
  key.shadow.bias = -0.00015;
  key.shadow.normalBias = 0.03;
  light("#9ccce1", 1.3, 10, 9, -12);
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
      bevelSegments: Math.max(w, h, d) < 0.3 ? 1 : 2,
      curveSegments: Math.max(w, h, d) < 0.3 ? 2 : 4,
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
    cylinder(0, 0, 0, 0.23, 0.52, machinePaint(x, z), g, "z");
    for (let i = 0; i < 9; i++)
      cylinder(
        0,
        0,
        -0.24 + i * 0.055,
        0.26,
        0.022,
        machinePaint(x, z),
        g,
        "z",
      );
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
          machinePaint(x, z),
        );
        box(x + dx, top - 0.05, z + dz, 0.16, 0.1, 0.16, machinePaint(x, z));
      }
    box(x, 0.83, z, w, 0.055, 0.065, machinePaint(x, z));
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
      box(
        x,
        y - 0.08,
        z + s * (width / 2 + 0.06),
        len,
        0.2,
        0.09,
        machinePaint(x, z),
      );
      for (let xx = a + 0.15; xx < b; xx += 0.6)
        bolt(xx, y - 0.08, z + s * (width / 2 + 0.12));
    }
    for (let xx of [a + 0.13, b - 0.13]) {
      const roller = cylinder(
        xx,
        y - 0.08,
        z,
        0.17,
        width,
        M.steel,
        scene,
        "z",
      );
      spinAnims.push({
        o: roller,
        axis: "z",
        turns: -Math.round((len * 8) / (Math.PI * 0.34)),
      });
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
    inst.frustumCulled = false;
    beltAnims.push({ a, b, z, y, width, n, inst });
    return { a, b, z, y, width };
  }
  const chipG = chipGeometry(),
    rawChipG = chipGeometry(0, false),
    potatoG = potatoGeometry();
  [M.chip, M.redChip, M.herbChip, M.raw].forEach((m) => {
    m.vertexColors = true;
    m.roughness = 0.48;
  });
  M.raw.vertexColors = false;
  M.raw.roughness = 0.28;
  const fluidClock = { value: 0 },
    fluidSurfaces = [];
  function liquid(x, y, z, w, d, m) {
    const isOil = m === M.oil;
    m = m.clone();
    m.onBeforeCompile = (s) => {
      s.uniforms.factoryTime = fluidClock;
      s.vertexShader = "uniform float factoryTime;\n" + s.vertexShader;
      s.vertexShader = s.vertexShader.replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
    float phase=factoryTime*3.14159265359;
    transformed.z+=.002*sin(position.x*13.0+phase)+.0015*cos(position.y*17.0-phase*2.0);`,
      );
      s.vertexShader = s.vertexShader.replace(
        "#include <beginnormal_vertex>",
        `#include <beginnormal_vertex>
    objectNormal=normalize(vec3(-.026*cos(position.x*13.0+factoryTime*3.14159265359),.0255*sin(position.y*17.0-factoryTime*6.28318530718),1.0));`,
      );
    };
    m.customProgramCacheKey = () => "crisp-fluid-surface-v3";
    const o = mesh(new THREE.PlaneGeometry(w, d, 64, 24), m, x, y, z);
    o.rotation.x = -Math.PI / 2;
    o.castShadow = false;
    o.receiveShadow = true;
    o.name = isOil ? "visible amber frying oil" : "washer water surface";
    // Keep local plane coordinates: static batching would bake its rotation,
    // causing the ripple shader to displace the wrong world axis.
    fluidSurfaces.push(o);
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
    cycles = type === "chip" ? 8 : 4,
  ) {
    const frying = type === "chip" && cycles === 1;
    const peeling = type === "potato" && material === M.peeled;
    const foodGeometry =
      type === "chip"
        ? chipGeometry(flows.length % 6, material !== M.raw)
        : potatoG;
    const cooked = frying || peeling ? cookingAttribute(foodGeometry, n) : null;
    const lowGeometry =
      type === "chip"
        ? chipGeometry(flows.length % 6, material !== M.raw, false)
        : foodGeometry;
    if (cooked && type === "chip")
      lowGeometry.setAttribute("cooking", cooked.cooking);
    let inst = new THREE.InstancedMesh(
      cooked?.geometry || foodGeometry,
      frying
        ? cookingMaterial(material)
        : peeling
          ? peelingMaterial(M.potato)
          : material,
      n,
    );
    if (cooked && foodGeometry !== potatoG) foodGeometry.dispose();
    inst.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    inst.castShadow = true;
    inst.receiveShadow = true;
    scene.add(inst);
    inst.frustumCulled = false;
    const meta = [];
    for (let i = 0; i < n; i++)
      meta.push({
        offset: i / n,
        lane: (random() - 0.5) * width,
        scale: 0.8 + random() * 0.4,
        angle: random() * TAU,
        variant: random(),
      });
    flows.push({
      a,
      b,
      z,
      y,
      n,
      type,
      inst,
      meta,
      cycles,
      highGeometry: inst.geometry,
      lowGeometry,
      cooking: frying ? cooked.cooking : null,
      peeling: peeling ? cooked.cooking : null,
    });
  }
  // The process is installed inside a real building footprint, not a plinth.
  const ground = mat("#233c3b", 0.02, 0.97);
  box(10, -0.39, 2, 200, 0.12, 170, ground, scene, 0.02);
  const campus = addFactoryCampus({ scene, M, mesh, pipe, textures, potatoG });
  function label(text, x, y, z, w = 1.5) {
    let c = document.createElement("canvas");
    c.width = 512;
    c.height = 128;
    let a = c.getContext("2d");
    a.fillStyle = "#193139";
    a.fillRect(0, 0, 512, 128);
    a.fillStyle = "#ecc869";
    a.font = "bold 32px Arial";
    a.textAlign = "center";
    a.fillText(text, 256, 75);
    let m = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c) });
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
    label(text, x, 0.59, 3.08, 1.8);
  const process = addProcessMachines({
    machinePaint,
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
    rawChipG,
    potatoG,
    textures,
    random,
  });
  const { peeler } = process;
  const engineering = addIndustrialServices({
    scene,
    M,
    box,
    cylinder,
    mesh,
    pipe,
    motor,
    textures,
  });
  const fryingEffects = addFryingEffects(
    scene,
    random,
    window.innerWidth < 700,
  );
  const processEffects = addProcessEffects(
    scene,
    random,
    window.innerWidth < 700,
  );
  const bubbles = [];
  const bubbleBatch = new THREE.InstancedMesh(
    new THREE.SphereGeometry(1, 12, 8),
    new THREE.MeshPhysicalMaterial({
      color: "#e8c980",
      metalness: 0,
      roughness: 0.25,
      clearcoat: 0.35,
      specularIntensity: 0.35,
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
    box(x, 0.99, z, 2.1, 0.13, 1.65, flavourColors[f]);
    let g = new THREE.Group();
    g.position.set(x, 2.01, z);
    g.rotation.y = Math.PI / 2;
    g.rotation.x = 0;
    g.rotation.z = -0.06;
    scene.add(g);
    let shell = mesh(drumG, M.steel, 0, 0, 0, g);
    const paintedSleeve = mesh(
      new THREE.CylinderGeometry(0.798, 0.798, 1.18, 64, 1, true),
      flavourColors[f],
      0,
      0,
      0,
      shell,
    );
    paintedSleeve.rotation.x = Math.PI / 2;
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
      tBatch = new THREE.InstancedMesh(chipG, chipColors[f], 96);
    tBatch.castShadow = tBatch.receiveShadow = true;
    g.add(tBatch);
    for (let i = 0; i < 96; i++) {
      let o = new THREE.Object3D();
      o.scale.setScalar(0.25 + random() * 0.08);
      tumblers.push({
        o,
        phase: random() * TAU,
        rad: 0.15 + random() * 0.34,
        depth: (random() - 0.5) * 1.45,
      });
    }
    drums[f].tumblers = tumblers;
    drums[f].chipBatch = tBatch;
    drums[f].lowGeometry = chipGeometry(f, true, false);
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
    box(x, 1.05, z, 1.5, 0.16, 1.64, flavourColors[f]);
    for (let dx of [-0.67, 0.67])
      for (let dz of [-0.71, 0.71])
        box(x + dx, 2.25, z + dz, 0.075, 2.48, 0.075, M.chrome);
    box(x, 3.5, z, 1.6, 0.15, 1.76, flavourColors[f]);
    box(x, 3.32, z - 0.58, 0.95, 0.95, 0.31, M.dark);
    cylinder(x, 3.62, z, 0.28, 0.44, M.steel);
    const roll = cylinder(x, 3.53, z - 1.02, 0.24, 0.65, paint, scene, "x");
    for (const dx of [-0.4, 0.4]) {
      cylinder(x + dx, 3.53, z - 1.02, 0.11, 0.08, M.dark, scene, "x");
      box(x + dx, 3.31, z - 0.88, 0.04, 0.48, 0.38, M.steel);
    }
    const filmMaterial = bagMat[0].clone();
    filmMaterial.side = THREE.DoubleSide;
    filmMaterial.map = bagMat[0].map.clone();
    filmMaterial.map.wrapT = THREE.RepeatWrapping;
    const webPath = [
      [3.74, -1.13],
      [3.85, -0.66],
      [3.23, -0.19],
      [3.01, -0.11],
    ];
    const webPoints = [],
      webUv = [],
      webIndex = [];
    webPath.forEach(([y, dz], i) => {
      webPoints.push(x - 0.3, y, z + dz, x + 0.3, y, z + dz);
      webUv.push(0, i / 3, 1, i / 3);
      if (i < webPath.length - 1) {
        const a = i * 2;
        webIndex.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    });
    const filmGeometry = new THREE.BufferGeometry();
    filmGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(webPoints, 3),
    );
    filmGeometry.setAttribute("uv", new THREE.Float32BufferAttribute(webUv, 2));
    filmGeometry.setIndex(webIndex);
    filmGeometry.computeVertexNormals();
    const film = mesh(filmGeometry, filmMaterial);
    cylinder(x, 3.83, z - 0.66, 0.045, 0.69, M.chrome, scene, "x");
    cylinder(x, 2.7, z, 0.11, 0.28, M.chrome);
    mesh(
      new THREE.CylinderGeometry(0.23, 0.11, 0.27, 48, 1, true),
      M.steel,
      x,
      2.83,
      z,
    );
    cylinder(x, 2.36, z, 0.11, 0.55, paint);
    for (let dx of [-0.3, 0.3]) cylinder(x + dx, 2.19, z, 0.11, 0.55, M.rubber);
    let a = box(x, 1.87, z - 0.22, 0.87, 0.17, 0.18, M.steel),
      b = box(x, 1.87, z + 0.22, 0.87, 0.17, 0.18, M.steel);
    mesh(sealFace, M.chrome, 0, 0, 0.092, a);
    mesh(sealFace, M.chrome, 0, 0, -0.092, b).rotation.y = Math.PI;
    sealers.push({ a, b, z, f });
    let formed = mesh(bagG, bagMat, x, 1.67, z);
    formed.scale.set(0.28, 0.28, 0.3);
    const released = mesh(bagG, bagMat, x, 1.67, z);
    released.scale.setScalar(0.28);
    const chute = box(x + 0.31, 1.3, z, 0.76, 0.035, 0.51, M.steel);
    chute.rotation.z = -0.46;
    for (const side of [-1, 1]) {
      const lip = box(
        x + 0.31,
        1.36,
        z + side * 0.26,
        0.76,
        0.14,
        0.025,
        M.steel,
      );
      lip.rotation.z = -0.46;
    }
    packAnims.push({ o: formed, released, roll, film, f, x, z });
    panel(x + 0.62, 2.89, z + 0.8, 0.32, 0.67, M.dark);
    box(x + 0.62, 3.02, z + 0.865, 0.2, 0.17, 0.022, M.led);
    box(x + 0.62, 2.73, z + 0.865, 0.09, 0.05, 0.02, M.red);
    conveyor(10.45, 14.0, z, 1.05, 1.03);
    box(12.1, 1.12, z + 0.42, 0.035, 0.24, 0.045, M.chrome);
    box(12.1, 1.25, z + 0.409, 0.085, 0.075, 0.043, M.dark);
    let bags = [];
    for (let i = 0; i < 4; i++) {
      let g = new THREE.Group();
      scene.add(g);
      let o = mesh(bagG, bagMat, 0, 0, 0, g);
      o.rotation.x = -Math.PI / 2;
      o.scale.setScalar(0.28);
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
    machinePaint,
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
      depthWrite: false,
    }),
  );
  scene.add(points);
  const dustN = 120,
    dustP = new Float32Array(dustN * 3),
    dustG = new THREE.BufferGeometry();
  const spiceColours = new Float32Array(dustN * 3);
  const spicePalette = [
    new THREE.Color("#e9d7a2"),
    new THREE.Color("#c57b49"),
    new THREE.Color("#719957"),
  ];
  for (let i = 0; i < dustN; i++)
    spicePalette[i % 3].toArray(spiceColours, i * 3);
  dustG.setAttribute("color", new THREE.BufferAttribute(spiceColours, 3));
  dustG.setAttribute("position", new THREE.BufferAttribute(dustP, 3));
  scene.add(
    new THREE.Points(
      dustG,
      new THREE.PointsMaterial({
        color: "#ffffff",
        vertexColors: true,
        depthWrite: false,
        size: 0.022,
        transparent: true,
        opacity: 0.8,
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
    budget.reset();
    update();
    align(t);
    syncAudio(t);
    dirty = true;
  }
  async function setAudio(enabled) {
    let t = now();
    if (enabled) {
      if (!ctx) {
        const Audio = window.AudioContext || window.webkitAudioContext;
        if (!Audio) throw new Error("Audio is unavailable in this browser.");
        ctx = new Audio();
        await ctx.resume();
        sound = await FactorySound.create(ctx);
        sound.setFocus(mode === "product" ? 7 : stage, true);
        sound.setMusic(musicOn);
      }
      await ctx.resume();
      if (disposed) return;
    }
    t = now();
    audioOn = enabled;
    align(t);
    syncAudio(t);
  }
  function updateCamera() {
    desired =
      mode === "product"
        ? { target: [0, 2.7, 0], radius: 10.1, yaw: 0.12, elev: 0.13 }
        : cameraAt(journey, flavour);
    dirty = true;
  }
  function setJourney(value) {
    const position = Math.max(0, Math.min(CAMERAS.length - 1, value));
    if (position === journey) return;
    journey = position;
    const next = Math.round(journey);
    if (next !== stage) {
      stage = next;
    }
    sound?.setFocus(mode === "product" ? 7 : journey);
    if (!inspect && mode === "factory") updateCamera();
  }
  function setMode(next) {
    if (mode === next) return;
    mode = next;
    zoom = desiredZoom = 1;
    options.onZoomChange?.();
    inspect = false;
    const product = mode === "product";
    factoryObjects.forEach((o) => {
      o.visible = !product;
    });
    productGroup.visible = product;
    scene.background.set(product ? "#eee8dc" : "#082326");
    scene.fog.color.copy(scene.background);
    scene.fog.density = product ? 0.004 : 0.004;
    sound?.setFocus(product ? 7 : stage);
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
  function zoomBy(factor) {
    if (!Number.isFinite(factor) || factor <= 0) return;
    desiredZoom = zoomDistance(desiredZoom, factor);
    dirty = true;
    options.onZoomChange?.();
  }
  function resetZoom() {
    desiredZoom = 1;
    dirty = true;
    options.onZoomChange?.();
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
  on(
    "wheel",
    (e) => {
      if (!inspect || e.ctrlKey || e.metaKey) return;
      e.preventDefault();
      zoomBy(Math.exp(-Math.max(-100, Math.min(100, e.deltaY)) * 0.003));
    },
    { passive: false },
  );
  on("keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (["+", "=", "-", "0"].includes(e.key)) {
      e.preventDefault();
      if (e.key === "0") resetZoom();
      else zoomBy(e.key === "-" ? 1 / 1.2 : 1.2);
      return;
    }
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
    ...engineering.dynamic,
    ...shipping.dynamic,
    ...campus.dynamic,
    fryingEffects.group,
    processEffects.group,
    ...fluidSurfaces,
    ...bubbles.map((a) => a.o),
    ...drums.map((a) => a.g),
    ...sealers.flatMap((a) => [a.a, a.b]),
    ...packAnims.flatMap((a) =>
      a.o ? [a.o, a.released, a.roll, a.film] : a.bags,
    ),
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
  const batchCentre = new THREE.Vector3();
  scene.traverse((o) => {
    if (
      !o.isMesh ||
      o.isInstancedMesh ||
      Array.isArray(o.material) ||
      o.material.transparent
    )
      return;
    for (let q = o; q; q = q.parent) if (protectedNodes.has(q)) return;
    // Spatial batches can be culled by the close-up camera. One material batch
    // spanning the entire campus would draw every machine in every chapter.
    if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
    o.geometry.boundingBox.getCenter(batchCentre).applyMatrix4(o.matrixWorld);
    const cell = `${Math.floor(batchCentre.x / 12)}:${Math.floor(batchCentre.z / 12)}`;
    const k = `${cell}/${o.material.uuid}/${o.castShadow}/${o.receiveShadow}`;
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
  const renderTarget = new THREE.WebGLRenderTarget(1, 1, {
    type: THREE.HalfFloatType,
    samples: 0,
  });
  const composer = new EffectComposer(renderer, renderTarget);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.17, 0.38, 2.6);
  const resizeBloom = bloom.setSize.bind(bloom);
  bloom.setSize = (w, h) =>
    resizeBloom(Math.max(1, Math.ceil(w / 2)), Math.max(1, Math.ceil(h / 2)));
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
    const bag = mesh(bagG, bagMaterial(i), 0, 2.76, 0, productGroup);
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
      chipGeometry(i + 1),
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
  function resize(force = false) {
    const nextWidth = Math.max(
      1,
      canvas.clientWidth || canvas.parentElement.clientWidth,
    );
    const nextHeight = Math.max(
      1,
      canvas.clientHeight || canvas.parentElement.clientHeight,
    );
    if (force !== true && nextWidth === width && nextHeight === height) return;
    width = nextWidth;
    height = nextHeight;
    const viewportChanged = camera.aspect !== width / height;
    budget.fps = window.innerWidth < 700 ? 30 : 60;
    if (viewportChanged) budget.reset();
    const { ratio } = drawingBudget({
      width,
      height,
      dpr: window.devicePixelRatio || 1,
      mobile: window.innerWidth < 700,
      scale: budget.scale,
      maxTextureSize: renderer.capabilities.maxTextureSize,
    });
    renderer.setPixelRatio(ratio);
    renderer.setSize(width, height, false);
    composer.setPixelRatio(renderer.getPixelRatio());
    composer.setSize(width, height);
    fxaa.uniforms.resolution.value.set(
      1 / (width * renderer.getPixelRatio()),
      1 / (height * renderer.getPixelRatio()),
    );
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    bloom.enabled = budget.scale >= 0.7;
    dirty = true;
  }
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();
  const temp = new THREE.Object3D();
  let logisticsLabel = "",
    lastAudioPosition = 0;
  const audioRight = new THREE.Vector3();
  let truckPosition = [39, 2, 0];
  function frame() {
    if (disposed) return;
    raf = requestAnimationFrame(frame);
    const frameStart = performance.now();
    const real = frameStart / 1000;
    if (!visible || !pageVisible || contextLost) return;
    cameraTarget.set(...desired.target);
    const cameraMoving =
      Math.abs(zoom - desiredZoom) > 0.0005 ||
      target.distanceTo(cameraTarget) > 0.004 ||
      Math.abs(radius - desired.radius) > 0.004 ||
      Math.abs(yaw - desired.yaw) > 0.0005 ||
      Math.abs(elevation - desired.elev) > 0.0005;
    if (!active() && !dirty && !cameraMoving && frameCount >= 2) return;
    const fps = window.innerWidth < 700 ? 30 : 60;
    if (active() && !dirty && real - lastRendered < 1 / fps - 0.002) return;
    // Camera easing uses elapsed time between rendered frames, including
    // callbacks skipped by the mobile frame limiter.
    const interval = Math.max(0, (real - lastRendered) * 1000);
    const dt = Math.min(0.1, interval / 1000);
    lastRendered = real;
    const worldTime = now();
    let t = ((worldTime % LOOP) + LOOP) % LOOP,
      p = t / LOOP,
      beat = TAU * t * 2;
    if (mode === "factory") {
      const logistics = campus.update(reducedMotion ? 26 : worldTime, journey);
      truckPosition = logistics.position;
      const label =
        logistics.time < 10
          ? "Truck arriving at the factory"
          : logistics.time < 12
            ? "Staging stop · Rear doors opening outward"
            : logistics.time < 18
              ? "Reversing into loading bay 01"
              : logistics.time < 22
                ? "Vehicle secured · Dock bridge connecting"
                : logistics.time < 48
                  ? "Forklift loading wrapped pallets"
                  : logistics.time < 49.6
                    ? "Dock closing · Vehicle release"
                    : logistics.time < 52
                      ? "Pulling clear of the loading bay"
                      : logistics.time < 56
                        ? "Staging stop · Cargo doors closing and locking"
                        : "Cargo ready · Departing across Pakistan";
      if (label !== logisticsLabel) {
        logisticsLabel = label;
        options.onLogistics?.(label);
      }
      if (journey > 5.5 && !inspect) {
        desired = cameraAt(journey, flavour);
        const follow = Math.min(1, (journey - 5.5) * 2);
        desired.target[0] +=
          (logistics.position[0] - desired.target[0]) *
          follow *
          (logistics.moving ? 1 : 0.2);
        desired.target[2] +=
          (logistics.position[2] - desired.target[2]) *
          follow *
          (logistics.moving ? 1 : 0.2);
      }
      if (journey === 0 && !inspect && !reducedMotion)
        desired = droneCamera(worldTime);
    }
    const smooth = reducedMotion ? 1 : 1 - Math.exp(-dt * 6);
    target.lerp(cameraTarget.set(...desired.target), smooth);
    zoom += (desiredZoom - zoom) * (reducedMotion ? 1 : 1 - Math.exp(-dt * 10));
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
      zoom *
      (mode === "product"
        ? Math.max(1, 0.95 / camera.aspect)
        : stage === 0
          ? Math.max(1, 1.55 / camera.aspect)
          : Math.max(1, 0.98 / camera.aspect));
    const far = Math.max(280, Math.ceil((rr + 200) / 100) * 100);
    if (camera.far !== far) {
      camera.far = far;
      camera.updateProjectionMatrix();
    }
    camera.position
      .copy(target)
      .add(
        cameraOffset.set(
          Math.sin(viewYaw) * rr * Math.cos(elevation),
          Math.sin(elevation) * rr,
          Math.cos(viewYaw) * rr * Math.cos(elevation),
        ),
      );
    camera.lookAt(target);
    camera.updateMatrixWorld();
    if (
      sound &&
      audioOn &&
      mode === "factory" &&
      real - lastAudioPosition > 0.1
    ) {
      audioRight.set(1, 0, 0).applyQuaternion(camera.quaternion);
      sound.setSpatial(camera.position, audioRight, truckPosition);
      lastAudioPosition = real;
    }
    viewFrustum.setFromProjectionMatrix(
      viewMatrix.multiplyMatrices(
        camera.projectionMatrix,
        camera.matrixWorldInverse,
      ),
    );
    if (mode === "product") {
      productBags.forEach((b) => {
        b.position.y = 2.76 + (reducedMotion ? 0 : 0.025 * Math.sin(p * TAU));
        b.rotation.y =
          -0.14 + (reducedMotion || inspect ? 0 : 0.05 * Math.sin(p * TAU));
      });
    }
    if (mode === "factory") {
      fryingEffects.update(t, camera, target, rr);
      processEffects.update(t, camera, target, rr);
      for (let b of beltAnims) {
        b.bounds ??= new THREE.Box3(
          v3(b.a - 0.1, b.y - 0.1, b.z - b.width),
          v3(b.b + 0.1, b.y + 0.2, b.z + b.width),
        );
        b.inst.visible = viewFrustum.intersectsBox(b.bounds);
        if (!b.inst.visible) continue;
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
        f.bounds ??= new THREE.Box3(
          v3(f.a - 0.2, f.y - 0.3, f.z - 1.5),
          v3(f.b + 0.2, f.y + 0.3, f.z + 1.5),
        );
        f.inst.visible = viewFrustum.intersectsBox(f.bounds);
        if (!f.inst.visible) continue;
        if (f.type === "chip")
          f.inst.geometry = rr > 32 ? f.lowGeometry : f.highGeometry;
        for (let i = 0; i < f.n; i++) {
          let m = f.meta[i],
            u = (m.offset + p * f.cycles) % 1;
          temp.position.set(
            f.a + u * (f.b - f.a),
            f.y +
              (f.type === "chip"
                ? (f.cycles === 1 ? 0.0035 : 0.008) * Math.sin(beat + m.angle)
                : 0.0),
            f.z + m.lane,
          );
          if (f.peeling) {
            temp.position.y +=
              0.16 * (m.lane / 0.8) ** 2 + 0.002 * Math.sin(beat + m.angle);
            f.peeling.setX(i, Math.min(1, u * 1.2));
          }
          if (f.cooking) {
            const enter = Math.min(1, Math.max(0, (u - 0.25) / 0.13));
            const leave = Math.min(1, Math.max(0, (u - 0.92) / 0.08));
            temp.position.y -= 0.025 * enter * (1 - leave);
          }
          if (f.type === "chip") {
            temp.rotation.set(
              -Math.PI / 2,
              0.1 * Math.sin(beat * 0.5 + m.angle),
              m.angle,
            );
            temp.scale.set(
              m.scale * (0.32 + m.variant * 0.04),
              m.scale * (0.32 + Math.sin(m.angle) * 0.018),
              m.scale * 0.33,
            );
          } else {
            temp.rotation.set(m.angle, beat * 0.25, m.angle * 0.5);
            temp.scale.set(0.052 * m.scale, 0.041 * m.scale, 0.043 * m.scale);
          }
          temp.updateMatrix();
          f.inst.setMatrixAt(i, temp.matrix);
          if (f.cooking) {
            const cook = Math.min(1, Math.max(0, (u - 0.06) / 0.87));
            f.cooking.setX(i, cook * cook * (3 - 2 * cook));
          }
        }
        f.inst.instanceMatrix.needsUpdate = true;
        if (f.cooking) f.cooking.needsUpdate = true;
        if (f.peeling) f.peeling.needsUpdate = true;
      }
      for (const a of spinAnims) {
        a.initial ??= a.o.quaternion.clone();
        a.spinAxis ??= new THREE.Vector3(
          a.axis === "x" ? 1 : 0,
          a.axis === "y" ? 1 : 0,
          a.axis === "z" ? 1 : 0,
        );
        a.spin ??= new THREE.Quaternion();
        // Rotate around the axle in parent coordinates without losing the
        // cylinder's initial orientation (Euler assignment tilted old rollers).
        a.o.quaternion
          .copy(a.spin.setFromAxisAngle(a.spinAxis, p * TAU * a.turns))
          .multiply(a.initial);
      }
      for (let d of drums) {
        d.bounds ??= new THREE.Box3(
          v3(d.x - 1.3, 0.9, d.z - 1.2),
          v3(d.x + 1.3, 4.0, d.z + 1.2),
        );
        d.g.visible = viewFrustum.intersectsBox(d.bounds);
        if (!d.g.visible) continue;
        d.chipBatch.geometry = rr > 32 ? d.lowGeometry : chipG;
        d.shell.rotation.z = p * TAU * 4;
        for (let i = 0; i < d.tumblers.length; i++) {
          let c = d.tumblers[i],
            u = (c.phase / TAU + p * 4) % 1,
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
          s = b.s * Math.sin(a * Math.PI) * 0.009;
        temp.position.set(b.x, 1.533 + a * 0.008, b.z);
        temp.rotation.set(0, 0, 0);
        temp.scale.set(s, s * 0.55, s);
        temp.updateMatrix();
        bubbleBatch.setMatrixAt(i, temp.matrix);
      }
      bubbleBatch.instanceMatrix.needsUpdate = true;
      for (let s of sealers) {
        let phase = bagPhase(t, s.f),
          gap = 0.29 - 0.18 * jawClosure(phase);
        s.a.position.z = s.z - gap;
        s.b.position.z = s.z + gap;
        const travel =
          jawClosure(phase) * Math.max(0, Math.min(1, (phase - 0.42) / 0.14));
        s.a.position.y = s.b.position.y = 1.87 - 0.045 * travel;
      }
      for (let a of packAnims) {
        if (a.o) {
          let phase = bagPhase(t, a.f);
          a.o.scale.y = 0.06 + 0.22 * Math.min(1, phase / 0.31);
          a.o.position.y = 1.78 - 0.1 * Math.min(1, phase / 0.31);
          a.o.visible = phase < 0.66;
          const filmAdvance = Math.min(1, phase / 0.31);
          a.film.material.map.offset.y = -filmAdvance;
          a.roll.rotation.x =
            (-(Math.floor(t / 2 + a.f / 3) + filmAdvance) * 0.34) / 0.24;
          const falling = Math.min(1, Math.max(0, (phase - 0.66) / 0.34));
          a.released.visible = phase >= 0.66;
          a.released.position.set(
            a.x + falling * 0.65,
            1.68 - 0.54 * falling * falling,
            a.z,
          );
          a.released.rotation.x =
            (-Math.PI / 2) * (falling * falling * (3 - 2 * falling));
        } else
          a.bags.forEach((g, i) => {
            let u = (i / 4 + t / 8 + a.f / 12) % 1;
            g.position.set(10.65 + u * 3.2, 1.14, a.z);
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
      detail.update(t, viewFrustum);
      engineering.update(t, viewFrustum);
      process.update(t, viewFrustum);
      shipping.update(t);
      fluidClock.value = t;
    }
    // Tight close-up shadow coverage gives better machine detail at 2048 than
    // a 4096 map spread across the whole campus. Shadows update at 30/15 Hz.
    if (dirty || real - lastShadow >= (rr > 45 ? 1 / 15 : 1 / 30)) {
      const extent =
        mode === "product" ? 9 : Math.max(12, Math.min(80, rr * 1.5));
      const sx = rr > 65 ? 12.5 : target.x,
        sz = rr > 65 ? 1 : target.z;
      key.target.position.set(sx, 0, sz);
      key.position.set(sx - 28, 42, sz + 28);
      Object.assign(key.shadow.camera, {
        left: -extent,
        right: extent,
        top: extent * 0.7,
        bottom: -extent * 0.7,
      });
      key.shadow.camera.updateProjectionMatrix();
      renderer.shadowMap.needsUpdate = true;
      lastShadow = real;
    }
    composer.render();
    if (
      active() &&
      !dirty &&
      budget.sample(interval, performance.now() - frameStart)
    ) {
      resize(true);
      // Resizing clears the canvas and replaces the composer's render targets.
      // Draw into the new targets before yielding to the browser's next paint.
      composer.render();
    }
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
    flows.forEach((f) => {
      geometries.add(f.highGeometry);
      geometries.add(f.lowGeometry);
    });
    drums.forEach((d) => geometries.add(d.lowGeometry));
    textures.add(scene.environment);
    fryingEffects.dispose();
    processEffects.dispose();
    geometries.forEach((g) => g.dispose());
    materials.forEach((m) => m.dispose());
    textures.forEach((t) => t?.dispose());
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
    zoomBy,
    resetZoom,
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
        quality: "HD",
        qualityScale: budget.scale,
        zoom: Math.round(100 / desiredZoom),
        renderWidth: canvas.width,
        renderHeight: canvas.height,
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

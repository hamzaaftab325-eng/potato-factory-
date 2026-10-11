import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { potatoGeometry } from "./geometry.js";
import {
  campusPhase,
  LOGISTICS_PHASE_SECONDS,
  logisticsAt,
  smooth,
} from "./timing.js";
import { batchRigidParts } from "./batching.js";
import { path, line as roadLine, arc, laneShift } from "./vehicle-paths.js";

// Metre-scale architectural cutaway. Vehicles and cargo have their own protected
// hierarchies; the static architecture is merged by the main scene's batching pass.
export function addFactoryCampus({ scene, M, mesh, pipe, textures, potatoG }) {
  const group = new THREE.Group();
  group.name = "CRISP factory campus";
  scene.add(group);
  const cube = new THREE.BoxGeometry(1, 1, 1);
  const round = new THREE.CylinderGeometry(1, 1, 1, 20);
  const globe = new THREE.SphereGeometry(1, 12, 8);
  const material = (color, roughness = 0.65, metalness = 0.05) =>
    new THREE.MeshStandardMaterial({ color, roughness, metalness });
  const P = {
    wall: material("#d8d5c8"),
    concrete: material("#a5aea7", 0.91),
    road: material("#414a49", 0.95),
    curb: material("#c0c2b5"),
    roof: material("#859590", 0.53, 0.55),
    teal: material("#1e5b60", 0.42, 0.35),
    white: material("#eceadf", 0.47, 0.25),
    soil: material("#8f927a", 0.98),
    foliage: material("#607661", 0.95),
    trunk: material("#6b6250", 0.97),
    line: material("#e8ddb2", 0.82),
    wood: new THREE.MeshStandardMaterial({
      map: textures.wood,
      roughness: 0.93,
    }),
    carton: new THREE.MeshStandardMaterial({
      map: textures.paper,
      roughness: 0.91,
    }),
    film: new THREE.MeshPhysicalMaterial({
      color: "#dce8db",
      transparent: true,
      opacity: 0.12,
      roughness: 0.32,
      depthWrite: false,
    }),
    vehicleGlass: new THREE.MeshPhysicalMaterial({
      color: "#294c56",
      roughness: 0.16,
      metalness: 0,
      clearcoat: 0.55,
      transparent: true,
      opacity: 0.88,
      depthWrite: false,
    }),
    lamp: new THREE.MeshStandardMaterial({
      color: "#fff2d4",
      emissive: "#fff0ce",
      emissiveIntensity: 0.5,
    }),
  };
  for (const m of [P.concrete, P.road, P.wall]) {
    m.bumpMap = textures.concrete;
    m.bumpScale = m === P.road ? 0.009 : 0.003;
    m.roughnessMap = textures.concrete;
  }
  for (const m of [P.white, P.teal, M.blue, M.graphite]) {
    m.roughnessMap = textures.enamel;
  }
  function B(x, y, z, w, h, d, m, parent = group) {
    const o = mesh(cube, m, x, y, z, parent);
    o.scale.set(w, h, d);
    return o;
  }
  function C(x, y, z, r, h, m, parent = group, axis = "y") {
    const o = mesh(round, m, x, y, z, parent);
    o.scale.set(r, h, r);
    if (axis === "x") o.rotation.z = Math.PI / 2;
    if (axis === "z") o.rotation.x = Math.PI / 2;
    return o;
  }
  function decal(text, sub, color = "#e9e5d4", background = "#205157") {
    const c = document.createElement("canvas");
    c.width = 1024;
    c.height = 384;
    const a = c.getContext("2d");
    a.fillStyle = background;
    a.fillRect(0, 0, 1024, 384);
    a.fillStyle = color;
    a.font = "160px Instrument Serif, serif";
    a.fillText(text, 62, 208);
    a.font = "26px DM Sans, sans-serif";
    a.fillText(sub, 69, 288);
    const map = new THREE.CanvasTexture(c);
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = 4;
    return new THREE.MeshStandardMaterial({ map, roughness: 0.58 });
  }
  function sign(text, sub, x, y, z, w, h, angle = 0, parent = group) {
    const o = mesh(
      new THREE.PlaneGeometry(w, h),
      decal(text, sub),
      x,
      y,
      z,
      parent,
    );
    o.rotation.y = angle;
    return o;
  }
  function line(a, b, z, width = 0.045, paint = P.line) {
    return B((a + b) / 2, 0.028, z, b - a, 0.014, width, paint);
  }

  // A complete fenced plot, with an uninterrupted dispatch apron and two roads.
  B(12.5, -0.19, 2, 122, 0.32, 38, P.soil);
  B(10, -0.015, 12, 190, 0.06, 7, P.road);
  B(52.5, -0.005, 3, 39, 0.07, 19, P.road);
  B(-31.5, -0.005, 3, 32, 0.07, 19, P.road);
  for (const z of [8.6, 15.4]) line(-85, 105, z, 0.07);
  for (let x = -85; x < 106; x += 3.8) line(x, x + 1.8, 12, 0.08);
  for (const z of [-16.4, 20.4]) B(12.5, 0.36, z, 122, 0.8, 0.2, P.wall);
  for (const x of [-48.5, 73.5]) {
    B(x, 0.36, -5.7, 0.2, 0.8, 20.4, P.wall);
    B(x, 0.36, 18.5, 0.2, 0.8, 3.8, P.wall);
  }
  for (let x = -47; x < 74; x += 2.8) {
    for (const z of [-16.4, 20.4]) {
      B(x, 1.25, z, 0.065, 1.3, 0.065, P.teal);
      B(x + 1.35, 1.75, z, 2.7, 0.035, 0.035, P.teal);
      B(x + 1.35, 1.12, z, 2.7, 0.025, 0.025, P.teal);
    }
  }
  // Pedestrian walkway is physically separate from the wet production floor.
  B(9.25, 0.12, 6.15, 51.5, 0.25, 2.5, P.concrete);
  for (const z of [4.8, 7.4]) B(9.25, 0.18, z, 51.5, 0.34, 0.12, P.curb);
  for (let z = 8.9; z < 15.4; z += 0.85)
    B(48.1, 0.038, z, 1.9, 0.015, 0.45, P.line);
  sign(
    "CRISP",
    "RECEIVING  ←     /     DISPATCH  →",
    49.8,
    2.2,
    8.1,
    3.3,
    1.25,
  );

  // Production building: low cutaway front, full back wall, columns and rafters.
  B(3.2, 0.29, 0, 39.1, 0.57, 9.25, P.concrete);
  B(3.2, 3.45, -4.6, 39.1, 5.75, 0.17, P.wall);
  B(3.2, 1.01, 4.58, 39.1, 0.84, 0.17, P.wall);
  B(3.2, 1.5, 4.61, 39.1, 0.13, 0.08, P.teal);
  B(-16.3, 3.46, -2.1, 0.17, 5.8, 5.05, P.wall);
  B(-16.3, 1.0, 2.58, 0.17, 0.83, 3.99, P.wall);
  for (let x = -16.2; x < 23; x += 6.5) {
    for (const z of [-4.4, 4.4]) {
      B(x, 3.6, z, 0.14, 6.0, 0.19, P.teal);
      B(x, 0.65, z, 0.48, 0.13, 0.52, M.steel);
    }
    B(x, 6.63, 0, 0.14, 0.18, 9.05, P.teal);
    const brace = B(x, 6.27, -3.5, 0.095, 0.095, 1.9, P.teal);
    brace.rotation.x = -0.35;
  }
  for (let x = -14.5; x < 23; x += 3.2) {
    B(x, 4.4, -4.495, 2.4, 1.3, 0.015, M.glass);
    for (const y of [3.74, 5.06]) B(x, y, -4.46, 2.46, 0.045, 0.07, P.teal);
    B(x, 4.4, -4.45, 0.05, 1.36, 0.06, P.teal);
  }
  const roof = new THREE.Group();
  group.add(roof);
  B(3.2, 6.8, -3.0, 39.3, 0.12, 3.35, P.roof, roof);
  for (let x = -16.2; x < 23; x += 0.38)
    B(x, 6.9, -3, 0.025, 0.06, 3.4, P.roof, roof);
  B(3.2, 6.72, -4.75, 39.3, 0.22, 0.15, M.steel, roof);
  pipe(
    [
      [-16, 6.56, -4.76],
      [21, 6.56, -4.76],
      [22.7, 6.3, -4.76],
      [22.7, 0.5, -4.76],
    ],
    0.075,
    P.roof,
    group,
  );
  sign(
    "crisp",
    "THE FACTORY / CRAFTED FOR THE CRUNCH",
    -8.5,
    5.75,
    -4.47,
    6.5,
    1.1,
  );
  // Aisles, trench drains, washable partitions and actual service connections.
  for (const z of [-3.8, 3.8]) B(3.1, 0.59, z, 37.9, 0.012, 0.06, M.yellow);
  for (let x = -15; x < -3; x += 0.28)
    B(x, 0.591, 3.15, 0.12, 0.018, 0.36, M.dark);
  for (const x of [-3.2, 7.6]) {
    B(x, 1.0, -3.1, 0.075, 0.8, 2.6, P.white);
    B(x, 3.2, -3.1, 0.075, 3.6, 2.6, M.glass);
    B(x, 3.4, 4.1, 0.075, 5.6, 0.75, P.teal);
  }
  for (const [text, sub, x] of [
    ["PREPARE", "WET PROCESS / 01", -11],
    ["FRY", "HEAT & CIRCULATION / 02", -0.4],
    ["PACK", "CLEAN PACKING / 03", 11.8],
  ])
    sign(text, sub, x, 3.15, -4.46, 3.25, 0.78);
  for (let x = -13; x < 21; x += 6) {
    B(x, 5.7, -0.5, 2.8, 0.06, 0.22, P.white);
    B(x, 5.65, -0.5, 2.7, 0.012, 0.19, P.lamp);
    C(x, 6.15, -0.5, 0.014, 0.9, M.dark);
  }
  pipe(
    [
      [-13, 4.8, -3.9],
      [-3, 4.8, -3.9],
      [0, 4.8, -3.9],
      [0, 1.4, -3.4],
    ],
    0.065,
    M.chrome,
    group,
  );
  pipe(
    [
      [-13, 4.95, -4.05],
      [20, 4.95, -4.05],
    ],
    0.055,
    M.blue,
    group,
  );
  pipe(
    [
      [-0.5, 3.82, -1],
      [-0.5, 4.4, -2],
      [-0.5, 6.98, -2],
    ],
    0.23,
    M.steel,
    group,
  );
  C(-0.5, 7.18, -2, 0.36, 0.2, P.roof);
  // Oil filter, heat exchanger and water treatment sit beside the process hall.
  for (const x of [-2.3, 0.7]) {
    B(x, 0.35, -7.2, 2.2, 0.55, 2.7, P.concrete);
    C(x, 1.6, -7.2, 0.76, 1.9, M.steel);
    C(x, 2.6, -7.2, 0.78, 0.12, M.chrome);
    B(x, 1.38, -6.42, 0.8, 1.1, 0.055, M.graphite);
    pipe(
      [
        [x, 0.95, -7.2],
        [x, 0.95, -5.4],
        [x, 0.9, -2.0],
      ],
      0.07,
      M.chrome,
      group,
    );
  }
  B(4.1, 1.05, -7.2, 2.2, 1.5, 1.85, M.graphite);
  for (let i = 0; i < 10; i++)
    B(4.1, 0.54 + i * 0.095, -6.265, 1.8, 0.025, 0.05, M.dark);
  for (const x of [-12.6, -9.7]) C(x, 1.14, -7.6, 1.08, 2.2, P.teal);
  pipe(
    [
      [-11, 0.8, -7.6],
      [-11, 0.8, -3.9],
      [-10.6, 1.05, -1],
    ],
    0.06,
    M.chrome,
    group,
  );
  B(-6.9, 1.4, -7.5, 1.25, 2.1, 0.65, M.blue);
  sign("UTILITIES", "WATER / OIL / EXTRACTION", -5.6, 1.8, -6.9, 2.4, 0.6);

  // Warehouse is raised to truck-bed height; the connecting ramp is solid.
  B(29.2, 0.65, 0, 12.1, 1.3, 9.2, P.concrete);
  B(29.2, 3.3, -4.6, 12.1, 4.0, 0.16, P.wall);
  B(29.2, 1.72, 4.6, 12.1, 0.8, 0.16, P.wall);
  B(35.3, 3.9, -3.6, 0.15, 5.2, 1.8, P.wall);
  B(35.3, 3.9, 3.6, 0.15, 5.2, 1.8, P.wall);
  B(35.3, 5.2, 0, 0.15, 0.45, 5.6, P.teal);
  B(29.2, 5.45, -3, 12.3, 0.12, 3.3, P.roof, roof);
  B(23.1, 4.0, -4.4, 0.15, 5.8, 0.2, P.teal);
  B(23.1, 4.0, 4.4, 0.15, 5.8, 0.2, P.teal);
  const ramp = B(24.35, 0.89, 0, 2.75, 0.12, 2.2, P.concrete);
  ramp.rotation.z = 0.26;
  sign(
    "DISPATCH",
    "SEALED / PALLETISED / READY FOR PAKISTAN",
    29.5,
    4.65,
    -4.47,
    5.4,
    0.95,
  );
  // Two warehouse racks with upright beams, levels and mixed flavour cartons.
  for (const z of [-3.25, 3.25]) {
    for (const x of [25.7, 28.7, 31.7]) B(x, 3.05, z, 0.09, 3.5, 0.12, M.blue);
    for (const y of [1.8, 3.0, 4.2]) {
      B(28.7, y, z, 6.15, 0.1, 1.2, M.yellow);
      for (let x = 26.15; x < 32; x += 0.7) {
        B(x, y + 0.24, z, 0.6, 0.4, 0.45, P.carton);
        B(
          x,
          y + 0.24,
          z + (z > 0 ? -0.231 : 0.231),
          0.34,
          0.13,
          0.014,
          P.white,
        );
      }
    }
  }
  // Bumpers, dock leveller, wheel restraint and loading-bay signal.
  for (const z of [-1.52, 1.52]) B(35.5, 1.22, z, 0.16, 0.62, 0.22, M.rubber);
  const bridge = new THREE.Group();
  bridge.position.set(35.25, 1.32, 0);
  group.add(bridge);
  B(0.24, 0, 0, 0.5, 0.05, 2.45, M.dark, bridge);
  B(0.49, 0.025, 0, 0.09, 0.025, 2.45, M.chrome, bridge);
  const restraint = new THREE.Group();
  restraint.position.set(37.0, 0.11, 1.78);
  group.add(restraint);
  B(0, 0, 0, 1.55, 0.12, 0.16, M.yellow, restraint);
  B(0, 0.19, -0.13, 0.13, 0.44, 0.42, M.yellow, restraint);
  B(35.6, 3.8, 1.95, 0.25, 0.63, 0.19, M.dark);
  const redSignal = C(35.745, 3.94, 1.95, 0.072, 0.025, M.red, group, "x");
  const greenSignal = C(35.745, 3.65, 1.95, 0.072, 0.025, M.led, group, "x");
  for (const z of [-1.65, 1.65]) B(41.2, 0.034, z, 11.7, 0.016, 0.07, P.line);
  sign("01", "LOADING BAY", 35.52, 4.2, 0, 1.1, 0.8, Math.PI / 2);

  // Checkpost is across the road, clear of the cab and manoeuvring apron.
  B(49.0, 0.12, 18.1, 3.4, 0.24, 2.9, P.concrete);
  B(49.0, 1.37, 18.1, 2.8, 2.5, 2.25, P.wall);
  B(49.0, 2.71, 18.1, 3.1, 0.16, 2.55, P.teal);
  B(49.0, 1.72, 16.97, 1.9, 0.95, 0.015, P.vehicleGlass);
  B(50.42, 1.72, 18.1, 0.015, 0.95, 1.35, P.vehicleGlass);
  sign(
    "CRISP",
    "SECURITY / FACTORY GATE",
    49.0,
    2.3,
    16.95,
    2.15,
    0.3,
    Math.PI,
  );
  B(47.58, 1.05, 18.1, 0.015, 1.8, 0.76, P.teal);
  for (const x of [46.9, 51.1]) C(x, 0.47, 16.75, 0.085, 0.94, M.yellow);
  const gate = new THREE.Group();
  gate.position.set(52.8, 0.9, 15.4);
  group.add(gate);
  B(0, 0.22, -3.4, 0.08, 0.09, 6.8, P.white, gate);
  for (let z = 0.25; z < 6.8; z += 0.6)
    B(0, 0.22, -z, 0.09, 0.095, 0.25, M.red, gate);
  B(52.8, 0.8, 15.4, 0.4, 1.6, 0.4, M.yellow);
  for (const [x, z] of [
    [-26, -10],
    [-18, -12],
    [17, -12],
    [29, -12],
    [43, 18],
  ]) {
    C(x, 1.2, z, 0.14, 2.4, P.trunk);
    const crown = mesh(globe, P.foliage, x, 3.15, z, group);
    crown.scale.set(1.45, 1.8, 1.4);
    B(x, 0.08, z, 2.9, 0.18, 2.9, P.curb);
  }
  for (const [x, z] of [
    [-17.5, -7],
    [16, 7.1],
    [36.9, -6.7],
  ]) {
    C(x, 2.7, z, 0.055, 5.4, P.teal);
    B(x, 5.42, z + 0.4, 0.35, 0.1, 0.85, P.roof);
    B(x, 5.36, z + 0.45, 0.29, 0.035, 0.65, P.lamp);
  }

  const cargoLabel = decal(
    "crisp",
    "ORIGINAL COLLECTION / HANDLE WITH CARE",
    "#27413d",
    "#d8be8a",
  );
  function pallet(parent, wrapped = true) {
    const p = new THREE.Group();
    parent.add(p);
    for (const z of [-0.42, 0, 0.42]) B(0, 0.06, z, 1.2, 0.12, 0.13, P.wood, p);
    for (let x = -0.5; x < 0.6; x += 0.2)
      B(x, 0.15, 0, 0.16, 0.055, 1.0, P.wood, p);
    for (let level = 0; level < 3; level++)
      for (const x of [-0.3, 0.3])
        for (const z of [-0.235, 0.235]) {
          B(x, 0.4 + level * 0.42, z, 0.58, 0.4, 0.45, P.carton, p);
          mesh(
            new THREE.PlaneGeometry(0.43, 0.17),
            cargoLabel,
            x,
            0.4 + level * 0.42,
            z + 0.231,
            p,
          );
          B(x, 0.605 + level * 0.42, z, 0.58, 0.008, 0.045, P.line, p);
        }
    if (wrapped) {
      B(0, 0.8, 0, 1.22, 1.32, 1.01, P.film, p);
      for (let y = 0.26; y < 1.46; y += 0.12) {
        B(0, y, 0.511, 1.23, 0.017, 0.008, P.film, p);
        B(0, y, -0.511, 1.23, 0.017, 0.008, P.film, p);
      }
    }
    return p;
  }
  const truckPotatoG = potatoGeometry(16, 12);
  const brakeLamp = new THREE.MeshStandardMaterial({
    color: "#d0392f",
    emissive: "#b52317",
    emissiveIntensity: 1.2,
    roughness: 0.3,
  });
  const amberLamp = new THREE.MeshStandardMaterial({
    color: "#e3a333",
    emissive: "#e99c23",
    emissiveIntensity: 1.6,
    roughness: 0.3,
  });
  const reverseLamp = new THREE.MeshStandardMaterial({
    color: "#f5f1d7",
    emissive: "#fff3d0",
    emissiveIntensity: 0.8,
    roughness: 0.28,
  });
  const tyreGroove = material("#111a1c", 0.94);
  const potatoFill = new THREE.MeshStandardMaterial({
    color: "#b79a72",
    map: textures.potato,
    roughness: 0.94,
  });
  function R(x, y, z, w, h, d, m, parent, radius = 0.055) {
    return mesh(
      new RoundedBoxGeometry(w, h, d, 2, Math.min(radius, w / 3, h / 3, d / 3)),
      m,
      x,
      y,
      z,
      parent,
    );
  }
  function pane(points, parent) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(points.flat(), 3),
    );
    geometry.setAttribute(
      "uv",
      new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2),
    );
    geometry.setIndex([0, 2, 1, 0, 3, 2]);
    geometry.computeVertexNormals();
    return mesh(geometry, P.vehicleGlass, 0, 0, 0, parent);
  }
  // Sculpted cab-over rigid: real window openings, shaped wheel arches and a
  // separate body on chassis rails. +X is the cab's forward direction.
  function vehicle(tipper = false) {
    const g = new THREE.Group();
    g.name = tipper ? "loaded raw-potato tipper" : "CRISP distribution truck";
    group.add(g);
    const wheels = [],
      steer = [],
      hydraulics = [],
      turnIndicators = [],
      reverseLights = [];
    const paint = new THREE.MeshPhysicalMaterial({
      color: "#e8ece6",
      metalness: 0.18,
      roughness: 0.32,
      clearcoat: 0.55,
      clearcoatRoughness: 0.24,
      roughnessMap: textures.enamel,
    });
    B(0.2, 0.75, 0, 8.15, 0.19, 0.9, M.dark, g);
    for (const z of [-0.51, 0.51]) B(0, 0.79, z, 8.1, 0.15, 0.1, M.dark, g);
    for (const x of [-2.3, 2.9]) {
      C(x, 0.54, 0, 0.105, 2.15, M.dark, g, "z");
      for (const side of [-1, 1]) {
        const hub = new THREE.Group();
        hub.position.set(x, 0.56, side * 1.12);
        g.add(hub);
        if (x > 0) steer.push(hub);
        const wheel = new THREE.Group();
        hub.add(wheel);
        wheels.push(wheel);
        C(0, 0, 0, 0.54, 0.29, M.rubber, wheel, "z");
        for (const z of [-0.14, 0.14])
          mesh(
            new THREE.TorusGeometry(0.426, 0.103, 8, 32),
            M.rubber,
            0,
            0,
            z,
            wheel,
          );
        for (const z of [-0.07, 0.07])
          mesh(
            new THREE.TorusGeometry(0.539, 0.008, 5, 32),
            tyreGroove,
            0,
            0,
            z,
            wheel,
          );
        for (let k = 0; k < 32; k++) {
          const angle = (k * Math.PI) / 16;
          const tread = B(
            Math.cos(angle) * 0.534,
            Math.sin(angle) * 0.534,
            0,
            0.061,
            0.024,
            0.23,
            tyreGroove,
            wheel,
          );
          tread.rotation.z = angle + Math.PI / 2;
        }
        C(0, 0, side * 0.167, 0.326, 0.033, M.steel, wheel, "z");
        C(0, 0, side * 0.19, 0.115, 0.055, M.chrome, wheel, "z");
        for (let k = 0; k < 10; k++) {
          const angle = (k * Math.PI) / 5;
          C(
            Math.cos(angle) * 0.25,
            Math.sin(angle) * 0.25,
            side * 0.189,
            0.038,
            0.009,
            M.dark,
            wheel,
            "z",
          );
          C(
            Math.cos(angle) * 0.165,
            Math.sin(angle) * 0.165,
            side * 0.216,
            0.021,
            0.019,
            M.chrome,
            wheel,
            "z",
          );
        }
        if (x < 0) {
          C(0, 0, -side * 0.3, 0.54, 0.26, M.rubber, wheel, "z");
          mesh(
            new THREE.TorusGeometry(0.426, 0.103, 8, 32),
            M.rubber,
            0,
            0,
            -side * 0.43,
            wheel,
          );
          R(x, 1.18, side * 1.12, 1.37, 0.15, 0.67, P.teal, g);
        }
      }
      for (const z of [-0.7, 0.7])
        for (let i = 0; i < 4; i++)
          B(x, 0.72 + i * 0.033, z, 1.3 - i * 0.15, 0.026, 0.11, M.dark, g);
    }
    // The lower side panel has a genuine semicircular wheel cutout.
    const arch = new THREE.Shape();
    arch.moveTo(2.08, 1.98);
    arch.lineTo(3.91, 1.98);
    arch.quadraticCurveTo(4.07, 1.83, 4.07, 1.64);
    arch.lineTo(4.07, 0.7);
    arch.lineTo(3.57, 0.7);
    arch.lineTo(3.57, 0.56);
    arch.absarc(2.93, 0.56, 0.64, 0, Math.PI, false);
    arch.lineTo(2.29, 0.7);
    arch.lineTo(2.08, 0.7);
    arch.closePath();
    const archGeometry = new THREE.ExtrudeGeometry(arch, {
      depth: 0.047,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.018,
      bevelThickness: 0.014,
      curveSegments: 20,
    });
    for (const side of [-1, 1]) {
      mesh(archGeometry, paint, 0, 0, side > 0 ? 1.237 : -1.284, g);
      B(3.05, 1.89, side * 1.294, 1.74, 0.06, 0.026, P.teal, g);
      B(2.17, 2.36, side * 1.25, 0.1, 0.91, 0.1, paint, g);
      const pillar = B(3.92, 2.38, side * 1.23, 0.087, 0.95, 0.11, paint, g);
      pillar.rotation.z = 0.12;
      B(3.01, 2.82, side * 1.25, 1.83, 0.07, 0.09, paint, g);
      B(3.02, 2.37, side * 1.258, 1.61, 0.82, 0.017, P.vehicleGlass, g);
      B(3.42, 2.36, side * 1.275, 0.044, 0.8, 0.023, M.dark, g);
      R(2.92, 1.7, side * 1.3, 1.39, 0.19, 0.025, P.teal, g, 0.012);
      R(2.63, 1.64, side * 1.327, 0.25, 0.052, 0.035, M.dark, g, 0.018);
      for (const y of [0.8, 1.05]) {
        B(2.15, y, side * 1.33, 0.32, 0.065, 0.26, M.steel, g);
        for (let x = 2.02; x < 2.31; x += 0.07)
          B(x, y + 0.035, side * 1.33, 0.023, 0.012, 0.22, M.dark, g);
      }
      pipe(
        [
          [3.83, 2.56, side * 1.25],
          [4.0, 2.57, side * 1.62],
          [3.88, 2.54, side * 1.76],
        ],
        0.025,
        M.dark,
        g,
      );
      R(3.86, 2.46, side * 1.78, 0.19, 0.4, 0.085, M.dark, g, 0.03);
      B(3.96, 2.46, side * 1.78, 0.013, 0.32, 0.059, M.chrome, g);
      R(4.07, 1.08, side * 0.99, 0.085, 0.27, 0.48, M.dark, g, 0.025);
      R(4.117, 1.105, side * 0.98, 0.025, 0.15, 0.31, P.lamp, g, 0.012);
      const indicator = R(
        4.121,
        1.255,
        side * 1.07,
        0.025,
        0.073,
        0.13,
        M.yellow,
        g,
        0.012,
      );
      turnIndicators.push({ o: indicator, side });
      for (const x of [2.2, 3.85])
        B(x, 2.36, side * 1.3, 0.026, 0.88, 0.018, M.rubber, g);
      B(-0.3, 0.66, side * 1.18, 2.8, 0.09, 0.08, M.steel, g);
    }
    R(3.0, 1.63, 0, 1.94, 0.54, 2.48, paint, g, 0.09);
    R(3.88, 1.39, 0, 0.34, 0.7, 2.49, paint, g, 0.07);
    B(2.13, 2.35, 0, 0.09, 0.99, 2.44, paint, g);
    R(3.0, 2.91, 0, 2.01, 0.16, 2.59, paint, g, 0.065);
    R(3.88, 2.875, 0, 0.34, 0.085, 2.62, P.teal, g, 0.03);
    if (!tipper) {
      const fairing = new THREE.Shape();
      fairing.moveTo(2.13, 3.02);
      fairing.lineTo(3.9, 3.02);
      fairing.quadraticCurveTo(3.4, 3.56, 2.22, 3.92);
      fairing.lineTo(2.13, 3.92);
      fairing.closePath();
      const geometry = new THREE.ExtrudeGeometry(fairing, {
        depth: 2.42,
        steps: 1,
        curveSegments: 12,
        bevelEnabled: true,
        bevelSize: 0.035,
        bevelThickness: 0.035,
        bevelSegments: 2,
      });
      geometry.translate(0, 0, -1.21);
      mesh(geometry, paint, 0, 0, 0, g);
    }
    for (const z of [-0.94, 0, 0.94])
      R(3.78, 2.99, z, 0.09, 0.035, 0.13, M.yellow, g, 0.01);
    pane(
      [
        [4.02, 1.995, -1.15],
        [4.02, 1.995, 1.15],
        [3.89, 2.817, 1.16],
        [3.89, 2.817, -1.16],
      ],
      g,
    );
    B(3.72, 1.985, 0, 0.49, 0.14, 2.2, M.dark, g);
    for (const side of [-1, 1]) {
      pipe(
        [
          [4.037, 2.05, side * 0.65],
          [3.975, 2.47, side * 0.32],
        ],
        0.013,
        M.dark,
        g,
      );
      B(4.045, 2.035, side * 0.65, 0.04, 0.04, 0.04, M.dark, g);
      B(2.9, 1.64, side * 0.58, 0.53, 0.16, 0.5, M.rubber, g);
      R(2.61, 1.95, side * 0.58, 0.15, 0.58, 0.5, M.rubber, g);
    }
    // Right-hand steering and a seated operator visible through the glazing.
    R(3.04, 2.08, 0.59, 0.29, 0.49, 0.35, P.teal, g);
    const driver = mesh(globe, material("#ac8669"), 3.09, 2.46, 0.59, g);
    driver.scale.set(0.12, 0.15, 0.13);
    const steering = mesh(
      new THREE.TorusGeometry(0.16, 0.014, 6, 20),
      M.dark,
      3.55,
      2.14,
      0.59,
      g,
    );
    steering.rotation.y = Math.PI / 2;
    pipe(
      [
        [3.09, 2.22, 0.75],
        [3.3, 2.08, 0.74],
        [3.52, 2.14, 0.7],
      ],
      0.047,
      P.teal,
      g,
    );
    R(4.075, 1.54, 0, 0.09, 0.38, 1.83, M.dark, g, 0.04);
    for (let y = 1.4; y < 1.7; y += 0.056)
      B(4.129, y, 0, 0.025, 0.017, 1.69, M.steel, g);
    sign("CRISP", "DISTRIBUTION", 4.149, 1.82, 0, 0.48, 0.14, Math.PI / 2, g);
    R(4.1, 0.855, 0, 0.21, 0.22, 2.7, M.dark, g, 0.055);
    B(4.216, 0.868, 0, 0.014, 0.075, 1.0, M.steel, g);
    const registration = mesh(
      new THREE.PlaneGeometry(0.43, 0.11),
      decal("CR-180", "CONCEPT VEHICLE", "#24463c", "#ece5bf"),
      4.23,
      0.93,
      0,
      g,
    );
    registration.rotation.y = Math.PI / 2;
    for (const z of [-0.65, 0.65])
      B(4.22, 0.82, z, 0.025, 0.035, 0.1, M.chrome, g);
    C(0.9, 0.72, -0.75, 0.34, 1.2, M.steel, g, "x");
    for (const x of [0.48, 1.32]) {
      const strap = mesh(
        new THREE.TorusGeometry(0.345, 0.025, 5, 24),
        M.dark,
        x,
        0.72,
        -0.75,
        g,
      );
      strap.rotation.y = Math.PI / 2;
    }
    C(1.3, 0.91, -0.99, 0.047, 0.055, M.chrome, g);
    pipe(
      [
        [1.84, 0.72, 0.57],
        [1.55, 0.87, 0.57],
        [1.48, 2.94, 0.57],
      ],
      0.041,
      M.steel,
      g,
    );
    C(1.75, 0.69, -0.7, 0.08, 1.45, M.dark, g, "x");
    B(0.05, 0.89, 0.83, 1.35, 0.54, 0.42, M.dark, g);
    const body = new THREE.Group();
    g.add(body);
    B(-0.85, 1.3, 0, 5.6, 0.14, 2.66, M.steel, body);
    const doors = [];
    let tailgate = null,
      potatoLoad = null,
      cargoBaseY = 0;
    if (!tipper) {
      for (const side of [-1, 1]) {
        B(-0.85, 2.88, side * 1.34, 5.6, 3.0, 0.055, paint, body);
        B(-0.85, 1.55, side * 1.38, 5.6, 0.25, 0.035, P.teal, body);
        for (let x = -3.55; x < 2.0; x += 0.75)
          B(x, 2.88, side * 1.378, 0.027, 2.88, 0.017, M.steel, body);
        for (const y of [1.42, 4.36])
          B(-0.85, y, side * 1.38, 5.65, 0.065, 0.045, M.chrome, body);
        for (const x of [-3.61, 1.91])
          B(x, 2.89, side * 1.37, 0.07, 3.04, 0.055, M.chrome, body);
        sign(
          "crisp",
          "CRAFTED FOR THE CRUNCH / ACROSS PAKISTAN",
          -0.85,
          2.88,
          side * 1.392,
          4.6,
          1.45,
          side < 0 ? Math.PI : 0,
          body,
        );
        for (const x of [-3.3, -0.85, 1.7])
          R(x, 1.51, side * 1.4, 0.15, 0.07, 0.022, M.yellow, body, 0.01);
      }
      R(-0.85, 4.43, 0, 5.65, 0.1, 2.75, paint, body, 0.035);
      B(1.94, 2.88, 0, 0.055, 3, 2.65, paint, body);
      for (const side of [-1, 1]) {
        const door = new THREE.Group();
        door.position.set(-3.66, 1.37, side * 1.32);
        body.add(door);
        B(0, 1.5, -side * 0.655, 0.065, 2.98, 1.31, paint, door);
        // Continuous rubber seals, hinge pins and retainers make the rear leaves
        // read as insulated cargo doors at both the closed and folded positions.
        for (const z of [-side * 0.03, -side * 1.28])
          B(0.038, 1.5, z, 0.018, 2.9, 0.022, M.rubber, door);
        for (const y of [0.25, 1.5, 2.74])
          C(-0.006, y, 0, 0.025, 0.19, M.chrome, door);
        for (const y of [0.07, 2.91])
          B(-0.04, y, -side * 0.655, 0.025, 0.06, 1.31, M.steel, door);
        C(-0.052, 1.5, -side * 0.81, 0.021, 2.48, M.chrome, door);
        for (const y of [0.3, 1.5, 2.7])
          B(-0.055, y, 0, 0.07, 0.09, 0.19, M.steel, door);
        const latch = new THREE.Group();
        latch.position.set(-0.077, 1.2, -side * 0.95);
        door.add(latch);
        B(0, 0, side * 0.1, 0.06, 0.055, 0.27, M.dark, latch);
        C(0, 0, 0, 0.038, 0.08, M.chrome, latch, "x");
        doors.push({ o: door, side, latch });
      }
    } else {
      for (const side of [-1, 1]) {
        B(-0.85, 2.08, side * 1.34, 5.6, 1.45, 0.09, P.teal, body);
        B(-0.85, 2.82, side * 1.34, 5.71, 0.09, 0.13, M.steel, body);
        B(-0.85, 1.42, side * 1.34, 5.66, 0.1, 0.13, M.steel, body);
        for (let x = -3.45; x < 1.95; x += 0.75)
          B(x, 2.1, side * 1.4, 0.085, 1.4, 0.09, M.steel, body);
      }
      B(1.93, 2.14, 0, 0.1, 1.6, 2.65, P.teal, body);
      C(1.95, 2.94, 0, 0.12, 2.72, M.dark, body, "z");
      tailgate = new THREE.Group();
      tailgate.position.set(-3.66, 2.81, 0);
      body.add(tailgate);
      B(0, -0.71, 0, 0.1, 1.42, 2.65, P.teal, tailgate);
      for (const z of [-0.9, 0, 0.9])
        B(-0.075, -0.71, z, 0.065, 1.33, 0.095, M.steel, tailgate);
      for (const z of [-0.9, 0.9])
        C(0, 0, z, 0.065, 0.23, M.chrome, tailgate, "z");
      potatoLoad = new THREE.Group();
      potatoLoad.name = "full textured potato mound";
      body.add(potatoLoad);
      B(-0.85, 1.95, 0, 5.34, 1.16, 2.49, potatoFill, potatoLoad);
      // Only the visible skin needs individual potatoes. Hidden buried layers
      // were tripling the vertex workload without changing the visible mound.
      const count = 40 * 18;
      const crop = new THREE.InstancedMesh(truckPotatoG, M.potato, count);
      crop.castShadow = crop.receiveShadow = true;
      potatoLoad.add(crop);
      const dummy = new THREE.Object3D(),
        tint = new THREE.Color();
      for (let i = 0; i < count; i++) {
        const col = i % 40,
          row = Math.floor(i / 40) % 18,
          layer = Math.floor(i / 720);
        const seed = Math.sin(i * 12.9898 + 4.7) * 43758.5453;
        const noise = seed - Math.floor(seed);
        const x = -3.43 + col * 0.137 + Math.sin(i * 5.7) * 0.018;
        const z = -1.2 + row * 0.141 + Math.sin(i * 2.9) * 0.015;
        const crown = Math.max(0, 1 - ((x + 0.85) / 2.8) ** 2 - (z / 1.5) ** 2);
        dummy.position.set(
          x,
          2.53 + crown * 0.29 - layer * 0.092 + noise * 0.022,
          z,
        );
        dummy.rotation.set(i * 1.32, i * 2.39, i * 0.73);
        dummy.scale.set(
          0.078 + noise * 0.017,
          0.062 + noise * 0.009,
          0.068 + noise * 0.014,
        );
        dummy.updateMatrix();
        crop.setMatrixAt(i, dummy.matrix);
        tint.setHSL(
          0.095 + noise * 0.012,
          0.19 + noise * 0.1,
          0.7 + noise * 0.12,
        );
        crop.setColorAt(i, tint);
      }
      crop.instanceMatrix.needsUpdate = true;
      crop.instanceColor.needsUpdate = true;
      crop.computeBoundingSphere();
      const hinge = new THREE.Vector3(-3.66, 1.3, 0);
      body.children.forEach((o) => o.position.sub(hinge));
      body.position.copy(hinge);
      cargoBaseY = potatoLoad.position.y;
      for (const z of [-0.42, 0.42]) {
        const outer = C(-1.5, 1.08, z, 0.105, 1.3, M.dark, g);
        const piston = C(-0.5, 1.3, z, 0.065, 1.3, M.chrome, g);
        hydraulics.push(outer, piston);
      }
    }
    const rearLights = [];
    for (const side of [-1, 1]) {
      R(-3.77, 0.86, side * 1.01, 0.08, 0.16, 0.29, M.dark, g, 0.02);
      const l = B(-3.82, 0.87, side * 1.01, 0.022, 0.11, 0.21, M.red, g);
      rearLights.push(l);
      turnIndicators.push({
        o: B(-3.82, 0.87, side * 1.2, 0.022, 0.11, 0.1, M.yellow, g),
        side,
      });
      reverseLights.push(
        B(-3.82, 0.7, side * 1.02, 0.024, 0.06, 0.12, paint, g),
      );
      B(-2.98, 0.28, side * 1.1, 0.035, 0.51, 0.34, M.rubber, g);
    }
    B(-3.75, 0.46, 0, 0.15, 0.13, 2.45, M.steel, g);
    return {
      g,
      body,
      wheels,
      steer,
      doors,
      rearLights,
      turnIndicators,
      reverseLights,
      tailgate,
      potatoLoad,
      cargoBaseY,
      hydraulics,
      curvature: 0,
      wheelAngle: 0,
      previousTime: null,
      previousPosition: new THREE.Vector3(),
    };
  }
  const truck = vehicle();
  const loads = [pallet(truck.g), pallet(truck.g)];
  loads[0].position.set(1.2, 1.38, 0);
  loads[1].position.set(-1.6, 1.38, 0);
  const raw = vehicle(true);
  raw.g.rotation.y = Math.PI;
  raw.g.position.set(-21, 0, 0);
  // Solid receiving ramp bridges the raw truck to the metered intake hopper.
  const receivingRamp = B(-16.0, 1.77, 0, 3.35, 0.1, 1.15, M.dark);
  receivingRamp.rotation.z = 0.21;
  for (const z of [-0.57, 0.57])
    B(-16, 1.88, z, 3.4, 0.2, 0.05, M.blue).rotation.z = 0.21;
  sign("RECEIVING", "RAW POTATOES / METERED INTAKE", -19, 3.2, -4.4, 4.0, 0.8);

  const forklift = new THREE.Group();
  group.add(forklift);
  B(0, 0.55, 0, 1.55, 0.75, 1.05, M.yellow, forklift);
  B(-0.48, 0.9, 0, 0.52, 0.6, 1.05, M.dark, forklift);
  B(0.1, 1.15, 0, 0.43, 0.19, 0.51, M.rubber, forklift);
  B(-0.05, 1.42, 0, 0.11, 0.54, 0.47, M.rubber, forklift);
  for (const z of [-0.5, 0.5])
    for (const x of [-0.52, 0.51])
      C(x, 0.23, z, 0.23, 0.16, M.rubber, forklift, "z");
  for (const z of [-0.49, 0.49]) {
    B(0.6, 1.45, z, 0.075, 2.4, 0.075, M.dark, forklift);
    B(-0.47, 1.57, z, 0.045, 1.8, 0.055, M.dark, forklift);
  }
  B(0, 2.51, 0, 1.65, 0.075, 1.3, M.dark, forklift);
  for (let x = -0.65; x < 0.8; x += 0.23)
    B(x, 2.52, 0, 0.04, 0.05, 1.21, M.yellow, forklift);
  const forks = new THREE.Group();
  forklift.add(forks);
  for (const z of [-0.24, 0.24]) {
    B(0.85, 0.2, z, 0.07, 0.67, 0.075, M.steel, forks);
    B(1.26, 0.02, z, 0.88, 0.065, 0.12, M.steel, forks);
  }
  const carried = pallet(forks);
  carried.position.set(1.32, 0.06, 0);
  const waiting = pallet(group);
  waiting.position.set(28.52, 1.38, 0);
  // Worker provides scale and a visible operator, without a detailed character rig.
  B(0.12, 1.45, 0, 0.31, 0.53, 0.4, P.teal, forklift);
  const head = mesh(globe, material("#b99072"), 0.1, 1.91, 0, forklift);
  head.scale.setScalar(0.16);
  C(0.1, 2.03, 0, 0.18, 0.08, M.yellow, forklift);
  B(0.25, 1.39, 0, 0.4, 0.075, 0.37, P.teal, forklift);
  // Turning envelopes stay inside the cleared aprons, separate from the
  // building, walkway and posts. Straight segments share their arc tangents.
  const STAGING_X = 54;
  const arrival = path(
    roadLine([82, 13.4], [51.5, 13.4]),
    arc([51.5, 6.7], 6.7, Math.PI / 2, Math.PI * 1.5),
    roadLine([51.5, 0], [STAGING_X, 0]),
  );
  const shift = laneShift(STAGING_X, 10.6, 1, 8);
  const exit = path(shift, roadLine([shift.endX, 10.6], [82, 10.6]));
  const rawArrival = path(
    roadLine([-62, 10.6], [-26.5, 10.6]),
    arc([-26.5, 5.3], 5.3, Math.PI / 2, -Math.PI / 2),
    roadLine([-26.5, 0], [-29, 0]),
  );
  const rawShift = laneShift(-29, 13.4, -1, 8);
  const rawExit = path(rawShift, roadLine([rawShift.endX, 13.4], [-62, 13.4]));
  const point = new THREE.Vector3(),
    tangent = new THREE.Vector3();
  function along(v, route, u) {
    const curvature = route.pose(u, point, tangent);
    v.g.position.copy(point);
    v.g.rotation.y = -Math.atan2(tangent.z, tangent.x);
    v.curvature = curvature;
  }
  const travel = new THREE.Vector3();
  function roll(v, phase) {
    if (
      v.previousTime !== null &&
      phase >= v.previousTime &&
      phase - v.previousTime < 1
    ) {
      travel.copy(v.g.position).sub(v.previousPosition);
      const signedDistance =
        travel.x * Math.cos(v.g.rotation.y) -
        travel.z * Math.sin(v.g.rotation.y);
      v.wheelAngle -= signedDistance / 0.54;
    }
    const delta =
      v.previousTime === null || phase < v.previousTime
        ? 0.1
        : Math.min(0.1, (phase - v.previousTime) * 1.5);
    const blend = 1 - Math.exp(-delta * 10);
    v.steer.forEach((hub) => {
      const radius = v.curvature === 0 ? Infinity : Math.abs(1 / v.curvature);
      const innerRadius = radius - Math.sign(v.curvature) * hub.position.z;
      const angle = -Math.sign(v.curvature) * Math.atan(5.2 / innerRadius);
      hub.rotation.y += (angle - hub.rotation.y) * blend;
    });
    v.wheels.forEach((o) => {
      o.rotation.z = v.wheelAngle;
    });
    v.previousPosition.copy(v.g.position);
    v.previousTime = phase;
  }
  function signals(v, time, reversing) {
    const flashing = (time * 2) % 1 < 0.5;
    for (const { o, side } of v.turnIndicators)
      o.material =
        flashing && (reversing || Math.sign(v.curvature) === side)
          ? amberLamp
          : M.yellow;
    for (const o of v.reverseLights)
      o.material = reversing ? reverseLamp : P.white;
  }
  const unloading = new THREE.InstancedMesh(truckPotatoG, M.potato, 96);
  unloading.name = "potatoes unloading onto the receiving elevator";
  unloading.castShadow = unloading.receiveShadow = true;
  unloading.frustumCulled = false;
  group.add(unloading);
  const cropDummy = new THREE.Object3D(),
    cropStart = new THREE.Vector3();
  const ramStart = new THREE.Vector3(),
    ramEnd = new THREE.Vector3(),
    ramDirection = new THREE.Vector3();
  const vertical = new THREE.Vector3(0, 1, 0);
  function hydraulic(o, a, b, radius) {
    ramDirection.copy(b).sub(a);
    o.position.copy(a).add(b).multiplyScalar(0.5);
    o.scale.set(radius, ramDirection.length(), radius);
    o.quaternion.setFromUnitVectors(vertical, ramDirection.normalize());
  }
  // Rigid vehicle assemblies are material batches; only their true moving
  // joints stay separate. The larger scene retains the prior frame budget.
  batchRigidParts(roof);
  batchRigidParts(truck.g, [
    ...truck.wheels,
    ...truck.steer,
    ...truck.doors.map((d) => d.o),
    ...truck.rearLights,
    ...truck.turnIndicators.map(({ o }) => o),
    ...truck.reverseLights,
    ...loads,
  ]);
  batchRigidParts(raw.g, [
    raw.body,
    ...raw.wheels,
    ...raw.steer,
    ...raw.rearLights,
    ...raw.turnIndicators.map(({ o }) => o),
    ...raw.reverseLights,
    ...raw.hydraulics,
  ]);
  batchRigidParts(raw.body, [raw.tailgate, raw.potatoLoad]);
  batchRigidParts(raw.tailgate);
  batchRigidParts(raw.potatoLoad);
  for (const v of [truck, raw]) {
    v.wheels.forEach((w) => batchRigidParts(w));
    v.steer.forEach((h) => batchRigidParts(h, v.wheels));
    v.doors.forEach((d) => {
      batchRigidParts(d.o, [d.latch]);
      batchRigidParts(d.latch);
    });
  }
  batchRigidParts(forklift, [forks]);
  batchRigidParts(forks, [carried]);
  [carried, waiting, ...loads].forEach((p) => batchRigidParts(p));
  const dynamic = [
    roof,
    bridge,
    restraint,
    gate,
    truck.g,
    raw.g,
    forklift,
    waiting,
    redSignal,
    greenSignal,
    unloading,
  ];
  return {
    group,
    dynamic,
    update(time, journey = 0) {
      const s = logisticsAt(time),
        t = s.time;
      // Architectural cutaway keeps equipment unobstructed during close views.
      roof.visible = journey < 0.35 || journey > 5.4;
      truck.curvature = 0;
      if (t < 10) along(truck, arrival, s.arrival);
      else if (t < 12) {
        truck.g.position.set(STAGING_X, 0, 0);
        truck.g.rotation.y = 0;
        truck.steer.forEach((o) => {
          o.rotation.y = 0;
        });
      } else if (t < 18) {
        truck.g.position.set(STAGING_X + (38.92 - STAGING_X) * s.reverse, 0, 0);
        truck.g.rotation.y = 0;
        truck.steer.forEach((o) => (o.rotation.y = 0));
      } else if (!s.readyToDepart) {
        truck.g.position.set(38.92, 0, 0);
        truck.g.rotation.y = 0;
      } else if (t < 56) {
        truck.g.position.set(38.92 + (STAGING_X - 38.92) * s.departure, 0, 0);
        truck.g.rotation.y = 0;
      } else along(truck, exit, s.exit);
      roll(truck, t);
      signals(truck, time, t >= 12 && t < 18);
      truck.g.visible = s.visible;
      truck.doors.forEach(({ o, side, latch }, i) => {
        // Positive rotation of the near hinge swings the leaf behind the
        // truck. Two staggered leaves open outside to a full 180 degrees.
        o.rotation.y = side * s.doorOpen[i] * Math.PI;
        latch.rotation.x = -side * s.unlocked * Math.PI * 0.38;
      });
      truck.rearLights.forEach(
        (o) => (o.material = s.brake ? brakeLamp : M.red),
      );
      loads.forEach((p, i) => (p.visible = s.cargo[i]));
      bridge.rotation.z = -(1 - s.bridge) * 0.65;
      restraint.rotation.x = s.secured ? 0 : Math.PI / 2;
      redSignal.visible = s.secured;
      greenSignal.visible = !s.secured;
      gate.rotation.x =
        (Math.PI / 2) *
        (1 - smooth((Math.min(Math.abs(t - 5), Math.abs(t - 59)) - 3) / 3));
      // Two cargo transfers: forks support the pallet until it is lowered.
      const transfer = t >= 36 ? 1 : 0,
        start = transfer ? 36 : 22;
      const p = Math.min(1, Math.max(0, (t - start) / 12));
      const sourceX = 27.2,
        destinationX = transfer ? 36.0 : 38.8;
      let x = sourceX;
      if (p >= 0.15 && p < 0.58)
        x = sourceX + (destinationX - sourceX) * smooth((p - 0.15) / 0.43);
      else if (p >= 0.58 && p < 0.68) x = destinationX;
      else if (p >= 0.68)
        x = destinationX + (sourceX - destinationX) * smooth((p - 0.68) / 0.32);
      forklift.position.set(x, 1.32, 0);
      forklift.rotation.y = 0;
      forks.position.y =
        0.13 * smooth(p / 0.15) * (1 - smooth((p - 0.58) / 0.08));
      carried.visible = s.loading && p >= 0.1 && p < 0.645;
      waiting.visible = t < 23.2 || (t >= 34 && t < 37.2) || t >= 50;
      const rawTime = (t + 32) % LOGISTICS_PHASE_SECONDS;
      raw.curvature = 0;
      if (rawTime < 12) along(raw, rawArrival, smooth(rawTime / 12));
      else if (rawTime < 18) {
        raw.g.position.set(-29 + 8 * smooth((rawTime - 12) / 6), 0, 0);
        raw.g.rotation.y = Math.PI;
        raw.steer.forEach((o) => {
          o.rotation.y = 0;
        });
      } else if (rawTime < 46) {
        raw.g.position.set(-21, 0, 0);
        raw.g.rotation.y = Math.PI;
        raw.steer.forEach((o) => {
          o.rotation.y = 0;
        });
      } else if (rawTime < 50) {
        raw.g.position.set(-21 - 8 * smooth((rawTime - 46) / 4), 0, 0);
        raw.g.rotation.y = Math.PI;
      } else along(raw, rawExit, smooth((rawTime - 50) / 14));
      roll(raw, rawTime);
      signals(raw, time, rawTime >= 12 && rawTime < 18);
      raw.g.visible = rawTime > 0.4 && rawTime < 63.6;
      raw.rearLights.forEach((o) => {
        o.material = rawTime >= 16.5 && rawTime < 18.5 ? brakeLamp : M.red;
      });
      const tip =
        0.36 * smooth((rawTime - 18) / 4) * (1 - smooth((rawTime - 40) / 4));
      const emptied = smooth((rawTime - 22) / 18);
      raw.body.rotation.z = tip;
      raw.tailgate.rotation.z =
        -0.7 * smooth((rawTime - 20) / 2) * (1 - smooth((rawTime - 42) / 2));
      raw.potatoLoad.position.y = raw.cargoBaseY - emptied * 0.55;
      for (let side = 0; side < 2; side++) {
        const z = side ? 0.42 : -0.42;
        ramStart.set(-1.45, 0.91, z);
        ramEnd
          .set(4.6, 0.07, z)
          .applyQuaternion(raw.body.quaternion)
          .add(raw.body.position);
        point.copy(ramStart).lerp(ramEnd, 0.55);
        hydraulic(raw.hydraulics[side * 2], ramStart, point, 0.105);
        hydraulic(raw.hydraulics[side * 2 + 1], point, ramEnd, 0.065);
      }
      unloading.visible = raw.g.visible && rawTime >= 22 && rawTime < 40;
      if (unloading.visible) {
        raw.g.updateWorldMatrix(true, true);
        cropStart.set(-0.04, 0.57, 0).applyMatrix4(raw.body.matrixWorld);
        for (let i = 0; i < 96; i++) {
          const u = ((rawTime - 22) / 3 + i / 96) % 1;
          const lane = Math.sin(i * 2.39) * 0.44;
          if (u < 0.16) {
            const q = u / 0.16;
            cropDummy.position.set(
              cropStart.x + (-17.53 - cropStart.x) * q,
              cropStart.y + (1.52 - cropStart.y) * q * q,
              lane,
            );
          } else {
            const q = (u - 0.16) / 0.84;
            cropDummy.position.set(-17.53 + q * 3.28, 1.52 + q * 0.68, lane);
          }
          cropDummy.rotation.set(i * 0.73, i * 2.39 + u * 1.7, i * 0.31);
          cropDummy.scale.set(0.073, 0.058, 0.065);
          cropDummy.updateMatrix();
          unloading.setMatrixAt(i, cropDummy.matrix);
        }
        unloading.instanceMatrix.needsUpdate = true;
      }
      s.position = [truck.g.position.x, 2.3, truck.g.position.z];
      return s;
    },
  };
}

// The overview tours the whole campus; the scroll chapters retain direct camera
// control. Position and velocity settle at the same aerial view at the loop seam.
export function droneCamera(time) {
  const t = campusPhase(time);
  const keys = [
    [0, [12.5, 1.8, 1], 100, 0.57, 0.73],
    [9, [-13, 1.8, 0], 37, 0.64, 0.62],
    [18, [-2.5, 1.9, 0], 28, 0.57, 0.56],
    [27, [6, 2.1, 0], 31, 0.61, 0.54],
    [36, [15, 2.1, 0], 34, 0.48, 0.55],
    [46, [31, 2.1, 0], 32, 0.65, 0.55],
    [55, [41, 1.7, 3], 39, 0.6, 0.57],
    [64, [12.5, 1.8, 1], 100, 0.57, 0.73],
  ];
  let i = 0;
  while (i < keys.length - 2 && t > keys[i + 1][0]) i++;
  const a = keys[i],
    b = keys[i + 1],
    u = smooth((t - a[0]) / (b[0] - a[0]));
  const lerp = (x, y) => x + (y - x) * u;
  return {
    target: a[1].map((v, j) => lerp(v, b[1][j])),
    radius: lerp(a[2], b[2]),
    yaw: lerp(a[3], b[3]),
    elev: lerp(a[4], b[4]),
  };
}

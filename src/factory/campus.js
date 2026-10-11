import * as THREE from "three";
import { CAMPUS_SECONDS, logisticsAt, smooth } from "./timing.js";
import { batchRigidParts } from "./batching.js";

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
      color: "#364e5a",
      roughness: 0.2,
      transparent: true,
      opacity: 0.58,
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
    m.roughnessMap = textures.metal;
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
  B(10, -0.19, 2, 86, 0.32, 38, P.soil);
  B(10, -0.015, 12, 126, 0.06, 7, P.road);
  B(43, -0.005, 3, 23, 0.07, 17, P.road);
  B(-23, -0.005, 3, 14, 0.07, 17, P.road);
  for (const z of [8.6, 15.4]) line(-43, 73, z, 0.07);
  for (let x = -43; x < 74; x += 3.8) line(x, x + 1.8, 12, 0.08);
  for (const z of [-16.4, 20.4]) B(10, 0.36, z, 85, 0.8, 0.2, P.wall);
  for (const x of [-32.5, 52.7]) {
    B(x, 0.36, -5.7, 0.2, 0.8, 20.4, P.wall);
    B(x, 0.36, 18.5, 0.2, 0.8, 3.8, P.wall);
  }
  for (let x = -31; x < 53; x += 2.8) {
    for (const z of [-16.4, 20.4]) {
      B(x, 1.25, z, 0.065, 1.3, 0.065, P.teal);
      B(x + 1.35, 1.75, z, 2.7, 0.035, 0.035, P.teal);
      B(x + 1.35, 1.12, z, 2.7, 0.025, 0.025, P.teal);
    }
  }
  // Pedestrian walkway is physically separate from the wet production floor.
  B(4, 0.12, 6.15, 62, 0.25, 2.5, P.concrete);
  for (const z of [4.8, 7.4]) B(4, 0.18, z, 62, 0.34, 0.12, P.curb);
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

  // Guardhouse and opening gate, set back from the truck's turning envelope.
  B(49.0, 1.25, 5.35, 2.8, 2.5, 2.25, P.wall);
  B(49.0, 2.59, 5.35, 3.1, 0.16, 2.55, P.teal);
  B(49.0, 1.6, 6.5, 1.9, 0.95, 0.015, M.glass);
  B(50.42, 1.6, 5.35, 0.015, 0.95, 1.35, M.glass);
  sign("CRISP", "FACTORY GATE / DISPATCH", 49.0, 2.16, 6.52, 2.15, 0.3);
  const gate = new THREE.Group();
  gate.position.set(52.8, 0.9, 8.6);
  group.add(gate);
  B(0, 0.22, 2.4, 0.08, 0.09, 4.8, P.white, gate);
  for (let z = 0.25; z < 4.8; z += 0.6)
    B(0, 0.22, z, 0.09, 0.095, 0.25, M.red, gate);
  B(52.8, 0.8, 8.6, 0.4, 1.6, 0.4, M.yellow);
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
  for (const x of [-25, 16, 44]) {
    C(x, 2.7, 7.1, 0.055, 5.4, P.teal);
    B(x, 5.42, 7.5, 0.35, 0.1, 0.85, P.roof);
    B(x, 5.36, 7.55, 0.29, 0.035, 0.65, P.lamp);
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
  // Cab-over 4x2 rigid box truck: rear dual tyres, separate chassis and body.
  function vehicle(tipper = false) {
    const g = new THREE.Group();
    group.add(g);
    const wheels = [],
      steer = [];
    B(0.2, 0.75, 0, 8.15, 0.19, 0.9, M.dark, g);
    for (const z of [-0.51, 0.51]) B(0.0, 0.79, z, 8.1, 0.15, 0.1, M.dark, g);
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
        C(0, 0, side * 0.155, 0.31, 0.032, M.steel, wheel, "z");
        C(0, 0, side * 0.18, 0.12, 0.05, M.dark, wheel, "z");
        for (let k = 0; k < 8; k++)
          C(
            Math.cos((k * Math.PI) / 4) * 0.23,
            Math.sin((k * Math.PI) / 4) * 0.23,
            side * 0.18,
            0.026,
            0.025,
            M.chrome,
            wheel,
            "z",
          );
        if (x < 0) C(0, 0, -side * 0.3, 0.54, 0.26, M.rubber, wheel, "z");
        B(0, 0.56, 0, 1.18, 0.09, 0.56, P.teal, hub);
      }
      for (const z of [-0.7, 0.7])
        for (let i = 0; i < 4; i++)
          B(x, 0.72 + i * 0.033, z, 1.3 - i * 0.15, 0.026, 0.11, M.dark, g);
    }
    B(3.0, 1.78, 0, 1.95, 2.2, 2.58, P.white, g);
    B(3.17, 3.0, 0, 1.86, 0.2, 2.62, P.teal, g);
    B(4.0, 2.32, 0, 0.022, 0.97, 2.26, P.vehicleGlass, g).rotation.z = -0.08;
    B(4.0, 1.52, 0, 0.045, 0.49, 1.88, M.dark, g);
    B(3.55, 1.93, 0, 0.42, 0.12, 2.22, M.dark, g);
    for (const z of [-0.6, 0.6]) {
      B(2.98, 1.65, z, 0.53, 0.17, 0.54, M.rubber, g);
      B(2.7, 1.96, z, 0.13, 0.57, 0.5, M.rubber, g);
    }
    // Right-hand cab position, matching the Pakistani delivery setting.
    B(3.02, 1.98, -0.6, 0.31, 0.5, 0.36, P.teal, g);
    const driver = mesh(globe, material("#ac8669"), 3.05, 2.31, -0.6, g);
    driver.scale.setScalar(0.14);
    for (let y = 1.36; y < 1.77; y += 0.075)
      B(4.032, y, 0, 0.045, 0.022, 1.76, M.steel, g);
    B(4.08, 0.92, 0, 0.16, 0.23, 2.7, M.dark, g);
    for (const side of [-1, 1]) {
      B(3.08, 2.32, side * 1.3, 1.18, 0.84, 0.016, P.vehicleGlass, g);
      B(3.4, 1.71, side * 1.31, 0.31, 0.06, 0.035, M.dark, g);
      B(2.65, 0.8, side * 1.31, 0.75, 0.12, 0.26, M.steel, g);
      pipe(
        [
          [3.69, 2.38, side * 1.3],
          [3.85, 2.45, side * 1.59],
          [3.65, 2.45, side * 1.75],
        ],
        0.035,
        M.dark,
        g,
      );
      B(3.62, 2.43, side * 1.76, 0.17, 0.38, 0.09, M.dark, g);
      B(3.72, 2.43, side * 1.76, 0.014, 0.29, 0.075, M.chrome, g);
      B(4.03, 1.1, side * 0.98, 0.04, 0.18, 0.35, P.lamp, g);
      B(4.035, 1.35, side * 1.1, 0.04, 0.09, 0.17, M.yellow, g);
      B(-0.3, 0.66, side * 1.18, 2.8, 0.09, 0.08, M.steel, g);
    }
    C(0.9, 0.72, -0.75, 0.34, 1.2, M.steel, g, "x");
    C(1.75, 0.69, -0.7, 0.08, 1.45, M.dark, g, "x");
    B(4.17, 0.98, 0, 0.012, 0.12, 0.43, P.white, g);
    const body = new THREE.Group();
    g.add(body);
    B(-0.55, 1.3, 0, 6.2, 0.14, 2.66, M.steel, body);
    const doors = [];
    if (!tipper) {
      for (const side of [-1, 1]) {
        B(-0.55, 2.88, side * 1.34, 6.2, 3.0, 0.055, P.white, body);
        B(-0.55, 1.55, side * 1.38, 6.2, 0.25, 0.035, P.teal, body);
        for (let x = -3.55; x < 2.6; x += 0.75)
          B(x, 2.88, side * 1.378, 0.027, 2.88, 0.017, M.steel, body);
        sign(
          "crisp",
          "CRAFTED FOR THE CRUNCH / ACROSS PAKISTAN",
          -0.55,
          2.88,
          side * 1.392,
          4.6,
          1.45,
          side < 0 ? Math.PI : 0,
          body,
        );
      }
      B(-0.55, 4.43, 0, 6.25, 0.1, 2.75, P.white, body);
      B(2.54, 2.88, 0, 0.055, 3, 2.65, P.white, body);
      for (const side of [-1, 1]) {
        const door = new THREE.Group();
        door.position.set(-3.66, 1.37, side * 1.32);
        body.add(door);
        B(0, 1.5, -side * 0.655, 0.065, 2.98, 1.31, P.white, door);
        C(-0.052, 1.5, -side * 0.81, 0.021, 2.48, M.chrome, door);
        for (const y of [0.3, 1.5, 2.7])
          B(-0.055, y, 0, 0.07, 0.09, 0.19, M.steel, door);
        B(-0.067, 1.2, -side * 0.95, 0.06, 0.055, 0.27, M.dark, door);
        doors.push({ o: door, side });
      }
    } else {
      for (const side of [-1, 1])
        B(-0.55, 2.08, side * 1.34, 6.2, 1.45, 0.09, P.teal, body);
      B(-3.66, 2.08, 0, 0.1, 1.45, 2.65, P.teal, body);
      for (let i = 0; i < 70; i++) {
        const p = mesh(
          potatoG,
          M.potato,
          -3.2 + (i % 10) * 0.57,
          1.58 + Math.sin(i * 8) * 0.08,
          Math.floor(i / 10) * 0.32 - 1.0,
          body,
        );
        p.scale.set(0.065, 0.05, 0.055);
      }
    }
    if (tipper) {
      const hinge = new THREE.Vector3(-3.66, 1.3, 0);
      body.children.forEach((o) => o.position.sub(hinge));
      body.position.copy(hinge);
    }
    const rearLights = [];
    for (const side of [-1, 1]) {
      const l = B(-3.77, 0.86, side * 1.01, 0.08, 0.13, 0.27, M.red, g);
      rearLights.push(l);
      B(-3.77, 0.86, side * 1.2, 0.08, 0.13, 0.11, M.yellow, g);
      B(-2.98, 0.28, side * 1.1, 0.035, 0.51, 0.34, M.rubber, g);
    }
    B(-3.75, 0.46, 0, 0.15, 0.13, 2.45, M.steel, g);
    return { g, body, wheels, steer, doors, rearLights };
  }
  const truck = vehicle();
  const loads = [pallet(truck.g), pallet(truck.g)];
  loads[0].position.set(1.2, 1.38, 0);
  loads[1].position.set(-1.6, 1.38, 0);
  const raw = vehicle(true);
  raw.g.rotation.y = Math.PI;
  raw.g.position.set(-21, 0, 0);
  // Solid receiving ramp bridges the raw truck to the metered intake hopper.
  const receivingRamp = B(-16.0, 1.67, 0, 3.2, 0.1, 1.15, M.steel);
  receivingRamp.rotation.z = 0.13;
  for (const z of [-0.57, 0.57])
    B(-16, 1.79, z, 3.25, 0.2, 0.05, M.blue).rotation.z = 0.13;
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
  const arrival = new THREE.CatmullRomCurve3(
    [
      [69, 10.6],
      [57, 10.6],
      [49, 10.8],
      [43.4, 7],
      [43.8, 4],
      [46.3, 0.4],
      [48.1, 0],
    ].map(([x, z]) => new THREE.Vector3(x, 0, z)),
  );
  const exit = new THREE.CatmullRomCurve3(
    [
      [48.1, 0],
      [49.3, 4.4],
      [51, 9.3],
      [55, 13.4],
      [69, 13.4],
    ].map(([x, z]) => new THREE.Vector3(x, 0, z)),
  );
  const rawArrival = new THREE.CatmullRomCurve3(
    [
      [-39, 13.4],
      [-30, 13.4],
      [-24.5, 8],
      [-22, 3],
      [-21, 0],
    ].map(([x, z]) => new THREE.Vector3(x, 0, z)),
  );
  const rawExit = new THREE.CatmullRomCurve3(
    [
      [-21, 0],
      [-26, 0],
      [-28, 6],
      [-32, 10.6],
      [-39, 10.6],
    ].map(([x, z]) => new THREE.Vector3(x, 0, z)),
  );
  const point = new THREE.Vector3(),
    tangent = new THREE.Vector3();
  function along(v, curve, u, time) {
    curve.getPoint(Math.min(1, Math.max(0, u)), point);
    v.g.position.copy(point);
    curve.getTangent(Math.min(0.999, Math.max(0.001, u)), tangent);
    v.g.rotation.y = -Math.atan2(tangent.z, tangent.x);
    curve.getTangent(Math.min(0.999, u + 0.03), point);
    const bend =
      Math.atan2(point.z, point.x) - Math.atan2(tangent.z, tangent.x);
    v.steer.forEach(
      (o) => (o.rotation.y = -Math.max(-0.38, Math.min(0.38, bend * 3))),
    );
    v.wheels.forEach((o) => (o.rotation.z = -time * 3.2));
  }
  // Rigid vehicle assemblies are material batches; only their true moving
  // joints stay separate. The larger scene retains the prior frame budget.
  batchRigidParts(roof);
  batchRigidParts(truck.g, [
    ...truck.wheels,
    ...truck.steer,
    ...truck.doors.map((d) => d.o),
    ...truck.rearLights,
    ...loads,
  ]);
  batchRigidParts(raw.g, [
    raw.body,
    ...raw.wheels,
    ...raw.steer,
    ...raw.rearLights,
  ]);
  batchRigidParts(raw.body);
  for (const v of [truck, raw]) {
    v.wheels.forEach((w) => batchRigidParts(w));
    v.steer.forEach((h) => batchRigidParts(h, v.wheels));
    v.doors.forEach((d) => batchRigidParts(d.o));
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
  ];
  let truckWheelAngle = 0,
    previousTime = null,
    previousTruckPosition = new THREE.Vector3();
  return {
    group,
    dynamic,
    update(time, journey = 0) {
      const s = logisticsAt(time),
        t = s.time;
      // Architectural cutaway keeps equipment unobstructed during close views.
      roof.visible = journey < 0.35 || journey > 5.4;
      if (t < 12) along(truck, arrival, s.arrival, t);
      else if (t < 18) {
        truck.g.position.set(48.1 + (38.92 - 48.1) * s.reverse, 0, 0);
        truck.g.rotation.y = 0;
        truck.steer.forEach((o) => (o.rotation.y = 0));
      } else if (t < 52) {
        truck.g.position.set(38.92, 0, 0);
        truck.g.rotation.y = 0;
      } else if (t < 56) {
        truck.g.position.set(38.92 + (48.1 - 38.92) * s.departure, 0, 0);
        truck.g.rotation.y = 0;
      } else along(truck, exit, s.exit, t);
      if (previousTime !== null && t >= previousTime && t - previousTime < 1) {
        const distance = truck.g.position.distanceTo(previousTruckPosition);
        truckWheelAngle += ((t >= 12 && t < 18 ? 1 : -1) * distance) / 0.54;
      }
      truck.wheels.forEach((o) => (o.rotation.z = truckWheelAngle));
      previousTruckPosition.copy(truck.g.position);
      previousTime = t;
      truck.g.visible = s.visible;
      truck.doors.forEach(
        ({ o, side }) => (o.rotation.y = -side * s.doors * Math.PI * 0.54),
      );
      truck.rearLights.forEach((o) => (o.material = s.brake ? P.lamp : M.red));
      loads.forEach((p, i) => (p.visible = s.cargo[i]));
      bridge.rotation.z = -(1 - s.bridge) * 0.65;
      restraint.rotation.x = s.secured ? 0 : Math.PI / 2;
      redSignal.visible = s.secured;
      greenSignal.visible = !s.secured;
      gate.rotation.x =
        (-Math.PI / 2) *
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
      const rawTime = (t + 32) % CAMPUS_SECONDS;
      if (rawTime < 12) along(raw, rawArrival, smooth(rawTime / 12), rawTime);
      else if (rawTime < 46) {
        raw.g.position.set(-21, 0, 0);
        raw.g.rotation.y = Math.PI;
        raw.steer.forEach((o) => (o.rotation.y = 0));
      } else along(raw, rawExit, smooth((rawTime - 46) / 18), rawTime);
      raw.g.visible = rawTime > 0.4 && rawTime < 63.6;
      raw.body.rotation.z =
        rawTime >= 14 && rawTime < 42
          ? 0.16 * smooth((rawTime - 14) / 4) * (1 - smooth((rawTime - 38) / 4))
          : 0;
      s.position = [truck.g.position.x, 2.3, truck.g.position.z];
      return s;
    },
  };
}

// The overview tours the whole campus; the scroll chapters retain direct camera
// control. Position and velocity settle at the same aerial view at the loop seam.
export function droneCamera(time) {
  const t = ((time % CAMPUS_SECONDS) + CAMPUS_SECONDS) % CAMPUS_SECONDS;
  const keys = [
    [0, [10, 1.8, 1], 83, 0.57, 0.73],
    [9, [-13, 1.8, 0], 37, 0.64, 0.62],
    [18, [-2.5, 1.9, 0], 28, 0.57, 0.56],
    [27, [6, 2.1, 0], 31, 0.61, 0.54],
    [36, [15, 2.1, 0], 34, 0.48, 0.55],
    [46, [31, 2.1, 0], 32, 0.65, 0.55],
    [55, [41, 1.7, 3], 39, 0.6, 0.57],
    [64, [10, 1.8, 1], 83, 0.57, 0.73],
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

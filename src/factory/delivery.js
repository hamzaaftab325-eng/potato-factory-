import * as THREE from "three";
import { deliveryMotion } from "./timing.js";

// A rigid-body delivery truck, loading dock and road. Built from the same
// bevelled geometry and materials as the factory; no remote model is required.
export function addDeliveryScene({
  scene,
  M,
  box,
  mesh,
  cylinder,
  pipe,
  textures,
}) {
  const group = new THREE.Group();
  group.name = "Pakistan delivery / loading dock";
  group.visible = false;
  scene.add(group);
  const paint = new THREE.MeshPhysicalMaterial({
    color: "#f2ecdc",
    roughness: 0.3,
    metalness: 0.18,
    clearcoat: 0.6,
  });
  const teal = new THREE.MeshPhysicalMaterial({
    color: "#16464a",
    roughness: 0.28,
    metalness: 0.25,
    clearcoat: 0.7,
  });
  const glass = new THREE.MeshPhysicalMaterial({
    color: "#12323c",
    roughness: 0.13,
    metalness: 0.38,
    clearcoat: 1,
  });
  const asphalt = new THREE.MeshStandardMaterial({
    color: "#203437",
    roughness: 0.98,
    bumpMap: textures.paper,
    bumpScale: 0.025,
  });
  const concrete = new THREE.MeshStandardMaterial({
    color: "#6d7e79",
    roughness: 0.9,
    bumpMap: textures.paper,
    bumpScale: 0.02,
  });
  const kraft = new THREE.MeshStandardMaterial({
    color: "#ffffff",
    map: textures.paper,
    roughness: 0.85,
  });
  const lamp = new THREE.MeshStandardMaterial({
    color: "#fff0cc",
    emissive: "#fff0cc",
    emissiveIntensity: 0.7,
    roughness: 0.22,
  });
  const label = (lines, background, ink, w = 1024, h = 512) => {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const g = c.getContext("2d");
    g.fillStyle = background;
    g.fillRect(0, 0, w, h);
    g.fillStyle = ink;
    for (const { text, y, size, font = "DM Sans", italic = false } of lines) {
      g.font = `${italic ? "italic " : ""}${size}px "${font}", serif`;
      g.textAlign = "center";
      g.fillText(text, w / 2, y);
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return new THREE.MeshStandardMaterial({
      map: t,
      roughness: 0.65,
      metalness: 0.04,
    });
  };
  const brand = label(
    [
      { text: "crisp✳", y: 247, size: 230, font: "Instrument Serif" },
      { text: "CRAFTED FOR THE CRUNCH.", y: 357, size: 31 },
      { text: "A LITTLE CRUNCH. A BIGGER JOURNEY.", y: 430, size: 19 },
    ],
    "#f2ecdc",
    "#123c40",
  );
  const cartonLabel = label(
    [
      { text: "CRISP", y: 110, size: 93, font: "Instrument Serif" },
      { text: "PACKED WITH CARE", y: 172, size: 18 },
      { text: "4 × 40 g    ↑↑", y: 219, size: 23 },
    ],
    "#bca073",
    "#26372c",
    512,
    256,
  );
  const road = box(0, -0.11, 0, 60, 0.2, 7.8, asphalt, group, 0.018);
  road.name = "Road surface";
  for (const z of [-3.35, 3.35])
    box(0, 0.008, z, 60, 0.013, 0.035, paint, group, 0.003);
  for (let x = -29; x < 30; x += 3.8)
    box(x, 0.009, 0, 1.65, 0.014, 0.035, paint, group, 0.003);
  // Dock height exactly matches the truck floor: cartons cross the bridge
  // rather than floating between disconnected surfaces.
  box(-7.0, 0.5, 0, 6.0, 1, 3.35, concrete, group, 0.06);
  box(-7, 1.035, 0, 6, 0.07, 3.35, M.steel, group, 0.015);
  box(-4.12, 0.78, 1.28, 0.12, 0.32, 0.3, M.rubber, group);
  box(-4.12, 0.78, -1.28, 0.12, 0.32, 0.3, M.rubber, group);
  box(-3.87, 1.077, 0, 0.42, 0.055, 1.6, M.steel, group, 0.008);
  for (const z of [-1.48, 1.48]) {
    for (let x = -9.7; x < -4.7; x += 1.3)
      cylinder(x, 1.45, z, 0.035, 0.83, M.yellow, group);
    pipe(
      [
        [-9.7, 1.88, z],
        [-4.6, 1.88, z],
      ],
      0.035,
      M.yellow,
      group,
    );
  }
  const dockSign = label(
    [
      { text: "CRISP / DISPATCH", y: 147, size: 73 },
      { text: "PAKISTAN  •  LOADING BAY 01", y: 222, size: 31 },
    ],
    "#10383b",
    "#e9d7ad",
    1024,
    300,
  );
  box(-9.85, 2.7, 0, 0.15, 2.45, 3.2, teal, group, 0.02);
  const ds = mesh(
    new THREE.PlaneGeometry(2.9, 0.9),
    dockSign,
    -9.75,
    3.05,
    0,
    group,
  );
  ds.rotation.y = Math.PI / 2;
  for (let i = 0; i < 9; i++)
    box(-9.74, 1.65 + i * 0.115, 0, 0.024, 0.014, 2.9, M.dark, group, 0.002);
  // A recognisable cab, glazed windows, separate chassis and three axles.
  const truck = new THREE.Group();
  truck.name = "CRISP delivery truck";
  group.add(truck);
  box(-0.5, 0.83, 0, 6.45, 0.22, 1.64, M.dark, truck, 0.035);
  box(-1.12, 1.005, 0, 4.9, 0.15, 2.06, M.steel, truck, 0.02);
  for (const z of [-1.025, 1.025]) {
    box(-1.1, 2.06, z, 4.94, 1.94, 0.075, paint, truck, 0.035);
    box(-1.1, 1.22, z * 1.025, 4.96, 0.18, 0.033, teal, truck, 0.008);
    for (const x of [-3.54, 1.34])
      box(x, 2.07, z * 1.015, 0.045, 1.97, 0.028, M.chrome, truck, 0.006);
    const art = mesh(
      new THREE.PlaneGeometry(4.48, 1.7),
      brand,
      -1.08,
      2.13,
      z * 1.043,
      truck,
    );
    if (z < 0) art.rotation.y = Math.PI;
    for (let x = -3.4; x < 1.35; x += 0.4) {
      cylinder(x, 1.18, z * 1.03, 0.012, 0.022, M.chrome, truck, "z");
      cylinder(x, 3.0, z * 1.03, 0.012, 0.022, M.chrome, truck, "z");
    }
  }
  box(-1.1, 3.064, 0, 4.96, 0.095, 2.1, paint, truck, 0.035);
  box(1.36, 2.04, 0, 0.08, 1.96, 2.1, paint, truck, 0.03);
  // Open rear cargo box with two independently hinged doors.
  const doors = [];
  for (const side of [-1, 1]) {
    const hinge = new THREE.Group();
    hinge.position.set(-3.59, 2.06, side * 1.015);
    truck.add(hinge);
    box(0, 0, -side * 0.506, 0.065, 1.9, 1.0, paint, hinge, 0.02);
    cylinder(-0.048, 0, -side * 0.47, 0.018, 1.68, M.chrome, hinge);
    box(-0.075, -0.16, -side * 0.45, 0.04, 0.05, 0.2, M.chrome, hinge, 0.009);
    for (const y of [-0.7, 0, 0.7])
      box(0, y, 0, 0.09, 0.055, 0.1, M.chrome, hinge, 0.008);
    doors.push({ hinge, side });
  }
  const shape = new THREE.Shape();
  shape.moveTo(1.49, 1.06);
  shape.lineTo(3.34, 1.06);
  shape.lineTo(3.44, 1.88);
  shape.lineTo(3.0, 2.73);
  shape.quadraticCurveTo(2.92, 2.9, 2.71, 2.9);
  shape.lineTo(1.5, 2.9);
  shape.closePath();
  const cabGeo = new THREE.ExtrudeGeometry(shape, {
    depth: 1.86,
    bevelEnabled: true,
    bevelSize: 0.085,
    bevelThickness: 0.08,
    bevelSegments: 4,
    steps: 1,
  });
  cabGeo.translate(0, 0, -0.93);
  mesh(cabGeo, teal, 0, 0, 0, truck);
  const sideWindow = new THREE.Shape();
  sideWindow.moveTo(1.67, 2.72);
  sideWindow.lineTo(2.85, 2.72);
  sideWindow.lineTo(3.21, 2.02);
  sideWindow.lineTo(1.67, 2.02);
  sideWindow.closePath();
  for (const side of [-1, 1]) {
    const w = mesh(
      new THREE.ShapeGeometry(sideWindow),
      glass,
      0,
      0,
      side * 1.025,
      truck,
    );
    w.material = glass;
    w.material.side = THREE.DoubleSide;
    box(1.9, 1.88, side * 1.038, 0.29, 0.045, 0.027, M.chrome, truck, 0.009);
    box(2.04, 1.48, side * 1.03, 0.72, 0.022, 0.03, paint, truck, 0.005);
    box(1.89, 1.015, side * 1.05, 0.68, 0.08, 0.22, M.steel, truck, 0.009);
    pipe(
      [
        [3.04, 2.25, side * 1.03],
        [3.09, 2.25, side * 1.26],
        [3.09, 2.53, side * 1.26],
      ],
      0.025,
      M.dark,
      truck,
    );
    box(3.09, 2.5, side * 1.26, 0.09, 0.29, 0.16, M.dark, truck, 0.035);
    box(3.041, 2.5, side * 1.26, 0.013, 0.245, 0.12, M.chrome, truck, 0.015);
    box(3.44, 1.31, side * 0.71, 0.035, 0.17, 0.38, lamp, truck, 0.025);
    cylinder(2.95, 2.97, side * 0.6, 0.05, 0.035, M.yellow, truck);
  }
  const windshield = mesh(
    new THREE.PlaneGeometry(1.68, 0.75),
    glass,
    3.18,
    2.4,
    0,
    truck,
  );
  windshield.rotation.set(0, Math.PI / 2, -0.46);
  box(3.48, 1.05, 0, 0.15, 0.17, 2.06, M.steel, truck, 0.045);
  box(3.48, 1.57, 0, 0.025, 0.32, 1.17, M.dark, truck, 0.025);
  for (let y = 1.46; y < 1.71; y += 0.052)
    box(3.495, y, 0, 0.028, 0.014, 1.11, M.chrome, truck, 0.005);
  const plate = label(
    [{ text: "CRISP · PK", y: 95, size: 67 }],
    "#e8eadb",
    "#143b3a",
    512,
    128,
  );
  const plateMesh = mesh(
    new THREE.PlaneGeometry(0.56, 0.14),
    plate,
    3.566,
    1.04,
    0,
    truck,
  );
  plateMesh.rotation.y = Math.PI / 2;
  box(-3.65, 0.84, 0, 0.16, 0.16, 2.1, M.steel, truck, 0.025);
  for (const z of [-0.85, 0.85])
    box(-3.747, 0.9, z, 0.026, 0.13, 0.21, M.red, truck, 0.02);
  const wheels = [];
  for (const x of [-2.58, -1.53, 2.37]) {
    cylinder(x, 0.48, 0, 0.1, 2.12, M.dark, truck, "z");
    for (const z of [-1.02, 1.02]) {
      const wheel = new THREE.Group();
      wheel.position.set(x, 0.48, z);
      truck.add(wheel);
      const tyre = mesh(
        new THREE.TorusGeometry(0.325, 0.125, 12, 36),
        M.rubber,
        0,
        0,
        0,
        wheel,
      );
      cylinder(0, 0, Math.sign(z) * 0.058, 0.255, 0.19, M.chrome, wheel, "z");
      cylinder(0, 0, Math.sign(z) * 0.17, 0.105, 0.075, M.dark, wheel, "z");
      for (let j = 0; j < 8; j++) {
        const a = (j * Math.PI) / 4;
        cylinder(
          Math.cos(a) * 0.17,
          Math.sin(a) * 0.17,
          Math.sign(z) * 0.174,
          0.03,
          0.025,
          M.dark,
          wheel,
          "z",
        );
      }
      for (let j = 0; j < 24; j++) {
        const a = (j * Math.PI) / 12;
        const tread = box(
          Math.cos(a) * 0.446,
          Math.sin(a) * 0.446,
          0,
          0.015,
          0.045,
          0.145,
          M.dark,
          wheel,
          0.003,
        );
        tread.rotation.z = a;
      }
      wheels.push(wheel);
      box(x, 0.94, z, 0.91, 0.05, 0.39, teal, truck, 0.018);
      box(x - 0.44, 0.71, z, 0.055, 0.43, 0.35, M.rubber, truck, 0.012);
    }
  }
  box(0.15, 0.69, 0, 1.1, 0.32, 0.98, M.steel, truck, 0.08);
  function carton(parent, x, y, z) {
    box(x, y, z, 0.78, 0.55, 0.61, kraft, parent, 0.016);
    box(x, y + 0.281, z, 0.78, 0.012, 0.074, M.copper, parent, 0.003);
    const l = mesh(
      new THREE.PlaneGeometry(0.51, 0.255),
      cartonLabel,
      x,
      y,
      z + 0.311,
      parent,
    );
    return l;
  }
  const stocked = new THREE.Group();
  truck.add(stocked);
  for (const x of [-0.84, 0.04, 0.92])
    for (const z of [-0.4, 0.31])
      for (const y of [1.52, 2.09]) carton(stocked, x, y, z);
  const cargo = new THREE.Group();
  truck.add(cargo);
  for (const x of [-2.82, -1.98])
    for (const z of [-0.4, 0.31])
      for (const y of [1.52, 2.09]) carton(cargo, x, y, z);
  // Transfer pallet travels along a covered dock track into the open rear.
  const load = new THREE.Group();
  group.add(load);
  for (const z of [-0.62, 0, 0.62])
    box(0, 1.13, z, 1.55, 0.1, 0.19, M.copper, load, 0.006);
  for (let x = -0.66; x < 0.76; x += 0.28)
    box(x, 1.21, 0, 0.22, 0.055, 1.5, M.copper, load, 0.006);
  for (const x of [-0.42, 0.42])
    for (const z of [-0.4, 0.31])
      for (const y of [1.52, 2.09]) carton(load, x, y, z);
  for (const side of [-1, 1]) {
    for (const x of [-0.58, 0.58])
      cylinder(x, 1.08, side * 0.69, 0.062, 0.13, M.dark, load, "z");
    box(0, 1.035, side * 0.68, 1.52, 0.045, 0.08, M.steel, load, 0.007);
  }
  // Roadside destination typography gives the miniature an explicit location.
  const roadSign = label(
    [
      { text: "PAKISTAN", y: 95, size: 64 },
      { text: "KARACHI   →   LAHORE", y: 164, size: 39 },
      { text: "ISLAMABAD   ↑", y: 222, size: 36 },
    ],
    "#174b3d",
    "#f1ead8",
    800,
    280,
  );
  for (const x of [6.3, 8.1])
    cylinder(x, 1.29, -3.23, 0.037, 2.55, M.steel, group);
  mesh(new THREE.PlaneGeometry(2.7, 0.94), roadSign, 7.2, 2.37, -3.18, group);
  box(7.2, 2.37, -3.22, 2.78, 1.02, 0.045, M.chrome, group, 0.035);
  const motionGroups = { truck, doors, wheels, load, cargo };
  function update(time) {
    const m = deliveryMotion(time);
    truck.position.x = m.x;
    doors.forEach(({ hinge, side }) => {
      hinge.rotation.y = -side * m.door * Math.PI * 0.78;
    });
    wheels.forEach((w) => {
      w.rotation.z = -m.wheelTurns * Math.PI * 2;
    });
    load.position.x = -6.75 + 4.35 * m.load;
    load.visible = m.loading;
    cargo.visible = m.loaded;
    stocked.visible = true;
  }
  update(0);
  return { group, update, motionGroups };
}

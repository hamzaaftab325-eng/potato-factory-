import * as THREE from "three";
import { bagPhase, smooth } from "./timing.js";

// All geometry is authored in code. Folded panels, connected services, supported
// pipes and isolated mechanisms make each machine read as an installed system.
export function addIndustrialServices({
  scene,
  M,
  box,
  cylinder,
  mesh,
  pipe,
  motor,
  textures,
}) {
  const dynamic = [],
    inspections = [];
  const doubleSteel = M.steel.clone();
  doubleSteel.side = THREE.DoubleSide;
  const meshSteel = M.steel.clone();
  meshSteel.alphaMap = textures.perforation;
  meshSteel.alphaTest = 0.45;
  meshSteel.side = THREE.DoubleSide;
  const bluePipe = new THREE.MeshStandardMaterial({
    color: "#37799b",
    metalness: 0.25,
    roughness: 0.42,
  });
  const dummy = new THREE.Object3D();

  function plate(title, sub, x, y, z, w = 0.8, h = 0.28) {
    const c = document.createElement("canvas");
    c.width = 768;
    c.height = 256;
    const a = c.getContext("2d");
    a.fillStyle = "#173b3f";
    a.fillRect(0, 0, 768, 256);
    a.fillStyle = "#dfb75f";
    a.fillRect(0, 0, 12, 256);
    a.fillStyle = "#f2eee1";
    a.font = "500 45px DM Sans";
    a.fillText(title, 34, 101);
    a.fillStyle = "#acc1bb";
    a.font = "26px DM Sans";
    a.fillText(sub, 34, 176);
    const map = new THREE.CanvasTexture(c);
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = 4;
    return mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshStandardMaterial({ map, roughness: 0.65 }),
      x,
      y,
      z,
    );
  }
  function flange(x, y, z, radius = 0.11, axis = "z") {
    cylinder(x, y, z, radius, 0.05, M.steel, scene, axis);
    cylinder(x, y, z, radius * 0.77, 0.068, M.rubber, scene, axis);
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3,
        u = Math.cos(a) * radius * 0.82,
        v = Math.sin(a) * radius * 0.82;
      cylinder(
        x + (axis === "x" ? 0.039 : u),
        y + (axis === "y" ? 0.039 : v),
        z + (axis === "z" ? 0.039 : axis === "x" ? u : v),
        0.014,
        0.024,
        M.chrome,
        scene,
        axis,
      );
    }
  }
  function valve(x, y, z) {
    cylinder(x, y - 0.09, z, 0.068, 0.22, M.steel);
    const wheel = mesh(
      new THREE.TorusGeometry(0.095, 0.012, 6, 24),
      M.red,
      x,
      y + 0.08,
      z,
    );
    wheel.rotation.x = -Math.PI / 2;
    for (let i = 0; i < 3; i++)
      box(x, y + 0.08, z, 0.18, 0.013, 0.013, M.red).rotation.y =
        (i * Math.PI) / 3;
    cylinder(x, y + 0.04, z, 0.02, 0.14, M.chrome);
  }
  function channel(a, b, z, y, width) {
    box((a + b) / 2, y, z, b - a, 0.025, width, M.steel);
    for (const side of [-1, 1])
      box(
        (a + b) / 2,
        y + 0.07,
        z + (side * width) / 2,
        b - a,
        0.14,
        0.025,
        M.steel,
      );
  }

  // A properly supported plate heat-exchanger and serviceable fine-filter skid.
  // The return line enters the fryer; the suction line returns to its filter.
  for (const z of [-3.17, -2.21]) box(-0.42, 0.69, z, 3.8, 0.11, 0.1, M.teal);
  for (const x of [-2.22, 1.38]) {
    box(x, 0.66, -2.69, 0.14, 0.16, 1.12, M.teal);
    for (const z of [-3.12, -2.26])
      cylinder(x, 0.605, z, 0.065, 0.05, M.rubber);
  }
  for (const x of [-1.94, -1.09])
    box(x, 1.38, -2.64, 0.095, 1.22, 0.69, M.fryPaint);
  for (let i = 0; i < 21; i++)
    box(-1.85 + i * 0.034, 1.39, -2.64, 0.019, 1.02, 0.62, M.steel);
  for (const y of [0.89, 1.88])
    for (const z of [-2.89, -2.39])
      cylinder(-1.52, y, z, 0.021, 1.04, M.chrome, scene, "x");
  plate(
    "HEAT EXCHANGER",
    "OIL LOOP / HX-03",
    -1.93,
    1.48,
    -2.277,
    0.095,
    0.34,
  ).rotation.y = -Math.PI / 2;
  cylinder(0.55, 1.36, -2.62, 0.24, 1.04, M.fryPaint);
  for (const y of [0.88, 1.87]) {
    cylinder(0.55, y, -2.62, 0.267, 0.06, M.chrome);
    for (let i = 0; i < 8; i++)
      cylinder(
        0.55 + Math.cos((i * Math.PI) / 4) * 0.23,
        y + 0.04,
        -2.62 + Math.sin((i * Math.PI) / 4) * 0.23,
        0.017,
        0.05,
        M.dark,
      );
  }
  pipe(
    [
      [0.47, 1.94, -2.62],
      [0.47, 2.08, -2.62],
      [0.65, 2.08, -2.62],
      [0.65, 1.94, -2.62],
    ],
    0.017,
    M.chrome,
  );
  motor(-0.31, 0.99, -2.68, "x");
  cylinder(-0.65, 0.98, -2.68, 0.19, 0.2, M.teal, scene, "x");
  pipe(
    [
      [1.25, 1.1, -1.58],
      [1.25, 1.1, -2.2],
      [0.55, 1.1, -2.38],
    ],
    0.062,
    M.steel,
  );
  pipe(
    [
      [0.55, 1.64, -2.38],
      [0.55, 1.64, -2.04],
      [-0.72, 1.64, -2.04],
      [-0.72, 0.98, -2.38],
    ],
    0.062,
    M.steel,
  );
  pipe(
    [
      [-0.72, 0.98, -2.68],
      [-1.95, 0.98, -2.68],
      [-2.34, 0.98, -2.68],
      [-2.34, 1.25, -2.04],
      [-2.2, 1.25, -1.15],
    ],
    0.062,
    M.steel,
  );
  for (const x of [-2.34, 0.98]) {
    flange(x, 1.1, -2.08);
    valve(x, 1.28, -2.08);
  }
  plate(
    "OIL CIRCULATION",
    "FILTER · PUMP · HEAT RECOVERY",
    -0.38,
    1.97,
    -2.05,
    1.8,
    0.22,
  );
  // A clear sight tube gives the system a readable flowing liquid detail.
  cylinder(0.92, 1.59, -2.07, 0.028, 0.38, M.glass);
  for (const y of [1.38, 1.8]) cylinder(0.92, y, -2.07, 0.052, 0.06, M.chrome);

  // Receiving inspection and waste paths have physically connected floor trays.
  channel(-11.42, -7.02, -0.01, 1.035, 1.49);
  pipe(
    [
      [-10.6, 1.04, -0.51],
      [-10.6, 0.77, -1.12],
      [-9.2, 0.77, -1.31],
    ],
    0.052,
    M.steel,
  );
  box(-8.55, 0.72, -1.36, 1.2, 0.13, 0.63, M.peelPaint);
  for (let x = -9.05; x < -8.05; x += 0.1)
    box(x, 0.794, -1.36, 0.025, 0.018, 0.58, M.steel);
  plate(
    "PEEL RECOVERY",
    "SCREENED WATER RETURN",
    -8.55,
    0.86,
    -1.025,
    0.77,
    0.14,
  );
  for (const x of [-11.1, -8.9, -7.18]) {
    box(x, 2.41, 0, 0.052, 0.07, 1.74, M.blue);
    for (const z of [-0.84, 0.84]) box(x, 2.21, z, 0.045, 0.38, 0.045, M.blue);
  }
  // Knife housing clamps and a locked service cover retain the enclosed form.
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    cylinder(
      -5.28 + Math.sin(a) * 0.65,
      2.6,
      Math.cos(a) * 0.65,
      0.025,
      0.075,
      M.dark,
    );
  }
  box(-5.94, 2.13, 0.28, 0.09, 0.28, 0.075, M.blue);
  box(-5.94, 2.13, 0.33, 0.045, 0.12, 0.033, M.yellow);
  channel(-4.25, -2.81, 0, 1.14, 1.05);
  pipe(
    [
      [-3.65, 1.13, -0.49],
      [-3.65, 0.86, -0.75],
      [-3.65, 0.73, -1.37],
    ],
    0.046,
    M.steel,
  );
  motor(-3.04, 1.06, -0.94, "x");
  pipe(
    [
      [-3.04, 1.21, -0.94],
      [-3.04, 1.75, -0.91],
      [-3.12, 1.75, -0.48],
    ],
    0.048,
    bluePipe,
  );

  // Folded insulated fryer panels, continuous seam lines and hood suspension.
  for (const z of [-1.18, 1.18])
    for (const x of [-2.76, -1.25, 0.25, 1.75])
      box(x, 1.17, z, 0.025, 0.62, 0.018, M.steel);
  for (const x of [-2.64, 1.65])
    for (const z of [-1.05, 1.02]) {
      cylinder(x, 2.23, z, 0.019, 0.74, M.chrome);
      box(x, 2.64, z, 0.1, 0.095, 0.1, M.steel);
    }
  for (const x of [-1.8, -0.5, 0.8]) {
    pipe(
      [
        [x - 0.2, 2.83, 0.25],
        [x - 0.2, 2.92, 0.25],
        [x + 0.2, 2.92, 0.25],
        [x + 0.2, 2.83, 0.25],
      ],
      0.017,
      M.chrome,
    );
  }
  for (let x = -2.43; x < 1.45; x += 0.12) {
    box(x, 1.48, -0.98, 0.065, 0.06, 0.025, M.steel);
    box(x, 1.48, 0.98, 0.065, 0.06, 0.025, M.steel);
  }
  // Oil drips return to the collection pan below the draining belt.
  const drops = new THREE.InstancedMesh(
    new THREE.SphereGeometry(1, 6, 4),
    M.oil,
    28,
  );
  drops.frustumCulled = false;
  drops.castShadow = false;
  drops.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  scene.add(drops);
  dynamic.push(drops);
  const drainBounds = new THREE.Box3(
    new THREE.Vector3(1.58, 1.27, -0.9),
    new THREE.Vector3(2.7, 1.91, 0.9),
  );

  // Inspection equipment is separate from the bagmaker and carton gantry.
  for (let f = 0; f < 3; f++) {
    const z = (f - 1) * 2.25;
    const x = 11.62;
    for (const side of [-1, 1]) {
      box(x, 1.29, z + side * 0.48, 0.8, 0.42, 0.12, M.teal);
      box(x, 1.1, z + side * 0.43, 0.76, 0.025, 0.04, M.chrome);
    }
    box(x, 1.49, z, 0.8, 0.1, 1.08, M.teal);
    plate(
      "SEAL + WEIGHT",
      "INLINE INSPECTION",
      x,
      1.49,
      z + 0.549,
      0.65,
      0.095,
    );
    const feeler = new THREE.Group();
    feeler.position.set(x, 1.35, z);
    scene.add(feeler);
    dynamic.push(feeler);
    for (const dz of [-0.08, 0.08])
      cylinder(0, 0, dz, 0.036, 0.56, M.rubber, feeler, "x");
    inspections.push({ feeler, f, z });
    for (const dz of [-0.55, 0.55]) {
      pipe(
        [
          [x, 1.55, z + dz],
          [x, 1.85, z + dz],
          [x + 0.36, 1.85, z + dz],
        ],
        0.014,
        bluePipe,
      );
    }
    // A photoeye faces its reflector across each conveyor; it never shines a
    // theatrical laser through the chips.
    cylinder(12.08, 1.19, z - 0.49, 0.032, 0.035, M.black, scene, "z");
    box(12.08, 1.19, z + 0.49, 0.05, 0.05, 0.012, M.chrome);
    plate("180 g", "CONCEPT FILL", 10.62, 2.89, z + 0.87, 0.22, 0.13);
  }
  return {
    dynamic,
    update(time, frustum) {
      drops.visible = !frustum || frustum.intersectsBox(drainBounds);
      if (drops.visible) {
        for (let i = 0; i < drops.count; i++) {
          const age = (time * 2 + i * 0.618) % 1;
          dummy.position.set(
            1.78 + (i % 7) * 0.11,
            1.66 - age * age * 0.3,
            Math.sin(i * 2.39) * 0.64,
          );
          dummy.rotation.set(0, 0, 0);
          dummy.scale.set(0.0035, 0.004 + age * 0.011, 0.0035);
          dummy.updateMatrix();
          drops.setMatrixAt(i, dummy.matrix);
        }
        drops.instanceMatrix.needsUpdate = true;
      }
      for (const { feeler, f } of inspections) {
        const phase = bagPhase(time, f);
        feeler.position.y =
          1.345 -
          0.025 * smooth(phase / 0.15) * (1 - smooth((phase - 0.45) / 0.15));
      }
    },
  };
}

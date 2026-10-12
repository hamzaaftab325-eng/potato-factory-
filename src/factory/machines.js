import * as THREE from "three";

// Purpose-built food-process equipment, with a readable path through every
// housing. Units are art-directed for the miniature, not fabrication drawings.
export function addProcessMachines(C) {
  const {
    scene,
    machinePaint,
    M,
    box,
    cylinder,
    mesh,
    pipe,
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
    random,
  } = C;
  const dynamic = [],
    transfers = [],
    cutters = [],
    branches = [];
  const TAU = Math.PI * 2;
  const dummy = new THREE.Object3D();
  const incline = new THREE.Quaternion(),
    beltAxis = new THREE.Vector3(0, 0, 1);
  const steelInside = M.steel.clone();
  steelInside.side = THREE.DoubleSide;
  const perforated = steelInside.clone();
  perforated.alphaMap = C.textures.perforation;
  perforated.alphaTest = 0.5;
  const abrasive = new THREE.MeshStandardMaterial({
    color: "#62665f",
    roughness: 0.95,
    bumpMap: C.textures.belt,
    bumpScale: 0.009,
  });

  function plate(text, x, y, z, w = 1, h = 0.15, background = "#18353a") {
    const c = document.createElement("canvas");
    c.width = 768;
    c.height = 128;
    const a = c.getContext("2d");
    a.fillStyle = background;
    a.fillRect(0, 0, 768, 128);
    a.fillStyle = "#e8eee6";
    a.font = "500 35px DM Sans";
    a.textAlign = "center";
    a.fillText(text, 384, 77);
    const map = new THREE.CanvasTexture(c);
    map.colorSpace = THREE.SRGBColorSpace;
    return mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshStandardMaterial({
        map,
        roughness: 0.44,
        metalness: 0.22,
      }),
      x,
      y,
      z,
    );
  }
  function hopper(x, y, z, w, d, h, throat = 0.34) {
    const points = [],
      uv = [];
    const upper = [
      [-w / 2, h / 2, -d / 2],
      [w / 2, h / 2, -d / 2],
      [w / 2, h / 2, d / 2],
      [-w / 2, h / 2, d / 2],
    ];
    const lower = [
      [-throat / 2, -h / 2, -throat / 2],
      [throat / 2, -h / 2, -throat / 2],
      [throat / 2, -h / 2, throat / 2],
      [-throat / 2, -h / 2, throat / 2],
    ];
    for (let i = 0; i < 4; i++) {
      const j = (i + 1) % 4;
      for (const p of [
        upper[i],
        lower[i],
        upper[j],
        upper[j],
        lower[i],
        lower[j],
      ])
        points.push(...p);
      uv.push(0, 1, 0, 0, 1, 1, 1, 1, 0, 0, 1, 0);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    g.computeVertexNormals();
    mesh(g, steelInside, x, y, z);
    for (const s of [-1, 1]) {
      box(x, y + h / 2, z + (s * d) / 2, w + 0.05, 0.035, 0.045, M.chrome);
      box(x + (s * w) / 2, y + h / 2, z, 0.045, 0.035, d + 0.05, M.chrome);
    }
  }
  function hmi(x, y, z, title, reading) {
    box(x, y, z, 0.48, 0.59, 0.15, machinePaint(x, z));
    box(x, y + 0.08, z + 0.081, 0.37, 0.29, 0.012, M.dark);
    plate(title, x, y + 0.155, z + 0.09, 0.32, 0.052);
    plate(reading, x, y + 0.055, z + 0.09, 0.32, 0.09, "#082326");
    cylinder(x - 0.1, y - 0.17, z + 0.1, 0.04, 0.025, M.led, scene, "z");
    cylinder(x + 0.1, y - 0.17, z + 0.1, 0.055, 0.035, M.red, scene, "z");
    cylinder(x + 0.1, y - 0.17, z + 0.081, 0.073, 0.015, M.yellow, scene, "z");
    pipe(
      [
        [x, y - 0.3, z],
        [x, y - 0.55, z],
        [x - 0.24, y - 0.6, z - 0.1],
      ],
      0.018,
      M.rubber,
    );
  }
  function gauge(x, y, z, units, maximum, reading) {
    const face = document.createElement("canvas");
    face.width = face.height = 512;
    const a = face.getContext("2d");
    a.fillStyle = "#e7e6dd";
    a.fillRect(0, 0, 512, 512);
    a.translate(256, 256);
    a.strokeStyle = "#768d76";
    a.lineWidth = 18;
    a.beginPath();
    a.arc(0, 0, 190, Math.PI * 0.95, Math.PI * 1.6);
    a.stroke();
    a.strokeStyle = "#253538";
    for (let i = 0; i <= 40; i++) {
      const angle = Math.PI * 0.75 + (i / 40) * Math.PI * 1.5;
      const r = i % 5 ? 174 : 155;
      a.lineWidth = i % 5 ? 2 : 4;
      a.beginPath();
      a.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
      a.lineTo(Math.cos(angle) * 196, Math.sin(angle) * 196);
      a.stroke();
      if (i % 10 === 0) {
        a.fillStyle = "#253538";
        a.font = "30px DM Sans";
        a.textAlign = "center";
        a.fillText(
          String((maximum * i) / 40),
          Math.cos(angle) * 126,
          Math.sin(angle) * 126 + 10,
        );
      }
    }
    const angle = Math.PI * 0.75 + (reading / maximum) * Math.PI * 1.5;
    a.strokeStyle = "#a74635";
    a.lineWidth = 7;
    a.beginPath();
    a.moveTo(-Math.cos(angle) * 23, -Math.sin(angle) * 23);
    a.lineTo(Math.cos(angle) * 164, Math.sin(angle) * 164);
    a.stroke();
    a.fillStyle = "#253538";
    a.beginPath();
    a.arc(0, 0, 12, 0, TAU);
    a.fill();
    a.font = "26px DM Sans";
    a.textAlign = "center";
    a.fillText(units, 0, 77);
    const map = new THREE.CanvasTexture(face);
    map.colorSpace = THREE.SRGBColorSpace;
    cylinder(x, y, z, 0.13, 0.075, M.steel, scene, "z");
    mesh(
      new THREE.CircleGeometry(0.113, 32),
      new THREE.MeshStandardMaterial({ map, roughness: 0.6 }),
      x,
      y,
      z + 0.041,
    );
    mesh(
      new THREE.TorusGeometry(0.117, 0.009, 6, 32),
      M.chrome,
      x,
      y,
      z + 0.044,
    );
    cylinder(x, y - 0.15, z, 0.022, 0.12, M.chrome);
  }
  function transfer(a, b, width, kind, material, count = 18) {
    const A = new THREE.Vector3(...a),
      B = new THREE.Vector3(...b);
    const length = A.distanceTo(B),
      angle = Math.atan2(B.y - A.y, B.x - A.x);
    const g = new THREE.Group();
    g.position.copy(A).add(B).multiplyScalar(0.5);
    g.rotation.z = angle;
    scene.add(g);
    box(0, -0.085, 0, length, 0.13, width, M.dark, g);
    for (const s of [-1, 1])
      box(0, 0.055, (s * width) / 2, length, 0.17, 0.055, M.steel, g);
    for (const x of [-length / 2 + 0.07, length / 2 - 0.07]) {
      const roller = cylinder(x, -0.025, 0, 0.085, width, M.chrome, g, "z");
      // Whole turns preserve the production loop while matching belt motion.
      spinAnims.push({
        o: roller,
        axis: "z",
        turns: -Math.round((length * 4) / (Math.PI * 0.17)),
      });
    }
    const cleats = new THREE.InstancedMesh(
      new THREE.BoxGeometry(0.028, 0.045, width - 0.09),
      M.rubber,
      18,
    );
    const food = new THREE.InstancedMesh(
      kind === "potato" ? potatoG : material === M.raw ? rawChipG : chipG,
      material,
      count,
    );
    food.castShadow = food.receiveShadow = true;
    cleats.frustumCulled = food.frustumCulled = false;
    scene.add(cleats, food);
    dynamic.push(cleats, food);
    const bounds = new THREE.Box3()
      .setFromPoints([A, B])
      .expandByScalar(width + 0.3);
    transfers.push({ A, B, width, angle, cleats, food, kind, count, bounds });
    for (const u of [0.16, 0.82]) {
      const p = A.clone().lerp(B, u);
      for (const s of [-1, 1])
        box(
          p.x,
          (p.y + 0.6) / 2,
          p.z + s * width * 0.42,
          0.07,
          p.y - 0.6,
          0.07,
          M.steel,
        );
    }
  }

  // Receiving hopper, metered infeed, and a proper enclosed recirculating washer.
  hopper(-13.4, 1.91, 0, 1.64, 1.35, 0.65, 0.62);
  feet(-13.4, 0, 1.25, 1.07, 1.66);
  box(-13.4, 1.34, 0, 1.55, 0.2, 1.16, M.washPaint);
  for (let i = 0; i < 160; i++) {
    const p = mesh(
      potatoG,
      M.potato,
      -13.4 + (random() - 0.5) * 1.28,
      2.11 + random() * 0.21,
      (random() - 0.5) * 0.99,
    );
    p.scale.set(0.055, 0.043, 0.046);
    p.rotation.set(random() * 3, random() * 3, random() * 3);
  }
  plate("01 / RECEIVING & WASHING", -13.4, 1.84, 0.6, 1.1, 0.13);
  transfer([-12.9, 1.91, 0], [-11.35, 1.63, 0], 0.88, "potato", M.potato, 15);
  box(-10.22, 1.18, 0, 2.45, 0.76, 1.62, M.washPaint);
  box(-10.22, 0.8, 0, 2.38, 0.12, 1.56, M.dark);
  feet(-10.2, 0, 2.1, 1.4, 1.3);
  liquid(-10.22, 1.58, 0, 2.25, 1.36, M.water);
  foodFlow(-11.32, -9.0, 0, 1.65, 72, "potato", M.potato, 1.05);
  for (const x of [-11.17, -10.69, -10.21, -9.73, -9.25]) {
    pipe(
      [
        [x, 1.62, -0.84],
        [x, 2.16, -0.84],
        [x, 2.24, 0],
        [x, 2.16, 0.84],
        [x, 1.62, 0.84],
      ],
      0.029,
    );
    for (const z of [-0.42, 0, 0.42]) {
      cylinder(x, 2.18, z, 0.043, 0.08, M.chrome);
      sprays.push({ x, y: 2.12, z });
    }
  }
  // Narrow glass splash windows sit in metal frames, not loose floating panels.
  for (const side of [-1, 1]) {
    box(-10.22, 1.94, side * 0.86, 2.38, 0.47, 0.018, M.glass);
    for (const y of [1.7, 2.2])
      box(-10.22, y, side * 0.87, 2.42, 0.035, 0.04, M.steel);
    for (const x of [-11.41, -9.03])
      box(x, 1.95, side * 0.87, 0.04, 0.51, 0.04, M.steel);
    for (const x of [-10.95, -10.22, -9.49]) {
      box(x, 1.18, side * 0.826, 0.67, 0.53, 0.02, M.washPaint);
      if (side === 1) for (const dx of [-0.28, 0.28]) bolt(x + dx, 1.4, 0.85);
    }
  }
  plate("RECIRCULATING WASH / FILTERED WATER", -10.22, 1.33, 0.85, 1.8, 0.13);
  pipe(
    [
      [-11.2, 0.88, 0.94],
      [-11.2, 0.72, 1.05],
      [-9.4, 0.72, 1.05],
      [-9.4, 1.24, 0.86],
    ],
    0.052,
  );
  cylinder(-10.65, 0.99, -1.04, 0.19, 0.66, M.steel);
  motor(-9.58, 0.87, -1.13);
  hmi(-9.65, 1.09, 1.05, "WASH PRESSURE", "2.4 BAR");
  gauge(-11.05, 1.15, 1.02, "BAR", 4, 2.4);

  // An eight-roll abrasive bed, enclosed by a stationary hygienic housing.
  // Only the rollers turn; spray bars and the peel-waste pan remain fixed.
  const peeler = new THREE.Group();
  scene.add(peeler);
  box(-8.02, 1.16, 0, 1.95, 0.61, 1.65, M.peelPaint, peeler);
  box(-8.02, 0.9, 0, 1.84, 0.08, 1.56, M.steel, peeler);
  for (const side of [-1, 1]) {
    box(-8.02, 1.91, side * 0.83, 1.88, 0.88, 0.025, M.glass, peeler);
    for (const y of [1.48, 2.35])
      box(-8.02, y, side * 0.85, 1.96, 0.045, 0.055, M.peelPaint, peeler);
    for (const x of [-8.97, -7.07])
      box(x, 1.92, side * 0.85, 0.05, 0.92, 0.055, M.peelPaint, peeler);
  }
  for (let i = 0; i < 8; i++) {
    const z = (i - 3.5) * 0.185,
      y = 1.45 + Math.pow(z / 0.8, 2) * 0.16;
    const roll = cylinder(-8.02, y, z, 0.108, 1.73, abrasive, scene, "x");
    spinAnims.push({ o: roll, axis: "x", turns: 16 });
    dynamic.push(roll);
    for (const x of [-8.94, -7.1]) {
      cylinder(x, y, z, 0.065, 0.11, M.chrome, scene, "x");
      box(x, y, z, 0.07, 0.17, 0.16, M.peelPaint, peeler);
    }
  }
  for (const x of [-8.61, -8.03, -7.45]) {
    pipe(
      [
        [x, 1.54, -0.9],
        [x, 2.29, -0.9],
        [x, 2.29, 0.9],
      ],
      0.03,
      M.chrome,
    );
    for (const z of [-0.42, 0, 0.42]) sprays.push({ x, y: 2.2, z });
  }
  feet(-8.02, 0, 1.65, 1.4, 1.14);
  plate("ABRASIVE PEELER / EIGHT ROLLS", -8.02, 1.16, 0.848, 1.6, 0.15);
  motor(-8.05, 1.0, -1.04, "x");
  pipe(
    [
      [-8.1, 0.98, -0.65],
      [-8.1, 0.74, -1.15],
      [-9.2, 0.74, -1.15],
    ],
    0.06,
  );
  box(-8.48, 0.77, -1.3, 0.82, 0.2, 0.45, M.steel);
  foodFlow(-9.15, -7.1, 0, 1.61, 20, "potato", M.peeled, 0.6);
  transfer([-7.17, 1.43, 0], [-5.58, 3.23, 0], 0.65, "potato", M.peeled, 13);

  // Enclosed centrifugal slicer. Eight FIXED knife cartridges surround a
  // cylindrical impeller. The narrow section window reveals the cutting head,
  // without making the machine resemble an exposed fan.
  feet(-5.28, 0, 1.12, 1.35, 1.28);
  box(-5.28, 1.15, 0, 1.49, 0.3, 1.58, M.cutPaint);
  cylinder(-5.28, 1.42, 0, 0.35, 0.3, M.dark);
  const cutShell = mesh(
    new THREE.CylinderGeometry(0.68, 0.68, 0.87, 72, 1, true, 0.58, TAU - 1.16),
    Object.assign(M.cutPaint.clone(), { side: THREE.DoubleSide }),
    -5.28,
    2.08,
    0,
  );
  const cutWindow = mesh(
    new THREE.CylinderGeometry(0.682, 0.682, 0.82, 32, 1, true, -0.58, 1.16),
    M.glass,
    -5.28,
    2.08,
    0,
  );
  for (const y of [1.64, 2.52]) {
    cylinder(-5.28, y, 0, 0.71, 0.09, M.chrome);
    const rim = mesh(
      new THREE.TorusGeometry(0.69, 0.029, 10, 64),
      M.steel,
      -5.28,
      y,
      0,
    );
    rim.rotation.x = Math.PI / 2;
  }
  for (let i = 0; i < 8; i++) {
    const a = (i * TAU) / 8;
    const knife = box(
      -5.28 + Math.sin(a) * 0.582,
      2.06,
      Math.cos(a) * 0.582,
      0.036,
      0.68,
      0.115,
      M.chrome,
    );
    knife.rotation.y = a + 0.2;
    const shoe = box(
      -5.28 + Math.sin(a + 0.1) * 0.62,
      2.06,
      Math.cos(a + 0.1) * 0.62,
      0.075,
      0.69,
      0.045,
      M.steel,
    );
    shoe.rotation.y = a;
  }
  const impeller = new THREE.Group();
  impeller.position.set(-5.28, 2.08, 0);
  scene.add(impeller);
  dynamic.push(impeller);
  cylinder(0, 0, 0, 0.365, 0.66, M.dark, impeller);
  for (let i = 0; i < 3; i++) {
    const a = (i * TAU) / 3;
    const pocket = box(
      Math.sin(a) * 0.4,
      0,
      Math.cos(a) * 0.4,
      0.08,
      0.59,
      0.13,
      M.steel,
      impeller,
    );
    pocket.rotation.y = a;
  }
  spinAnims.push({ o: impeller, axis: "y", turns: 16 });
  cylinder(-5.28, 2.66, 0, 0.29, 0.24, M.steel);
  hopper(-5.28, 2.98, 0, 1.05, 0.95, 0.48, 0.44);
  for (const x of [-5.86, -4.7]) {
    box(x, 2.37, 0.33, 0.07, 0.17, 0.06, M.dark);
    cylinder(x, 2.34, 0.39, 0.025, 0.12, M.chrome);
  }
  plate("02 / CENTRIFUGAL SLICER", -5.28, 1.24, 0.812, 1.27, 0.14);
  hmi(-5.95, 1.63, 1.01, "SLICE CONTROL", "1.5 mm");
  motor(-5.34, 0.95, -0.95, "x");
  transfer([-4.86, 1.87, 0], [-4.18, 1.29, 0], 0.7, "chip", M.raw, 18);
  box(-4.84, 1.91, 0, 0.31, 0.37, 0.78, M.steel);
  for (let i = 0; i < 16; i++) {
    const o = mesh(rawChipG, M.raw);
    dynamic.push(o);
    cutters.push({ o, offset: i / 16 });
  }
  conveyor(-4.25, -2.85, 0, 1.12, 1.26);
  foodFlow(-4.24, -2.82, 0, 1.33, 30, "chip", M.raw, 0.85);
  pipe(
    [
      [-4.0, 1.45, -0.7],
      [-4.0, 1.96, -0.7],
      [-3.34, 1.96, -0.7],
      [-3.34, 1.45, -0.7],
    ],
    0.032,
  );
  box(-3.85, 1.88, 0, 0.1, 0.08, 1.38, M.rinsePaint);
  for (const z of [-0.36, 0, 0.36]) sprays.push({ x: -3.85, y: 1.82, z });
  box(-3.12, 1.6, 0, 0.22, 0.15, 1.28, M.rinsePaint);
  plate("RINSE / AIR KNIFE", -3.55, 0.99, 0.65, 1.08, 0.11);

  // Continuous fryer: insulated vessel, lift-up extraction hood, viewing slots,
  // metering wheels, a submerged mesh belt and a sloping oil-drain discharge.
  // Open tank, rather than a solid cuboid covering the liquid surface.
  box(-0.5, 0.82, 0, 4.58, 0.31, 2.27, M.fryPaint, scene, 0.08);
  box(-0.5, 1.02, 0, 4.29, 0.1, 1.99, M.steel);
  for (const z of [-1.08, 1.08])
    box(-0.5, 1.25, z, 4.58, 0.57, 0.13, M.fryPaint);
  for (const x of [-2.72, 1.72]) box(x, 1.25, 0, 0.13, 0.57, 2.11, M.fryPaint);
  liquid(-0.5, 1.53, 0, 4.27, 1.97, M.oil);
  feet(-0.5, 0, 3.95, 1.95, 1.2);
  for (const z of [-1.1, 1.1]) box(-0.5, 1.59, z, 4.75, 0.16, 0.15, M.chrome);
  for (const x of [-2.78, 1.78]) box(x, 1.58, 0, 0.17, 0.16, 2.31, M.chrome);
  for (const x of [-2.0, -0.5, 1.0]) {
    box(x, 1.1, 1.153, 1.4, 0.67, 0.055, M.fryPaint);
    for (const xx of [x - 0.58, x + 0.58])
      for (const y of [0.85, 1.34]) bolt(xx, y, 1.196);
    box(x + 0.48, 1.13, 1.2, 0.034, 0.24, 0.07, M.dark);
    box(x, 1.43, 1.196, 1.34, 0.065, 0.012, M.yellow);
    plate("INSULATED / HOT SURFACE", x, 0.91, 1.19, 1.02, 0.1);
  }
  // Raised hood leaves a deliberate viewing gap along the near side.
  box(-0.5, 2.76, -0.15, 4.45, 0.18, 2.1, M.fryPaint, scene, 0.09);
  box(-0.5, 2.49, -1.13, 4.44, 0.55, 0.08, M.fryPaint);
  for (const x of [-2.72, 1.72]) {
    box(x, 2.49, -0.16, 0.075, 0.56, 2.07, M.fryPaint);
    cylinder(x, 2.04, -1.24, 0.05, 1.34, M.chrome);
    cylinder(x, 1.84, -1.24, 0.09, 0.7, M.steel);
    motor(x, 1.19, -1.39, "x");
  }
  for (const x of [-1.98, -0.5, 0.98]) {
    box(x, 2.49, 0.91, 1.35, 0.38, 0.037, M.fryPaint);
    box(x, 2.5, 0.938, 0.93, 0.21, 0.012, M.dark);
    box(x, 2.5, 0.95, 0.87, 0.16, 0.012, M.glass);
    box(x, 2.65, 0.96, 0.26, 0.025, 0.065, M.chrome);
  }
  plate("03 / CONTINUOUS FRYING", -0.5, 2.73, 0.913, 2.15, 0.12);
  cylinder(-0.5, 3.18, -0.46, 0.26, 0.67, M.steel);
  for (const y of [2.95, 3.39]) cylinder(-0.5, y, -0.46, 0.3, 0.075, M.chrome);
  pipe(
    [
      [-0.5, 3.48, -0.46],
      [-0.5, 3.71, -0.46],
      [-0.5, 3.82, -1.0],
    ],
    0.235,
  );
  // Two small metering paddle wheels are partially immersed in oil.
  for (const x of [-2.14, -1.1]) {
    const wheel = new THREE.Group();
    wheel.position.set(x, 1.66, 0);
    scene.add(wheel);
    dynamic.push(wheel);
    cylinder(0, 0, 0, 0.045, 1.89, M.chrome, wheel, "z");
    for (let i = 0; i < 6; i++) {
      const a = (i * TAU) / 6;
      const paddle = box(
        Math.cos(a) * 0.16,
        Math.sin(a) * 0.16,
        0,
        0.028,
        0.22,
        1.72,
        perforated,
        wheel,
      );
      paddle.rotation.z = a;
    }
    spinAnims.push({ o: wheel, axis: "z", turns: -2 });
    for (const z of [-1.08, 1.08]) box(x, 1.7, z, 0.2, 0.23, 0.15, M.steel);
  }
  const submergeMaterial = perforated.clone();
  submergeMaterial.alphaMap = C.textures.perforation.clone();
  const submerge = mesh(
    new THREE.PlaneGeometry(2.45, 1.8),
    submergeMaterial,
    0.3,
    1.527,
    0,
  );
  submerge.rotation.x = -Math.PI / 2;
  foodFlow(-2.59, 1.59, 0, 1.533, 240, "chip", M.chip, 1.63, 1);
  // Side chain, bearing blocks and a level sight glass distinguish the oil
  // circulation vessel from the drain conveyor beside it.
  for (const z of [-0.98, 0.98]) {
    box(-0.5, 1.47, z, 4.08, 0.045, 0.05, M.dark);
    for (const x of [-2.43, 1.43]) {
      cylinder(x, 1.48, z, 0.12, 0.07, M.dark, scene, "z");
      cylinder(
        x,
        1.48,
        z + Math.sign(z) * 0.04,
        0.05,
        0.025,
        M.chrome,
        scene,
        "z",
      );
    }
  }
  box(-1.5, 1.18, 1.207, 0.12, 0.36, 0.035, M.dark);
  box(-1.5, 1.18, 1.23, 0.055, 0.3, 0.012, M.glass);
  box(-1.5, 1.105, 1.22, 0.048, 0.15, 0.014, M.oil);
  pipe(
    [
      [-2.2, 0.87, -1.24],
      [-2.2, 0.75, -1.57],
      [1.25, 0.75, -1.57],
      [1.25, 1.35, -1.15],
    ],
    0.075,
  );
  cylinder(0.25, 1.12, -1.62, 0.22, 0.64, M.steel);
  motor(0.9, 0.84, -1.69);
  hmi(0.45, 1.24, 1.37, "OIL TEMPERATURE", "175 °C");
  gauge(-1.0, 1.21, 1.24, "°C", 200, 175);
  transfer([1.6, 1.51, 0], [2.68, 1.86, 0], 1.68, "chip", M.chip, 36);
  box(2.1, 1.34, 0, 1.14, 0.045, 1.62, M.steel);
  transfer([2.68, 1.86, 0], [3.52, 1.34, 0], 1.66, "chip", M.chip, 24);
  for (const z of [-0.96, 0.96])
    box(2.66, 2.02, z, 0.045, 1.21, 0.05, M.coolPaint);
  box(2.66, 2.61, 0, 0.5, 0.17, 2.02, M.coolPaint);
  for (const z of [-0.4, 0.4]) {
    cylinder(2.66, 2.73, z, 0.23, 0.13, M.dark);
    cylinder(2.66, 2.8, z, 0.18, 0.025, perforated);
  }
  plate("DRAIN & COOL", 2.66, 2.63, 1.022, 0.45, 0.1);

  // Open vibratory distribution chutes carry visible chips to each flavour.
  for (const z of [-2.25, 0, 2.25]) {
    const A = new THREE.Vector3(3.45, 1.39, 0),
      B = new THREE.Vector3(4.48, 1.36, z);
    const g = new THREE.Group();
    g.position.copy(A).add(B).multiplyScalar(0.5);
    g.rotation.y = -Math.atan2(z, B.x - A.x);
    scene.add(g);
    const length = A.distanceTo(B);
    box(0, -0.055, 0, length, 0.045, 0.67, M.steel, g);
    for (const side of [-1, 1])
      box(0, 0.04, side * 0.34, length, 0.16, 0.027, M.steel, g);
    const food = new THREE.InstancedMesh(chipG, M.chip, 18);
    food.castShadow = true;
    food.frustumCulled = false;
    scene.add(food);
    dynamic.push(food);
    dynamic.push(g);
    branches.push({
      tray: g,
      rest: g.position.clone(),
      axis: B.clone().sub(A).normalize(),
      A,
      B,
      food,
      bounds: new THREE.Box3().setFromPoints([A, B]).expandByScalar(0.7),
    });
  }

  return {
    peeler,
    dynamic,
    update(t, frustum) {
      // The repeating mesh moves at the chip bed's forward travel speed.
      submergeMaterial.alphaMap.offset.x = (-t * 27) / 256;
      for (const e of transfers) {
        e.food.visible = e.cleats.visible =
          !frustum || frustum.intersectsBox(e.bounds);
        if (!e.food.visible) continue;
        for (let i = 0; i < 18; i++) {
          const u = (i / 18 + t * 0.25) % 1;
          dummy.position.lerpVectors(e.A, e.B, u);
          dummy.position.y += 0.024;
          dummy.rotation.set(0, 0, e.angle);
          dummy.scale.setScalar(1);
          dummy.updateMatrix();
          e.cleats.setMatrixAt(i, dummy.matrix);
        }
        for (let i = 0; i < e.count; i++) {
          const u = (i / e.count + t * 0.25) % 1;
          dummy.position.lerpVectors(e.A, e.B, u);
          dummy.position.z +=
            Math.sin(i * 7.1) *
            Math.max(
              0.02,
              e.width * 0.5 - (e.kind === "potato" ? 0.09 : 0.075),
            );
          dummy.position.y += e.kind === "potato" ? 0.09 : 0.055;
          dummy.rotation.set(
            e.kind === "potato" ? i : -Math.PI / 2,
            e.kind === "potato" ? i * 0.29 : 0.06 * Math.sin(i),
            e.kind === "potato" ? e.angle : i * 2.399,
          );
          if (e.kind === "chip")
            dummy.quaternion.premultiply(
              incline.setFromAxisAngle(beltAxis, e.angle),
            );
          if (e.kind === "potato") dummy.scale.set(0.055, 0.043, 0.046);
          else dummy.scale.setScalar(0.33 + 0.025 * Math.sin(i * 3));
          dummy.updateMatrix();
          e.food.setMatrixAt(i, dummy.matrix);
        }
        e.cleats.instanceMatrix.needsUpdate = true;
        e.food.instanceMatrix.needsUpdate = true;
      }
      cutters.forEach((d, i) => {
        const u = (t * 4 + d.offset) % 1;
        d.o.position.set(
          -4.99 + u * 0.33,
          1.78 - u * u * 0.17,
          Math.sin(i * 7) * 0.18,
        );
        d.o.rotation.set(
          -Math.PI / 2 + u * 0.18,
          0.12 * Math.sin(i),
          i * 2.399 + u * 0.4,
        );
        d.o.scale.setScalar(0.33);
      });
      for (const b of branches) {
        // Horizontal differential motion: a gentle carrying stroke and a quick
        // return. The tray physically reciprocates along its own centreline.
        const phase = (t * 2) % 1;
        const stroke = phase < 0.76 ? phase / 0.76 : 1 - (phase - 0.76) / 0.24;
        b.tray.position
          .copy(b.rest)
          .addScaledVector(b.axis, (stroke - 0.5) * 0.018);
        b.food.visible = !frustum || frustum.intersectsBox(b.bounds);
        if (!b.food.visible) continue;
        for (let i = 0; i < 18; i++) {
          const u = (i / 18 + t * 0.5) % 1;
          dummy.position.lerpVectors(b.A, b.B, u);
          dummy.position.z += Math.sin(i * 13) * 0.13;
          dummy.position.y += 0.035 + Math.sin(t * Math.PI * 8 + i) * 0.002;
          dummy.rotation.set(-Math.PI / 2, 0, i * 2);
          dummy.scale.setScalar(0.33);
          dummy.updateMatrix();
          b.food.setMatrixAt(i, dummy.matrix);
        }
        b.food.instanceMatrix.needsUpdate = true;
      }
    },
  };
}

import * as THREE from "three";
export function addFactoryDetails(C) {
  const {
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
  } = C;
  const dynamic = [],
    drops = [],
    splash = [],
    rolling = [],
    fanRotors = [];
  const tau = Math.PI * 2;
  const enamel = new THREE.MeshPhysicalMaterial({
    color: "#dcaa27",
    metalness: 0.34,
    roughness: 0.26,
    clearcoat: 0.55,
    clearcoatRoughness: 0.22,
  });
  const blue = new THREE.MeshStandardMaterial({
    color: "#173b50",
    metalness: 0.74,
    roughness: 0.27,
  });
  const steelDark = new THREE.MeshStandardMaterial({
    color: "#606c6b",
    metalness: 0.92,
    roughness: 0.32,
  });
  function textPlate(
    text,
    x,
    y,
    z,
    w = 0.45,
    h = 0.16,
    color = "#e7dac1",
    bg = "#15272b",
  ) {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 192;
    const a = c.getContext("2d");
    a.fillStyle = bg;
    a.fillRect(0, 0, 512, 192);
    a.strokeStyle = "#ffffff38";
    a.lineWidth = 5;
    a.strokeRect(5, 5, 502, 182);
    a.fillStyle = color;
    a.font = "bold 45px Arial";
    a.textAlign = "center";
    a.fillText(text, 256, 113);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ map: t }),
      x,
      y,
      z,
    );
  }
  function flange(x, y, z, r = 0.12, axis = "z") {
    cylinder(x, y, z, r, 0.055, M.chrome, scene, axis);
    for (let i = 0; i < 6; i++) {
      const a = (i * tau) / 6;
      bolt(
        x + Math.cos(a) * r * 0.76,
        y + Math.sin(a) * r * 0.76,
        z + 0.04,
        axis,
      );
    }
  }
  function valve(x, y, z, r = 0.12) {
    const o = mesh(new THREE.TorusGeometry(r, 0.017, 6, 24), M.red, x, y, z);
    for (let i = 0; i < 3; i++) {
      let a = (i * tau) / 3;
      let s = box(
        x + Math.cos(a) * r * 0.45,
        y + Math.sin(a) * r * 0.45,
        z,
        r,
        0.022,
        0.025,
        M.red,
      );
      s.rotation.z = a;
    }
    cylinder(x, y, z, 0.035, 0.16, M.chrome, scene, "z");
    return o;
  }
  function gauge(x, y, z) {
    cylinder(x, y, z, 0.115, 0.045, M.chrome, scene, "z");
    cylinder(x, y, z + 0.029, 0.096, 0.012, M.peeled, scene, "z");
    let needle = box(
      x + 0.018,
      y + 0.019,
      z + 0.039,
      0.08,
      0.009,
      0.006,
      M.red,
    );
    needle.rotation.z = 0.84;
    for (let i = 0; i < 8; i++) {
      let a = 0.3 + i * 0.36;
      let tick = box(
        x + Math.cos(a) * 0.076,
        y + Math.sin(a) * 0.076,
        z + 0.041,
        0.015,
        0.005,
        0.005,
        M.dark,
      );
      tick.rotation.z = a;
    }
  }
  function cabinet(x, y, z, w = 0.75, h = 0.75) {
    box(x, y, z, w, h, 0.28, M.steel);
    box(x, y, z + 0.155, w - 0.08, h - 0.08, 0.025, steelDark);
    for (let dx of [-w / 2 + 0.065, w / 2 - 0.065])
      for (let dy of [-h / 2 + 0.065, h / 2 - 0.065])
        bolt(x + dx, y + dy, z + 0.18);
    box(x + 0.22 * w, y, z + 0.19, 0.025, h * 0.28, 0.035, M.chrome);
    textPlate(
      "CRISP / " + (x < 0 ? "PROCESS" : "CONTROL"),
      x - 0.04,
      y + h * 0.25,
      z + 0.173,
      w * 0.62,
      h * 0.11,
    );
    box(x - 0.1, y + 0.02, z + 0.18, w * 0.34, h * 0.17, 0.018, M.black);
    textPlate(
      "RUN  •  24.0",
      x - 0.1,
      y + 0.02,
      z + 0.195,
      w * 0.29,
      h * 0.11,
      "#83c9c0",
    );
    for (let i = 0; i < 3; i++) {
      cylinder(
        x - 0.19 + i * 0.115,
        y - h * 0.26,
        z + 0.187,
        0.034,
        0.018,
        i === 2 ? M.red : i === 1 ? enamel : M.led,
        scene,
        "z",
      );
    }
    pipe(
      [
        [x, y - h / 2, z],
        [x, y - h / 2 - 0.17, z],
        [x + 0.5, y - h / 2 - 0.17, z - 0.28],
      ],
      0.027,
      M.rubber,
    );
  }
  function safetyGuard(x, y, z, w, h) {
    for (let dx of [-w / 2, w / 2])
      box(x + dx, y, z, 0.045, h + 0.05, 0.06, enamel);
    for (let dy of [-h / 2, h / 2]) box(x, y + dy, z, w, 0.045, 0.06, enamel);
    for (let dx = -w / 2 + 0.075; dx < w / 2; dx += 0.08)
      box(x + dx, y, z, 0.008, h - 0.06, 0.015, steelDark);
    for (let dy = -h / 2 + 0.075; dy < h / 2; dy += 0.08)
      box(x, y + dy, z, w - 0.06, 0.008, 0.015, steelDark);
  }
  function rail(a, b, z, y = 1.53) {
    pipe(
      [
        [a, y, z],
        [b, y, z],
      ],
      0.024,
      M.chrome,
    );
    for (let x = a + 0.08; x < b; x += 0.65) {
      cylinder(x, y - 0.14, z, 0.02, 0.3, M.chrome);
      box(x, y - 0.3, z, 0.09, 0.065, 0.075, M.steel);
    }
  }
  function funnel(x, y, z, w, d, h) {
    const top = [
        [-w / 2, h / 2, -d / 2],
        [w / 2, h / 2, -d / 2],
        [w / 2, h / 2, d / 2],
        [-w / 2, h / 2, d / 2],
      ],
      bottom = [
        [-w * 0.17, -h / 2, -d * 0.17],
        [w * 0.17, -h / 2, -d * 0.17],
        [w * 0.17, -h / 2, d * 0.17],
        [-w * 0.17, -h / 2, d * 0.17],
      ];
    const p = [];
    for (let i = 0; i < 4; i++) {
      let j = (i + 1) % 4;
      for (let v of [top[i], bottom[i], top[j], top[j], bottom[i], bottom[j]])
        p.push(...v);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(p, 3));
    g.computeVertexNormals();
    const m = M.steel.clone();
    m.side = THREE.DoubleSide;
    mesh(g, m, x, y, z);
    for (let s of [-1, 1]) {
      box(x, y + h / 2, z + (s * d) / 2, w + 0.08, 0.045, 0.055, M.chrome);
      box(x + (s * w) / 2, y + h / 2, z, 0.055, 0.045, d + 0.08, M.chrome);
    }
  }
  // Deep receiving hopper, cross braces, gearbox and plumbing under the wash bath.
  funnel(-13.4, 1.8, 0, 1.62, 1.44, 0.8);
  for (let z of [-0.65, 0.65]) {
    box(-13.4, 1.32, z, 1.55, 0.07, 0.08, M.chrome);
    safetyGuard(-13.4, 1.02, z, 1.2, 0.48);
  }
  cabinet(-12.9, 1.01, 0.85, 0.6, 0.63);
  motor(-13.0, 0.94, -0.95);
  textPlate("01 / RAW INTAKE", -13.4, 2.1, 0.728, 1.15, 0.18);
  for (let x of [-11.1, -9.25])
    for (let z of [-0.74, 0.74]) box(x, 1.06, z, 0.13, 1.04, 0.13, M.chrome);
  box(-10.2, 0.95, 0.83, 2.1, 0.45, 0.065, M.steel);
  for (let x = -11.12; x < -9.3; x += 0.09)
    for (let yy = 1.05; yy < 1.44; yy += 0.09)
      cylinder(x, yy, 0.887, 0.016, 0.008, M.black, scene, "z");
  pipe(
    [
      [-11.2, 0.75, 0.73],
      [-10.2, 0.75, 0.73],
      [-9.15, 0.75, 0.73],
      [-9.15, 1.16, 0.6],
    ],
    0.07,
  );
  for (let x of [-10.8, -9.5]) {
    flange(x, 0.75, 0.75, 0.105);
    valve(x, 0.75, 0.85, 0.1);
  }
  motor(-10.1, 0.77, -1.0);
  cabinet(-9.58, 0.91, 1.06, 0.62, 0.63);
  for (let x of [-10.95, -9.35]) {
    pipe(
      [
        [x, 2.46, -0.76],
        [x, 2.54, -0.76],
        [x, 2.54, 0.72],
      ],
      0.027,
    );
    for (let z of [-0.5, 0, 0.5]) {
      flange(x, 2.38, z, 0.074, "y");
    }
  }
  // Abrasive peeler: access housing, punched shroud, safety cage and drain manifold.
  box(-8.65, 1.62, 0.83, 0.22, 1.5, 0.22, enamel);
  box(-7.32, 1.62, 0.83, 0.22, 1.5, 0.22, enamel);
  for (let xx of [-8.65, -7.32]) {
    flange(xx, 1.75, 0.87, 0.14);
    bolt(xx, 2.1, 0.958);
  }
  safetyGuard(-7.98, 1.03, 0.98, 1.2, 0.52);
  cabinet(-8.1, 0.95, -0.88, 0.7, 0.72);
  pipe(
    [
      [-7.82, 1.0, -0.75],
      [-7.82, 0.76, -0.75],
      [-7.15, 0.76, -0.75],
      [-7.15, 0.9, -0.4],
    ],
    0.045,
  );
  gauge(-8.69, 2.1, 1.01);
  textPlate("ABRASIVE PEELER", -8, 1.26, 1.02, 0.9, 0.13);
  // Every transfer has adjustable rails, bearing blocks, drip trays and inspection plates.
  for (let [a, b, z, w, y] of [
    [-7.3, -5.9, 0, 1.1, 1.25],
    [-4.7, -2.9, 0, 1.1, 1.25],
    [1.6, 3.45, 0, 1.75, 1.33],
  ]) {
    for (let s of [-1, 1]) rail(a, b, z + s * (w / 2 - 0.06), y + 0.23);
    box((a + b) / 2, y - 0.34, z, b - a - 0.1, 0.065, w - 0.11, M.steel);
    safetyGuard((a + b) / 2, 0.94, z + w / 2 + 0.22, b - a - 0.1, 0.45);
    for (let x of [a + 0.18, b - 0.18]) {
      box(x, y - 0.15, z + w / 2 + 0.12, 0.22, 0.3, 0.14, M.steel);
      flange(x, y - 0.08, z + w / 2 + 0.23, 0.09);
    }
  }
  // Slicer enclosure: central shaft, four radial knives and visible falling slices.
  cylinder(-5.3, 2.35, 0, 0.08, 1.55, M.chrome);
  const rotor = new THREE.Group();
  rotor.position.set(-5.3, 2.2, 0);
  scene.add(rotor);
  dynamic.push(rotor);
  cylinder(0, 0, 0, 0.12, 0.12, M.chrome, rotor);
  for (let i = 0; i < 4; i++) {
    const arm = box(0.26, 0, 0, 0.48, 0.03, 0.1, M.chrome, rotor);
    arm.rotation.y = (i * tau) / 4;
    arm.position.set(
      Math.cos((i * tau) / 4) * 0.26,
      0,
      Math.sin((i * tau) / 4) * 0.26,
    );
    const edge = box(0.44, -0.018, 0, 0.24, 0.014, 0.06, steelDark, rotor);
    edge.position.set(
      Math.cos((i * tau) / 4) * 0.44,
      -0.018,
      Math.sin((i * tau) / 4) * 0.44,
    );
    edge.rotation.y = (-i * tau) / 4;
  }
  spinAnims.push({ o: rotor, axis: "y", turns: 16 });
  cylinder(-5.3, 2.85, 0, 0.21, 0.28, M.steel);
  funnel(-5.3, 3.11, 0, 0.55, 0.55, 0.35);
  for (let x of [-5.94, -4.77])
    for (let z of [-0.77, 0.77]) {
      box(x, 2.1, z, 0.055, 1.4, 0.055, M.chrome);
      flange(x, 2.72, z, 0.068);
    }
  box(-5.36, 1.47, 0.91, 1.35, 0.5, 0.13, M.steel);
  textPlate("02 / ROTARY SLICER", -5.35, 1.51, 0.99, 0.98, 0.16);
  cabinet(-5.94, 1.03, 1.05, 0.48, 0.59);
  safetyGuard(-5.3, 0.99, 0.82, 0.7, 0.54);
  for (let i = 0; i < 14; i++) {
    const o = mesh(chipG, M.raw, -5.25, 2, 0);
    dynamic.push(o);
    drops.push({ o, offset: i / 14, angle: random() * tau });
  }
  pipe(
    [
      [-4.46, 1.4, -0.73],
      [-4.46, 2.04, -0.73],
      [-3.1, 2.04, -0.73],
      [-3.1, 1.48, -0.73],
    ],
    0.035,
  );
  valve(-3.25, 2.04, -0.67, 0.09);
  // Fryer service doors, insulated panels, gauges, burner lines and bright guard frames.
  for (let x of [-2.05, -0.52, 1.01]) {
    box(x, 1.01, 1.22, 1.4, 0.73, 0.055, M.steel);
    for (let xx of [x - 0.6, x + 0.6])
      for (let y of [0.72, 1.31]) bolt(xx, y, 1.26);
    for (let xx of [x - 0.58, x + 0.58]) {
      box(xx, 1.07, 1.29, 0.035, 0.17, 0.035, M.chrome);
      cylinder(xx, 0.88, 1.285, 0.028, 0.08, M.chrome);
    }
    box(x + 0.42, 1.09, 1.3, 0.027, 0.25, 0.055, M.black);
    textPlate("HOT SURFACE", x - 0.16, 0.79, 1.259, 0.39, 0.08, "#e7b745");
  }
  rail(-2.8, 1.8, 1.02, 1.72);
  rail(-2.8, 1.8, -1.02, 1.72);
  pipe(
    [
      [-2.5, 0.79, 1.36],
      [-2.5, 0.66, 1.53],
      [1.4, 0.66, 1.53],
      [1.4, 1.13, 1.32],
    ],
    0.05,
  );
  gauge(-2.18, 1.22, 1.4);
  valve(-1.0, 0.66, 1.6, 0.11);
  valve(0.5, 0.66, 1.6, 0.11);
  cabinet(0.6, 1.06, -1.35, 0.75, 0.72);
  for (let x of [-2.7, 1.7]) {
    safetyGuard(x, 1.05, 1.43, 0.24, 0.67);
    box(x, 1.59, 1.14, 0.22, 0.26, 0.16, enamel);
  }
  for (let x of [-1.85, 0.68])
    pipe(
      [
        [x, 2.34, -1.2],
        [x, 2.75, -1.2],
        [x, 2.75, -0.63],
      ],
      0.03,
    );
  for (let y of [2.83, 3.1, 3.52]) {
    cylinder(-0.5, y, -1, 0.235, 0.065, M.chrome);
  }
  textPlate("03 / CONTINUOUS FRYER", -0.52, 1.31, 1.26, 1.14, 0.11);
  // Stainless mesh extraction belt, a denser grid underneath the traveling chips.
  for (let x = 1.62; x < 3.5; x += 0.07)
    box(x, 1.363, 0, 0.012, 0.011, 1.63, M.chrome);
  for (let z = -0.79; z < 0.8; z += 0.065)
    box(2.55, 1.366, z, 1.9, 0.008, 0.011, M.chrome);
  // Fan-driven cooling bridge with two real rotating impellers.
  for (let x of [2.1, 2.9]) {
    box(x, 2.05, 0, 0.5, 0.09, 1.95, M.steel);
    for (let z of [-0.97, 0.97]) cylinder(x, 1.78, z, 0.027, 0.58, M.chrome);
    cylinder(x, 2.11, 0, 0.31, 0.07, M.dark);
    const rotor = new THREE.Group();
    rotor.position.set(x, 2.155, 0);
    scene.add(rotor);
    dynamic.push(rotor);
    fanRotors.push(rotor);
    for (let i = 0; i < 5; i++) {
      let a = (i * tau) / 5,
        blade = box(
          Math.cos(a) * 0.15,
          0,
          Math.sin(a) * 0.15,
          0.23,
          0.016,
          0.07,
          M.steel,
          rotor,
        );
      blade.rotation.y = -a;
    }
    cylinder(0, 0, 0, 0.05, 0.04, M.chrome, rotor);
    mesh(
      new THREE.TorusGeometry(0.29, 0.012, 5, 32),
      M.chrome,
      x,
      2.185,
      0,
    ).rotation.x = Math.PI / 2;
  }
  // Drum frame, geared drive ring, powder auger, access guard and raised control box.
  for (let f = 0; f < 3; f++) {
    let x = 5.95,
      z = (f - 1) * 2.25,
      color = [M.yellow, M.red, M.green][f];
    for (let xx of [x - 0.78, x + 0.78])
      for (let zz of [z - 0.58, z + 0.58])
        box(xx, 1.15, zz, 0.13, 1.23, 0.13, M.chrome);
    box(x, 1.2, z + 0.8, 1.8, 0.12, 0.12, M.steel);
    safetyGuard(x, 0.91, z + 0.86, 1.45, 0.5);
    for (let xx of [x - 0.61, x + 0.61]) {
      box(xx, 1.16, z + 0.58, 0.29, 0.19, 0.25, M.steel);
      flange(xx, 1.34, z + 0.84, 0.13);
    }
    funnel(x, 3.59, z, 0.84, 0.84, 0.56);
    box(x, 3.89, z, 0.88, 0.065, 0.88, M.chrome);
    cylinder(x, 3.23, z, 0.11, 0.24, M.chrome);
    pipe(
      [
        [x, 3.21, z],
        [x + 0.21, 3.0, z],
        [x + 0.21, 2.72, z],
      ],
      0.06,
    );
    motor(x + 0.6, 3.07, z, "x");
    box(x + 0.34, 3.13, z, 0.5, 0.12, 0.24, M.steel);
    cabinet(7.12, 1.75, z + 0.6, 0.53, 0.61);
    textPlate(
      ["SEA SALT", "SMOKY PAPRIKA", "GARDEN HERBS"][f],
      x,
      1.2,
      z + 0.89,
      1.03,
      0.14,
    );
    for (let a = 0; a < tau; a += tau / 16) {
      bolt(x + 0.85, 2.01 + Math.cos(a) * 0.765, z + Math.sin(a) * 0.765, "x");
    }
    for (let s of [-1, 1]) rail(6.85, 7.75, z + s * 0.48, 1.56);
    safetyGuard(7.3, 1.04, z + 0.69, 0.24, 0.5);
    // Falling chips from the mouth: gravity arc instead of teleporting between belts.
    for (let i = 0; i < 12; i++) {
      const o = mesh(chipG, [M.chip, M.redChip, M.herbChip][f]);
      dynamic.push(o);
      drops.push({ o, offset: i / 12, angle: random() * tau, drum: f });
    }
  }
  // Bagging towers: radial weigh buckets, safety doors, film spindle, guide rollers,
  // pneumatics, corrugated jaws and cable trays. Three independent colour ways.
  for (let f = 0; f < 3; f++) {
    const x = 10,
      z = (f - 1) * 2.25,
      paint = [M.yellow, M.red, M.green][f];
    // A cleated elevator raises the seasoned chips into the weighing hopper.
    const A = new THREE.Vector3(7.7, 1.34, z - 0.25),
      B = new THREE.Vector3(9.94, 4.51, z - 0.25);
    const mid = A.clone().add(B).multiplyScalar(0.5),
      length = A.distanceTo(B),
      angle = Math.atan2(B.y - A.y, B.x - A.x);
    const lift = new THREE.Group();
    lift.position.copy(mid);
    lift.rotation.z = angle;
    scene.add(lift);
    box(0, -0.085, 0, length, 0.12, 0.62, M.dark, lift);
    for (let s of [-1, 1]) {
      box(0, 0.08, s * 0.32, length, 0.18, 0.047, M.steel, lift);
    }
    for (let xx of [-length / 2 + 0.08, length / 2 - 0.08])
      cylinder(xx, 0, 0, 0.09, 0.62, M.chrome, lift, "z");
    const cleats = new THREE.InstancedMesh(
      new THREE.BoxGeometry(0.034, 0.07, 0.54),
      M.rubber,
      24,
    );
    scene.add(cleats);
    dynamic.push(cleats);
    const food = new THREE.InstancedMesh(
      chipG,
      [M.chip, M.redChip, M.herbChip][f],
      36,
    );
    food.castShadow = true;
    scene.add(food);
    dynamic.push(food);
    rolling.push({ A, B, cleats, food, angle });
    for (let xx of [8.3, 9.38]) {
      const yy = A.y + ((xx - A.x) / (B.x - A.x)) * (B.y - A.y);
      box(xx, (yy + 0.6) / 2, z - 0.35, 0.07, yy - 0.6, 0.07, M.chrome);
    }
    funnel(x, 4.35, z, 1.19, 1.19, 0.48);
    textPlate("PRECISION WEIGH", x, 4.43, z + 0.61, 0.86, 0.12);
    for (let i = 0; i < 10; i++) {
      const a = (i * tau) / 10;
      const bucket = mesh(
        new THREE.CylinderGeometry(0.16, 0.075, 0.31, 6, 1, true),
        M.steel,
        x + Math.cos(a) * 0.57,
        3.98,
        z + Math.sin(a) * 0.57,
      );
      bucket.rotation.y = -a;
      const rim = mesh(
        new THREE.TorusGeometry(0.16, 0.014, 5, 6),
        M.chrome,
        x + Math.cos(a) * 0.57,
        4.14,
        z + Math.sin(a) * 0.57,
      );
      rim.rotation.x = Math.PI / 2;
      cylinder(
        x + Math.cos(a) * 0.47,
        3.8,
        z + Math.sin(a) * 0.47,
        0.036,
        0.26,
        M.chrome,
      );
    }
    for (let dx of [-0.7, 0.7])
      box(x + dx, 2.22, z + 0.78, 0.07, 2.55, 0.07, enamel);
    box(x, 3.48, z + 0.78, 1.47, 0.055, 0.07, enamel);
    box(x, 1.03, z + 0.78, 1.47, 0.055, 0.07, enamel);
    box(x, 2.22, z + 0.78, 1.3, 2.35, 0.012, M.glass);
    for (let y of [1.55, 2.77]) {
      box(x - 0.64, y, z + 0.85, 0.06, 0.22, 0.06, M.chrome);
    }
    box(x + 0.52, 2.3, z + 0.86, 0.036, 0.37, 0.08, M.black);
    for (let y of [2.0, 2.25, 3.18]) {
      cylinder(x, y, z - 0.34, 0.056, 1.03, M.chrome, scene, "x");
      for (let dx of [-0.54, 0.54])
        box(x + dx, y, z - 0.34, 0.1, 0.14, 0.18, M.steel);
    }
    pipe(
      [
        [x - 0.77, 1.9, z],
        [x - 0.9, 1.9, z],
        [x - 0.9, 2.7, z],
        [x - 0.67, 2.8, z],
      ],
      0.025,
      blue,
    );
    for (let dx of [-0.51, 0.51]) {
      cylinder(x + dx, 1.86, z - 0.13, 0.063, 0.35, M.steel, scene, "z");
      cylinder(x + dx, 1.86, z + 0.16, 0.025, 0.23, M.chrome, scene, "z");
    }
    cabinet(x + 0.8, 2.7, z + 0.6, 0.4, 0.65);
    textPlate("05 / FORM · FILL · SEAL", x, 3.38, z + 0.825, 1.19, 0.12);
    safetyGuard(x, 0.85, z + 0.79, 1.3, 0.35);
    for (let s of [-1, 1]) rail(10.75, 14.2, z + s * 0.46, 1.24);
    for (let xx of [11.0, 13.3]) safetyGuard(xx, 0.84, z + 0.66, 0.3, 0.42);
    textPlate("VISION / PASS", 13.85, 1.42, z + 0.664, 0.25, 0.095, "#79dfbd");
  }
  // Braced legs and routed services add believable construction beneath the line.
  for (let x of [-12.8, -10.6, -8.2, -6.3, -4.1, -1.7, 1.0, 3.0]) {
    box(x, 0.7, 0.57, 0.095, 0.31, 0.095, M.steel);
    cylinder(x, 0.575, 0.57, 0.11, 0.045, M.chrome);
    let brace = box(x, 0.94, -0.42, 0.065, 0.065, 1.26, M.chrome);
    brace.rotation.x = 0.3;
  }
  for (let z of [-3.62, 3.62])
    pipe(
      [
        [-14.2, 0.61, z],
        [14.25, 0.61, z],
      ],
      0.027,
      M.chrome,
    );
  for (let x of [-11.8, -7.8, -2.1, 3.6, 8.6, 12.8]) {
    pipe(
      [
        [x, 0.65, -3.66],
        [x, 0.73, -3.1],
        [x, 0.73, -1.48],
      ],
      0.025,
      M.rubber,
    );
  }
  return {
    dynamic,
    update(t) {
      for (const d of drops) {
        const u = (t * (d.drum === undefined ? 4 : 2) + d.offset) % 1;
        if (d.drum === undefined) {
          d.o.position.set(
            -5.3 + u * 0.49,
            2.19 - u * 0.78,
            Math.sin(d.angle) * 0.2,
          );
        } else {
          d.o.position.set(
            6.79 + u * 0.35,
            1.99 - 0.64 * u * u,
            (d.drum - 1) * 2.25 + Math.sin(d.angle) * 0.32,
          );
        }
        d.o.rotation.set(d.angle + u * tau, u * 3.14, d.angle);
        d.o.scale.setScalar(0.9);
      }
      fanRotors.forEach((o) => (o.rotation.y = t * tau * 3));
      const dummy = new THREE.Object3D();
      for (const e of rolling) {
        for (let i = 0; i < 24; i++) {
          const u = (i / 24 + t * 0.5) % 1;
          dummy.position.lerpVectors(e.A, e.B, u);
          dummy.position.y += 0.04;
          dummy.rotation.set(0, 0, e.angle);
          dummy.scale.set(1, 1, 1);
          dummy.updateMatrix();
          e.cleats.setMatrixAt(i, dummy.matrix);
        }
        for (let i = 0; i < 36; i++) {
          const u = (i / 36 + t * 0.5) % 1;
          dummy.position.lerpVectors(e.A, e.B, u);
          dummy.position.y += 0.09;
          dummy.position.z += Math.sin(i * 7) * 0.18;
          dummy.rotation.set(-Math.PI / 2, Math.sin(i) * 0.2, e.angle);
          dummy.scale.setScalar(0.83);
          dummy.updateMatrix();
          e.food.setMatrixAt(i, dummy.matrix);
        }
        e.cleats.instanceMatrix.needsUpdate = true;
        e.food.instanceMatrix.needsUpdate = true;
      }
    },
  };
}

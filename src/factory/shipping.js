import * as THREE from "three";
import { bagPhase, casePhase, smooth } from "./timing.js";
import { batchRigidParts } from "./batching.js";

export function addShippingLine(C) {
  const {
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
  } = C;
  const dynamic = [],
    lines = [];
  const paper = new THREE.MeshStandardMaterial({
    color: "#ffffff",
    map: textures.paper,
    roughness: 0.91,
    bumpMap: textures.paper,
    bumpScale: 0.002,
  });
  const edge = new THREE.MeshStandardMaterial({
    color: "#9d7950",
    roughness: 0.96,
  });
  const wood = new THREE.MeshStandardMaterial({
    map: textures.wood,
    roughness: 0.9,
    bumpMap: textures.wood,
    bumpScale: 0.003,
  });
  const tape = new THREE.MeshPhysicalMaterial({
    color: "#b99557",
    transparent: true,
    opacity: 0.86,
    roughness: 0.35,
    clearcoat: 0.6,
    side: THREE.DoubleSide,
  });
  const W = 0.6,
    D = 0.45,
    H = 0.4;
  function sticker(f) {
    const c = document.createElement("canvas");
    c.width = 768;
    c.height = 384;
    const a = c.getContext("2d");
    a.fillStyle = "#eee7d6";
    a.fillRect(0, 0, 768, 384);
    a.fillStyle = ["#a88335", "#aa4936", "#667347"][f];
    a.fillRect(0, 0, 22, 384);
    a.fillStyle = "#293730";
    a.font = "84px Instrument Serif";
    a.fillText("crisp", 46, 108);
    a.font = "23px DM Sans";
    a.fillText(
      ["GOLDEN SEA SALT", "SMOKY PAPRIKA", "GARDEN HERBS"][f],
      48,
      163,
    );
    a.font = "17px DM Sans";
    a.fillText("8 × 180 g  /  ORIGINAL COLLECTION", 48, 201);
    a.fillText("CRISP STUDIO     •     READY TO SHIP", 48, 340);
    for (let i = 0; i < 98; i++)
      if ((i * 17 + i * i) % 7 > 2)
        a.fillRect(48 + i * 3.3, 226, 1 + (i % 3), 72);
    a.font = "37px DM Sans";
    a.fillText("↑ ↑", 565, 96);
    a.font = "17px DM Sans";
    a.fillText("KEEP DRY", 550, 135);
    a.strokeStyle = "#627061";
    a.strokeRect(530, 203, 180, 85);
    a.font = "22px DM Sans";
    a.fillText("LOT  /  001", 548, 254);
    const map = new THREE.CanvasTexture(c);
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = 4;
    return new THREE.MeshStandardMaterial({ map, roughness: 0.88 });
  }
  const labels = [0, 1, 2].map(sticker);
  function carton(f, closed = false) {
    const g = new THREE.Group();
    scene.add(g);
    box(0, 0.025, 0, W, 0.045, D, paper, g, 0.012);
    for (const s of [-1, 1]) {
      box((s * W) / 2, H / 2, 0, 0.026, H, D, paper, g, 0.008);
      box(0, H / 2, (s * D) / 2, W, H, 0.026, paper, g, 0.008);
      // Exposed corrugated edge, liner and scored fold at the rim.
      box(0, H, (s * D) / 2, W, 0.012, 0.032, edge, g, 0.003);
    }
    mesh(
      new THREE.PlaneGeometry(0.45, 0.225),
      labels[f],
      0,
      0.22,
      D / 2 + 0.017,
      g,
    );
    const minor = [],
      major = [];
    for (const s of [-1, 1]) {
      const flap = new THREE.Group();
      flap.position.set((s * W) / 2, H, 0);
      g.add(flap);
      box(-s * W * 0.21, 0, 0, W * 0.42, 0.018, D - 0.04, paper, flap, 0.005);
      minor.push({ o: flap, s });
      const lid = new THREE.Group();
      lid.position.set(0, H, (s * D) / 2);
      g.add(lid);
      box(0, 0, -s * D * 0.249, W - 0.01, 0.02, D * 0.499, paper, lid, 0.005);
      major.push({ o: lid, s });
    }
    const strip = box(0, H + 0.02, 0, W + 0.025, 0.008, 0.105, tape, g, 0.002);
    const contents = [];
    for (let i = 0; i < 8; i++) {
      const b = mesh(
        bagG,
        bagMaterials[f],
        i % 2 ? 0.15 : -0.15,
        0.095 + Math.floor(i / 2) * 0.087,
        0,
        g,
      );
      b.scale.setScalar(0.28);
      b.rotation.set(-Math.PI / 2, 0, (i % 2 ? 1 : -1) * 0.035);
      contents.push(b);
    }
    if (closed) contents.forEach((o) => (o.visible = false));
    return { g, minor, major, strip, contents, closed };
  }
  function flapPose(c, minor, major) {
    c.minor.forEach(({ o, s }) => (o.rotation.z = -s * (1 - minor) * 1.65));
    c.major.forEach(({ o, s }) => (o.rotation.x = s * (1 - major) * 1.73));
  }
  // Shared overhead gantry with independent vacuum heads for all three lanes.
  for (const x of [13.35, 15.65]) {
    for (const z of [-3.17, 3.17]) {
      box(x, 1.9, z, 0.1, 2.65, 0.1, M.casePaint);
      box(x, 0.66, z, 0.32, 0.12, 0.28, M.casePaint);
    }
    box(x, 3.23, 0, 0.16, 0.18, 6.48, M.casePaint);
  }
  for (let f = 0; f < 3; f++) {
    const z = (f - 1) * 2.25;
    // Outfeed inspection arch has a dark tunnel, lens and status light.
    box(12.67, 1.54, z, 0.3, 0.15, 1.19, M.casePaint);
    for (const s of [-1, 1])
      box(12.67, 1.29, z + s * 0.59, 0.3, 0.51, 0.08, M.casePaint);
    cylinder(12.67, 1.47, z, 0.055, 0.085, M.black);
    box(12.67, 1.63, z + 0.41, 0.1, 0.022, 0.08, M.led);
    conveyor(14.75, 19.35, z, 1.42, 1.035);
    // Roller outfeed is distinct from the food conveyors.
    for (let x = 17.1; x < 19.36; x += 0.13)
      cylinder(x, 1.11, z, 0.052, 1.22, M.chrome, scene, "z");
    box(15.35, 0.84, z, 1.73, 0.52, 1.5, M.casePaint);
    for (const s of [-1, 1])
      box(16.74, 1.35, z + s * 0.32, 2.15, 0.11, 0.09, M.steel);
    box(14.53, 3.23, z, 2.36, 0.12, 0.15, M.dark);
    cylinder(14.53, 3.31, z, 0.029, 2.29, M.chrome, scene, "x");
    const head = new THREE.Group();
    scene.add(head);
    dynamic.push(head);
    box(0, 0, 0, 0.23, 0.11, 0.31, M.steel, head);
    for (const dz of [-0.08, 0.08]) {
      cylinder(0, -0.1, dz, 0.024, 0.08, M.dark, head);
      cylinder(0, -0.155, dz, 0.036, 0.025, M.rubber, head);
    }
    const carried = mesh(bagG, bagMaterials[f], 0, -0.21, 0, head);
    carried.scale.setScalar(0.28);
    carried.rotation.x = -Math.PI / 2;
    const rod = cylinder(14, 2.5, z, 0.026, 1, M.chrome);
    dynamic.push(rod);
    const carriage = box(14, 3.2, z, 0.38, 0.25, 0.35, M.casePaint);
    dynamic.push(carriage);
    const boxes = [carton(f), carton(f), carton(f, true)];
    boxes.forEach((c) => dynamic.push(c.g));
    // Flap ploughs and pressure rollers guide the flaps into a top tape head.
    for (const s of [-1, 1]) {
      pipe(
        [
          [16.4, 1.72, z + s * 0.45],
          [16.78, 1.64, z + s * 0.3],
          [17.1, 1.56, z + s * 0.2],
        ],
        0.024,
        M.chrome,
      );
      box(17.52, 1.7, z + s * 0.43, 0.09, 1.22, 0.09, M.casePaint);
      box(17.52, 1.61, z + s * 0.303, 1.36, 0.23, 0.12, M.dark);
    }
    box(17.53, 1.79, z, 1.05, 0.12, 1.61, M.casePaint);
    box(17.6, 1.53, z, 0.64, 0.27, 0.22, M.casePaint);
    cylinder(17.56, 1.93, z, 0.17, 0.115, tape, scene, "z");
    cylinder(17.56, 1.93, z, 0.084, 0.125, M.dark, scene, "z");
    for (const x of [17.22, 17.93])
      cylinder(x, 1.54, z, 0.085, 0.17, M.rubber, scene, "z");
    box(
      17.55,
      1.54,
      z + 0.46,
      0.38,
      0.13,
      0.035,
      [M.yellow, M.red, M.green][f],
    );
    // A second vacuum carriage transfers each sealed carton onto its pallet.
    const palletHead = new THREE.Group();
    scene.add(palletHead);
    dynamic.push(palletHead);
    box(0, 0, 0, 0.65, 0.11, 0.85, M.casePaint, palletHead);
    for (const dz of [-0.27, 0.27])
      cylinder(0, -0.07, dz, 0.075, 0.04, M.rubber, palletHead);
    for (const x of [19.3, 22.1]) {
      box(x, 2.16, z + 0.78, 0.09, 3.16, 0.09, M.casePaint);
      box(x, 3.72, z, 0.12, 0.14, 1.68, M.casePaint);
    }
    box(20.7, 3.72, z, 2.98, 0.12, 0.11, M.casePaint);
    for (let x = 19.4; x < 21.3; x += 0.16)
      cylinder(x, 1.11, z, 0.052, 1.22, M.chrome, scene, "z");
    const liftRod = cylinder(20, 3.1, z, 0.029, 1.0, M.chrome);
    dynamic.push(liftRod);
    const line = {
      f,
      z,
      head,
      carried,
      rod,
      carriage,
      boxes,
      palletHead,
      liftRod,
    };
    lines.push(line);
    // Finished cartons sit squarely on an actual slatted pallet after the belt.
    const px = 21.2;
    for (const dx of [-0.62, 0, 0.62]) {
      box(px + dx, 0.7, z, 0.16, 0.15, 1.51, wood);
      for (const dz of [-0.59, 0.59])
        box(px + dx, 0.63, z + dz, 0.18, 0.12, 0.18, wood);
    }
    for (let j = 0; j < 6; j++)
      box(px, 0.81, z - 0.65 + j * 0.26, 1.59, 0.075, 0.19, wood);
    for (let j = 0; j < 2; j++) {
      const c = carton(f, true);
      c.g.position.set(px, 0.85 + j * (H + 0.045), z);
      flapPose(c, 1, 1);
      if (j === 1) {
        line.stackTop = c.g;
        dynamic.push(c.g);
      }
    }
    boxes.forEach((c) => {
      batchRigidParts(c.g, [
        ...c.minor.map((d) => d.o),
        ...c.major.map((d) => d.o),
        c.strip,
        ...c.contents,
      ]);
      [...c.minor, ...c.major].forEach((d) => batchRigidParts(d.o));
    });
    batchRigidParts(head, [carried]);
    batchRigidParts(palletHead);
  }
  return {
    dynamic,
    update(t) {
      for (const l of lines) {
        const p = bagPhase(t, l.f),
          cp = casePhase(t, l.f),
          advance = smooth((cp - 0.945) / 0.055);
        const which = Math.floor(cp * 8) % 8;
        const destinationX = 15.25 + (which % 2 ? 0.15 : -0.15);
        let x, y;
        if (p < 0.15) {
          x = 13.85;
          y = 1.35 + 0.65 * smooth(p / 0.15);
        } else if (p < 0.43) {
          x = 13.85 + (destinationX - 13.85) * smooth((p - 0.15) / 0.28);
          y = 2.0;
        } else if (p < 0.63) {
          x = destinationX;
          y =
            2.0 -
            (0.58 - Math.floor(which / 2) * 0.087) * smooth((p - 0.43) / 0.2);
        } else if (p < 0.76) {
          x = destinationX;
          y =
            1.42 +
            Math.floor(which / 2) * 0.087 +
            (0.58 - Math.floor(which / 2) * 0.087) * smooth((p - 0.63) / 0.13);
        } else {
          x = destinationX + (13.85 - destinationX) * smooth((p - 0.76) / 0.24);
          y = 2.0 - 0.65 * smooth((p - 0.9) / 0.1);
        }
        l.head.position.set(x, y, l.z);
        l.carried.visible = p < 0.63;
        l.carriage.position.x = x;
        l.rod.position.set(x, (3.18 + y) / 2, l.z);
        l.rod.scale.y = Math.max(0.1, 3.18 - y);
        for (let k = 0; k < 3; k++) {
          const c = l.boxes[k];
          c.g.position.set(15.25 + k * 1.5 + advance * 1.5, 1.115, l.z);
          if (k === 0) {
            c.g.position.y -= 0.56 * (1 - smooth(cp / 0.045));
            flapPose(c, 0, 0);
            c.strip.visible = false;
            c.contents.forEach((b, j) => (b.visible = cp > (j + 0.63) / 8));
          } else if (k === 1) {
            flapPose(c, smooth(cp / 0.12), smooth((cp - 0.16) / 0.24));
            const taped = smooth((advance - 0.2) / 0.65);
            c.strip.visible = taped > 0;
            c.strip.scale.x = Math.max(0.001, taped);
            c.strip.position.x = (W + 0.025) * (1 - taped) * 0.5;
            c.contents.forEach((b) => (b.visible = cp < 0.4));
          } else {
            flapPose(c, 1, 1);
            c.strip.visible = true;
            c.g.visible = cp < 0.82;
          }
        }
        const out = l.boxes[2];
        let hx = 19.4,
          hy = 1.595;
        if (cp < 0.3) {
          out.g.position.x = 18.25 + 1.15 * smooth(cp / 0.24);
          hy = 2.6 - 1.005 * smooth((cp - 0.2) / 0.1);
        } else if (cp < 0.48) {
          hy = 1.595 + 1.005 * smooth((cp - 0.3) / 0.18);
        } else if (cp < 0.68) {
          hy = 2.6;
          hx = 19.4 + 1.8 * smooth((cp - 0.48) / 0.2);
        } else if (cp < 0.82) {
          hx = 21.2;
          hy = 2.6 - 0.825 * smooth((cp - 0.68) / 0.14);
        } else {
          hx = 21.2 - 1.8 * smooth((cp - 0.82) / 0.18);
          hy = 2.6;
        }
        l.palletHead.position.set(hx, hy, l.z);
        l.liftRod.position.set(hx, (3.66 + hy) / 2, l.z);
        l.liftRod.scale.y = Math.max(0.15, 3.66 - hy);
        if (cp >= 0.3 && cp < 0.82) out.g.position.set(hx, hy - H - 0.08, l.z);
        l.stackTop.visible = cp >= 0.82;
      }
    },
  };
}

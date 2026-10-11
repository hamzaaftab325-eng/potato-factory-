import * as THREE from "three";

// Deliberately restrained, tileable surface detail. Metal roughness stays in
// linear space; food colour maps are sRGB. No asset downloads are required.
export function createSurfaceTextures(random, anisotropy = 4) {
  const make = (paint, color = false, size = 1024) => {
    const c = document.createElement("canvas");
    c.width = c.height = size;
    paint(c.getContext("2d"), size);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = anisotropy;
    t.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    return t;
  };
  const metal = make((a, s) => {
    a.fillStyle = "#c2c2c2";
    a.fillRect(0, 0, s, s);
    for (let i = 0; i < 5800; i++) {
      const v = Math.round(170 + random() * 55);
      a.fillStyle = `rgba(${v},${v},${v},.19)`;
      a.fillRect(random() * s, random() * s, 18 + random() * 210, 0.35);
    }
  });
  const potato = make((a, s) => {
    a.fillStyle = "#c4aa80";
    a.fillRect(0, 0, s, s);
    for (let i = 0; i < 180; i++) {
      const x = random() * s,
        y = random() * s,
        r = 5 + random() * 35;
      const g = a.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, i % 2 ? "#80654626" : "#eed8a72b");
      g.addColorStop(1, "#ad8a5400");
      a.fillStyle = g;
      a.fillRect(x - r, y - r, r * 2, r * 2);
    }
    for (let i = 0; i < 7500; i++) {
      a.fillStyle = i % 3 ? "#76522e35" : "#f3e2be36";
      a.fillRect(random() * s, random() * s, 0.5 + random(), 0.5 + random());
    }
    for (let i = 0; i < 22; i++) {
      const x = random() * s,
        y = random() * s;
      a.fillStyle = "#86664066";
      a.beginPath();
      a.ellipse(x, y, 2.7, 1.2, random() * 3, 0, Math.PI * 2);
      a.fill();
      a.fillStyle = "#e8cf9d99";
      a.fillRect(x - 1, y + 1.5, 3, 0.6);
    }
  }, true);
  const chip = make((a, s) => {
    const base = a.createRadialGradient(
      s * 0.44,
      s * 0.38,
      s * 0.04,
      s * 0.5,
      s * 0.5,
      s * 0.65,
    );
    base.addColorStop(0, "#f7df9e");
    base.addColorStop(0.6, "#edc776");
    base.addColorStop(1, "#c28a3e");
    a.fillStyle = base;
    a.fillRect(0, 0, s, s);
    // Small translucent blisters, with toasted contact points and bright rims.
    for (let i = 0; i < 320; i++) {
      const x = random() * s,
        y = random() * s,
        r = 1.5 + random() * 12;
      const g = a.createRadialGradient(x - r * 0.25, y - r * 0.25, 0, x, y, r);
      g.addColorStop(0, i % 6 ? "#fff7cc99" : "#98622988");
      g.addColorStop(0.5, "#eac77830");
      g.addColorStop(0.8, "#b6803538");
      g.addColorStop(1, "#eac77800");
      a.fillStyle = g;
      a.fillRect(x - r, y - r, r * 2, r * 2);
      a.strokeStyle = "#fff1b957";
      a.lineWidth = 0.7;
      a.beginPath();
      a.ellipse(x, y, r * 0.73, r * 0.6, 0.3, Math.PI, Math.PI * 1.8);
      a.stroke();
    }
    for (let i = 0; i < 5200; i++) {
      a.fillStyle = i % 5 ? "#99672822" : "#fff8dd7b";
      a.fillRect(random() * s, random() * s, 0.45 + random() * 0.6, 0.6);
    }
  }, true);
  const oil = make((a, s) => {
    a.fillStyle = "#818181";
    a.fillRect(0, 0, s, s);
    for (let i = 0; i < 120; i++) {
      const x = random() * s,
        y = random() * s,
        r = 5 + random() * 42;
      const g = a.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, "#e0e0e035");
      g.addColorStop(0.5, "#54545427");
      g.addColorStop(1, "#81818100");
      a.fillStyle = g;
      a.fillRect(x - r, y - r, r * 2, r * 2);
    }
  });
  const belt = make((a, s) => {
    a.fillStyle = "#999999";
    a.fillRect(0, 0, s, s);
    a.strokeStyle = "#727272";
    a.lineWidth = 2;
    for (let x = 0; x < s; x += 16) {
      a.beginPath();
      a.moveTo(x, 0);
      a.lineTo(x, s);
      a.stroke();
      for (let y = 0; y < s; y += 16) a.fillRect(x + 3, y + 3, 10, 8);
    }
  });
  const perforation = make((a, s) => {
    a.fillStyle = "#fff";
    a.fillRect(0, 0, s, s);
    a.fillStyle = "#000";
    for (let y = 0; y < s; y += 32)
      for (let x = 0; x < s; x += 32) {
        a.beginPath();
        a.arc(x + 16 + (y % 64 ? 8 : 0), y + 16, 7, 0, Math.PI * 2);
        a.fill();
      }
  });
  const paper = make((a, s) => {
    a.fillStyle = "#bc996b";
    a.fillRect(0, 0, s, s);
    for (let i = 0; i < 15000; i++) {
      a.fillStyle = i % 2 ? "#76533018" : "#f5dfb82b";
      a.fillRect(random() * s, random() * s, 0.6 + random() * 3, 0.4);
    }
  }, true);
  const wood = make((a, s) => {
    a.fillStyle = "#a5875f";
    a.fillRect(0, 0, s, s);
    for (let i = 0; i < 650; i++) {
      a.strokeStyle = i % 2 ? "#5e442928" : "#f1d2a225";
      a.lineWidth = 0.5 + random();
      const y = random() * s;
      a.beginPath();
      a.moveTo(0, y);
      a.bezierCurveTo(
        s * 0.3,
        y + random() * 8,
        s * 0.7,
        y - random() * 8,
        s,
        y,
      );
      a.stroke();
    }
  }, true);
  const concrete = make((a, s) => {
    a.fillStyle = "#b0b0b0";
    a.fillRect(0, 0, s, s);
    for (let i = 0; i < 22000; i++) {
      const n = Math.round(135 + random() * 70);
      a.fillStyle = `rgba(${n},${n},${n},.24)`;
      a.fillRect(
        random() * s,
        random() * s,
        0.4 + random() * 1.3,
        0.4 + random() * 1.3,
      );
    }
  });
  concrete.repeat.set(6, 6);
  return { metal, potato, chip, oil, belt, perforation, paper, wood, concrete };
}

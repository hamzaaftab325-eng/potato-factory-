import * as THREE from "three";

// Deliberately restrained, tileable surface detail. Metal roughness stays in
// linear space; food colour maps are sRGB. No asset downloads are required.
export function createSurfaceTextures(random, anisotropy = 4) {
  const make = (paint, color = false, size = 512) => {
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
    a.fillStyle = "#edc571";
    a.fillRect(0, 0, s, s);
    for (let i = 0; i < 210; i++) {
      const x = random() * s,
        y = random() * s,
        r = 2 + random() * 16;
      const g = a.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, i % 4 ? "#fff0b160" : "#b7782545");
      g.addColorStop(0.7, "#e0a14018");
      g.addColorStop(1, "#e0a14000");
      a.fillStyle = g;
      a.fillRect(x - r, y - r, r * 2, r * 2);
      a.strokeStyle = "#fff0be35";
      a.lineWidth = 0.5;
      a.beginPath();
      a.ellipse(x, y, r, r * 0.65, 0.3, 0, Math.PI);
      a.stroke();
    }
    for (let i = 0; i < 4200; i++) {
      a.fillStyle = i % 4 ? "#9b702a26" : "#fff5c36b";
      a.fillRect(random() * s, random() * s, 0.6, 1);
    }
  }, true);
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
  return { metal, potato, chip, belt, perforation, paper, wood };
}

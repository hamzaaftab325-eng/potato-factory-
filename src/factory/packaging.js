import * as THREE from "three";
import { chipGeometry } from "./geometry.js";

const COLOURS = [
  ["#e6bf63", "#b58432"],
  ["#cc7157", "#91452f"],
  ["#8f9d6b", "#556941"],
];
const NAMES = ["GOLDEN SEA SALT", "SMOKY PAPRIKA", "GARDEN HERBS"];
const LINES = [
  ["GOLDEN", "SEA SALT"],
  ["SMOKY", "PAPRIKA"],
  ["GARDEN", "HERBS"],
];
const contours = new Map();
function chipContour(variant) {
  if (!contours.has(variant)) {
    const geometry = chipGeometry(variant);
    const p = geometry.attributes.position;
    contours.set(
      variant,
      Array.from({ length: 41 }, (_, j) => [
        p.getX(8 * 41 + j) * 940,
        -p.getY(8 * 41 + j) * 840,
      ]),
    );
    geometry.dispose();
  }
  return contours.get(variant);
}
function tracked(g, text, x, y, spacing = 3) {
  const width =
    [...text].reduce((sum, c) => sum + g.measureText(c).width, 0) +
    (text.length - 1) * spacing;
  let left = x - width / 2;
  g.save();
  g.textAlign = "left";
  for (const c of text) {
    g.fillText(c, left, y);
    left += g.measureText(c).width + spacing;
  }
  g.restore();
}
function foilRelief() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 384;
  const g = c.getContext("2d");
  g.fillStyle = "#808080";
  g.fillRect(0, 0, 256, 384);
  for (let x = 0; x < 256; x += 4) {
    g.fillStyle = `rgb(${128 + Math.round(4 * Math.sin(x * 0.7))},${128 + Math.round(4 * Math.sin(x * 0.7))},${128 + Math.round(4 * Math.sin(x * 0.7))})`;
    g.fillRect(x, 0, 1, 384);
  }
  for (const y of [8, 360]) {
    g.fillStyle = "#989898";
    g.fillRect(0, y, 256, 14);
    for (let x = 0; x < 256; x += 3) {
      g.fillStyle = "#616161";
      g.fillRect(x, y, 1, 14);
    }
  }
  return new THREE.CanvasTexture(c);
}

// Separate printed faces and an unprinted foil edge preserve a believable
// pouch when viewed from either side. Artwork stays aligned with the web packs.
export function createBagMaterials(
  flavour,
  anisotropy = 4,
  { resolution = 1 } = {},
) {
  const relief = foilRelief();
  relief.anisotropy = anisotropy;
  const make = (back = false) => {
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(1024 * resolution);
    canvas.height = Math.round(1536 * resolution);
    const g = canvas.getContext("2d");
    g.scale(resolution, resolution);
    const [light, dark] = COLOURS[flavour];
    const ink = flavour === 0 ? "#253b30" : "#fff4db";
    const base = g.createLinearGradient(110, 0, 920, 1536);
    base.addColorStop(0, light);
    base.addColorStop(0.42, light);
    base.addColorStop(1, dark);
    g.fillStyle = base;
    g.fillRect(0, 0, 1024, 1536);
    g.fillStyle = "#ffffff08";
    for (let x = -1000; x < 1800; x += 115) {
      g.save();
      g.translate(x, 0);
      g.rotate(-0.32);
      g.fillRect(0, 0, 12, 2100);
      g.restore();
    }
    g.fillStyle = ink;
    g.textAlign = "center";
    if (!back) {
      g.font = '18px "DM Sans", Arial';
      tracked(g, "THE ORIGINAL COLLECTION", 512, 235, 4);
      g.font = 'italic 285px "Instrument Serif", Georgia';
      g.fillText("crisp", 501, 538);
      g.font = '18px "DM Sans", Arial';
      tracked(g, "CRAFTED FOR THE CRUNCH", 512, 615, 3);
      g.strokeStyle = `${ink}80`;
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(296, 661);
      g.lineTo(728, 661);
      g.stroke();
      g.font = '38px "DM Sans", Arial';
      tracked(g, LINES[flavour][0], 512, 731, 5);
      tracked(g, LINES[flavour][1], 512, 788, 5);
      for (let i = 0; i < 3; i++) {
        g.save();
        g.translate(401 + i * 115, 1049 - i * 26);
        g.rotate(-0.28 + i * 0.21);
        g.shadowColor = "#5a35043b";
        g.shadowBlur = 16;
        g.shadowOffsetY = 13;
        const chip = g.createRadialGradient(-45, -40, 10, 0, 0, 177);
        chip.addColorStop(0, "#ffe8b0");
        chip.addColorStop(0.63, "#e8b54b");
        chip.addColorStop(1, "#b67828");
        g.fillStyle = chip;
        g.beginPath();
        chipContour(i).forEach(([x, y], n) =>
          n ? g.lineTo(x, y) : g.moveTo(x, y),
        );
        g.closePath();
        g.fill();
        g.shadowBlur = 0;
        g.shadowOffsetY = 0;
        g.strokeStyle = "#a76b2e60";
        g.lineWidth = 1.5;
        g.stroke();
        for (let n = 0; n < 90; n++) {
          const a = n * 2.399,
            r = Math.sqrt(n / 90);
          g.fillStyle = n % 5 ? "#db9e3855" : "#a76b2e60";
          g.beginPath();
          g.ellipse(
            Math.cos(a) * r * 144,
            Math.sin(a) * r * 86,
            1.2 + (n % 3),
            1 + (n % 2),
            0,
            0,
            Math.PI * 2,
          );
          g.fill();
        }
        if (flavour === 2)
          for (let n = 0; n < 21; n++) {
            g.fillStyle = "#486634a0";
            g.fillRect(Math.sin(n * 7) * 117, Math.cos(n * 3) * 70, 5, 3);
          }
        g.restore();
      }
      g.fillStyle = ink;
      g.font = '19px "DM Sans", Arial';
      tracked(g, "POTATO CHIPS", 512, 1243, 4);
      g.strokeStyle = `${ink}80`;
      g.lineWidth = 1.5;
      g.beginPath();
      g.moveTo(449, 1286);
      g.lineTo(575, 1286);
      g.stroke();
      g.font = '28px "DM Sans", Arial';
      tracked(g, "180 g", 512, 1341, 2);
    } else {
      g.font = 'italic 135px "Instrument Serif", Georgia';
      g.fillText("crisp", 512, 280);
      g.font = '32px "DM Sans", Arial';
      g.fillText(NAMES[flavour], 512, 358);
      g.textAlign = "left";
      g.font = '22px "DM Sans", Arial';
      const copy = [
        "A LITTLE POTATO. A REMARKABLE JOURNEY.",
        "An original flavour and packaging concept.",
        "Golden potatoes. Carefully crafted crunch.",
        "",
        "STORE IN A COOL, DRY PLACE.",
        "Enjoy fresh after opening.",
        "",
        "PACKAGING STUDY / HAMZA AFTAB",
      ];
      copy.forEach((text, i) => g.fillText(text, 158, 475 + i * 42));
      g.fillStyle = "#f6e9c6";
      g.fillRect(160, 865, 704, 190);
      g.fillStyle = "#33412c";
      g.font = '23px "DM Sans", Arial';
      g.fillText("ORIGINAL COLLECTION / CONCEPT PACK", 182, 911);
      g.font = '19px "DM Sans", Arial';
      g.fillText("Illustrative artwork — no nutritional claims.", 182, 955);
      g.fillText("NET WEIGHT 180 g      LOT 001", 182, 1006);
      g.fillStyle = "#fff4db";
      g.fillRect(273, 1112, 478, 146);
      g.fillStyle = "#1b302c";
      for (let i = 0; i < 126; i++)
        if ((i * 13 + i * i) % 7 > 2)
          g.fillRect(293 + i * 3.5, 1125, 1 + (i % 3), 113);
      g.textAlign = "center";
      g.fillStyle = ink;
      g.font = '23px "DM Sans", Arial';
      g.fillText("CRISP / PAKISTAN", 512, 1330);
    }
    for (const y of [30, 1454]) {
      g.fillStyle = "#f3e1b780";
      g.fillRect(0, y, 1024, 52);
      g.strokeStyle = "#60462b40";
      g.lineWidth = 1;
      for (let x = 0; x < 1024; x += 9) {
        g.beginPath();
        g.moveTo(x, y + 4);
        g.lineTo(x, y + 47);
        g.stroke();
      }
    }
    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = anisotropy;
    return new THREE.MeshPhysicalMaterial({
      map,
      metalness: 0.14,
      roughness: 0.36,
      clearcoat: 0.55,
      clearcoatRoughness: 0.24,
      bumpMap: relief,
      bumpScale: 0.0007,
    });
  };
  const edge = new THREE.MeshPhysicalMaterial({
    color: COLOURS[flavour][1],
    metalness: 0.22,
    roughness: 0.42,
    clearcoat: 0.3,
  });
  return [make(false), make(true), edge];
}

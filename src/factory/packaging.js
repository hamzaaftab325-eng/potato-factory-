import * as THREE from "three";

const COLOURS = [
  ["#e4b849", "#bc861e"],
  ["#c7583a", "#923c2a"],
  ["#899350", "#566535"],
];
const NAMES = ["GOLDEN SEA SALT", "SMOKY PAPRIKA", "GARDEN HERBS"];

// Separate printed faces and an unprinted foil edge preserve a believable
// pouch when viewed from either side. Artwork stays aligned with the web packs.
export function createBagMaterials(flavour, textures, anisotropy = 4) {
  const make = (back = false) => {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 1536;
    const g = canvas.getContext("2d");
    const [light, dark] = COLOURS[flavour];
    const base = g.createLinearGradient(0, 0, 1024, 1536);
    base.addColorStop(0, light);
    base.addColorStop(1, dark);
    g.fillStyle = base;
    g.fillRect(0, 0, 1024, 1536);
    g.fillStyle = "#ffffff08";
    for (let x = -1000; x < 1800; x += 115) {
      g.save();
      g.translate(x, 0);
      g.rotate(-0.32);
      g.fillRect(0, 0, 28, 2100);
      g.restore();
    }
    g.fillStyle = "#fff4db";
    g.textAlign = "center";
    if (!back) {
      g.font = 'italic 285px "Instrument Serif", Georgia';
      g.fillText("crisp", 502, 548);
      g.font = '22px "DM Sans", Arial';
      g.fillText("A LITTLE POTATO. A LOT OF POSSIBILITY.", 512, 622);
      g.strokeStyle = "#fff4db80";
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(225, 676);
      g.lineTo(799, 676);
      g.stroke();
      g.font = '42px "DM Sans", Arial';
      g.fillText(NAMES[flavour], 512, 760);
      for (let i = 0; i < 3; i++) {
        g.save();
        g.translate(425 + i * 93, 1012 - i * 22);
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
        g.ellipse(0, 0, 160, 104, 0, 0, Math.PI * 2);
        g.fill();
        g.shadowBlur = 0;
        g.shadowOffsetY = 0;
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
      g.fillStyle = "#fff4db";
      g.font = '24px "DM Sans", Arial';
      g.fillText("THE ORIGINAL COLLECTION", 512, 1250);
      g.font = '30px "DM Sans", Arial';
      g.fillText("40 g", 512, 1312);
    } else {
      g.font = 'italic 125px "Instrument Serif", Georgia';
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
      g.fillText("NET WEIGHT 40 g      LOT 001", 182, 1006);
      g.fillStyle = "#fff4db";
      g.fillRect(273, 1112, 478, 146);
      g.fillStyle = "#1b302c";
      for (let i = 0; i < 126; i++)
        if ((i * 13 + i * i) % 7 > 2)
          g.fillRect(293 + i * 3.5, 1125, 1 + (i % 3), 113);
      g.textAlign = "center";
      g.fillStyle = "#fff4db";
      g.font = '23px "DM Sans", Arial';
      g.fillText("CRISP / PAKISTAN", 512, 1330);
    }
    for (const y of [30, 1454]) {
      g.fillStyle = "#ebd4a775";
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
      metalness: 0.18,
      roughness: 0.4,
      clearcoat: 0.45,
      clearcoatRoughness: 0.34,
      bumpMap: textures.paper,
      bumpScale: 0.00035,
    });
  };
  const edge = new THREE.MeshPhysicalMaterial({
    color: COLOURS[flavour][1],
    metalness: 0.28,
    roughness: 0.39,
    clearcoat: 0.4,
  });
  return [make(false), make(true), edge];
}

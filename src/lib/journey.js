export const PROCESS_NAMES = [
  "Wash & peel",
  "Precision slicing",
  "Golden frying",
  "Season & tumble",
  "Fill & seal",
];

export const CAMERAS = [
  { target: [0.3, 1.5, 0], radius: 36.5, yaw: 0.57, elev: 0.48 },
  { target: [-10, 1.55, 0], radius: 8.9, yaw: 0.6, elev: 0.4 },
  { target: [-5.1, 1.55, 0], radius: 7.1, yaw: 0.55, elev: 0.35 },
  { target: [-0.2, 1.5, 0], radius: 8.7, yaw: 0.64, elev: 0.48 },
  { target: [5.9, 1.9, 0], radius: 9.5, yaw: 0.4, elev: 0.54 },
  { target: [10.8, 2.05, 0], radius: 12.3, yaw: 0.5, elev: 0.36 },
];

export const FLAVOURS = [
  {
    name: "Golden Sea Salt",
    personality: "The timeless one.",
    color: "#bd8829",
    pack: "sea-salt",
  },
  {
    name: "Smoky Paprika",
    personality: "The bold one.",
    color: "#a8442e",
    pack: "paprika",
  },
  {
    name: "Garden Herbs",
    personality: "The fresh one.",
    color: "#677344",
    pack: "herbs",
  },
];

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

// The camera follows the centres of the readable steps, rather than an
// arbitrary document percentage. This remains correct after font/viewport changes.
export function journeyPosition(rects, viewportHeight, mobile = false) {
  if (!rects.length) return 1;
  const line = viewportHeight * (mobile ? 0.78 : 0.55);
  const centres = rects.map((r) => r.top + r.height / 2);
  if (line <= centres[0]) return 1;
  for (let i = 0; i < centres.length - 1; i++) {
    if (line <= centres[i + 1]) {
      return (
        i +
        1 +
        clamp(
          (line - centres[i]) / Math.max(1, centres[i + 1] - centres[i]),
          0,
          1,
        )
      );
    }
  }
  return rects.length;
}

export function cameraAt(position, flavour = 0) {
  const p = clamp(
    Number.isFinite(position) ? position : 0,
    0,
    CAMERAS.length - 1,
  );
  const from = Math.floor(p),
    to = Math.min(from + 1, CAMERAS.length - 1);
  const u = p - from,
    t = u * u * (3 - 2 * u);
  const mix = (a, b) => a + (b - a) * t;
  const a = CAMERAS[from],
    b = CAMERAS[to];
  const result = {
    target: a.target.map((v, i) => mix(v, b.target[i])),
    radius: mix(a.radius, b.radius),
    yaw: mix(a.yaw, b.yaw),
    elev: mix(a.elev, b.elev),
  };
  const flavourWeight = Math.max(0, 1 - Math.abs(p - 4));
  result.target[2] += (clamp(flavour, 0, 2) - 1) * 1.3 * flavourWeight;
  return result;
}

export function chooseSurface(bounds, height) {
  const visible = (r) => r && r.bottom > 0 && r.top < height;
  if (visible(bounds.product) && bounds.product.top < height * 0.72)
    return "product";
  if (visible(bounds.story) && bounds.story.top < height * 0.85) return "story";
  if (visible(bounds.hero)) return "hero";
  return null;
}

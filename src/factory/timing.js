export const LOOP_SECONDS = 16;
export const BAG_SECONDS = 2;
export const CASE_SECONDS = 16;
export const CAMPUS_SECONDS = 64;
export const CUTS_PER_SECOND = 8;
export const fract = (n) => ((n % 1) + 1) % 1;
export const smooth = (n) => {
  const v = Math.min(1, Math.max(0, n));
  return v * v * (3 - 2 * v);
};
export const bagPhase = (time, lane = 0) =>
  fract(time / BAG_SECONDS + lane / 3);
export const casePhase = (time, lane = 0) =>
  fract(time / CASE_SECONDS + lane / 24);
export function jawClosure(phase) {
  return smooth((phase - 0.32) / 0.1) * (1 - smooth((phase - 0.54) / 0.12));
}

// Logistics uses four complete machine loops. The truck resets beyond the
// perimeter, while all visible transfers remain on a single continuous clock.
export function logisticsAt(time) {
  const t = fract(time / CAMPUS_SECONDS) * CAMPUS_SECONDS;
  const between = (a, b) => smooth((t - a) / (b - a));
  return {
    time: t,
    arrival: between(0, 12),
    reverse: between(12, 18),
    secured: t >= 18 && t < 52,
    doors: between(18, 20) * (1 - between(49, 51)),
    bridge: between(20, 21.5) * (1 - between(48, 49)),
    departure: between(52, 56),
    exit: between(56, 64),
    moving: t < 18 || t >= 52,
    visible: t > 0.35 && t < 63.6,
    brake: t >= 16.5 && t < 18.5,
    loading: t >= 22 && t < 48,
    cargo: [t >= 29.74, t >= 43.74],
  };
}

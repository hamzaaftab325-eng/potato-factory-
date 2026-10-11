export const LOOP_SECONDS = 16;
export const BAG_SECONDS = 2;
export const CASE_SECONDS = 8;
export const CUTS_PER_SECOND = 8;
export const fract = (n) => ((n % 1) + 1) % 1;
export const smooth = (n) => {
  const v = Math.min(1, Math.max(0, n));
  return v * v * (3 - 2 * v);
};
export const bagPhase = (time, lane = 0) =>
  fract(time / BAG_SECONDS + lane / 3);
export const casePhase = (time, lane = 0) =>
  fract(time / CASE_SECONDS + lane / 12);
export function jawClosure(phase) {
  return smooth((phase - 0.32) / 0.1) * (1 - smooth((phase - 0.54) / 0.12));
}

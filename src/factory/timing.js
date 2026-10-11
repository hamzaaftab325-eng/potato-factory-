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

// The truck is stationary at both ends of the loop. Loading happens only while
// the doors are open; departure waits for the pallet and door closure.
export function deliveryMotion(time) {
  const p = fract(time / LOOP_SECONDS);
  const departure = smooth((p - 0.46) / 0.24);
  const arrival = smooth((p - 0.82) / 0.18);
  const x = p < 0.76 ? departure * 24 : -24 + arrival * 24;
  const door = smooth(p / 0.035) * (1 - smooth((p - 0.37) / 0.055));
  const load = smooth((p - 0.105) / 0.245);
  return {
    x,
    door,
    load,
    loading: p >= 0.065 && p < 0.353,
    loaded: p >= 0.35 && p < 0.76,
    wheelTurns: p < 0.76 ? departure * 9 : 9 + arrival * 9,
    driving: (p > 0.46 && p < 0.7) || p > 0.82,
  };
}

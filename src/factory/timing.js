export const LOOP_SECONDS = 16;
export const BAG_SECONDS = 2;
export const CASE_SECONDS = 16;
export const CAMPUS_SECONDS = 96;
export const LOGISTICS_PHASE_SECONDS = 64;
export const LOGISTICS_TIME_SCALE = CAMPUS_SECONDS / LOGISTICS_PHASE_SECONDS;
export const campusPhase = (time) =>
  fract(time / CAMPUS_SECONDS) * LOGISTICS_PHASE_SECONDS;
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

// Six machine loops allow comfortable vehicle manoeuvres. Phase coordinates
// keep dock actions on one shared timeline with the sound and drone tour.
export function logisticsAt(time) {
  const t = campusPhase(time);
  const between = (a, b) => smooth((t - a) / (b - a));
  const doorOpen = [
    between(10.1, 11.8) * (1 - between(49, 50.75)),
    between(10.3, 12) * (1 - between(49.25, 51)),
  ];
  const unlocked = between(9.65, 10.1) * (1 - between(51.1, 51.8));
  const doorsClosed = doorOpen.every((value) => value === 0);
  const readyToDepart = t >= 52 && doorsClosed && unlocked === 0;
  return {
    time: t,
    elapsed: t * LOGISTICS_TIME_SCALE,
    arrival: between(0, 10),
    reverse: between(12, 18),
    secured: t >= 18 && t < 52,
    doors: Math.max(...doorOpen),
    doorOpen,
    unlocked,
    doorsClosed,
    readyToDepart,
    bridge: between(20, 21.5) * (1 - between(48, 49)),
    departure: between(52, 56),
    exit: between(56, 64),
    moving: t < 10 || (t >= 12 && t < 18) || readyToDepart,
    visible: t > 0.35 && t < 63.6,
    brake: (t >= 9.2 && t < 10.3) || (t >= 16.5 && t < 18.5),
    loading: t >= 22 && t < 48,
    cargo: [t >= 29.74, t >= 43.74],
  };
}

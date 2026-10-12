// Keep deadlines on a stable grid instead of restarting the interval at each
// rendered frame. This also works on 75/120/144 Hz monitors without losing fps.
export class FrameClock {
  constructor() {
    this.next = 0;
    this.fps = 0;
  }
  due(now, fps, force = false) {
    const step = 1 / fps;
    if (force || this.fps !== fps || now - this.next > step * 3) {
      this.fps = fps;
      this.next = now + step;
      return true;
    }
    if (now + 0.0005 < this.next) return false;
    this.next += step;
    return true;
  }
}

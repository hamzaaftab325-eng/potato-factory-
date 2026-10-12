const clamp = (value, low, high) => Math.min(high, Math.max(low, value));

// HD is the single rendering mode. Native pixels, adaptive scaling and GPU
// limits keep the canvas inside a 1920 × 1080 drawing-buffer ceiling.
export function drawingBudget({
  width,
  height,
  dpr = 1,
  scale = 1,
  maxTextureSize = 8192,
}) {
  width = Math.max(1, width);
  height = Math.max(1, height);
  const ceiling = [1920, 1080];
  const native = Math.min(dpr, 1.5);
  const ratio =
    Math.min(
      native,
      ceiling[0] / width,
      ceiling[1] / height,
      maxTextureSize / width,
      maxTextureSize / height,
    ) * clamp(scale, 0.55, 1);
  return {
    ratio,
    width: Math.max(1, Math.floor(width * ratio)),
    height: Math.max(1, Math.floor(height * ratio)),
  };
}

// Observe rendered-frame cadence as well as CPU work. Slow windows reduce the
// pixel budget promptly; recovery needs six seconds of headroom to avoid churn.
// Pauses, tab switches and long OS stalls are excluded by the scene integration.
export class AdaptiveRenderBudget {
  constructor(fps = 60) {
    this.fps = fps;
    this.scale = 1;
    this.reset();
  }
  reset() {
    this.elapsed = 0;
    this.cost = 0;
    this.samples = 0;
    this.fastWindows = 0;
    this.stalls = 0;
    this.warmup = 2500;
  }
  sample(interval, cost) {
    if (interval <= 0 || interval > 2000) return false;
    if (interval > 250) {
      if (++this.stalls < 3) return false;
      interval = 250;
    } else this.stalls = 0;
    if (this.warmup > 0) {
      this.warmup -= interval;
      return false;
    }
    this.elapsed += interval;
    this.cost += cost;
    this.samples++;
    if (this.elapsed < 1500 || this.samples < 6) return false;
    const target = 1000 / this.fps;
    const cadence = this.elapsed / this.samples;
    const costMean = this.cost / this.samples;
    this.elapsed = this.cost = this.samples = 0;
    const previous = this.scale;
    if (cadence > target * 1.32 || costMean > target * 0.95) {
      this.scale = Math.max(0.55, this.scale * 0.84);
      this.fastWindows = 0;
    } else if (cadence < target * 1.12 && costMean < target * 0.65) {
      if (++this.fastWindows >= 4) {
        this.scale = Math.min(1, this.scale + 0.06);
        this.fastWindows = 0;
      }
    } else this.fastWindows = 0;
    return previous !== this.scale;
  }
}

export function zoomDistance(current, factor) {
  return clamp(current / factor, 0.4, 1.8);
}

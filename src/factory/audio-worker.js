import { synthesizeSound } from "./audio-synthesis.js";

// Procedural sound preparation never monopolises the render/scroll thread.
// Transfer the completed PCM buffers instead of copying them between workers.
self.onmessage = ({ data: { sampleRate, kinds } }) => {
  const context = {
    sampleRate,
    createBuffer(channels, length, rate) {
      const data = Array.from(
        { length: channels },
        () => new Float32Array(length),
      );
      return { data, sampleRate: rate, getChannelData: (i) => data[i] };
    },
  };
  try {
    kinds.forEach((kind, index) => {
      const buffer = synthesizeSound(context, kind, index);
      const [left, right] = buffer.data;
      self.postMessage({ index, sampleRate, left, right }, [
        left.buffer,
        right.buffer,
      ]);
    });
  } catch (error) {
    self.postMessage({ error: error.message });
  }
};

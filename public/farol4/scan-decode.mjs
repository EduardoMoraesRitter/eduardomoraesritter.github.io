// Pure helpers for reading QR frames. The reader itself runs in scan-worker.mjs.

// Copies one colour channel of an RGBA frame into a greyscale RGBA image, as the reader expects.
export function channelImage(src, ch, out = new Uint8ClampedArray(src.length)) {
  const n = src.length;
  for (let i = 0; i < n; i += 4) {
    const v = src[i + ch];
    out[i] = v; out[i + 1] = v; out[i + 2] = v; out[i + 3] = 255;
  }
  return out;
}

// zxing reports four points; the rest of the app uses jsQR's corner names.
export function toLocation(position) {
  if (!position) return null;
  return {
    topLeftCorner: position.topLeft,
    topRightCorner: position.topRight,
    bottomLeftCorner: position.bottomLeft,
    bottomRightCorner: position.bottomRight,
  };
}

// Keeps only results that carry a Farol 4 packet. A null list (timed-out channel) yields nothing.
export function packetsFrom(results) {
  if (!Array.isArray(results)) return [];
  return results
    .filter((r) => typeof r?.text === 'string' && r.text.startsWith('F4|'))
    .map((r) => ({ data: r.text, location: toLocation(r.position) }));
}

// Splits one RGBA frame into three greyscale RGBA images in a single pass.
// Writes into the buffers passed in, so the caller can reuse them.
export function splitChannels(src, outs = [0, 1, 2].map(() => new Uint8ClampedArray(src.length))) {
  const [r, g, b] = outs;
  const n = src.length;
  for (let i = 0; i < n; i += 4) {
    const R = src[i], G = src[i + 1], B = src[i + 2];
    r[i] = R; r[i + 1] = R; r[i + 2] = R; r[i + 3] = 255;
    g[i] = G; g[i + 1] = G; g[i + 2] = G; g[i + 3] = 255;
    b[i] = B; b[i + 1] = B; b[i + 2] = B; b[i + 3] = 255;
  }
  return outs;
}

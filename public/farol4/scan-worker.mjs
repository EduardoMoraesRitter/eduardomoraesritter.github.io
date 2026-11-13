// Reads one colour channel of a camera frame with zxing-wasm. One worker per channel.
// The pixel buffer is handed back when done, so the page can reuse it without copying.
import {readBarcodesFromImageData} from './vendor/zxing/es/reader/index.js';

const options = {formats: ['QRCode'], maxNumberOfSymbols: 1};

self.onmessage = async ({data}) => {
  try {
    const image = new ImageData(new Uint8ClampedArray(data.buffer), data.width, data.height);
    const results = await readBarcodesFromImageData(image, options);
    self.postMessage({id: data.id, results: results.map((r) => ({text: r.text, position: r.position})), buffer: data.buffer}, [data.buffer]);
  } catch (error) {
    self.postMessage({id: data.id, error: String(error?.message || error), buffer: data.buffer}, [data.buffer]);
  }
};

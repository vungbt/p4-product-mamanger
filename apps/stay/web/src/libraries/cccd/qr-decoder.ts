/**
 * In-browser QR decoding for the CCCD scanner: the native `BarcodeDetector` when the browser has
 * one (Chrome on Android, Safari 17+…), else `jsqr`, loaded on first use so it stays out of the
 * main bundle. Nothing leaves the device.
 */

/** Decodes the QR code drawn on `canvas`; `null` when none is found. */
export type QrDecoder = (canvas: HTMLCanvasElement) => Promise<string | null>;

type NativeDetector = { detect: (source: CanvasImageSource) => Promise<{ rawValue: string }[]> };
type NativeDetectorClass = {
  new (options: { formats: string[] }): NativeDetector;
  getSupportedFormats?: () => Promise<string[]>;
};

let jsqrDecoder: Promise<QrDecoder> | null = null;
let nativeDecoder: Promise<QrDecoder | null> | null = null;

function loadJsqr(): Promise<QrDecoder> {
  jsqrDecoder ??= import('jsqr')
    .then(({ default: jsQR }): QrDecoder => {
      return async (canvas) => {
        const context = canvas.getContext('2d', { willReadFrequently: true });

        if (!context || !canvas.width || !canvas.height) return null;
        const image = context.getImageData(0, 0, canvas.width, canvas.height);

        return (
          jsQR(image.data, image.width, image.height, { inversionAttempts: 'attemptBoth' })?.data ||
          null
        );
      };
    })
    .catch((error: unknown) => {
      // A failed chunk load may succeed on the next attempt.
      jsqrDecoder = null;
      throw error;
    });
  return jsqrDecoder;
}

function loadNative(): Promise<QrDecoder | null> {
  nativeDecoder ??= (async () => {
    const Detector = (globalThis as { BarcodeDetector?: NativeDetectorClass }).BarcodeDetector;

    if (!Detector) return null;
    try {
      const formats = (await Detector.getSupportedFormats?.()) ?? [];

      if (!formats.includes('qr_code')) return null;
      const detector = new Detector({ formats: ['qr_code'] });

      return async (canvas: HTMLCanvasElement) => {
        const [code] = await detector.detect(canvas);

        return code?.rawValue || null;
      };
    } catch {
      return null;
    }
  })();
  return nativeDecoder;
}

/**
 * The decoder for camera frames: native when available (fast enough for every frame), else
 * `jsqr`. `thorough` (a picked photo) also tries `jsqr` when the native detector finds nothing.
 */
export async function loadQrDecoder({ thorough = false } = {}): Promise<QrDecoder> {
  const native = await loadNative();

  if (!native) return loadJsqr();
  if (!thorough) return native;
  return async (canvas) => (await native(canvas)) ?? (await (await loadJsqr())(canvas));
}

/** Draws `source` on `canvas`, scaled so its longer side is at most `maxSide` pixels. */
export function drawScaled(
  canvas: HTMLCanvasElement,
  source: CanvasImageSource,
  width: number,
  height: number,
  maxSide: number,
): boolean {
  if (!width || !height) return false;
  const scale = Math.min(1, maxSide / Math.max(width, height));

  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const context = canvas.getContext('2d', { willReadFrequently: true });

  if (!context) return false;
  context.drawImage(source, 0, 0, canvas.width, canvas.height);
  return true;
}

/** Decodes a picked photo, trying a large and a smaller size (dense codes on big photos). */
export async function decodeQrFile(file: Blob): Promise<string | null> {
  const bitmap = await createImageBitmap(file);

  try {
    const decode = await loadQrDecoder({ thorough: true });
    const canvas = document.createElement('canvas');

    for (const maxSide of [2000, 1200, 800]) {
      if (!drawScaled(canvas, bitmap, bitmap.width, bitmap.height, maxSide)) return null;
      const text = await decode(canvas);

      if (text) return text;
    }
    return null;
  } finally {
    bitmap.close();
  }
}

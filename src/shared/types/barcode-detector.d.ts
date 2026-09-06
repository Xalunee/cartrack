/**
 * `BarcodeDetector` is a real API in Chrome on Android — it reads a QR straight
 * out of the video stream, with no JavaScript decoder in the bundle — but it is
 * not in TypeScript's DOM library, because Safari and Firefox do not implement
 * it. Only the parts we call are declared; everything else about it stays
 * unknown on purpose, so nothing can accidentally depend on it.
 */
interface DetectedBarcode {
  rawValue: string
  format: string
}

declare class BarcodeDetector {
  constructor(options?: { formats?: string[] })
  static getSupportedFormats(): Promise<string[]>
  detect(source: CanvasImageSource): Promise<DetectedBarcode[]>
}

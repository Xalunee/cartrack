/**
 * A QR reader for the receipt scanner, in two flavours behind one function.
 *
 * Native `BarcodeDetector` is used wherever it exists — Chrome on Android has
 * it, it decodes on the platform's own (often hardware-backed) path, and it
 * costs zero bytes of bundle.
 *
 * Safari on iOS has no such thing, so a JavaScript decoder is needed there, and
 * the choice is `jsqr`: it is a single pure function over raw `ImageData` with
 * no DOM, worker or WASM assets to host, about 40 KB minified — an order of
 * magnitude smaller than the ZXing ports — and it decodes only QR, which is
 * exactly and only what a fiscal receipt carries. It is imported dynamically, so
 * a phone with the native detector never downloads it, and the phones that do
 * download it pay for it when the camera opens rather than when the app starts.
 */
export type FrameDecoder = (video: HTMLVideoElement) => Promise<string | null>

async function nativeDecoder(): Promise<FrameDecoder | null> {
  if (typeof BarcodeDetector === 'undefined') return null

  // Present but without QR support is a real combination on older builds, and it
  // fails silently — every frame simply finds nothing — so it is checked rather
  // than assumed.
  const formats = await BarcodeDetector.getSupportedFormats()
  if (!formats.includes('qr_code')) return null

  const detector = new BarcodeDetector({ formats: ['qr_code'] })
  return async (video) => {
    const found = await detector.detect(video)
    return found[0]?.rawValue ?? null
  }
}

function jsqrDecoder(decode: typeof import('jsqr').default): FrameDecoder {
  // One canvas for the whole session: allocating a new one per frame is what
  // turns a scanner into a memory sawmill on a phone.
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d', { willReadFrequently: true })

  return async (video) => {
    if (!context || !video.videoWidth || !video.videoHeight) return null

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    const frame = context.getImageData(0, 0, canvas.width, canvas.height)
    // The code is printed black-on-white on a receipt, but a photographed
    // receipt under a canopy light is often read inverted — trying both costs
    // one extra pass and saves a scan that otherwise just never resolves.
    return decode(frame.data, frame.width, frame.height, { inversionAttempts: 'attemptBoth' })
      ?.data ?? null
  }
}

/**
 * Returns a decoder, or null when this browser can offer neither — the caller
 * says so in one line and leaves the manual form in place.
 */
export async function createQrDecoder(): Promise<FrameDecoder | null> {
  try {
    const native = await nativeDecoder()
    if (native) return native
  } catch {
    // A detector that exists but throws on construction is the same situation as
    // one that is missing: fall through to the JavaScript decoder.
  }

  try {
    const { default: jsQR } = await import('jsqr')
    return jsqrDecoder(jsQR)
  } catch {
    return null
  }
}

import {
  SCREENSHOT_MAX_DATA_URL_BYTES,
  SCREENSHOT_SIZE_MESSAGE,
} from '@shared/lib/validation/support'

/**
 * A phone screenshot is routinely 3–5 MB, which is well past what we are willing
 * to put in a request body — and none of that detail survives being looked at in
 * Telegram anyway. So the image is redrawn at a readable width and re-encoded as
 * JPEG before it becomes a data URL, and only what comes out of that is checked
 * against the bound.
 */
const MAX_EDGE_PX = 1600
const JPEG_QUALITY = 0.8

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Не удалось прочитать изображение'))
    }
    img.src = url
  })
}

/**
 * Returns a `data:image/jpeg;base64,…` URL, or throws with a message meant for
 * the user. The caller keeps the result in memory only — nothing is uploaded
 * until the ticket itself is submitted.
 */
export async function fileToScreenshotDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Это не изображение')
  }

  const img = await loadImage(file)
  const scale = Math.min(1, MAX_EDGE_PX / Math.max(img.width, img.height))

  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(img.width * scale))
  canvas.height = Math.max(1, Math.round(img.height * scale))

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Не удалось обработать изображение')
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

  const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY)
  if (dataUrl.length > SCREENSHOT_MAX_DATA_URL_BYTES) {
    throw new Error(SCREENSHOT_SIZE_MESSAGE)
  }

  return dataUrl
}

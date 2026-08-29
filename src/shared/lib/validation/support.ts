import { z } from 'zod'
import { textField } from './limits'

/**
 * The screenshot never reaches our database or a bucket — it is forwarded to
 * Telegram and dropped. The bound is on the *data URL*, which is what actually
 * travels in the request body: base64 inflates the file by ~4/3, so this accepts
 * roughly a 1.5 MB image. Telegram's own photo limit is 10 MB, so the binding
 * constraint here is our request body, not theirs.
 */
export const SCREENSHOT_MAX_DATA_URL_BYTES = 2 * 1024 * 1024

/** What the browser's FileReader produces, and the only shapes we forward. */
const SCREENSHOT_DATA_URL = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/

export const SCREENSHOT_TYPE_MESSAGE = 'Поддерживаются PNG, JPEG и WebP'
export const SCREENSHOT_SIZE_MESSAGE = 'Скриншот слишком большой — до 1,5 МБ'

export function screenshotField() {
  return z
    .string()
    .regex(SCREENSHOT_DATA_URL, SCREENSHOT_TYPE_MESSAGE)
    .refine((value) => value.length <= SCREENSHOT_MAX_DATA_URL_BYTES, {
      message: SCREENSHOT_SIZE_MESSAGE,
    })
}

/**
 * The message body. `textField()` carries the shared 500-character bound, so the
 * form and the route cannot drift apart on how long a request may be.
 */
export function supportMessageField() {
  // The floor is deliberately low: the same field carries a first description and
  // a one-word follow-up ("ок, спасибо"), and refusing the second would push
  // people into opening a new ticket to say it.
  return textField().min(2, 'Напишите сообщение')
}

/**
 * Everything the client is trusted to report about itself. The rest of the
 * context — user agent, app version, whether a car exists — is assembled on the
 * server, where it cannot be dressed up.
 */
export const supportRequestSchema = z.object({
  message: supportMessageField(),
  screenshot: screenshotField().optional(),
  standalone: z.boolean().optional(),
  /**
   * Continues an existing conversation instead of opening a new one. Ownership
   * is checked server-side — an id alone proves nothing.
   */
  ticketId: z.string().min(1).max(64).optional(),
})

export type SupportRequest = z.infer<typeof supportRequestSchema>

/** The silent technical envelope stored on the ticket and shown to the admin. */
export interface SupportContext {
  /** Deploy the report came from — the commit sha on Vercel, `dev` locally. */
  appVersion: string
  userAgent?: string
  /** Installed as a PWA rather than opened in a browser tab. */
  standalone?: boolean
  hasCar: boolean
}

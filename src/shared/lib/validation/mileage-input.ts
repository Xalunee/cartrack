import { LIMITS } from './limits'

export type MileageInputResult =
  | { ok: true; mileage: number }
  | { ok: false; reason: 'not_a_number' | 'too_large' }

/**
 * Parses a free-text odometer reading, as typed into the Telegram chat.
 *
 * Spaces are stripped because people write thousands as "87 650", but the whole
 * remaining string must be digits: parseInt would happily read "123abc" as 123
 * and store a number the user never meant.
 */
export function parseMileageInput(text: string): MileageInputResult {
  const compact = text.trim().replace(/\s/g, '')
  if (!/^\d+$/.test(compact)) return { ok: false, reason: 'not_a_number' }

  const mileage = Number(compact)
  if (!Number.isSafeInteger(mileage)) return { ok: false, reason: 'too_large' }

  // Same ceiling the web forms and API routes use. Without it a mistyped reading
  // is stored, becomes currentMileage, and then rejects every real one after it.
  if (mileage > LIMITS.mileage) return { ok: false, reason: 'too_large' }

  return { ok: true, mileage }
}

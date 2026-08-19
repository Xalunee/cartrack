import { z } from 'zod'

/**
 * Upper bounds for every user-supplied value. They live here, not inline in each
 * schema, because the same field is validated twice — once in the browser form and
 * once in the route that receives it — and a client bound that the server does not
 * share is only a false sense of safety.
 *
 * The numbers are deliberately loose: they exist to keep nonsense out of the
 * database, not to second-guess a plausible car. Where a bound is tighter than the
 * column could physically hold, the reason is written next to it.
 */
export const LIMITS = {
  /**
   * Int4 tops out at 2 147 483 647, so anything past it makes Prisma throw an
   * unhandled 500 instead of returning a validation error. 2 000 000 km is far
   * beyond any car this app will track (a hard-worked truck does ~150 000 km a
   * year) while staying three orders of magnitude clear of the column limit. The
   * documented odometer record is higher, ~5 200 000 km, but a reading that large
   * is far likelier to be a typo than a Volvo P1800.
   */
  mileage: 2_000_000,
  /**
   * `cost` is a Float, so an unbounded value is storable and then summed into
   * `totalSpent`, where a single 1e308 record turns the total into Infinity.
   * 10 000 000 ₽ is more than a private car is worth, let alone one service.
   */
  cost: 10_000_000,
  /** No real service interval approaches this; it only has to stay inside Int4. */
  intervalKm: 1_000_000,
  /** 100 years. Anything longer is not a maintenance interval. */
  intervalDays: 36_500,
  /** Cars predating this are museum pieces, not daily drivers. */
  yearMin: 1900,
  /**
   * Free-text fields are re-serialised into every subsequent list response — GET
   * /api/mileage returns all logs unpaginated — so one oversized note degrades
   * every later read for that car. 500 chars is a paragraph.
   */
  textLength: 500,
  /** Names, titles, brands, models: a label, not a description. */
  nameLength: 100,
  /** Longest real plate formats sit well under this. */
  licensePlateLength: 15,
  /** RFC 5321 caps an address at 254 characters. */
  emailLength: 254,
  /**
   * bcrypt ignores everything past 72 bytes, so a longer password is already
   * silently truncated. Bounding it keeps a multi-megabyte body out of the hasher.
   */
  passwordLength: 200,
} as const

/** Newest model year worth accepting — next year's models go on sale early. */
export function maxCarYear(): number {
  return new Date().getFullYear() + 1
}

/**
 * Date inputs submit `yyyy-MM-dd`, which `new Date()` reads as UTC midnight, and
 * the day the user picked is their *local* day. East of UTC that midnight can sit
 * hours ahead of the current instant: at 02:00 in GMT+3 the form's own default
 * value is already "the future" by a strict comparison. The offsets in use run to
 * +14, so a day of slack accepts today everywhere while still rejecting the
 * 2030-dated reading that permanently poisons currentMileage.
 */
const FUTURE_DATE_TOLERANCE_MS = 24 * 60 * 60 * 1000

export const FUTURE_DATE_MESSAGE = 'Дата не может быть в будущем'

/** Shared rule behind every "not in the future" check, client and server. */
export function isFutureDate(value: string | Date, now: Date = new Date()): boolean {
  const time = value instanceof Date ? value.getTime() : new Date(value).getTime()
  if (Number.isNaN(time)) return false
  return time > now.getTime() + FUTURE_DATE_TOLERANCE_MS
}

// --- Field builders ---
//
// Each returns a fresh schema, so a caller can tighten it further — an edit form
// narrowing a mileage to its neighbours in history, say — without the extra check
// leaking into every other use of the same field.

/** Odometer readings, including service mileage. */
export function mileageField() {
  return z
    .number({ error: 'Введите число' })
    .int()
    .min(0, 'Пробег не может быть отрицательным')
    .max(LIMITS.mileage, `Пробег не может быть больше ${LIMITS.mileage.toLocaleString('ru')} км`)
}

export function costField() {
  return z
    .number({ error: 'Введите число' })
    .min(0, 'Стоимость не может быть отрицательной')
    .max(LIMITS.cost, `Стоимость не может быть больше ${LIMITS.cost.toLocaleString('ru')} ₽`)
}

export function intervalKmField() {
  return z
    .number({ error: 'Введите число' })
    .int()
    .positive()
    .max(LIMITS.intervalKm, `Интервал не может быть больше ${LIMITS.intervalKm.toLocaleString('ru')} км`)
}

export function intervalDaysField() {
  return z
    .number({ error: 'Введите число' })
    .int()
    .positive()
    .max(LIMITS.intervalDays, `Интервал не может быть больше ${LIMITS.intervalDays.toLocaleString('ru')} дн.`)
}

export function yearField() {
  return z
    .number({ error: 'Введите год' })
    .int()
    .min(LIMITS.yearMin, 'Некорректный год')
    .max(maxCarYear(), 'Некорректный год')
}

/** Free text: notes, descriptions. */
export function textField() {
  return z.string().max(LIMITS.textLength, `Не больше ${LIMITS.textLength} символов`)
}

/** A label — item name, event title, brand, model, person's name. */
export function nameField(requiredMessage: string) {
  return z
    .string()
    .min(1, requiredMessage)
    .max(LIMITS.nameLength, `Не больше ${LIMITS.nameLength} символов`)
}

export function licensePlateField() {
  return z.string().max(LIMITS.licensePlateLength, `Не больше ${LIMITS.licensePlateLength} символов`)
}

export function emailField() {
  return z.string().email('Неверный email').max(LIMITS.emailLength, 'Неверный email')
}

export function passwordField() {
  return z
    .string()
    .min(6, 'Минимум 6 символов')
    .max(LIMITS.passwordLength, `Не больше ${LIMITS.passwordLength} символов`)
}

/** `yyyy-MM-dd` from a date input, rejected if it names a future day. */
export function pastDateField(requiredMessage = 'Укажите дату') {
  return z
    .string()
    .min(1, requiredMessage)
    .refine((value) => !isFutureDate(value), { message: FUTURE_DATE_MESSAGE })
}

/** ISO datetime as the client sends it over the wire, same future rule. */
export function pastDateTimeField() {
  return z
    .string()
    .datetime()
    .refine((value) => !isFutureDate(value), { message: FUTURE_DATE_MESSAGE })
}

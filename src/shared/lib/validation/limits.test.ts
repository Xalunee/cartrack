import { describe, it, expect } from 'vitest'
import {
  LIMITS,
  FUTURE_DATE_MESSAGE,
  costField,
  emailField,
  intervalDaysField,
  intervalKmField,
  isFutureDate,
  licensePlateField,
  maxCarYear,
  mileageField,
  nameField,
  passwordField,
  pastDateField,
  pastDateTimeField,
  textField,
  yearField,
} from '@shared/lib/validation/limits'

/**
 * These are the schemas the forms and the routes both build on, so asserting on
 * them here is the same as asserting on both sides at once — a bound cannot drift
 * between client and server without one of these failing.
 */

describe('numeric ceilings', () => {
  it('accepts a mileage at the ceiling and rejects one past it', () => {
    expect(mileageField().safeParse(LIMITS.mileage).success).toBe(true)
    expect(mileageField().safeParse(LIMITS.mileage + 1).success).toBe(false)
  })

  it('rejects the values that used to reach the database', () => {
    // Stored fine as Int4, then no real reading could ever be logged again.
    expect(mileageField().safeParse(999_999_999).success).toBe(false)
    // Overflows Int4, so Prisma threw an unhandled 500 instead of a 400.
    expect(mileageField().safeParse(2_147_483_648).success).toBe(false)
  })

  it('still rejects negative and fractional readings', () => {
    expect(mileageField().safeParse(-1).success).toBe(false)
    expect(mileageField().safeParse(1000.5).success).toBe(false)
  })

  it('keeps a cost that would poison totalSpent out', () => {
    expect(costField().safeParse(LIMITS.cost).success).toBe(true)
    expect(costField().safeParse(LIMITS.cost + 1).success).toBe(false)
    // Summing this into totalSpent produced Infinity.
    expect(costField().safeParse(1e308).success).toBe(false)
  })

  it('bounds both interval kinds', () => {
    expect(intervalKmField().safeParse(LIMITS.intervalKm).success).toBe(true)
    expect(intervalKmField().safeParse(LIMITS.intervalKm + 1).success).toBe(false)
    expect(intervalKmField().safeParse(0).success).toBe(false)

    expect(intervalDaysField().safeParse(LIMITS.intervalDays).success).toBe(true)
    expect(intervalDaysField().safeParse(LIMITS.intervalDays + 1).success).toBe(false)
    expect(intervalDaysField().safeParse(0).success).toBe(false)
  })

  it('bounds the model year to next year at the latest', () => {
    expect(yearField().safeParse(maxCarYear()).success).toBe(true)
    expect(yearField().safeParse(maxCarYear() + 1).success).toBe(false)
    expect(yearField().safeParse(LIMITS.yearMin - 1).success).toBe(false)
  })
})

describe('string ceilings', () => {
  it('bounds free text at a paragraph', () => {
    expect(textField().safeParse('a'.repeat(LIMITS.textLength)).success).toBe(true)
    expect(textField().safeParse('a'.repeat(LIMITS.textLength + 1)).success).toBe(false)
  })

  it('rejects the note that used to be re-serialised into every list response', () => {
    expect(textField().safeParse('a'.repeat(10 * 1024 * 1024)).success).toBe(false)
  })

  it('bounds labels and keeps them non-empty', () => {
    const field = nameField('Введите название')
    expect(field.safeParse('a'.repeat(LIMITS.nameLength)).success).toBe(true)
    expect(field.safeParse('a'.repeat(LIMITS.nameLength + 1)).success).toBe(false)

    const empty = field.safeParse('')
    expect(empty.success).toBe(false)
    if (!empty.success) expect(empty.error.issues[0].message).toBe('Введите название')
  })

  it('bounds plates, emails and passwords', () => {
    expect(licensePlateField().safeParse('a'.repeat(LIMITS.licensePlateLength)).success).toBe(true)
    expect(licensePlateField().safeParse('a'.repeat(LIMITS.licensePlateLength + 1)).success).toBe(false)

    expect(emailField().safeParse(`${'a'.repeat(LIMITS.emailLength)}@x.ru`).success).toBe(false)
    expect(emailField().safeParse('driver@example.ru').success).toBe(true)

    expect(passwordField().safeParse('a'.repeat(LIMITS.passwordLength)).success).toBe(true)
    expect(passwordField().safeParse('a'.repeat(LIMITS.passwordLength + 1)).success).toBe(false)
    expect(passwordField().safeParse('12345').success).toBe(false)
  })
})

describe('isFutureDate', () => {
  const now = new Date('2026-08-19T10:00:00.000Z')

  it('accepts today and the recent past', () => {
    expect(isFutureDate('2026-08-19T09:00:00.000Z', now)).toBe(false)
    expect(isFutureDate('2020-01-01T00:00:00.000Z', now)).toBe(false)
  })

  it('accepts the UTC midnight a date picker sends for a local day ahead of UTC', () => {
    // 01:00 on 20 Aug in GMT+14 is still 19 Aug 11:00 UTC. The picker's own
    // default value must not be rejected as a future date.
    expect(isFutureDate('2026-08-20T00:00:00.000Z', now)).toBe(false)
  })

  it('rejects a day that is genuinely in the future', () => {
    expect(isFutureDate('2026-08-21T00:00:00.000Z', now)).toBe(true)
    expect(isFutureDate('2030-01-01T00:00:00.000Z', now)).toBe(true)
  })

  it('treats an unparseable value as not-future and leaves it to the format check', () => {
    expect(isFutureDate('не дата', now)).toBe(false)
  })

  it('accepts a Date as well as a string', () => {
    expect(isFutureDate(new Date('2030-01-01T00:00:00.000Z'), now)).toBe(true)
    expect(isFutureDate(new Date('2026-08-18T00:00:00.000Z'), now)).toBe(false)
  })
})

describe('date fields', () => {
  it('rejects a far-future day with the shared message', () => {
    const parsed = pastDateField().safeParse('2030-01-01')
    expect(parsed.success).toBe(false)
    if (!parsed.success) expect(parsed.error.issues[0].message).toBe(FUTURE_DATE_MESSAGE)
  })

  it('requires a date and accepts a past one', () => {
    expect(pastDateField().safeParse('').success).toBe(false)
    expect(pastDateField().safeParse('2024-03-01').success).toBe(true)
  })

  it('holds the wire format to ISO and to the same future rule', () => {
    expect(pastDateTimeField().safeParse('2024-03-01').success).toBe(false)
    expect(pastDateTimeField().safeParse('2024-03-01T12:00:00.000Z').success).toBe(true)
    expect(pastDateTimeField().safeParse('2030-01-01T00:00:00.000Z').success).toBe(false)
  })
})

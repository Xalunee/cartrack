import { describe, expect, it } from 'vitest'
import { LIMITS } from './limits'
import { parseMileageInput } from './mileage-input'

describe('parseMileageInput', () => {
  it('accepts a plain number', () => {
    expect(parseMileageInput('87650')).toEqual({ ok: true, mileage: 87650 })
  })

  it('accepts spaces as thousand separators', () => {
    expect(parseMileageInput(' 87 650 ')).toEqual({ ok: true, mileage: 87650 })
    expect(parseMileageInput('1 000')).toEqual({ ok: true, mileage: 1000 })
  })

  it('accepts zero', () => {
    expect(parseMileageInput('0')).toEqual({ ok: true, mileage: 0 })
  })

  it('rejects a numeric prefix instead of salvaging it', () => {
    expect(parseMileageInput('123abc')).toEqual({ ok: false, reason: 'not_a_number' })
    expect(parseMileageInput('87650 км')).toEqual({ ok: false, reason: 'not_a_number' })
  })

  it('rejects non-numeric and empty input', () => {
    for (const text of ['', '   ', 'привет', '-100', '12.5', '1e5', '+5', '١٢٣']) {
      expect(parseMileageInput(text)).toEqual({ ok: false, reason: 'not_a_number' })
    }
  })

  it('rejects readings above the shared ceiling', () => {
    expect(parseMileageInput(String(LIMITS.mileage))).toEqual({
      ok: true,
      mileage: LIMITS.mileage,
    })
    expect(parseMileageInput(String(LIMITS.mileage + 1))).toEqual({
      ok: false,
      reason: 'too_large',
    })
    expect(parseMileageInput('9'.repeat(30))).toEqual({ ok: false, reason: 'too_large' })
  })
})

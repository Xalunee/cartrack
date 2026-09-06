import { describe, it, expect } from 'vitest'
import type { FuelSegment, FuelSegmentStatus } from '@shared/types'
import { describeFuelSegment, formatConsumption } from './segmentText'

function segment(status: FuelSegmentStatus, consumption: number | null = 9.4): FuelSegment {
  return {
    fromEntryId: 'a',
    toEntryId: 'b',
    fromDate: new Date('2026-01-01T00:00:00.000Z'),
    toDate: new Date('2026-01-10T00:00:00.000Z'),
    distanceKm: consumption === null ? null : 520,
    liters: 48,
    consumption,
    status,
  }
}

describe('formatConsumption', () => {
  it('оставляет один знак после запятой', () => {
    expect(formatConsumption(9.4444)).toBe('9,4 л/100 км')
  })

  it('целое показывает без хвоста', () => {
    expect(formatConsumption(10)).toBe('10 л/100 км')
  })
})

describe('describeFuelSegment', () => {
  it('посчитанный отрезок показывает число и расстояние', () => {
    const label = describeFuelSegment({ isFullTank: true }, segment('ok'))
    expect(label.tone).toBe('ok')
    expect(label.text).toContain('9,4 л/100 км')
    expect(label.text).toContain('520 км')
  })

  it('выброс называет число и говорит, что в среднее оно не идёт', () => {
    const label = describeFuelSegment({ isFullTank: true }, segment('outlier', 4.2))
    expect(label.tone).toBe('warn')
    expect(label.text).toContain('4,2 л/100 км')
    expect(label.text).toContain('в среднее не идёт')
  })

  it.each([
    ['missing-mileage', 'одометр'],
    ['missed-entry', 'незаписанная заправка'],
    ['no-distance', 'одометр не вырос'],
  ] as const)('причину %s объясняет словами', (status, expected) => {
    const label = describeFuelSegment({ isFullTank: true }, segment(status, null))
    expect(label.text).toContain(expected)
    expect(label.tone).toBe('muted')
  })

  it('полная заправка без отрезка ждёт следующую', () => {
    const label = describeFuelSegment({ isFullTank: true }, null)
    expect(label.text).toContain('следующей заправки до полного')
  })

  it('неполная заправка объясняет, куда денутся её литры', () => {
    const label = describeFuelSegment({ isFullTank: false }, null)
    expect(label.text).toContain('следующего полного бака')
  })

  it('строка есть всегда — пустого места под записью не бывает', () => {
    const statuses: FuelSegmentStatus[] = [
      'ok',
      'outlier',
      'missing-mileage',
      'missed-entry',
      'no-distance',
    ]
    for (const status of statuses) {
      expect(describeFuelSegment({ isFullTank: true }, segment(status)).text.length).toBeGreaterThan(0)
    }
    expect(describeFuelSegment({ isFullTank: true }, null).text.length).toBeGreaterThan(0)
    expect(describeFuelSegment({ isFullTank: false }, null).text.length).toBeGreaterThan(0)
  })
})

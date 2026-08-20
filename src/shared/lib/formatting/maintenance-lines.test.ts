import { describe, expect, it } from 'vitest'
import { formatAlerts, formatItemLine, formatMaintenanceStatus, remainingText } from './maintenance-lines'
import type { RemainingResource } from '@shared/types'

const NOW = new Date()
const DAY = 24 * 60 * 60 * 1000

function resource(over: Partial<RemainingResource> = {}): RemainingResource {
  return {
    remainingKm: null,
    remainingDays: null,
    usedPercent: 0,
    status: 'ok',
    forecastDate: null,
    ...over,
  }
}

/** An item due in `days` days on a day-only interval — no intervalKm at all. */
function daysOnlyItem(name: string, intervalDays: number, ageDays: number) {
  return {
    name,
    intervalKm: null,
    intervalDays,
    lastServiceMileage: null,
    lastServiceDate: new Date(NOW.getTime() - ageDays * DAY),
  }
}

describe('remainingText', () => {
  it('renders a remaining amount without a prefix', () => {
    expect(remainingText(500, 'км')).toBe('500 км')
  })

  it('renders the due and overdue cases', () => {
    expect(remainingText(0, 'км')).toBe('пора')
    expect(remainingText(-120, 'дн.')).toBe('просрочено на 120 дн.')
  })
})

describe('formatItemLine', () => {
  it('marks an item with no computable data', () => {
    expect(formatItemLine('Масло', resource())).toBe('➖ Масло — нет данных')
  })

  it('joins km and days on one line', () => {
    const line = formatItemLine(
      'Масло',
      resource({ remainingKm: 500, remainingDays: 30, status: 'soon' })
    )
    expect(line).toBe('🟡 Масло — 500 км · 30 дн.')
  })

  it('keeps the forecast off a days-only line', () => {
    const line = formatItemLine(
      'Страховка',
      resource({ remainingDays: 30, status: 'soon', forecastDate: new Date(NOW.getTime() + 30 * DAY) })
    )
    expect(line).toBe('🟡 Страховка — 30 дн.')
  })
})

describe('formatAlerts', () => {
  it('reports a day-interval-only item that is overdue', () => {
    // The case the cron's old intervalKm-only arithmetic could never see.
    const alerts = formatAlerts([daysOnlyItem('Страховка', 365, 545)], 100_000, null)
    expect(alerts).toEqual(['🔴 Страховка — просрочено на 180 дн.'])
  })

  it('leaves healthy items out', () => {
    expect(formatAlerts([daysOnlyItem('Страховка', 365, 10)], 100_000, null)).toEqual([])
  })

  it('sorts critical before soon', () => {
    const alerts = formatAlerts(
      [daysOnlyItem('Скоро', 365, 300), daysOnlyItem('Просрочено', 365, 400)],
      100_000,
      null
    )
    expect(alerts.map((line) => line.slice(0, 2))).toEqual(['🔴', '🟡'])
  })
})

describe('formatMaintenanceStatus', () => {
  it('handles a car with no items', () => {
    expect(formatMaintenanceStatus([], 100_000, null)).toBe('Нет позиций обслуживания')
  })
})

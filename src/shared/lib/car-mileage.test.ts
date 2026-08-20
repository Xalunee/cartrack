import { describe, expect, it } from 'vitest'
import {
  projectMileageAfterRemoval,
  resolveServiceLogSync,
  selectPairedMileageLog,
  serviceMileageLogNote,
} from './car-mileage'

const RECORD_DATE = new Date('2026-03-01T10:00:00.000Z')

function log(id: string, recordedAt: string) {
  return { id, recordedAt: new Date(recordedAt) }
}

describe('serviceMileageLogNote', () => {
  it('matches the note the complete route writes', () => {
    expect(serviceMileageLogNote('Масло')).toBe('Обслуживание: Масло')
  })
})

describe('selectPairedMileageLog', () => {
  it('returns null when the record has no paired log', () => {
    expect(selectPairedMileageLog([], RECORD_DATE)).toBeNull()
  })

  it('returns the only candidate even if its date drifted from the record', () => {
    const only = log('a', '2026-02-20T00:00:00.000Z')
    expect(selectPairedMileageLog([only], RECORD_DATE)).toBe(only)
  })

  it('breaks a tie on the record date', () => {
    const match = log('a', RECORD_DATE.toISOString())
    const other = log('b', '2026-01-01T00:00:00.000Z')
    expect(selectPairedMileageLog([other, match], RECORD_DATE)).toBe(match)
  })

  it('refuses to guess when the date does not disambiguate', () => {
    const a = log('a', RECORD_DATE.toISOString())
    const b = log('b', RECORD_DATE.toISOString())
    expect(selectPairedMileageLog([a, b], RECORD_DATE)).toBeNull()
  })

  it('refuses to guess when no candidate carries the record date', () => {
    const a = log('a', '2026-01-01T00:00:00.000Z')
    const b = log('b', '2026-02-01T00:00:00.000Z')
    expect(selectPairedMileageLog([a, b], RECORD_DATE)).toBeNull()
  })
})

describe('resolveServiceLogSync', () => {
  const record = { mileage: 100_000, date: RECORD_DATE }

  it('reports nothing to sync when neither field was sent', () => {
    expect(resolveServiceLogSync(record, {})).toEqual({
      mileageChanged: false,
      dateChanged: false,
      pointChanged: false,
    })
  })

  it('reports nothing to sync when the sent values match what is stored', () => {
    const sync = resolveServiceLogSync(record, {
      mileage: 100_000,
      date: new Date(RECORD_DATE),
    })
    expect(sync.pointChanged).toBe(false)
  })

  it('treats an unsent date as unchanged even when the mileage moves', () => {
    // The regression: the paired log's own date may have been corrected
    // separately, and a mileage-only edit must leave that correction alone.
    const sync = resolveServiceLogSync(record, { mileage: 95_000 })
    expect(sync).toEqual({ mileageChanged: true, dateChanged: false, pointChanged: true })
  })

  it('treats an unsent mileage as unchanged even when the date moves', () => {
    const sync = resolveServiceLogSync(record, { date: new Date('2026-03-05T00:00:00.000Z') })
    expect(sync).toEqual({ mileageChanged: false, dateChanged: true, pointChanged: true })
  })

  it('reports both when both actually moved', () => {
    const sync = resolveServiceLogSync(record, {
      mileage: 95_000,
      date: new Date('2026-03-05T00:00:00.000Z'),
    })
    expect(sync).toEqual({ mileageChanged: true, dateChanged: true, pointChanged: true })
  })

  it('compares dates by value, not identity', () => {
    const sync = resolveServiceLogSync(record, { date: new Date(RECORD_DATE.getTime()) })
    expect(sync.dateChanged).toBe(false)
  })
})

describe('projectMileageAfterRemoval', () => {
  it('leaves the odometer alone when the removed log was the only one', () => {
    // recomputeCurrentMileage returns null and does not touch the car, so the
    // preview must not promise a drop to zero.
    expect(projectMileageAfterRemoval(142_500, null)).toEqual({
      mileage: 142_500,
      changed: false,
    })
  })

  it('drops to the surviving reading when the removed log was the newest', () => {
    expect(projectMileageAfterRemoval(142_500, { mileage: 138_200 })).toEqual({
      mileage: 138_200,
      changed: true,
    })
  })

  it('reports no change when an older log is removed', () => {
    // The newest reading still carries the same number the car already shows.
    expect(projectMileageAfterRemoval(142_500, { mileage: 142_500 })).toEqual({
      mileage: 142_500,
      changed: false,
    })
  })
})

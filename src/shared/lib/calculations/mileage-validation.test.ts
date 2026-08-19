import { describe, it, expect } from 'vitest'
import {
  validateMileagePoint,
  isBigJump,
  LARGE_JUMP_THRESHOLD,
} from '@shared/lib/calculations/mileage-validation'

/**
 * In-memory stand-in for the Prisma client. It re-implements the `where` /
 * `orderBy` semantics that validateMileagePoint actually uses, so the tests
 * exercise the real neighbour-selection logic rather than canned return values.
 */
interface Row {
  id: string
  carId: string
  mileage: number
  recordedAt: Date
}

interface FindFirstArgs {
  where: {
    carId: string
    recordedAt?: { lte?: Date; gt?: Date }
    id?: { not: string }
  }
  orderBy: { recordedAt: 'asc' | 'desc' }
}

function fakeDb(rows: Row[]) {
  const calls: FindFirstArgs[] = []
  const client = {
    mileageLog: {
      findFirst(args: FindFirstArgs) {
        calls.push(args)
        const { where, orderBy } = args
        const matched = rows
          .filter((r) => r.carId === where.carId)
          .filter((r) => {
            const at = r.recordedAt.getTime()
            if (where.recordedAt?.lte !== undefined) {
              return at <= where.recordedAt.lte.getTime()
            }
            if (where.recordedAt?.gt !== undefined) {
              return at > where.recordedAt.gt.getTime()
            }
            return true
          })
          .filter((r) => (where.id?.not ? r.id !== where.id.not : true))
          .sort((a, b) =>
            orderBy.recordedAt === 'asc'
              ? a.recordedAt.getTime() - b.recordedAt.getTime()
              : b.recordedAt.getTime() - a.recordedAt.getTime()
          )
        return Promise.resolve(matched[0] ?? null)
      },
    },
  }
  // The function only ever touches tx.mileageLog.findFirst.
  return { client: client as unknown as Parameters<typeof validateMileagePoint>[0], calls }
}

const CAR = 'car-1'
const OTHER_CAR = 'car-2'

function row(id: string, isoDate: string, mileage: number, carId = CAR): Row {
  return { id, carId, mileage, recordedAt: new Date(isoDate) }
}

/** Two existing logs: 10 000 km on 1 Jan, 12 000 km on 1 Mar. */
const EXISTING = [
  row('a', '2026-01-01T00:00:00.000Z', 10_000),
  row('b', '2026-03-01T00:00:00.000Z', 12_000),
]

function candidate(isoDate: string, mileage: number) {
  return { mileage, recordedAt: new Date(isoDate) }
}

describe('validateMileagePoint', () => {
  describe('between two neighbours', () => {
    it('accepts a mileage inside the neighbours’ range', () => {
      const { client } = fakeDb(EXISTING)
      return expect(
        validateMileagePoint(client, CAR, candidate('2026-02-01T00:00:00.000Z', 11_000))
      ).resolves.toEqual({ ok: true })
    })

    it('rejects a mileage below the nearest earlier log', async () => {
      const { client } = fakeDb(EXISTING)
      const result = await validateMileagePoint(
        client,
        CAR,
        candidate('2026-02-01T00:00:00.000Z', 9_500)
      )
      expect(result.ok).toBe(false)
      if (result.ok) throw new Error('unreachable')
      expect(result.code).toBe('LOWER_THAN_EARLIER_LOG')
      expect(result.message).toBeTruthy()
      expect(result.suggestion).toBeTruthy()
    })

    it('names the conflicting earlier record in the message', async () => {
      const { client } = fakeDb(EXISTING)
      const result = await validateMileagePoint(
        client,
        CAR,
        candidate('2026-02-01T00:00:00.000Z', 9_500)
      )
      if (result.ok) throw new Error('expected rejection')
      // 10 000 formatted for ru locale uses a non-breaking space.
      expect(result.message).toContain('10')
      expect(result.message).toContain('000')
      expect(result.message).toContain('2026')
    })

    it('rejects a mileage above the nearest later log (odometer runs backwards)', async () => {
      const { client } = fakeDb(EXISTING)
      const result = await validateMileagePoint(
        client,
        CAR,
        candidate('2026-02-01T00:00:00.000Z', 13_000)
      )
      expect(result.ok).toBe(false)
      if (result.ok) throw new Error('unreachable')
      expect(result.code).toBe('HIGHER_THAN_LATER_LOG')
      expect(result.message).toBeTruthy()
      expect(result.suggestion).toBeTruthy()
    })

    it('reports the earlier-log conflict first when both bounds are violated', async () => {
      // Existing data is itself inconsistent: 12 000 in Jan, 10 000 in Mar.
      const broken = [
        row('a', '2026-01-01T00:00:00.000Z', 12_000),
        row('b', '2026-03-01T00:00:00.000Z', 10_000),
      ]
      const { client } = fakeDb(broken)
      const result = await validateMileagePoint(
        client,
        CAR,
        candidate('2026-02-01T00:00:00.000Z', 11_000)
      )
      if (result.ok) throw new Error('expected rejection')
      expect(result.code).toBe('LOWER_THAN_EARLIER_LOG')
    })

    it('picks the nearest earlier neighbour, not the oldest', async () => {
      const rows = [
        row('a', '2026-01-01T00:00:00.000Z', 10_000),
        row('b', '2026-02-01T00:00:00.000Z', 11_000), // nearest earlier
        row('c', '2026-04-01T00:00:00.000Z', 13_000),
      ]
      const { client } = fakeDb(rows)
      // 10 500 clears the Jan log but not the Feb one.
      const result = await validateMileagePoint(
        client,
        CAR,
        candidate('2026-03-01T00:00:00.000Z', 10_500)
      )
      if (result.ok) throw new Error('expected rejection')
      expect(result.code).toBe('LOWER_THAN_EARLIER_LOG')
    })

    it('picks the nearest later neighbour, not the newest', async () => {
      const rows = [
        row('a', '2026-01-01T00:00:00.000Z', 10_000),
        row('b', '2026-03-01T00:00:00.000Z', 11_000), // nearest later
        row('c', '2026-06-01T00:00:00.000Z', 20_000),
      ]
      const { client } = fakeDb(rows)
      const result = await validateMileagePoint(
        client,
        CAR,
        candidate('2026-02-01T00:00:00.000Z', 15_000)
      )
      if (result.ok) throw new Error('expected rejection')
      expect(result.code).toBe('HIGHER_THAN_LATER_LOG')
    })
  })

  describe('newest candidate — the "Заменил" case', () => {
    it('allows any higher mileage when nothing later exists', async () => {
      const { client } = fakeDb(EXISTING)
      const result = await validateMileagePoint(
        client,
        CAR,
        candidate('2026-06-01T00:00:00.000Z', 99_999)
      )
      expect(result).toEqual({ ok: true })
    })

    it('still enforces the lower bound for the newest candidate', async () => {
      const { client } = fakeDb(EXISTING)
      const result = await validateMileagePoint(
        client,
        CAR,
        candidate('2026-06-01T00:00:00.000Z', 11_000)
      )
      if (result.ok) throw new Error('expected rejection')
      expect(result.code).toBe('LOWER_THAN_EARLIER_LOG')
    })

    it('applies no upper bound at all — an enormous jump is accepted', async () => {
      const { client } = fakeDb(EXISTING)
      const result = await validateMileagePoint(
        client,
        CAR,
        candidate('2026-12-31T00:00:00.000Z', 1_000_000)
      )
      expect(result).toEqual({ ok: true })
    })
  })

  describe('oldest candidate', () => {
    it('applies only the upper bound', async () => {
      const { client } = fakeDb(EXISTING)
      const result = await validateMileagePoint(
        client,
        CAR,
        candidate('2025-06-01T00:00:00.000Z', 5_000)
      )
      expect(result).toEqual({ ok: true })
    })

    it('rejects an oldest candidate above the nearest later log', async () => {
      const { client } = fakeDb(EXISTING)
      const result = await validateMileagePoint(
        client,
        CAR,
        candidate('2025-06-01T00:00:00.000Z', 10_500)
      )
      if (result.ok) throw new Error('expected rejection')
      expect(result.code).toBe('HIGHER_THAN_LATER_LOG')
    })

    it('accepts a mileage of zero as the oldest point', async () => {
      const { client } = fakeDb(EXISTING)
      const result = await validateMileagePoint(
        client,
        CAR,
        candidate('2025-01-01T00:00:00.000Z', 0)
      )
      expect(result).toEqual({ ok: true })
    })
  })

  describe('empty log list', () => {
    it('accepts any candidate when the car has no logs', async () => {
      const { client } = fakeDb([])
      const result = await validateMileagePoint(
        client,
        CAR,
        candidate('2026-02-01T00:00:00.000Z', 50_000)
      )
      expect(result).toEqual({ ok: true })
    })

    it('ignores logs belonging to another car', async () => {
      const { client } = fakeDb([
        row('x', '2026-01-01T00:00:00.000Z', 900_000, OTHER_CAR),
      ])
      const result = await validateMileagePoint(
        client,
        CAR,
        candidate('2026-02-01T00:00:00.000Z', 10_000)
      )
      expect(result).toEqual({ ok: true })
    })
  })

  describe('equal mileage to a neighbour', () => {
    // Readings must be non-decreasing, so equal is intentionally allowed —
    // a car that did not move keeps the same odometer reading.
    it('allows mileage equal to the earlier neighbour', async () => {
      const { client } = fakeDb(EXISTING)
      const result = await validateMileagePoint(
        client,
        CAR,
        candidate('2026-02-01T00:00:00.000Z', 10_000)
      )
      expect(result).toEqual({ ok: true })
    })

    it('allows mileage equal to the later neighbour', async () => {
      const { client } = fakeDb(EXISTING)
      const result = await validateMileagePoint(
        client,
        CAR,
        candidate('2026-02-01T00:00:00.000Z', 12_000)
      )
      expect(result).toEqual({ ok: true })
    })

    it('allows a candidate equal to both neighbours at once', async () => {
      const flat = [
        row('a', '2026-01-01T00:00:00.000Z', 10_000),
        row('b', '2026-03-01T00:00:00.000Z', 10_000),
      ]
      const { client } = fakeDb(flat)
      const result = await validateMileagePoint(
        client,
        CAR,
        candidate('2026-02-01T00:00:00.000Z', 10_000)
      )
      expect(result).toEqual({ ok: true })
    })
  })

  describe('same-timestamp candidate', () => {
    it('treats an existing log at the identical timestamp as the earlier bound', async () => {
      const { client } = fakeDb(EXISTING)
      // lte means the 1 Jan log is the "prev" for a candidate also on 1 Jan.
      const result = await validateMileagePoint(
        client,
        CAR,
        candidate('2026-01-01T00:00:00.000Z', 9_000)
      )
      if (result.ok) throw new Error('expected rejection')
      expect(result.code).toBe('LOWER_THAN_EARLIER_LOG')
    })

    it('accepts a same-timestamp candidate at or above that log', async () => {
      const { client } = fakeDb(EXISTING)
      const result = await validateMileagePoint(
        client,
        CAR,
        candidate('2026-01-01T00:00:00.000Z', 10_000)
      )
      expect(result).toEqual({ ok: true })
    })
  })

  describe('edit case — excludeLogId', () => {
    it('ignores the record being edited when finding the earlier neighbour', async () => {
      const { client } = fakeDb(EXISTING)
      // Correcting log "b" (12 000 on 1 Mar) down to 11 000. Without the
      // exclusion its own old value would be the lower bound and reject this.
      const result = await validateMileagePoint(
        client,
        CAR,
        candidate('2026-03-01T00:00:00.000Z', 11_000),
        'b'
      )
      expect(result).toEqual({ ok: true })
    })

    it('rejects the same edit when excludeLogId is omitted', async () => {
      const { client } = fakeDb(EXISTING)
      const result = await validateMileagePoint(
        client,
        CAR,
        candidate('2026-03-01T00:00:00.000Z', 11_000)
      )
      if (result.ok) throw new Error('expected rejection')
      expect(result.code).toBe('LOWER_THAN_EARLIER_LOG')
    })

    it('still enforces the remaining neighbours during an edit', async () => {
      const rows = [
        row('a', '2026-01-01T00:00:00.000Z', 10_000),
        row('b', '2026-03-01T00:00:00.000Z', 12_000),
        row('c', '2026-05-01T00:00:00.000Z', 14_000),
      ]
      const { client } = fakeDb(rows)
      // Editing "b" below the 1 Jan log must still fail.
      const low = await validateMileagePoint(
        client,
        CAR,
        candidate('2026-03-01T00:00:00.000Z', 9_000),
        'b'
      )
      if (low.ok) throw new Error('expected rejection')
      expect(low.code).toBe('LOWER_THAN_EARLIER_LOG')

      // Editing "b" above the 1 May log must still fail.
      const high = await validateMileagePoint(
        client,
        CAR,
        candidate('2026-03-01T00:00:00.000Z', 15_000),
        'b'
      )
      if (high.ok) throw new Error('expected rejection')
      expect(high.code).toBe('HIGHER_THAN_LATER_LOG')
    })

    it('passes the exclusion to both neighbour queries', async () => {
      const { client, calls } = fakeDb(EXISTING)
      await validateMileagePoint(
        client,
        CAR,
        candidate('2026-02-01T00:00:00.000Z', 11_000),
        'a'
      )
      expect(calls).toHaveLength(2)
      for (const call of calls) {
        expect(call.where.id).toEqual({ not: 'a' })
        expect(call.where.carId).toBe(CAR)
      }
    })

    it('does not filter by id when excludeLogId is undefined', async () => {
      const { client, calls } = fakeDb(EXISTING)
      await validateMileagePoint(
        client,
        CAR,
        candidate('2026-02-01T00:00:00.000Z', 11_000)
      )
      expect(calls).toHaveLength(2)
      for (const call of calls) {
        expect(call.where.id).toBeUndefined()
      }
    })

    it('allows an edit to move a lone record anywhere', async () => {
      const { client } = fakeDb([row('a', '2026-01-01T00:00:00.000Z', 10_000)])
      const result = await validateMileagePoint(
        client,
        CAR,
        candidate('2026-01-01T00:00:00.000Z', 1),
        'a'
      )
      expect(result).toEqual({ ok: true })
    })
  })
})

describe('isBigJump', () => {
  const BASE = 10_000

  it('flags a delta at the default threshold', () => {
    expect(isBigJump(BASE + LARGE_JUMP_THRESHOLD, BASE)).toEqual({
      big: true,
      delta: LARGE_JUMP_THRESHOLD,
    })
  })

  it('does not flag a delta just below the default threshold', () => {
    expect(isBigJump(BASE + LARGE_JUMP_THRESHOLD - 1, BASE)).toEqual({
      big: false,
      delta: LARGE_JUMP_THRESHOLD - 1,
    })
  })

  // The dialog compares against this constant directly, so the function default
  // and the exported value have to stay the same number.
  it('uses the exported threshold as its default', () => {
    expect(isBigJump(BASE + LARGE_JUMP_THRESHOLD, BASE, LARGE_JUMP_THRESHOLD)).toEqual(
      isBigJump(BASE + LARGE_JUMP_THRESHOLD, BASE)
    )
  })

  it('honours a custom threshold', () => {
    expect(isBigJump(10_500, 10_000, 500).big).toBe(true)
    expect(isBigJump(10_499, 10_000, 500).big).toBe(false)
  })

  it('never flags a decrease, and reports the delta as negative', () => {
    expect(isBigJump(9_000, 10_000)).toEqual({ big: false, delta: -1_000 })
  })

  it('reports a zero delta for an unchanged reading', () => {
    expect(isBigJump(10_000, 10_000)).toEqual({ big: false, delta: 0 })
  })
})

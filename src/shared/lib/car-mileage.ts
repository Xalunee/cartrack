import type { Prisma, PrismaClient } from '@prisma/client'

type DbClient = PrismaClient | Prisma.TransactionClient

/**
 * Sets Car.currentMileage/lastTrackedAt to the chronologically latest MileageLog
 * (MAX recordedAt, ties broken by highest mileage). If no logs remain, the car
 * is left untouched. This is the single source of truth for currentMileage —
 * every mileage mutation path (create/edit/delete) must go through this instead
 * of trusting whichever log was just written.
 */
export async function recomputeCurrentMileage(
  tx: DbClient,
  carId: string
): Promise<number | null> {
  const latest = await tx.mileageLog.findFirst({
    where: { carId },
    orderBy: [{ recordedAt: 'desc' }, { mileage: 'desc' }],
  })

  if (!latest) return null

  await tx.car.update({
    where: { id: carId },
    data: { currentMileage: latest.mileage, lastTrackedAt: latest.recordedAt },
  })

  return latest.mileage
}

/**
 * The note `maintenance/[id]/complete` stamps on the MileageLog it creates
 * alongside a ServiceRecord. Editing that record has to find the same log again,
 * so the pattern lives here rather than being retyped on either side.
 */
export function serviceMileageLogNote(itemName: string): string {
  return `Обслуживание: ${itemName}`
}

interface PairCandidate {
  id: string
  recordedAt: Date
}

/**
 * Picks the MileageLog paired with a ServiceRecord out of the candidates that
 * already match carId + the record's old mileage + the service note.
 *
 * Nothing links the two rows, so the match can be ambiguous: two services of the
 * same item at the same mileage produce two indistinguishable logs. The record's
 * old date breaks that tie; if it does not, we return null rather than guess and
 * silently rewrite the wrong history entry.
 */
export function selectPairedMileageLog<T extends PairCandidate>(
  candidates: T[],
  recordDate: Date
): T | null {
  if (candidates.length === 0) return null
  if (candidates.length === 1) return candidates[0]

  const sameDate = candidates.filter(
    (log) => log.recordedAt.getTime() === recordDate.getTime()
  )
  return sameDate.length === 1 ? sameDate[0] : null
}

interface ServiceRecordPoint {
  mileage: number
  date: Date
}

export interface ServiceLogSync {
  mileageChanged: boolean
  dateChanged: boolean
  /** True when the paired log has to be looked at at all. */
  pointChanged: boolean
}

/**
 * What editing a ServiceRecord means for the MileageLog paired with it.
 *
 * The rule that is easy to get backwards: a field the request did not carry is
 * not a change. A log's date can be corrected on its own in the mileage history,
 * and syncing a record whose date nobody touched must not roll that correction
 * back — so `patch` holds only what the request actually sent.
 */
export function resolveServiceLogSync(
  record: ServiceRecordPoint,
  patch: { mileage?: number; date?: Date }
): ServiceLogSync {
  const mileageChanged = patch.mileage !== undefined && patch.mileage !== record.mileage
  const dateChanged = patch.date !== undefined && patch.date.getTime() !== record.date.getTime()

  return { mileageChanged, dateChanged, pointChanged: mileageChanged || dateChanged }
}

interface PairLookup {
  carId: string
  /** The maintenance item's name, which the note was built from. */
  itemName: string
  /** The record's mileage and date as they stand in the database. */
  recordMileage: number
  recordDate: Date
}

export interface PairedServiceLog {
  log: { id: string; mileage: number; recordedAt: Date; note: string | null } | null
  /** Several candidates matched and the date could not tell them apart. */
  ambiguous: boolean
}

/**
 * Finds the MileageLog paired with a ServiceRecord. Every route that touches the
 * pair goes through here, so an edit and a delete can never disagree about which
 * row is the partner.
 */
export async function findPairedServiceLog(
  tx: DbClient,
  { carId, itemName, recordMileage, recordDate }: PairLookup
): Promise<PairedServiceLog> {
  const candidates = await tx.mileageLog.findMany({
    where: { carId, mileage: recordMileage, note: serviceMileageLogNote(itemName) },
  })

  const log = selectPairedMileageLog(candidates, recordDate)
  return { log, ambiguous: log === null && candidates.length > 1 }
}

/**
 * What `recomputeCurrentMileage` will settle on once a log is removed, given the
 * newest reading that survives it. With nothing left the recompute leaves the car
 * alone rather than zeroing it, so the odometer stays where it is.
 */
export function projectMileageAfterRemoval(
  currentMileage: number,
  nextLatest: { mileage: number } | null
): { mileage: number; changed: boolean } {
  if (!nextLatest) return { mileage: currentMileage, changed: false }
  return { mileage: nextLatest.mileage, changed: nextLatest.mileage !== currentMileage }
}

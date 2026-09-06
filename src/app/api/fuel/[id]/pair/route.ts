import { NextResponse } from 'next/server'
import { auth } from '@shared/lib/auth'
import { db } from '@shared/lib/db'
import { findPairedFuelLog, projectMileageAfterRemoval } from '@shared/lib/car-mileage'

/**
 * What deleting this fuel entry would mean for the mileage history, so the
 * confirmation can offer the choice only when there is one — and warn before the
 * odometer moves. Read-only; the delete route decides again for itself rather
 * than trusting anything computed here.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const entry = await db.fuelEntry.findUnique({ where: { id }, include: { car: true } })
  if (!entry || entry.car.userId !== session.user.id) {
    return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
  }

  const car = entry.car
  const nothingPaired = {
    found: false,
    ambiguous: false,
    currentMileage: car.currentMileage,
    mileageAfterDelete: car.currentMileage,
    lowersCurrentMileage: false,
  }

  // An entry without an odometer reading never wrote a point, so there is
  // nothing to look for.
  if (entry.mileage === null) return NextResponse.json(nothingPaired)

  const { log, ambiguous } = await findPairedFuelLog(db, {
    carId: car.id,
    recordMileage: entry.mileage,
    recordDate: entry.date,
  })

  if (!log) return NextResponse.json({ ...nothingPaired, ambiguous })

  // The reading recompute would fall back to — same ordering it uses.
  const nextLatest = await db.mileageLog.findFirst({
    where: { carId: car.id, id: { not: log.id } },
    orderBy: [{ recordedAt: 'desc' }, { mileage: 'desc' }],
  })
  const projected = projectMileageAfterRemoval(car.currentMileage, nextLatest)

  return NextResponse.json({
    found: true,
    ambiguous: false,
    log: { id: log.id, mileage: log.mileage, recordedAt: log.recordedAt },
    currentMileage: car.currentMileage,
    mileageAfterDelete: projected.mileage,
    lowersCurrentMileage: projected.changed,
  })
}

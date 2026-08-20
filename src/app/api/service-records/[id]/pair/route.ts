import { NextResponse } from 'next/server'
import { auth } from '@shared/lib/auth'
import { db } from '@shared/lib/db'
import { findPairedServiceLog, projectMileageAfterRemoval } from '@shared/lib/car-mileage'

/**
 * What deleting this service record would mean for the mileage history, so the
 * confirmation can offer the choice only when there is one — and warn before the
 * odometer moves. Read-only; the delete route decides again for itself rather
 * than trusting anything computed here.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const record = await db.serviceRecord.findUnique({
    where: { id },
    include: { maintenanceItem: { include: { car: true } } },
  })
  if (!record || record.maintenanceItem.car.userId !== session.user.id) {
    return NextResponse.json({ error: 'Record not found' }, { status: 404 })
  }

  const car = record.maintenanceItem.car
  const { log, ambiguous } = await findPairedServiceLog(db, {
    carId: car.id,
    itemName: record.maintenanceItem.name,
    recordMileage: record.mileage,
    recordDate: record.date,
  })

  if (!log) {
    return NextResponse.json({
      found: false,
      ambiguous,
      currentMileage: car.currentMileage,
      mileageAfterDelete: car.currentMileage,
      lowersCurrentMileage: false,
    })
  }

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

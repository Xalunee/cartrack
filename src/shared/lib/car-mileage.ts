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

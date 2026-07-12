import { db } from '@shared/lib/db'
import { fetchFines } from './fines-api'

export async function syncFinesForCar(carId: string): Promise<{ newFines: number; total: number }> {
  const car = await db.car.findUnique({ where: { id: carId } })
  if (!car || !car.stsNumber || !car.licensePlate) {
    throw new Error('Car missing licensePlate or stsNumber')
  }

  const apiFines = await fetchFines(car.licensePlate, car.stsNumber)

  let newCount = 0
  for (const f of apiFines) {
    const existing = await db.fine.findUnique({ where: { numPost: f.num_post } })
    if (existing) continue

    await db.fine.create({
      data: {
        carId: car.id,
        numPost: f.num_post,
        koapCode: f.koap_code,
        koapText: f.koap_text,
        sum: parseFloat(f.sum),
        enableDiscount: f.enable_discount,
        dateDiscount: f.date_discount ? new Date(f.date_discount) : null,
        dateDecision: f.date_decision ? new Date(f.date_decision) : null,
        divisionName: f.division_name ?? null,
      },
    })
    newCount++
  }

  await db.car.update({ where: { id: car.id }, data: { lastFinesCheckAt: new Date() } })
  return { newFines: newCount, total: apiFines.length }
}

import { NextResponse } from 'next/server'
import { auth } from '@shared/lib/auth'
import { db } from '@shared/lib/db'
import { z } from 'zod'
import { costField, mileageField, pastDateTimeField, textField } from '@shared/lib/validation/limits'
import { calculateDrivingPace, MILEAGE_LOGS_FOR_PACE } from '@shared/lib/calculations/mileage'
import { calculateRemainingResource } from '@shared/lib/calculations/maintenance'
import { validateMileagePoint } from '@shared/lib/calculations/mileage-validation'
import { recomputeCurrentMileage, serviceMileageLogNote } from '@shared/lib/car-mileage'

const completeSchema = z.object({
  mileage: mileageField(),
  date: pastDateTimeField(),
  cost: costField().optional(),
  notes: textField().optional(),
})

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const parsed = completeSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

  const car = await db.car.findUnique({
    where: { userId: session.user.id },
    include: { mileageLogs: { orderBy: { recordedAt: 'desc' }, take: MILEAGE_LOGS_FOR_PACE } },
  })
  if (!car) return NextResponse.json({ error: 'Car not found' }, { status: 404 })

  const item = await db.maintenanceItem.findFirst({ where: { id, carId: car.id } })
  if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 })

  const { mileage, cost, notes } = parsed.data
  const date = new Date(parsed.data.date)

  const prevMileage = item.lastServiceMileage ?? 0
  if (mileage < prevMileage) {
    return NextResponse.json(
      {
        error: 'Пробег замены не может быть меньше предыдущей замены',
        suggestion: `Предыдущая замена была на ${prevMileage.toLocaleString('ru')} км. Введите значение не меньше этого.`,
      },
      { status: 400 }
    )
  }

  const validation = await validateMileagePoint(db, car.id, { mileage, recordedAt: date })
  if (!validation.ok) {
    return NextResponse.json(
      { error: validation.message, suggestion: validation.suggestion },
      { status: 400 }
    )
  }

  let mileageLogWarning: string | null = null

  const updated = await db.$transaction(async (tx) => {
    await tx.serviceRecord.create({
      data: { maintenanceItemId: item.id, mileage, date, cost, notes },
    })

    const duplicate = await tx.mileageLog.findFirst({ where: { carId: car.id, mileage } })

    if (!duplicate) {
      await tx.mileageLog.create({
        data: { carId: car.id, mileage, recordedAt: date, note: serviceMileageLogNote(item.name) },
      })
    } else {
      mileageLogWarning = 'Служба записана, но точка пробега уже была в истории'
    }

    await recomputeCurrentMileage(tx, car.id)

    return tx.maintenanceItem.update({
      where: { id: item.id },
      data: {
        lastServiceMileage: mileage,
        lastServiceDate: date,
        lastServiceCost: cost ?? null,
        lastServiceNotes: notes ?? null,
      },
    })
  })

  const pace = calculateDrivingPace(car.mileageLogs)
  const resource = calculateRemainingResource(updated, car.currentMileage, pace)

  return NextResponse.json({ ...updated, resource, mileageLogWarning })
}

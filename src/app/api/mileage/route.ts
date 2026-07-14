import { NextResponse } from 'next/server'
import { auth } from '@shared/lib/auth'
import { db } from '@shared/lib/db'
import { z } from 'zod'
import { calculateDrivingPace } from '@shared/lib/calculations/mileage'
import { validateMileagePoint } from '@shared/lib/calculations/mileage-validation'
import { recomputeCurrentMileage } from '@shared/lib/car-mileage'

const createSchema = z.object({
  mileage: z.number().int().min(0),
  note: z.string().optional(),
  recordedAt: z.string().datetime().optional(),
})

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const car = await db.car.findUnique({ where: { userId: session.user.id } })
  if (!car) return NextResponse.json({ error: 'Car not found' }, { status: 404 })

  const logs = await db.mileageLog.findMany({
    where: { carId: car.id },
    orderBy: { recordedAt: 'desc' },
  })

  const pace = calculateDrivingPace(logs)
  return NextResponse.json({ logs, pace })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

  const car = await db.car.findUnique({ where: { userId: session.user.id } })
  if (!car) return NextResponse.json({ error: 'Car not found' }, { status: 404 })

  const recordedAt = parsed.data.recordedAt ? new Date(parsed.data.recordedAt) : new Date()

  if (!parsed.data.recordedAt) {
    if (parsed.data.mileage < car.currentMileage) {
      return NextResponse.json(
        { error: `Пробег не может быть меньше текущего (${car.currentMileage} км)` },
        { status: 400 }
      )
    }
  } else {
    const validation = await validateMileagePoint(db, car.id, { mileage: parsed.data.mileage, recordedAt })
    if (!validation.ok) {
      return NextResponse.json({ error: validation.message, suggestion: validation.suggestion }, { status: 400 })
    }
  }

  await db.$transaction(async (tx) => {
    const created = await tx.mileageLog.create({
      data: { carId: car.id, mileage: parsed.data.mileage, note: parsed.data.note, recordedAt },
    })
    await recomputeCurrentMileage(tx, car.id)
    return created
  })

  const allLogs = await db.mileageLog.findMany({
    where: { carId: car.id },
    orderBy: { recordedAt: 'desc' },
  })
  const pace = calculateDrivingPace(allLogs)

  return NextResponse.json({ logs: allLogs, pace }, { status: 201 })
}

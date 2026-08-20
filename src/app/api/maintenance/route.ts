import { MaintenanceItem } from '@prisma/client'
import { NextResponse } from 'next/server'
import { auth } from '@shared/lib/auth'
import { db } from '@shared/lib/db'
import { z } from 'zod'
import {
  costField,
  intervalDaysField,
  intervalKmField,
  mileageField,
  nameField,
  pastDateTimeField,
  textField,
} from '@shared/lib/validation/limits'
import { calculateDrivingPace, MILEAGE_LOGS_FOR_PACE } from '@shared/lib/calculations/mileage'
import { calculateRemainingResource } from '@shared/lib/calculations/maintenance'

const createSchema = z.object({
  name: nameField('Введите название'),
  intervalKm: intervalKmField().optional(),
  intervalDays: intervalDaysField().optional(),
  lastServiceMileage: mileageField().optional(),
  lastServiceDate: pastDateTimeField().optional(),
  lastServiceCost: costField().optional(),
  lastServiceNotes: textField().optional(),
})

async function getCarAndPace(userId: string) {
  const car = await db.car.findUnique({
    where: { userId },
    include: { mileageLogs: { orderBy: { recordedAt: 'desc' }, take: MILEAGE_LOGS_FOR_PACE } },
  })
  if (!car) return null
  const pace = calculateDrivingPace(car.mileageLogs)
  return { car, pace }
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const result = await getCarAndPace(session.user.id)
  if (!result) return NextResponse.json({ error: 'Car not found' }, { status: 404 })

  const { car, pace } = result
  const items = await db.maintenanceItem.findMany({
    where: { carId: car.id },
    orderBy: { createdAt: 'asc' },
    include: { serviceRecords: { select: { id: true, date: true, cost: true } } },
  })

  const withStatus = items.map(({ serviceRecords, ...item }: MaintenanceItem & { serviceRecords: { id: string; date: Date; cost: number | null }[] }) => ({
    ...item,
    totalSpent: serviceRecords.reduce((sum, r) => sum + (r.cost ?? 0), 0),
    serviceRecords,
    resource: calculateRemainingResource(item, car.currentMileage, pace),
  }))

  const order = { critical: 0, soon: 1, ok: 2 }
  withStatus.sort((a, b) => order[a.resource.status] - order[b.resource.status])

  return NextResponse.json(withStatus)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const result = await getCarAndPace(session.user.id)
  if (!result) return NextResponse.json({ error: 'Car not found' }, { status: 404 })

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

  const item = await db.maintenanceItem.create({
    data: {
      ...parsed.data,
      carId: result.car.id,
      lastServiceDate: parsed.data.lastServiceDate ? new Date(parsed.data.lastServiceDate) : undefined,
    },
  })

  const resource = calculateRemainingResource(item, result.car.currentMileage, result.pace)
  return NextResponse.json({ ...item, resource }, { status: 201 })
}

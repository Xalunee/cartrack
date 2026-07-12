import { NextResponse } from 'next/server'
import { auth } from '@shared/lib/auth'
import { db } from '@shared/lib/db'
import { z } from 'zod'
import { calculateDrivingPace } from '@shared/lib/calculations/mileage'
import { calculateRemainingResource } from '@shared/lib/calculations/maintenance'

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  intervalKm: z.number().int().positive().optional(),
  intervalDays: z.number().int().positive().optional(),
  lastServiceMileage: z.number().int().min(0).optional(),
  lastServiceDate: z.string().datetime().optional(),
  lastServiceCost: z.number().min(0).optional(),
  lastServiceNotes: z.string().optional(),
})

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const car = await db.car.findUnique({
    where: { userId: session.user.id },
    include: { mileageLogs: { orderBy: { recordedAt: 'desc' }, take: 8 } },
  })
  if (!car) return NextResponse.json({ error: 'Car not found' }, { status: 404 })

  const item = await db.maintenanceItem.findFirst({
    where: { id, carId: car.id },
    include: { serviceRecords: { select: { cost: true } } },
  })
  if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 })

  const { serviceRecords, ...rest } = item
  const totalSpent = serviceRecords.reduce((sum, r) => sum + (r.cost ?? 0), 0)

  const pace = calculateDrivingPace(car.mileageLogs)
  const resource = calculateRemainingResource(rest, car.currentMileage, pace)

  return NextResponse.json({ ...rest, totalSpent, resource })
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

  const car = await db.car.findUnique({
    where: { userId: session.user.id },
    include: { mileageLogs: { orderBy: { recordedAt: 'desc' }, take: 8 } },
  })
  if (!car) return NextResponse.json({ error: 'Car not found' }, { status: 404 })

  const item = await db.maintenanceItem.update({
    where: { id, carId: car.id },
    data: {
      ...parsed.data,
      lastServiceDate: parsed.data.lastServiceDate ? new Date(parsed.data.lastServiceDate) : undefined,
    },
  })

  const pace = calculateDrivingPace(car.mileageLogs)
  const resource = calculateRemainingResource(item, car.currentMileage, pace)
  return NextResponse.json({ ...item, resource })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const car = await db.car.findUnique({ where: { userId: session.user.id } })
  if (!car) return NextResponse.json({ error: 'Car not found' }, { status: 404 })

  await db.maintenanceItem.delete({ where: { id, carId: car.id } })
  return NextResponse.json({ success: true })
}

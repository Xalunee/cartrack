import { NextResponse } from 'next/server'
import { auth } from '@shared/lib/auth'
import { db } from '@shared/lib/db'
import { z } from 'zod'
import { recomputeCurrentMileage } from '@shared/lib/car-mileage'
import { validateMileagePoint } from '@shared/lib/calculations/mileage-validation'

const updateSchema = z.object({
  mileage: z.number().int().min(0).optional(),
  note: z.string().optional().nullable(),
  recordedAt: z.string().datetime().optional(),
})

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const car = await db.car.findUnique({ where: { userId: session.user.id } })
  if (!car) return NextResponse.json({ error: 'Car not found' }, { status: 404 })

  const log = await db.mileageLog.findFirst({ where: { id, carId: car.id } })
  if (!log) return NextResponse.json({ error: 'Log not found' }, { status: 404 })

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

  const candidateMileage = parsed.data.mileage ?? log.mileage
  const candidateRecordedAt = parsed.data.recordedAt ? new Date(parsed.data.recordedAt) : log.recordedAt

  const validation = await validateMileagePoint(
    db,
    car.id,
    { mileage: candidateMileage, recordedAt: candidateRecordedAt },
    log.id
  )
  if (!validation.ok) {
    return NextResponse.json({ error: validation.message, suggestion: validation.suggestion }, { status: 400 })
  }

  await db.$transaction(async (tx) => {
    await tx.mileageLog.update({
      where: { id },
      data: {
        ...(parsed.data.mileage !== undefined && { mileage: parsed.data.mileage }),
        ...(parsed.data.note !== undefined && { note: parsed.data.note }),
        ...(parsed.data.recordedAt !== undefined && { recordedAt: new Date(parsed.data.recordedAt) }),
      },
    })
    await recomputeCurrentMileage(tx, car.id)
  })

  return NextResponse.json({ success: true })
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

  const log = await db.mileageLog.findFirst({ where: { id, carId: car.id } })
  if (!log) return NextResponse.json({ error: 'Log not found' }, { status: 404 })

  await db.$transaction(async (tx) => {
    await tx.mileageLog.delete({ where: { id } })
    await recomputeCurrentMileage(tx, car.id)
  })

  return NextResponse.json({ success: true })
}

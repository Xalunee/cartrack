import { NextResponse } from 'next/server'
import { auth } from '@shared/lib/auth'
import { db } from '@shared/lib/db'
import { z } from 'zod'
import { costField, mileageField, pastDateTimeField, textField } from '@shared/lib/validation/limits'

const updateSchema = z.object({
  mileage: mileageField().optional(),
  date: pastDateTimeField().optional(),
  cost: costField().optional(),
  notes: textField().optional(),
})

async function findOwnedRecord(userId: string, id: string) {
  const record = await db.serviceRecord.findUnique({
    where: { id },
    include: { maintenanceItem: { include: { car: true } } },
  })
  if (!record || record.maintenanceItem.car.userId !== userId) return null
  return record
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

  const record = await findOwnedRecord(session.user.id, id)
  if (!record) return NextResponse.json({ error: 'Record not found' }, { status: 404 })

  const { mileage, cost, notes } = parsed.data
  const date = parsed.data.date ? new Date(parsed.data.date) : undefined

  if (mileage !== undefined && mileage !== record.mileage) {
    const neighbours = await db.serviceRecord.findMany({
      where: { maintenanceItemId: record.maintenanceItemId, id: { not: record.id } },
      orderBy: { mileage: 'asc' },
    })
    const lower = neighbours.filter((r) => r.mileage < record.mileage).at(-1)
    const upper = neighbours.filter((r) => r.mileage > record.mileage)[0]
    if (lower && mileage <= lower.mileage) {
      return NextResponse.json(
        { error: 'Пробег должен быть больше предыдущей замены в истории' },
        { status: 400 }
      )
    }
    if (upper && mileage >= upper.mileage) {
      return NextResponse.json(
        { error: 'Пробег должен быть меньше следующей замены в истории' },
        { status: 400 }
      )
    }
  }

  const updated = await db.$transaction(async (tx) => {
    const updatedRecord = await tx.serviceRecord.update({
      where: { id: record.id },
      data: { mileage, date, cost, notes },
    })

    const isCurrentReference = record.mileage === record.maintenanceItem.lastServiceMileage
    if (isCurrentReference) {
      await tx.maintenanceItem.update({
        where: { id: record.maintenanceItemId },
        data: {
          lastServiceMileage: updatedRecord.mileage,
          lastServiceDate: updatedRecord.date,
          lastServiceCost: updatedRecord.cost,
          lastServiceNotes: updatedRecord.notes,
        },
      })
    }

    return updatedRecord
  })

  return NextResponse.json(updated)
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const record = await findOwnedRecord(session.user.id, id)
  if (!record) return NextResponse.json({ error: 'Record not found' }, { status: 404 })

  const isCurrentReference = record.mileage === record.maintenanceItem.lastServiceMileage

  await db.$transaction(async (tx) => {
    await tx.serviceRecord.delete({ where: { id: record.id } })

    if (isCurrentReference) {
      const next = await tx.serviceRecord.findFirst({
        where: { maintenanceItemId: record.maintenanceItemId },
        orderBy: { mileage: 'desc' },
      })

      await tx.maintenanceItem.update({
        where: { id: record.maintenanceItemId },
        data: {
          lastServiceMileage: next?.mileage ?? null,
          lastServiceDate: next?.date ?? null,
          lastServiceCost: next?.cost ?? null,
          lastServiceNotes: next?.notes ?? null,
        },
      })
    }
  })

  return NextResponse.json({ success: true })
}

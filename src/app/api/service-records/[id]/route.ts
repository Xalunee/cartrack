import { NextResponse } from 'next/server'
import { auth } from '@shared/lib/auth'
import { db } from '@shared/lib/db'
import { z } from 'zod'
import { costField, mileageField, pastDateTimeField, textField } from '@shared/lib/validation/limits'
import { validateMileagePoint } from '@shared/lib/calculations/mileage-validation'
import {
  findPairedServiceLog,
  recomputeCurrentMileage,
  resolveServiceLogSync,
} from '@shared/lib/car-mileage'

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

  // `maintenance/[id]/complete` writes a MileageLog alongside the ServiceRecord.
  // Nothing links the rows, so the pair is identified the only way available:
  // same car, the record's *old* mileage, and the note that route stamps.
  const carId = record.maintenanceItem.carId
  const newMileage = mileage ?? record.mileage
  const sync = resolveServiceLogSync(record, { mileage, date })

  let pairedLog: { id: string; recordedAt: Date } | null = null
  let mileageLogWarning: string | null = null

  if (sync.pointChanged) {
    const pair = await findPairedServiceLog(db, {
      carId,
      itemName: record.maintenanceItem.name,
      recordMileage: record.mileage,
      recordDate: record.date,
    })
    pairedLog = pair.log

    // Ambiguous means several identical logs and no date to tell them apart.
    // Rewriting an arbitrary one would corrupt history that is still correct.
    if (pair.ambiguous) {
      mileageLogWarning = 'Запись обновлена, но парную точку пробега не удалось определить однозначно'
    }

    if (pairedLog) {
      // Validate the point the log will actually occupy afterwards. When the
      // date is not part of this request the log keeps its own recordedAt, which
      // may sit elsewhere on the timeline than the record's date — checking the
      // record's date there would clear a history that ends up out of order.
      const validation = await validateMileagePoint(
        db,
        carId,
        { mileage: newMileage, recordedAt: sync.dateChanged ? date! : pairedLog.recordedAt },
        pairedLog.id
      )
      if (!validation.ok) {
        return NextResponse.json(
          { error: validation.message, suggestion: validation.suggestion },
          { status: 400 }
        )
      }
    }
  }

  const updated = await db.$transaction(async (tx) => {
    const updatedRecord = await tx.serviceRecord.update({
      where: { id: record.id },
      data: { mileage, date, cost, notes },
    })

    // No paired log — the record predates the behaviour, or the log was deduped
    // away because that mileage already existed. Nothing to sync, and creating
    // one now would invent history the user never entered.
    if (pairedLog) {
      await tx.mileageLog.update({
        where: { id: pairedLog.id },
        data: {
          ...(sync.mileageChanged && { mileage: updatedRecord.mileage }),
          ...(sync.dateChanged && { recordedAt: updatedRecord.date }),
        },
      })
      await recomputeCurrentMileage(tx, carId)
    }

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

  return NextResponse.json({ ...updated, mileageLogWarning })
}

/**
 * The flag rides in the query string rather than a DELETE body: request bodies on
 * DELETE are not forwarded by every proxy and runtime, and this is one boolean.
 */
function wantsLogDeleted(req: Request): boolean {
  return new URL(req.url).searchParams.get('deleteMileageLog') === 'true'
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const record = await findOwnedRecord(session.user.id, id)
  if (!record) return NextResponse.json({ error: 'Record not found' }, { status: 404 })

  const carId = record.maintenanceItem.carId
  const carBefore = record.maintenanceItem.car
  const isCurrentReference = record.mileage === record.maintenanceItem.lastServiceMileage

  const pair = await findPairedServiceLog(db, {
    carId,
    itemName: record.maintenanceItem.name,
    recordMileage: record.mileage,
    recordDate: record.date,
  })

  // Deleting the point is only offered when we know which point it is. With no
  // candidate, or several the date cannot separate, the record goes and the
  // mileage history is left exactly as it was.
  const pairedLog = pair.log
  const deleteLog = pairedLog !== null && wantsLogDeleted(req)

  const currentMileage = await db.$transaction(async (tx) => {
    await tx.serviceRecord.delete({ where: { id: record.id } })

    // Independent of the mileage point: the item's reference must follow the
    // record that is left, whether or not a paired log was found.
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

    if (!pairedLog) return carBefore.currentMileage

    if (deleteLog) {
      await tx.mileageLog.delete({ where: { id: pairedLog.id } })
    } else {
      // The reading itself happened — the odometer really did show this number on
      // this day — so the point stays. Only the note goes, because it is the one
      // part that claims a service which no longer exists. It is cleared rather
      // than reworded: the text was generated when the service was completed, not
      // written by the user, so nothing here is worth preserving, and any
      // replacement would be a new claim nobody made.
      await tx.mileageLog.update({ where: { id: pairedLog.id }, data: { note: null } })
    }

    // A car with no logs left is deliberately not reset to zero, so fall back to
    // what it already held.
    return (await recomputeCurrentMileage(tx, carId)) ?? carBefore.currentMileage
  })

  return NextResponse.json({
    success: true,
    pair: !pairedLog ? (pair.ambiguous ? 'ambiguous' : 'none') : deleteLog ? 'deleted' : 'kept',
    currentMileage,
    currentMileageChanged: currentMileage !== carBefore.currentMileage,
  })
}

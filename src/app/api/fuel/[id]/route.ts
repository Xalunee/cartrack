import { NextResponse } from 'next/server'
import { auth } from '@shared/lib/auth'
import { db } from '@shared/lib/db'
import { z } from 'zod'
import {
  costField,
  litersField,
  mileageField,
  optionalNameField,
  pastDateTimeField,
  textField,
} from '@shared/lib/validation/limits'
import { validateMileagePoint } from '@shared/lib/calculations/mileage-validation'
import {
  FUEL_MILEAGE_LOG_NOTE,
  findPairedFuelLog,
  recomputeCurrentMileage,
} from '@shared/lib/car-mileage'

const updateSchema = z.object({
  liters: litersField().optional(),
  totalCost: costField().optional(),
  date: pastDateTimeField().optional(),
  // `null` is a value here, not an omission: it means "I did not look at the
  // odometer after all", which has to be tellable apart from "I did not touch
  // this field", because the two do opposite things to the paired point.
  mileage: mileageField().nullable().optional(),
  isFullTank: z.boolean().optional(),
  hasMissedEntry: z.boolean().optional(),
  station: optionalNameField().nullable(),
  fuelType: optionalNameField().nullable(),
  notes: textField().nullable().optional(),
})

/**
 * The entry and its car, separately: the car is needed for the ownership check
 * and for the odometer, but it must never ride along into the response.
 */
async function findOwnedEntry(userId: string, id: string) {
  const found = await db.fuelEntry.findUnique({ where: { id }, include: { car: true } })
  if (!found || found.car.userId !== userId) return null

  const { car, ...entry } = found
  return { entry, car }
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const owned = await findOwnedEntry(session.user.id, id)
  if (!owned) return NextResponse.json({ error: 'Entry not found' }, { status: 404 })

  return NextResponse.json(owned.entry)
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const owned = await findOwnedEntry(session.user.id, id)
  if (!owned) return NextResponse.json({ error: 'Entry not found' }, { status: 404 })

  const entry = owned.entry
  const carId = entry.carId
  const { liters, totalCost, mileage, isFullTank, hasMissedEntry, station, fuelType, notes } =
    parsed.data
  const date = parsed.data.date ? new Date(parsed.data.date) : undefined

  const newMileage = mileage === undefined ? entry.mileage : mileage
  const newDate = date ?? entry.date
  const mileageChanged = mileage !== undefined && mileage !== entry.mileage
  const dateChanged = date !== undefined && date.getTime() !== entry.date.getTime()
  const pointChanged = mileageChanged || dateChanged

  let mileageLogWarning: string | null = null
  /** The paired log and what this request does to it, decided before the write. */
  let logAction: 'none' | 'update' | 'create' | 'delete' = 'none'
  let pairedLogId: string | null = null

  if (pointChanged) {
    if (entry.mileage === null) {
      // Nothing was ever paired with this entry. If a reading is being added now,
      // this is the same situation as creating an entry with one — so it behaves
      // the same way: the entry saves, and a point that cannot be added is
      // reported rather than blocking the edit.
      if (newMileage !== null) {
        const validation = await validateMileagePoint(db, carId, {
          mileage: newMileage,
          recordedAt: newDate,
        })
        const duplicate = await db.mileageLog.findFirst({ where: { carId, mileage: newMileage } })

        if (!validation.ok) {
          mileageLogWarning = `Заправка обновлена, но точка пробега не добавлена. ${validation.message} ${validation.suggestion}`
        } else if (duplicate) {
          mileageLogWarning = 'Заправка обновлена, но точка пробега уже была в истории'
        } else {
          logAction = 'create'
        }
      }
    } else {
      const pair = await findPairedFuelLog(db, {
        carId,
        recordMileage: entry.mileage,
        recordDate: entry.date,
      })

      if (!pair.log) {
        // Either the point was deduped away when the entry was created, or two
        // identical fill-ups left two indistinguishable logs. Rewriting an
        // arbitrary one would corrupt history that is still correct.
        mileageLogWarning = pair.ambiguous
          ? 'Заправка обновлена, но парную точку пробега не удалось определить однозначно'
          : 'Заправка обновлена, парной точки пробега в истории нет'
      } else if (newMileage === null) {
        // The reading is being taken back, so the point it produced goes with it.
        logAction = 'delete'
        pairedLogId = pair.log.id
        mileageLogWarning = 'Показание одометра убрано — точка пробега удалена из истории'
      } else {
        // Unlike creating an entry, an edit that cannot move the point is
        // refused outright: pairing is by mileage, so leaving the log behind at
        // the old number would not just be untidy — it would orphan the pair for
        // good, and no later edit could find it again.
        const validation = await validateMileagePoint(
          db,
          carId,
          { mileage: newMileage, recordedAt: dateChanged ? newDate : pair.log.recordedAt },
          pair.log.id
        )
        if (!validation.ok) {
          return NextResponse.json(
            { error: validation.message, suggestion: validation.suggestion },
            { status: 400 }
          )
        }
        logAction = 'update'
        pairedLogId = pair.log.id
      }
    }
  }

  const updated = await db.$transaction(async (tx) => {
    const result = await tx.fuelEntry.update({
      where: { id: entry.id },
      // An empty label is the form's resting state, not a value worth storing —
      // it is normalised to null here so a cleared field reads the same as one
      // that was never filled in.
      data: {
        liters,
        totalCost,
        date,
        mileage,
        isFullTank,
        hasMissedEntry,
        station: station || (station === undefined ? undefined : null),
        fuelType: fuelType || (fuelType === undefined ? undefined : null),
        notes: notes || (notes === undefined ? undefined : null),
      },
    })

    if (logAction === 'create') {
      await tx.mileageLog.create({
        data: {
          carId,
          mileage: newMileage!,
          recordedAt: newDate,
          note: FUEL_MILEAGE_LOG_NOTE,
        },
      })
    } else if (logAction === 'update') {
      await tx.mileageLog.update({
        where: { id: pairedLogId! },
        data: {
          ...(mileageChanged && { mileage: newMileage! }),
          ...(dateChanged && { recordedAt: newDate }),
        },
      })
    } else if (logAction === 'delete') {
      await tx.mileageLog.delete({ where: { id: pairedLogId! } })
    }

    if (logAction !== 'none') await recomputeCurrentMileage(tx, carId)

    return result
  })

  return NextResponse.json({ ...updated, mileageLogWarning })
}

/**
 * The flag rides in the query string rather than a DELETE body, for the same
 * reason as on service records: request bodies on DELETE are not forwarded by
 * every proxy and runtime, and this is one boolean.
 */
function wantsLogDeleted(req: Request): boolean {
  return new URL(req.url).searchParams.get('deleteMileageLog') === 'true'
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const owned = await findOwnedEntry(session.user.id, id)
  if (!owned) return NextResponse.json({ error: 'Entry not found' }, { status: 404 })

  const entry = owned.entry
  const carId = entry.carId
  const carBefore = owned.car

  const pair =
    entry.mileage === null
      ? { log: null, ambiguous: false }
      : await findPairedFuelLog(db, {
          carId,
          recordMileage: entry.mileage,
          recordDate: entry.date,
        })

  // Same choice as deleting a service record: the point is only offered when we
  // know which point it is. With none, or several the date cannot separate, the
  // entry goes and the mileage history is left exactly as it was.
  const pairedLog = pair.log
  const deleteLog = pairedLog !== null && wantsLogDeleted(req)

  const currentMileage = await db.$transaction(async (tx) => {
    await tx.fuelEntry.delete({ where: { id: entry.id } })

    if (!pairedLog) return carBefore.currentMileage

    if (deleteLog) {
      await tx.mileageLog.delete({ where: { id: pairedLog.id } })
    } else {
      // The reading itself happened — the odometer really did show this number on
      // this day — so the point stays. Only the note goes, because it is the one
      // part that claims a fill-up which no longer exists.
      await tx.mileageLog.update({ where: { id: pairedLog.id }, data: { note: null } })
    }

    return (await recomputeCurrentMileage(tx, carId)) ?? carBefore.currentMileage
  })

  return NextResponse.json({
    success: true,
    pair: !pairedLog ? (pair.ambiguous ? 'ambiguous' : 'none') : deleteLog ? 'deleted' : 'kept',
    currentMileage,
    currentMileageChanged: currentMileage !== carBefore.currentMileage,
  })
}

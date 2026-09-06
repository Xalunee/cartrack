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
import { calculateFuelConsumption } from '@shared/lib/calculations/fuel'
import { validateMileagePoint } from '@shared/lib/calculations/mileage-validation'
import { FUEL_MILEAGE_LOG_NOTE, recomputeCurrentMileage } from '@shared/lib/car-mileage'

const createSchema = z.object({
  liters: litersField(),
  totalCost: costField(),
  date: pastDateTimeField(),
  mileage: mileageField().optional(),
  isFullTank: z.boolean(),
  hasMissedEntry: z.boolean(),
  station: optionalNameField(),
  fuelType: optionalNameField(),
  notes: textField().optional(),
})

/** How many past station names the form's suggestions are drawn from. */
const STATION_SUGGESTIONS = 20

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const car = await db.car.findUnique({ where: { userId: session.user.id } })
  if (!car) return NextResponse.json({ error: 'Car not found' }, { status: 404 })

  const entries = await db.fuelEntry.findMany({
    where: { carId: car.id },
    orderBy: [{ date: 'desc' }, { mileage: 'desc' }],
  })

  // The segments come back keyed by the entry that closes them, which is the
  // entry the number belongs to: a consumption figure describes the distance
  // driven up to this fill-up, so that is the card it is shown on.
  const { segments, averageConsumption, basedOnSegments } = calculateFuelConsumption(entries)
  const byCloser = new Map(segments.map((segment) => [segment.toEntryId, segment]))

  // Suggestions are the user's own recent stations, newest first — `entries` is
  // already in that order, so the first time a name appears is its latest use.
  const stations: string[] = []
  for (const entry of entries) {
    const station = entry.station?.trim()
    if (station && !stations.includes(station)) stations.push(station)
    if (stations.length >= STATION_SUGGESTIONS) break
  }

  return NextResponse.json({
    entries: entries.map((entry) => ({ ...entry, segment: byCloser.get(entry.id) ?? null })),
    averageConsumption,
    basedOnSegments,
    stations,
  })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const car = await db.car.findUnique({ where: { userId: session.user.id } })
  if (!car) return NextResponse.json({ error: 'Car not found' }, { status: 404 })

  const { liters, totalCost, mileage, isFullTank, hasMissedEntry, station, fuelType, notes } =
    parsed.data
  const date = new Date(parsed.data.date)

  // The mileage point is a side effect of the fill-up, not the point of it. A
  // reading that contradicts the history must not swallow the receipt the user
  // just typed in, so the entry is saved either way and the refusal is reported
  // instead of returned as an error — unlike completing a service, where the
  // mileage *is* the record.
  let mileageLogWarning: string | null = null
  let writeLog = mileage !== undefined

  if (mileage !== undefined) {
    const validation = await validateMileagePoint(db, car.id, { mileage, recordedAt: date })
    if (!validation.ok) {
      writeLog = false
      mileageLogWarning = `Заправка записана, но точка пробега не добавлена. ${validation.message} ${validation.suggestion}`
    }
  }

  const entry = await db.$transaction(async (tx) => {
    const created = await tx.fuelEntry.create({
      data: {
        carId: car.id,
        liters,
        totalCost,
        date,
        mileage: mileage ?? null,
        isFullTank,
        hasMissedEntry,
        station: station || null,
        fuelType: fuelType || null,
        notes: notes || null,
      },
    })

    if (writeLog) {
      const duplicate = await tx.mileageLog.findFirst({ where: { carId: car.id, mileage } })
      if (duplicate) {
        mileageLogWarning = 'Заправка записана, но точка пробега уже была в истории'
      } else {
        await tx.mileageLog.create({
          data: { carId: car.id, mileage: mileage!, recordedAt: date, note: FUEL_MILEAGE_LOG_NOTE },
        })
        await recomputeCurrentMileage(tx, car.id)
      }
    }

    return created
  })

  return NextResponse.json({ ...entry, mileageLogWarning }, { status: 201 })
}

import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { auth } from '@shared/lib/auth'
import { db } from '@shared/lib/db'
import { syncFinesForCar } from '@shared/lib/fines-sync'

const RATE_LIMIT_MS = 60 * 60 * 1000

export async function POST() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const car = await db.car.findUnique({ where: { userId: session.user.id } })
  if (!car) return NextResponse.json({ error: 'Car not found' }, { status: 404 })
  if (!car.stsNumber) return NextResponse.json({ error: 'СТС не указан' }, { status: 400 })

  if (car.lastFinesCheckAt && Date.now() - car.lastFinesCheckAt.getTime() < RATE_LIMIT_MS) {
    return NextResponse.json({ error: 'Проверять можно раз в час' }, { status: 429 })
  }

  try {
    const result = await syncFinesForCar(car.id)
    return NextResponse.json(result)
  } catch (error) {
    // The user only ever sees "try later", so this catch is the one place the
    // real reason exists.
    Sentry.captureException(error, { tags: { area: 'fines', step: 'manual-check' } })
    // Under Turbopack the SDK does not wrap route handlers, so nothing flushes
    // the queue for us before the instance is frozen.
    await Sentry.flush(2000).catch(() => {})
    return NextResponse.json(
      { error: 'Не удалось проверить штрафы. Попробуйте позже.' },
      { status: 502 }
    )
  }
}

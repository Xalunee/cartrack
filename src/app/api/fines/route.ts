import { NextResponse } from 'next/server'
import { auth } from '@shared/lib/auth'
import { db } from '@shared/lib/db'

function maskSts(sts: string) {
  const visible = sts.slice(-4)
  return '•'.repeat(Math.max(sts.length - 4, 0)) + visible
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const car = await db.car.findUnique({ where: { userId: session.user.id } })
  if (!car) return NextResponse.json({ error: 'Car not found' }, { status: 404 })

  const fines = await db.fine.findMany({
    where: { carId: car.id },
    orderBy: { dateDecision: 'desc' },
  })

  return NextResponse.json({
    fines,
    stsNumber: car.stsNumber ? maskSts(car.stsNumber) : null,
    lastCheckAt: car.lastFinesCheckAt,
  })
}

import { NextResponse } from 'next/server'
import { auth } from '@shared/lib/auth'
import { db } from '@shared/lib/db'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const car = await db.car.findUnique({ where: { userId: session.user.id } })
  if (!car) return NextResponse.json({ error: 'Car not found' }, { status: 404 })

  const item = await db.maintenanceItem.findFirst({ where: { id, carId: car.id } })
  if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 })

  const records = await db.serviceRecord.findMany({
    where: { maintenanceItemId: item.id },
    orderBy: { mileage: 'desc' },
  })

  return NextResponse.json(records)
}

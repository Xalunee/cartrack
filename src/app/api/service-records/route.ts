import { NextResponse } from 'next/server'
import { auth } from '@shared/lib/auth'
import { db } from '@shared/lib/db'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const car = await db.car.findUnique({ where: { userId: session.user.id } })
  if (!car) return NextResponse.json({ error: 'Car not found' }, { status: 404 })

  const records = await db.serviceRecord.findMany({
    where: { maintenanceItem: { carId: car.id } },
    include: { maintenanceItem: { select: { name: true } } },
    orderBy: { mileage: 'desc' },
  })

  const withItemName = records.map(({ maintenanceItem, ...record }) => ({
    ...record,
    itemName: maintenanceItem.name,
  }))

  return NextResponse.json(withItemName)
}

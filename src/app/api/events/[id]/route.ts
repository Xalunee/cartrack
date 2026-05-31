import { NextResponse } from 'next/server'
import { auth } from '@shared/lib/auth'
import { db } from '@shared/lib/db'

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const car = await db.car.findUnique({ where: { userId: session.user.id } })
  if (!car) return NextResponse.json({ error: 'Car not found' }, { status: 404 })

  await db.carEvent.delete({ where: { id, carId: car.id } })
  return NextResponse.json({ success: true })
}

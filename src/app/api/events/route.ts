import { NextResponse } from 'next/server'
import { auth } from '@shared/lib/auth'
import { db } from '@shared/lib/db'
import { z } from 'zod'

const createSchema = z.object({
  type: z.enum(['ACCIDENT', 'MALFUNCTION', 'FINE', 'SERVICE', 'NOTE']),
  title: z.string().min(1),
  description: z.string().optional(),
  cost: z.number().min(0).optional(),
  occurredAt: z.string().datetime().optional(),
})

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const car = await db.car.findUnique({ where: { userId: session.user.id } })
  if (!car) return NextResponse.json({ error: 'Car not found' }, { status: 404 })

  const events = await db.carEvent.findMany({
    where: { carId: car.id },
    orderBy: { occurredAt: 'desc' },
  })

  return NextResponse.json(events)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

  const car = await db.car.findUnique({ where: { userId: session.user.id } })
  if (!car) return NextResponse.json({ error: 'Car not found' }, { status: 404 })

  const event = await db.carEvent.create({
    data: {
      ...parsed.data,
      carId: car.id,
      occurredAt: parsed.data.occurredAt ? new Date(parsed.data.occurredAt) : new Date(),
    },
  })

  return NextResponse.json(event, { status: 201 })
}

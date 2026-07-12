import { NextResponse } from 'next/server'
import { auth } from '@shared/lib/auth'
import { db } from '@shared/lib/db'
import { z } from 'zod'

const updateSchema = z.object({
  isPaid: z.boolean(),
})

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

  const car = await db.car.findUnique({ where: { userId: session.user.id } })
  if (!car) return NextResponse.json({ error: 'Car not found' }, { status: 404 })

  const fine = await db.fine.findFirst({ where: { id, carId: car.id } })
  if (!fine) return NextResponse.json({ error: 'Fine not found' }, { status: 404 })

  const updated = await db.fine.update({
    where: { id: fine.id },
    data: { isPaid: parsed.data.isPaid },
  })

  return NextResponse.json(updated)
}

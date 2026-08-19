import { NextResponse } from 'next/server'
import { auth } from '@shared/lib/auth'
import { db } from '@shared/lib/db'
import { z } from 'zod'
import { costField, nameField, pastDateTimeField, textField } from '@shared/lib/validation/limits'

const updateSchema = z.object({
  type: z.enum(['ACCIDENT', 'MALFUNCTION', 'FINE', 'SERVICE', 'NOTE']).optional(),
  title: nameField('Введите название').optional(),
  description: textField().optional(),
  cost: costField().optional(),
  occurredAt: pastDateTimeField().optional(),
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

  const event = await db.carEvent.update({
    where: { id, carId: car.id },
    data: {
      ...parsed.data,
      occurredAt: parsed.data.occurredAt ? new Date(parsed.data.occurredAt) : undefined,
    },
  })

  return NextResponse.json(event)
}

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

import { NextResponse } from 'next/server'
import { auth } from '@shared/lib/auth'
import { db } from '@shared/lib/db'
import { z } from 'zod'
import { licensePlateField, mileageField, nameField, yearField } from '@shared/lib/validation/limits'

const createSchema = z.object({
  brand: nameField('Введите марку'),
  model: nameField('Введите модель'),
  year: yearField(),
  licensePlate: licensePlateField().optional(),
  currentMileage: mileageField(),
})

const updateSchema = createSchema.partial().extend({
  stsNumber: z
    .string()
    .length(10)
    .optional()
    .or(z.literal(''))
    .transform((v) => (v === '' ? null : v)),
})

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const car = await db.car.findUnique({ where: { userId: session.user.id } })
  if (!car) return NextResponse.json({ error: 'Car not found' }, { status: 404 })

  return NextResponse.json(car)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const existing = await db.car.findUnique({ where: { userId: session.user.id } })
  if (existing) return NextResponse.json({ error: 'Car already exists' }, { status: 409 })

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

  const car = await db.car.create({ data: { ...parsed.data, userId: session.user.id } })
  return NextResponse.json(car, { status: 201 })
}

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

  const car = await db.car.update({
    where: { userId: session.user.id },
    data: parsed.data,
  })
  return NextResponse.json(car)
}

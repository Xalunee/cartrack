import { NextResponse } from 'next/server'
import { auth } from '@shared/lib/auth'
import { db } from '@shared/lib/db'
import { z } from 'zod'
import { LIMITS, nameField, passwordField } from '@shared/lib/validation/limits'
import bcrypt from 'bcryptjs'

const updateSchema = z.object({
  name: nameField('Введите имя').optional(),
  // Bounded but with no minimum — it is an existing credential being checked, not
  // a new one being set, so length rules must not gate it.
  currentPassword: z.string().max(LIMITS.passwordLength).optional(),
  newPassword: passwordField().optional(),
}).refine(
  (data) => {
    if (data.newPassword && !data.currentPassword) return false
    return true
  },
  { message: 'Введите текущий пароль', path: ['currentPassword'] }
)

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      telegramChatId: true,
      mileageTrackInterval: true,
    },
  })

  return NextResponse.json(user)
}

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

  const { name, currentPassword, newPassword } = parsed.data
  const updateData: Record<string, unknown> = {}

  if (name !== undefined) updateData.name = name

  if (newPassword && currentPassword) {
    const user = await db.user.findUnique({ where: { id: session.user.id } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const valid = await bcrypt.compare(currentPassword, user.password)
    if (!valid) return NextResponse.json({ error: 'Неверный текущий пароль' }, { status: 400 })

    updateData.password = await bcrypt.hash(newPassword, 12)
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: 'Нечего обновлять' }, { status: 400 })
  }

  const updated = await db.user.update({
    where: { id: session.user.id },
    data: updateData,
    select: { id: true, email: true, name: true, telegramChatId: true, mileageTrackInterval: true },
  })

  return NextResponse.json(updated)
}

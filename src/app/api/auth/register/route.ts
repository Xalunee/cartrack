import { NextResponse } from 'next/server'
import { db } from '@shared/lib/db'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { emailField, nameField, passwordField } from '@shared/lib/validation/limits'

const schema = z.object({
  email: emailField(),
  password: passwordField(),
  name: nameField('Введите имя').optional(),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { email, password, name } = parsed.data

    const existing = await db.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { error: 'Пользователь с таким email уже существует' },
        { status: 409 }
      )
    }

    const hashed = await bcrypt.hash(password, 12)
    const user = await db.user.create({
      data: { email, password: hashed, name },
    })

    return NextResponse.json(
      { id: user.id, email: user.email },
      { status: 201 }
    )
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

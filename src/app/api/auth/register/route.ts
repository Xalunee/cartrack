import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { db } from '@shared/lib/db'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { emailField, nameField, passwordField } from '@shared/lib/validation/limits'
import { notifyAdminOfRegistration } from '@shared/lib/support/notify'

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

    // A counter for me, not a step in signing up: it swallows its own failures,
    // so an unreachable Telegram cannot cost someone their account.
    await notifyAdminOfRegistration(user.name)

    return NextResponse.json(
      { id: user.id, email: user.email },
      { status: 201 }
    )
  } catch (error) {
    // 'Server error' tells us nothing on its own — a failed signup has to be
    // visible somewhere. A malformed body is the caller's problem, not ours, and
    // bots send plenty of it.
    if (!(error instanceof SyntaxError)) {
      Sentry.captureException(error, { tags: { area: 'auth', step: 'register' } })
      // Nothing flushes the queue for a route handler before the instance is
      // frozen, so the event has to be pushed out here.
      await Sentry.flush(2000).catch(() => {})
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

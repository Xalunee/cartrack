import { NextResponse } from 'next/server'
import { auth } from '@shared/lib/auth'
import { db } from '@shared/lib/db'
import crypto from 'crypto'

export async function POST() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const code = crypto.randomInt(100000, 999999).toString()
  const expires = new Date(Date.now() + 10 * 60 * 1000)

  await db.user.update({
    where: { id: session.user.id },
    data: {
      telegramLinkCode: code,
      telegramLinkExpires: expires,
    },
  })

  return NextResponse.json({ code, expiresIn: '10 минут' })
}

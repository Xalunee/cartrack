import { NextResponse } from 'next/server'
import { auth } from '@shared/lib/auth'
import { db } from '@shared/lib/db'
import crypto from 'crypto'

/**
 * The token travels as a Telegram deep-link start parameter, which allows at most
 * 64 chars from [A-Za-z0-9_-] — base64url of 24 random bytes is 32 of them, so it
 * fits with room to spare and leaves nothing guessable to brute-force.
 */
const LINK_TOKEN_BYTES = 24
const LINK_TOKEN_TTL_MS = 15 * 60 * 1000

export async function POST() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Built server-side so the bot username never has to reach the client, and so a
  // missing env var fails loudly instead of producing a link that goes nowhere.
  const botUsername = process.env.TELEGRAM_BOT_USERNAME?.replace(/^@/, '')
  if (!botUsername) {
    console.error('[telegram/generate-code] TELEGRAM_BOT_USERNAME is not set in this environment')
    return NextResponse.json(
      { error: 'Привязка Telegram временно недоступна. Попробуйте позже.' },
      { status: 500 }
    )
  }

  const token = crypto.randomBytes(LINK_TOKEN_BYTES).toString('base64url')
  const expires = new Date(Date.now() + LINK_TOKEN_TTL_MS)

  await db.user.update({
    where: { id: session.user.id },
    data: {
      telegramLinkCode: token,
      telegramLinkExpires: expires,
    },
  })

  return NextResponse.json({
    token,
    url: `https://t.me/${botUsername}?start=${token}`,
    expiresIn: '15 минут',
  })
}

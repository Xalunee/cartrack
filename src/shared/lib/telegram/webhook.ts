import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import type { Bot } from 'grammy'

/**
 * Both webhooks have the same skeleton: check the secret header, initialise the
 * bot once per instance, answer 200 whatever happens so Telegram stops retrying,
 * and make sure the failure that was swallowed reaches Sentry first. Only the
 * bot, the secret and the Sentry tag differ.
 */
interface WebhookOptions {
  req: Request
  bot: Bot
  /** Expected value of `x-telegram-bot-api-secret-token` for this bot. */
  secret: string | undefined
  /** Sentry tag, so the two bots are distinguishable in the issue list. */
  area: string
}

// `bot.init()` is per Bot instance, and each route module holds exactly one, so
// the flag lives with the instance rather than in this module.
const initialised = new WeakSet<Bot>()

export async function handleTelegramWebhook({ req, bot, secret, area }: WebhookOptions) {
  // An unset secret must not turn into "no header required": a missing header
  // would then match and the webhook would be open to anyone.
  if (!secret || req.headers.get('x-telegram-bot-api-secret-token') !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    if (!initialised.has(bot)) {
      await bot.init()
      initialised.add(bot)
    }
    await bot.handleUpdate(await req.json())
    return NextResponse.json({ ok: true })
  } catch (error) {
    // We answer 200 on purpose so Telegram stops retrying, which means this catch
    // is where webhook failures used to disappear. Report before swallowing.
    console.error(`[${area}] webhook error:`, error)
    Sentry.captureException(error, { tags: { area, step: 'webhook' } })
    await Sentry.flush(2000).catch(() => {})
    return NextResponse.json({ ok: true })
  }
}

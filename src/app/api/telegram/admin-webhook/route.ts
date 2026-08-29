import { NextResponse } from 'next/server'
import { Bot } from 'grammy'
import { handleTelegramWebhook } from '@shared/lib/telegram/webhook'
import { matchAdminReply } from '@shared/lib/support/reply-matching'
import { findTicketByAdminMessageId } from '@shared/lib/support/tickets'
import { deliverAnswer } from '@shared/lib/support/answer'
import { adminBotToken, adminChatId } from '@shared/lib/support/notify'

/**
 * Built on first request rather than at module load. The user webhook throws on
 * import when its token is missing, which is fine for a bot the app cannot work
 * without — but the admin bot is optional infrastructure, and a missing token
 * must not take a deploy or a build down with it.
 */
let bot: Bot | null = null

function getBot(token: string): Bot {
  if (bot) return bot

  bot = new Bot(token)

  /**
   * Every update goes through one handler rather than through commands and
   * hears, because the admin check has to come first in all of them: anything
   * from any other chat gets no reply, no error, nothing that would confirm this
   * bot exists.
   */
  bot.on('message', async (ctx) => {
    const match = matchAdminReply(
      {
        chat: { id: ctx.chat.id },
        text: ctx.message.text,
        reply_to_message: ctx.message.reply_to_message
          ? { message_id: ctx.message.reply_to_message.message_id }
          : undefined,
      },
      adminChatId()
    )

    if (match.kind === 'not_admin') return

    if (match.kind === 'not_a_reply') {
      await ctx.reply(
        'Это админский бот CarTrack.\n\n' +
          'Сюда приходят обращения в поддержку и уведомления о регистрациях. ' +
          'Чтобы ответить пользователю — ответь реплаем на сообщение с обращением.'
      )
      return
    }

    if (match.kind === 'empty') {
      await ctx.reply('В реплае нет текста — отправлять нечего.')
      return
    }

    const ticket = await findTicketByAdminMessageId(match.adminMessageId)
    if (!ticket) {
      // Silence here would read as "sent" — say plainly that nothing was.
      await ctx.reply(
        '🤷 Не нашёл обращение для этого сообщения — ответ никому не ушёл.\n\n' +
          'Отвечай реплаем на сообщение с обращением, а не на моё подтверждение или скриншот.'
      )
      return
    }

    const { channels, failure } = await deliverAnswer(
      ticket,
      match.text,
      // The admin's own message joins the thread, so a reply to *it* finds the
      // same ticket later.
      String(ctx.message.message_id)
    )

    await ctx.reply(
      `✅ Ответ доставлен: ${channels.join(', ')}.` + (failure ? `\n\n⚠️ ${failure}` : '')
    )
  })

  return bot
}

export async function POST(req: Request) {
  const token = adminBotToken()
  if (!token) {
    console.error('[telegram-admin] TELEGRAM_ADMIN_BOT_TOKEN is not set in this environment')
    return NextResponse.json({ error: 'Admin bot not configured' }, { status: 503 })
  }

  return handleTelegramWebhook({
    req,
    bot: getBot(token),
    secret: process.env.TELEGRAM_ADMIN_WEBHOOK_SECRET,
    area: 'telegram-admin',
  })
}

export async function GET() {
  return NextResponse.json({ status: 'Telegram admin webhook active' })
}

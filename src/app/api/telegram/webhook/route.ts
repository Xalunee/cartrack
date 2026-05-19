import { NextResponse } from 'next/server'
import { bot, ensureBotInitialized } from '@shared/lib/telegram'
import { db } from '@shared/lib/db'

function verifySecret(req: Request): boolean {
  const secret = req.headers.get('x-telegram-bot-api-secret-token')
  return secret === process.env.TELEGRAM_WEBHOOK_SECRET
}

bot.command('start', async (ctx) => {
  await ctx.reply(
    'Привет! Я бот CarTrack 🚗\n\n' +
    'Я буду напоминать тебе вносить пробег и показывать статус обслуживания.\n\n' +
    'Чтобы привязать аккаунт:\n' +
    '1. Зайди на сайт → Настройки → Telegram\n' +
    '2. Нажми "Получить код привязки"\n' +
    '3. Отправь мне: /link ТВОЙ_КОД\n\n' +
    'После привязки можешь вводить пробег — просто отправь число.'
  )
})

bot.command('link', async (ctx) => {
  const chatId = String(ctx.chat.id)
  const code = ctx.match?.trim()

  if (!code || !/^\d{6}$/.test(code)) {
    await ctx.reply(
      'Отправьте 6-значный код привязки:\n' +
      '/link 123456\n\n' +
      'Код можно получить на сайте в разделе Настройки → Telegram.'
    )
    return
  }

  const user = await db.user.findFirst({
    where: {
      telegramLinkCode: code,
      telegramLinkExpires: { gt: new Date() },
    },
  })

  if (!user) {
    await ctx.reply('❌ Код неверный или истёк. Получите новый код в настройках на сайте.')
    return
  }

  await db.user.update({
    where: { id: user.id },
    data: {
      telegramChatId: chatId,
      telegramLinkCode: null,
      telegramLinkExpires: null,
    },
  })

  await ctx.reply(
    `✅ Аккаунт ${user.email} привязан!\n\n` +
    'Теперь я буду напоминать тебе вносить пробег.\n' +
    'Чтобы внести пробег — просто отправь число.\n' +
    'Чтобы посмотреть статус — /status'
  )
})

bot.command('status', async (ctx) => {
  const chatId = String(ctx.chat.id)

  const user = await db.user.findFirst({
    where: { telegramChatId: chatId },
    include: {
      car: {
        include: {
          maintenanceItems: true,
        },
      },
    },
  })

  if (!user || !user.car) {
    await ctx.reply('Аккаунт не привязан или машина не добавлена. Получи код в настройках на сайте и отправь /link код')
    return
  }

  const car = user.car
  const items = car.maintenanceItems
    .map((item) => {
      if (!item.intervalKm || item.lastServiceMileage === null) return null
      const remaining = item.intervalKm - (car.currentMileage - item.lastServiceMileage)
      const emoji = remaining <= 0 ? '🔴' : remaining < item.intervalKm * 0.3 ? '🟡' : '🟢'
      return `${emoji} ${item.name}: ${remaining.toLocaleString('ru')} км`
    })
    .filter(Boolean)

  await ctx.reply(
    `🚗 ${car.brand} ${car.model} ${car.year}\n` +
    `📏 Пробег: ${car.currentMileage.toLocaleString('ru')} км\n\n` +
    `Обслуживание:\n${items.join('\n') || 'Нет позиций'}`
  )
})

bot.on('message:text', async (ctx) => {
  const chatId = String(ctx.chat.id)
  const text = ctx.message.text.trim()

  if (text.startsWith('/')) return

  const mileage = parseInt(text.replace(/\s/g, ''), 10)
  if (isNaN(mileage) || mileage < 0) {
    await ctx.reply('Отправь число — текущий пробег в км (например: 87650)')
    return
  }

  const user = await db.user.findFirst({
    where: { telegramChatId: chatId },
    include: { car: true },
  })

  if (!user || !user.car) {
    await ctx.reply('Сначала привяжи аккаунт: получи код в настройках на сайте и отправь /link код')
    return
  }

  if (mileage < user.car.currentMileage) {
    await ctx.reply(`Пробег не может быть меньше текущего (${user.car.currentMileage.toLocaleString('ru')} км)`)
    return
  }

  await db.$transaction([
    db.mileageLog.create({
      data: {
        carId: user.car.id,
        mileage,
        note: 'Через Telegram',
      },
    }),
    db.car.update({
      where: { id: user.car.id },
      data: {
        currentMileage: mileage,
        lastTrackedAt: new Date(),
      },
    }),
  ])

  const diff = mileage - user.car.currentMileage
  await ctx.reply(
    `✅ Пробег обновлён: ${mileage.toLocaleString('ru')} км\n` +
    (diff > 0 ? `+${diff.toLocaleString('ru')} км с прошлого раза` : '')
  )
})

export async function POST(req: Request) {
  if (!verifySecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    await ensureBotInitialized()
    await bot.handleUpdate(body)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Telegram webhook error:', error)
    return NextResponse.json({ ok: true })
  }
}

export async function GET() {
  return NextResponse.json({ status: 'Telegram webhook is active' })
}

import { MaintenanceItem } from '@prisma/client'
import { NextResponse } from 'next/server'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Bot, InlineKeyboard, Keyboard } from 'grammy'
import { db } from '@shared/lib/db'
import { calculateDrivingPace } from '@shared/lib/calculations/mileage'
import { calculateRemainingResource } from '@shared/lib/calculations/maintenance'
import type { DrivingPace, MaintenanceStatus, RemainingResource } from '@shared/types'

const token = process.env.TELEGRAM_BOT_TOKEN
if (!token) throw new Error('TELEGRAM_BOT_TOKEN is not set')

const bot = new Bot(token)

/** How many recent readings the driving pace is derived from. */
const MILEAGE_LOGS_FOR_PACE = 8

// --- Helper: get user by chatId ---
async function getUserByChatId(chatId: string) {
  return db.user.findFirst({
    where: { telegramChatId: chatId },
    include: {
      car: {
        include: {
          maintenanceItems: { orderBy: { createdAt: 'asc' } },
          // Same window as /api/maintenance — enough for a driving pace.
          mileageLogs: { orderBy: { recordedAt: 'desc' }, take: MILEAGE_LOGS_FOR_PACE },
        },
      },
    },
  })
}

// --- Helper: main menu keyboard ---
function mainMenu() {
  return new InlineKeyboard()
    .text('📏 Внести пробег', 'action:mileage')
    .row()
    .text('📊 Статус машины', 'action:status')
    .row()
    .text('⚙️ Настройки', 'action:settings')
}

function mainReplyKeyboard() {
  return new Keyboard()
    .text('📏 Внести пробег')
    .text('📊 Статус')
    .row()
    .text('⚙️ Настройки')
    .resized()
    .persistent()
}

const STATUS_EMOJI: Record<MaintenanceStatus, string> = {
  critical: '🔴',
  soon: '🟡',
  ok: '🟢',
}

/** Worst first, same order the web app lists items in. */
const STATUS_ORDER: Record<MaintenanceStatus, number> = { critical: 0, soon: 1, ok: 2 }

/** Short date, with the year only when it is not the current one. */
function shortDate(date: Date): string {
  const pattern = date.getFullYear() === new Date().getFullYear() ? 'd MMM' : 'd MMM yyyy'
  return format(date, pattern, { locale: ru })
}

function remainingText(value: number, unit: string): string {
  const amount = Math.abs(value).toLocaleString('ru')
  if (value > 0) return `${amount} ${unit}`
  if (value === 0) return 'пора'
  return `просрочено на ${amount} ${unit}`
}

/**
 * One Telegram line per item. Whatever the shared calculation could not work out
 * — no intervals, or no last service to count from — surfaces as "нет данных".
 */
function formatItemLine(name: string, resource: RemainingResource): string {
  const parts: string[] = []
  if (resource.remainingKm !== null) parts.push(remainingText(resource.remainingKm, 'км'))
  if (resource.remainingDays !== null) parts.push(remainingText(resource.remainingDays, 'дн.'))

  const unique = [...new Set(parts)]
  if (!unique.length) return `➖ ${name} — нет данных`

  // For a km interval the forecast adds something the numbers do not say: when
  // the current pace gets there. For a days-only item it just repeats the day
  // count, so it stays off those lines.
  if (resource.forecastDate && resource.remainingKm !== null) {
    unique.push(`~${shortDate(resource.forecastDate)}`)
  }

  return `${STATUS_EMOJI[resource.status]} ${name} — ${unique.join(' · ')}`
}

function withResources(
  items: MaintenanceItem[],
  currentMileage: number,
  pace: DrivingPace | null
) {
  return items
    .map((item) => ({
      name: item.name,
      resource: calculateRemainingResource(item, currentMileage, pace),
    }))
    .sort((a, b) => STATUS_ORDER[a.resource.status] - STATUS_ORDER[b.resource.status])
}

// --- Helper: format maintenance status ---
function formatMaintenanceStatus(
  items: MaintenanceItem[],
  currentMileage: number,
  pace: DrivingPace | null
): string {
  if (!items.length) return 'Нет позиций обслуживания'

  return withResources(items, currentMileage, pace)
    .map(({ name, resource }) => formatItemLine(name, resource))
    .join('\n')
}

/** Only the items that need attention — an item without data never qualifies. */
function formatAlerts(
  items: MaintenanceItem[],
  currentMileage: number,
  pace: DrivingPace | null
): string[] {
  return withResources(items, currentMileage, pace)
    .filter(({ resource }) => resource.status !== 'ok')
    .map(({ name, resource }) => formatItemLine(name, resource))
}

// --- /start command ---
bot.command('start', async (ctx) => {
  const chatId = String(ctx.chat.id)
  const user = await getUserByChatId(chatId)

  if (user) {
    await ctx.reply(
      `С возвращением, ${user.name ?? user.email}! 🚗`,
      { reply_markup: mainReplyKeyboard() }
    )
  } else {
    await ctx.reply(
      'Привет! Я бот CarTrack 🚗\n\n' +
      'Чтобы начать, привяжи аккаунт:\n\n' +
      '1️⃣ Зайди на сайт → Настройки → Telegram\n' +
      '2️⃣ Нажми "Получить код"\n' +
      '3️⃣ Отправь код сюда командой: /link КОД',
      {
        reply_markup: new InlineKeyboard()
          .url('🌐 Открыть сайт', (process.env.NEXTAUTH_URL ?? 'https://cartrack.vercel.app') + '/settings')
      }
    )
  }
})

// --- /link command (code-based, secure) ---
bot.command('link', async (ctx) => {
  const chatId = String(ctx.chat.id)
  const code = ctx.match?.trim()

  if (!code || !/^\d{6}$/.test(code)) {
    await ctx.reply(
      'Отправь 6-значный код привязки:\n/link 123456\n\n' +
      'Код можно получить на сайте: Настройки → Telegram.',
      {
        reply_markup: new InlineKeyboard()
          .url('🌐 Открыть настройки', (process.env.NEXTAUTH_URL ?? 'https://cartrack.vercel.app') + '/settings')
      }
    )
    return
  }

  // Check if this chatId is already linked to someone
  const existingLink = await db.user.findFirst({ where: { telegramChatId: chatId } })
  if (existingLink) {
    await ctx.reply(
      `Ты уже привязан к аккаунту ${existingLink.email}.\n\n` +
      'Сначала отвяжи текущий аккаунт в настройках на сайте.',
      {
        reply_markup: new InlineKeyboard()
          .url('⚙️ Настройки', (process.env.NEXTAUTH_URL ?? 'https://cartrack.vercel.app') + '/settings')
      }
    )
    return
  }

  // Find user by code
  const user = await db.user.findFirst({
    where: {
      telegramLinkCode: code,
      telegramLinkExpires: { gt: new Date() },
    },
  })

  if (!user) {
    await ctx.reply('❌ Код неверный или истёк. Получи новый код в настройках.')
    return
  }

  // Link
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
    'Теперь ты можешь вносить пробег и проверять статус.',
    { reply_markup: mainReplyKeyboard() }
  )
})

// --- Callback: mileage prompt ---
bot.callbackQuery('action:mileage', async (ctx) => {
  await ctx.answerCallbackQuery()
  const chatId = String(ctx.chat!.id)
  const user = await getUserByChatId(chatId)

  if (!user || !user.car) {
    await ctx.editMessageText('Аккаунт не привязан или машина не добавлена.')
    return
  }

  await ctx.editMessageText(
    `📏 Текущий пробег: ${user.car.currentMileage.toLocaleString('ru')} км\n\n` +
    'Отправь новый пробег числом (например: ' + (user.car.currentMileage + 200) + ')',
    {
      reply_markup: new InlineKeyboard()
        .text('◀️ Назад', 'action:menu')
    }
  )
})

// --- Callback: status ---
bot.callbackQuery('action:status', async (ctx) => {
  await ctx.answerCallbackQuery()
  const chatId = String(ctx.chat!.id)
  const user = await getUserByChatId(chatId)

  if (!user || !user.car) {
    await ctx.editMessageText('Аккаунт не привязан или машина не добавлена.')
    return
  }

  const car = user.car
  const pace = calculateDrivingPace(car.mileageLogs)
  const statusText = formatMaintenanceStatus(car.maintenanceItems, car.currentMileage, pace)

  await ctx.editMessageText(
    `🚗 ${car.brand} ${car.model} ${car.year}\n` +
    `📏 Пробег: ${car.currentMileage.toLocaleString('ru')} км\n\n` +
    `Обслуживание:\n${statusText}`,
    {
      reply_markup: new InlineKeyboard()
        .text('🔄 Обновить', 'action:status')
        .text('◀️ Назад', 'action:menu')
    }
  )
})

// --- Callback: settings ---
bot.callbackQuery('action:settings', async (ctx) => {
  await ctx.answerCallbackQuery()
  const chatId = String(ctx.chat!.id)
  const user = await getUserByChatId(chatId)

  if (!user) {
    await ctx.editMessageText('Аккаунт не привязан.')
    return
  }

  await ctx.editMessageText(
    `⚙️ Настройки\n\n` +
    `👤 ${user.name ?? 'Без имени'}\n` +
    `📧 ${user.email}\n` +
    `🔔 Напоминания: каждые ${user.mileageTrackInterval} дн.\n\n` +
    'Для полных настроек зайди на сайт.',
    {
      reply_markup: new InlineKeyboard()
        .url('🌐 Открыть сайт', (process.env.NEXTAUTH_URL ?? 'https://cartrack.vercel.app') + '/settings')
        .row()
        .text('❌ Отвязать Telegram', 'action:unlink_confirm')
        .row()
        .text('◀️ Назад', 'action:menu')
    }
  )
})

// --- Callback: unlink confirmation ---
bot.callbackQuery('action:unlink_confirm', async (ctx) => {
  await ctx.answerCallbackQuery()
  await ctx.editMessageText(
    'Точно отвязать Telegram? Ты перестанешь получать напоминания.',
    {
      reply_markup: new InlineKeyboard()
        .text('✅ Да, отвязать', 'action:unlink')
        .text('❌ Отмена', 'action:settings')
    }
  )
})

// --- Callback: unlink ---
bot.callbackQuery('action:unlink', async (ctx) => {
  await ctx.answerCallbackQuery()
  const chatId = String(ctx.chat!.id)

  await db.user.updateMany({
    where: { telegramChatId: chatId },
    data: {
      telegramChatId: null,
      telegramLinkCode: null,
      telegramLinkExpires: null,
    },
  })

  await ctx.editMessageText(
    '✅ Telegram отвязан. Чтобы привязать снова — используй /start'
  )
})

// --- Callback: back to menu ---
bot.callbackQuery('action:menu', async (ctx) => {
  await ctx.answerCallbackQuery()
  const chatId = String(ctx.chat!.id)
  const user = await getUserByChatId(chatId)

  await ctx.editMessageText(
    `🚗 CarTrack${user?.car ? ` · ${user.car.brand} ${user.car.model}` : ''}\nЧто сделать?`,
    { reply_markup: mainMenu() }
  )
})

bot.hears('📏 Внести пробег', async (ctx) => {
  const chatId = String(ctx.chat.id)
  const user = await getUserByChatId(chatId)

  if (!user || !user.car) {
    await ctx.reply('Сначала привяжи аккаунт. Нажми /start')
    return
  }

  await ctx.reply(
    `📏 Текущий пробег: ${user.car.currentMileage.toLocaleString('ru')} км\n\n` +
    'Отправь новый пробег числом:'
  )
})

bot.hears('📊 Статус', async (ctx) => {
  const chatId = String(ctx.chat.id)
  const user = await getUserByChatId(chatId)

  if (!user || !user.car) {
    await ctx.reply('Сначала привяжи аккаунт. Нажми /start')
    return
  }

  const car = user.car
  const pace = calculateDrivingPace(car.mileageLogs)
  const statusText = formatMaintenanceStatus(car.maintenanceItems, car.currentMileage, pace)

  await ctx.reply(
    `🚗 ${car.brand} ${car.model} ${car.year}\n` +
    `📏 Пробег: ${car.currentMileage.toLocaleString('ru')} км\n\n` +
    `Обслуживание:\n${statusText}`
  )
})

bot.hears('⚙️ Настройки', async (ctx) => {
  const chatId = String(ctx.chat.id)
  const user = await getUserByChatId(chatId)

  if (!user) {
    await ctx.reply('Сначала привяжи аккаунт. Нажми /start')
    return
  }

  await ctx.reply(
    `⚙️ Настройки\n\n` +
    `👤 ${user.name ?? 'Без имени'}\n` +
    `📧 ${user.email}\n` +
    `🔔 Напоминания: каждые ${user.mileageTrackInterval} дн.\n\n` +
    'Для полных настроек зайди на сайт.',
    {
      reply_markup: new InlineKeyboard()
        .url('🌐 Открыть сайт', (process.env.NEXTAUTH_URL ?? 'https://cartrack.vercel.app') + '/settings')
        .row()
        .text('❌ Отвязать Telegram', 'action:unlink_confirm')
    }
  )
})

// --- Handle plain number as mileage input ---
bot.on('message:text', async (ctx) => {
  const chatId = String(ctx.chat.id)
  const text = ctx.message.text.trim()

  if (text.startsWith('/')) return

  const mileage = parseInt(text.replace(/\s/g, ''), 10)
  if (isNaN(mileage) || mileage < 0) {
    await ctx.reply(
      'Отправь текущий пробег числом (например: 87650)',
      { reply_markup: mainMenu() }
    )
    return
  }

  const user = await getUserByChatId(chatId)
  if (!user || !user.car) {
    await ctx.reply('Сначала привяжи аккаунт. Нажми /start')
    return
  }

  if (mileage < user.car.currentMileage) {
    await ctx.reply(
      `Пробег не может быть меньше текущего (${user.car.currentMileage.toLocaleString('ru')} км)`,
      { reply_markup: mainMenu() }
    )
    return
  }

  // Ask for confirmation
  await ctx.reply(
    `Пробег: ${mileage.toLocaleString('ru')} км\n` +
    `+${(mileage - user.car.currentMileage).toLocaleString('ru')} км с прошлого раза\n\n` +
    'Всё верно?',
    {
      reply_markup: new InlineKeyboard()
        .text('✅ Да, сохранить', `confirm:mileage:${mileage}`)
        .text('❌ Отмена', 'action:menu')
    }
  )
})

// --- Callback: confirm mileage ---
bot.callbackQuery(/^confirm:mileage:(\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery()
  const chatId = String(ctx.chat!.id)
  const mileage = parseInt(ctx.match![1], 10)

  const user = await getUserByChatId(chatId)
  if (!user || !user.car) {
    await ctx.editMessageText('Ошибка: машина не найдена.')
    return
  }

  if (mileage < user.car.currentMileage) {
    await ctx.editMessageText('Ошибка: пробег уже был обновлён.')
    return
  }

  const diff = mileage - user.car.currentMileage

  // Save mileage
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

  // Build alerts against the reading just saved, with the pace it implies — the
  // fetched car still holds the previous mileage and log list.
  const logs = [{ mileage, recordedAt: new Date() }, ...user.car.mileageLogs].slice(
    0,
    MILEAGE_LOGS_FOR_PACE
  )
  const alerts = formatAlerts(user.car.maintenanceItems, mileage, calculateDrivingPace(logs))

  let message = `✅ Пробег обновлён: ${mileage.toLocaleString('ru')} км`
  if (diff > 0) message += `\n+${diff.toLocaleString('ru')} км`
  if (alerts.length > 0) message += `\n\n⚠️ Требует внимания:\n${alerts.join('\n')}`

  await ctx.editMessageText('✅ Пробег сохранён!')
  await ctx.reply(message, { reply_markup: mainReplyKeyboard() })
})

// --- Webhook handler ---
function verifySecret(req: Request): boolean {
  const secret = req.headers.get('x-telegram-bot-api-secret-token')
  return secret === process.env.TELEGRAM_WEBHOOK_SECRET
}

let botInitialized = false

export async function POST(req: Request) {
  if (!verifySecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    if (!botInitialized) {
      await bot.init()
      botInitialized = true
    }
    const body = await req.json()
    await bot.handleUpdate(body)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Telegram webhook error:', error)
    return NextResponse.json({ ok: true })
  }
}

export async function GET() {
  return NextResponse.json({ status: 'Telegram webhook active' })
}

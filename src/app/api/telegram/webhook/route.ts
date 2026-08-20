import { NextResponse } from 'next/server'
import { Bot, InlineKeyboard, Keyboard } from 'grammy'
import { db } from '@shared/lib/db'
import { calculateDrivingPace, MILEAGE_LOGS_FOR_PACE } from '@shared/lib/calculations/mileage'
import { formatAlerts, formatMaintenanceStatus } from '@shared/lib/formatting/maintenance-lines'
import { validateMileagePoint } from '@shared/lib/calculations/mileage-validation'
import { recomputeCurrentMileage } from '@shared/lib/car-mileage'
import { LIMITS } from '@shared/lib/validation/limits'
import { parseMileageInput } from '@shared/lib/validation/mileage-input'
import { TELEGRAM_FALLBACK_LABEL } from '@shared/config'

const token = process.env.TELEGRAM_BOT_TOKEN
if (!token) throw new Error('TELEGRAM_BOT_TOKEN is not set')

const bot = new Bot(token)

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

// --- Account linking ---

/**
 * Link tokens are 24 random bytes in base64url (32 chars). The range is loose on
 * purpose so a token issued under a different length still validates; anything
 * outside this alphabet cannot be one and is rejected without a database hit.
 */
const LINK_TOKEN_PATTERN = /^[A-Za-z0-9_-]{16,64}$/

/**
 * Defence in depth. The token itself is infeasible to guess, so this exists to
 * stop a chat burning function invocations on a sweep. In-memory means it is
 * per-instance and resets on redeploy — acceptable for that purpose, and the
 * token remains the actual security boundary.
 */
const MAX_LINK_ATTEMPTS = 5
const LINK_ATTEMPT_WINDOW_MS = 60 * 60 * 1000

const linkAttempts = new Map<string, { count: number; firstAt: number }>()

function pruneLinkAttempts(now: number) {
  for (const [chatId, entry] of linkAttempts) {
    if (now - entry.firstAt > LINK_ATTEMPT_WINDOW_MS) linkAttempts.delete(chatId)
  }
}

function isLinkLockedOut(chatId: string): boolean {
  const entry = linkAttempts.get(chatId)
  if (!entry) return false
  if (Date.now() - entry.firstAt > LINK_ATTEMPT_WINDOW_MS) {
    linkAttempts.delete(chatId)
    return false
  }
  return entry.count >= MAX_LINK_ATTEMPTS
}

function recordFailedLink(chatId: string) {
  const now = Date.now()
  const entry = linkAttempts.get(chatId)
  if (!entry || now - entry.firstAt > LINK_ATTEMPT_WINDOW_MS) {
    if (linkAttempts.size > 1000) pruneLinkAttempts(now)
    linkAttempts.set(chatId, { count: 1, firstAt: now })
    return
  }
  entry.count += 1
}

type LinkOutcome =
  | { status: 'linked'; email: string }
  | { status: 'already_linked'; email: string }
  | { status: 'invalid' }
  | { status: 'locked' }

/**
 * Redeems a link token for this chat. Expired and never-issued tokens are
 * deliberately indistinguishable to the caller — telling them apart would confirm
 * to a sweeper that a value was once real.
 */
async function linkAccount(chatId: string, token: string): Promise<LinkOutcome> {
  if (isLinkLockedOut(chatId)) return { status: 'locked' }

  // Not a guess, so it never counts against the attempt budget.
  const existingLink = await db.user.findFirst({ where: { telegramChatId: chatId } })
  if (existingLink) return { status: 'already_linked', email: existingLink.email }

  if (!LINK_TOKEN_PATTERN.test(token)) {
    recordFailedLink(chatId)
    return { status: 'invalid' }
  }

  const user = await db.user.findFirst({
    where: { telegramLinkCode: token, telegramLinkExpires: { gt: new Date() } },
  })
  if (!user) {
    recordFailedLink(chatId)
    return { status: 'invalid' }
  }

  await db.user.update({
    where: { id: user.id },
    data: {
      telegramChatId: chatId,
      telegramLinkCode: null,
      telegramLinkExpires: null,
    },
  })

  linkAttempts.delete(chatId)
  return { status: 'linked', email: user.email }
}

function settingsUrl() {
  return (process.env.NEXTAUTH_URL ?? 'https://cartrack.vercel.app') + '/settings'
}

/**
 * The manual /link command is the exception, not the entry point: the token it
 * needs is only shown on the settings page, under the fallback disclosure, and
 * only after the link button has been pressed. So every reply that mentions the
 * command has to send the user to that button first, or they arrive on the site
 * looking for a token that is not there yet. The disclosure's own label is
 * imported rather than retyped, so renaming it cannot strand this instruction.
 */
const LINK_INSTRUCTIONS =
  'Зайди на сайт → Настройки → Telegram и нажми «Привязать Telegram» — бот сам откроет этот чат.\n\n' +
  `Команда /link нужна только если чат не открылся: там же, под «${TELEGRAM_FALLBACK_LABEL}», лежит готовая команда — скопируй и пришли её сюда.`

/** One message for every failure mode that is not "you are already linked". */
const LINK_FAILED_TEXT =
  '❌ Ссылка привязки недействительна или истекла.\n\n' + LINK_INSTRUCTIONS

/**
 * Shared reply for both entry points — the /start deep link and the manual
 * /link fallback. A locked-out chat gets no reply at all.
 */
async function replyToLinkOutcome(
  ctx: { reply: (text: string, other?: object) => Promise<unknown> },
  outcome: LinkOutcome
) {
  if (outcome.status === 'locked') return

  if (outcome.status === 'linked') {
    await ctx.reply(
      `✅ Аккаунт ${outcome.email} привязан!\n\n` +
        'Теперь ты можешь вносить пробег и проверять статус.',
      { reply_markup: mainReplyKeyboard() }
    )
    return
  }

  if (outcome.status === 'already_linked') {
    await ctx.reply(
      `Ты уже привязан к аккаунту ${outcome.email}.\n\n` +
        'Сначала отвяжи текущий аккаунт в настройках на сайте.',
      {
        reply_markup: new InlineKeyboard().url('⚙️ Настройки', settingsUrl()),
      }
    )
    return
  }

  await ctx.reply(LINK_FAILED_TEXT, {
    reply_markup: new InlineKeyboard().url('🌐 Открыть настройки', settingsUrl()),
  })
}

// --- /start command ---
bot.command('start', async (ctx) => {
  const chatId = String(ctx.chat.id)

  // Deep link from the site: /start <token>. Telegram passes the start parameter
  // through as the command argument.
  const payload = ctx.match?.trim()
  if (payload) {
    await replyToLinkOutcome(ctx, await linkAccount(chatId, payload))
    return
  }

  const user = await getUserByChatId(chatId)

  if (user) {
    await ctx.reply(
      `С возвращением, ${user.name ?? user.email}! 🚗`,
      { reply_markup: mainReplyKeyboard() }
    )
  } else {
    await ctx.reply(
      'Привет! Я бот CarTrack 🚗\n\n' +
      'Чтобы начать, привяжи аккаунт.\n\n' +
      LINK_INSTRUCTIONS,
      {
        reply_markup: new InlineKeyboard()
          .url('🌐 Открыть настройки', settingsUrl())
      }
    )
  }
})

// --- /link command (manual fallback for the deep link) ---
bot.command('link', async (ctx) => {
  const chatId = String(ctx.chat.id)
  const token = ctx.match?.trim()

  if (!token) {
    if (isLinkLockedOut(chatId)) return
    await ctx.reply(
      'Привязка делается с сайта в одно нажатие.\n\n' + LINK_INSTRUCTIONS,
      {
        reply_markup: new InlineKeyboard().url('🌐 Открыть настройки', settingsUrl()),
      }
    )
    return
  }

  await replyToLinkOutcome(ctx, await linkAccount(chatId, token))
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
        .url('🌐 Открыть сайт', settingsUrl())
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
        .url('🌐 Открыть сайт', settingsUrl())
        .row()
        .text('❌ Отвязать Telegram', 'action:unlink_confirm')
    }
  )
})

/**
 * Every reading the bot is about to store goes through the same gate the web API
 * uses: the shared non-decreasing-odometer check, reported back in the same
 * words. Returns the refusal text, or null when the point is acceptable.
 */
async function rejectMileagePoint(
  carId: string,
  currentMileage: number,
  mileage: number,
  recordedAt: Date
): Promise<string | null> {
  if (mileage < currentMileage) {
    return `Пробег не может быть меньше текущего (${currentMileage.toLocaleString('ru')} км)`
  }

  const validation = await validateMileagePoint(db, carId, { mileage, recordedAt })
  if (!validation.ok) return `${validation.message}\n\n${validation.suggestion}`

  return null
}

// --- Handle plain number as mileage input ---
bot.on('message:text', async (ctx) => {
  const chatId = String(ctx.chat.id)
  const text = ctx.message.text.trim()

  if (text.startsWith('/')) return

  const parsed = parseMileageInput(text)
  if (!parsed.ok) {
    await ctx.reply(
      parsed.reason === 'too_large'
        ? `Слишком большой пробег — не больше ${LIMITS.mileage.toLocaleString('ru')} км.`
        : 'Отправь текущий пробег числом (например: 87650)',
      { reply_markup: mainMenu() }
    )
    return
  }

  const { mileage } = parsed

  const user = await getUserByChatId(chatId)
  if (!user || !user.car) {
    await ctx.reply('Сначала привяжи аккаунт. Нажми /start')
    return
  }

  const refusal = await rejectMileagePoint(
    user.car.id,
    user.car.currentMileage,
    mileage,
    new Date()
  )
  if (refusal) {
    await ctx.reply(refusal, { reply_markup: mainMenu() })
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
  // The number comes back from a callback payload, not fresh user input, but it
  // still gets the same bounds check — a stale or crafted payload is untrusted.
  const parsed = parseMileageInput(ctx.match![1])
  if (!parsed.ok) {
    await ctx.editMessageText('Ошибка: некорректный пробег.')
    return
  }
  const { mileage } = parsed

  const user = await getUserByChatId(chatId)
  if (!user || !user.car) {
    await ctx.editMessageText('Ошибка: машина не найдена.')
    return
  }

  const car = user.car
  const recordedAt = new Date()

  // Re-checked here, not just before the confirm button: minutes may have passed
  // and another path may have moved the odometer in between.
  const refusal = await rejectMileagePoint(car.id, car.currentMileage, mileage, recordedAt)
  if (refusal) {
    await ctx.editMessageText(`❌ ${refusal}`)
    return
  }

  const diff = mileage - car.currentMileage

  // Save mileage. currentMileage is never written directly — recompute derives
  // it from the log history, the same as every other write path.
  try {
    await db.$transaction(async (tx) => {
      await tx.mileageLog.create({
        data: {
          carId: car.id,
          mileage,
          recordedAt,
          note: 'Через Telegram',
        },
      })
      await recomputeCurrentMileage(tx, car.id)
    })
  } catch (error) {
    // The webhook's blanket catch would swallow this and leave the user with no
    // reply at all, staring at an unanswered confirmation.
    console.error('[telegram] mileage save failed:', error)
    await ctx.editMessageText('❌ Не удалось сохранить пробег. Попробуй ещё раз позже.')
    return
  }

  // Build alerts against the reading just saved, with the pace it implies — the
  // fetched car still holds the previous mileage and log list.
  const logs = [{ mileage, recordedAt }, ...car.mileageLogs].slice(0, MILEAGE_LOGS_FOR_PACE)
  const alerts = formatAlerts(car.maintenanceItems, mileage, calculateDrivingPace(logs))

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

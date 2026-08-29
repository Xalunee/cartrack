import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { captureMisconfigurationOnce } from '@shared/lib/monitoring/capture-once'
import { db } from '@shared/lib/db'
import { calculateDrivingPace, MILEAGE_LOGS_FOR_PACE } from '@shared/lib/calculations/mileage'
import { formatAlerts } from '@shared/lib/formatting/maintenance-lines'
import { sendMessage } from '@shared/lib/telegram/api'

export async function GET(req: Request) {
  if (!process.env.CRON_SECRET) {
    console.error('[cron/notify] CRON_SECRET is not set in this environment')
    await captureMisconfigurationOnce('[cron/notify] CRON_SECRET is not set')
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 })
  }
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.error('[cron/notify] TELEGRAM_BOT_TOKEN is not set in this environment')
    await captureMisconfigurationOnce('[cron/notify] TELEGRAM_BOT_TOKEN is not set')
    return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN not configured' }, { status: 500 })
  }

  const users = await db.user.findMany({
    where: {
      telegramChatId: { not: null },
      car: { isNot: null },
    },
    include: {
      car: {
        include: {
          maintenanceItems: true,
          // Needed for the pace the shared calculation forecasts from.
          mileageLogs: { orderBy: { recordedAt: 'desc' }, take: MILEAGE_LOGS_FOR_PACE },
        },
      },
    },
  })

  let sent = 0
  let skipped = 0
  const errors: string[] = []

  for (const user of users) {
    if (!user.telegramChatId || !user.car) {
      skipped++
      continue
    }

    const car = user.car
    const daysSinceLastTrack = Math.floor(
      (Date.now() - new Date(car.lastTrackedAt).getTime()) / (1000 * 60 * 60 * 24)
    )

    if (daysSinceLastTrack < user.mileageTrackInterval) {
      skipped++
      continue
    }

    // The shared calculation and the shared formatting, not hand-rolled km
    // arithmetic: a day-interval-only item has no intervalKm to count against
    // and used to be invisible here even when months overdue.
    const pace = calculateDrivingPace(car.mileageLogs)
    const criticalItems = formatAlerts(car.maintenanceItems, car.currentMileage, pace)

    let message =
      `🚗 Пора внести пробег!\n\n` +
      `Последний раз: ${daysSinceLastTrack} дн. назад\n` +
      `Текущий пробег: ${car.currentMileage.toLocaleString('ru')} км\n\n` +
      `Просто отправь текущий пробег числом.`

    if (criticalItems.length > 0) {
      message += `\n\n⚠️ Требует внимания:\n${criticalItems.join('\n')}`
    }

    try {
      await sendMessage(process.env.TELEGRAM_BOT_TOKEN, user.telegramChatId, message)
      sent++
    } catch (err) {
      Sentry.captureException(err, { tags: { area: 'cron', job: 'notify' }, extra: { userId: user.id } })
      errors.push(`user ${user.id}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  console.log(
    `[cron/notify] candidates=${users.length} reminded=${sent} skipped=${skipped} failed=${errors.length}`
  )
  if (errors.length) console.error('[cron/notify] send errors:', errors)

  // Flush before responding: the instance may be frozen right after.
  if (errors.length) await Sentry.flush(2000).catch(() => {})

  return NextResponse.json({
    ok: true,
    candidates: users.length,
    reminded: sent,
    skipped,
    failed: errors.length,
  })
}

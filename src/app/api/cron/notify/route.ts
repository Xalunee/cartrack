import { NextResponse } from 'next/server'
import { db } from '@shared/lib/db'

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`

async function sendTelegramMessage(chatId: string, text: string) {
  await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  })
}

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
        },
      },
    },
  })

  let sent = 0

  for (const user of users) {
    if (!user.telegramChatId || !user.car) continue

    const car = user.car
    const daysSinceLastTrack = Math.floor(
      (Date.now() - new Date(car.lastTrackedAt).getTime()) / (1000 * 60 * 60 * 24)
    )

    if (daysSinceLastTrack < user.mileageTrackInterval) continue

    const criticalItems = car.maintenanceItems
      .filter((item) => {
        if (!item.intervalKm || item.lastServiceMileage === null) return false
        const remaining = item.intervalKm - (car.currentMileage - item.lastServiceMileage)
        return remaining < item.intervalKm * 0.3
      })
      .map((item) => {
        const remaining = item.intervalKm! - (car.currentMileage - item.lastServiceMileage!)
        return remaining <= 0
          ? `🔴 ${item.name} — просрочено`
          : `🟡 ${item.name} — осталось ${remaining.toLocaleString('ru')} км`
      })

    let message =
      `🚗 Пора внести пробег!\n\n` +
      `Последний раз: ${daysSinceLastTrack} дн. назад\n` +
      `Текущий пробег: ${car.currentMileage.toLocaleString('ru')} км\n\n` +
      `Просто отправь текущий пробег числом.`

    if (criticalItems.length > 0) {
      message += `\n\n⚠️ Требует внимания:\n${criticalItems.join('\n')}`
    }

    await sendTelegramMessage(user.telegramChatId, message)
    sent++
  }

  return NextResponse.json({ ok: true, reminded: sent })
}

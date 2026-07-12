import { NextResponse } from 'next/server'
import { db } from '@shared/lib/db'
import { syncFinesForCar } from '@shared/lib/fines-sync'

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`

async function sendTelegramMessage(chatId: string, text: string) {
  const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Telegram sendMessage ${res.status}: ${body}`)
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function GET(req: Request) {
  if (!process.env.CRON_SECRET) {
    console.error('[cron/fines] CRON_SECRET is not set in this environment')
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 })
  }
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const cars = await db.car.findMany({
    where: { stsNumber: { not: null } },
    include: { user: true },
  })

  let checked = 0
  let newFinesTotal = 0
  let notified = 0
  const errors: string[] = []

  for (const car of cars) {
    try {
      const result = await syncFinesForCar(car.id)
      checked++
      newFinesTotal += result.newFines

      const unnotified = await db.fine.findMany({
        where: { carId: car.id, notifiedAt: null },
      })

      if (car.user.telegramChatId && unnotified.length > 0) {
        for (const fine of unnotified) {
          let message =
            `⚠️ Новый штраф: ${fine.koapText ?? 'Штраф ГИБДД'}\n` +
            `Сумма: ${fine.sum.toLocaleString('ru')} ₽`

          if (fine.enableDiscount && fine.dateDiscount) {
            const discountDate = fine.dateDiscount.toLocaleDateString('ru')
            message += `\n💸 Со скидкой 50%: ${(fine.sum / 2).toLocaleString('ru')} ₽ до ${discountDate}`
          }

          message += `\n\nПодробнее: ${process.env.NEXTAUTH_URL}/fines`

          await sendTelegramMessage(car.user.telegramChatId, message)
        }

        await db.fine.updateMany({
          where: { id: { in: unnotified.map((f) => f.id) } },
          data: { notifiedAt: new Date() },
        })
        notified += unnotified.length
      }
    } catch (err) {
      errors.push(`car ${car.id}: ${err instanceof Error ? err.message : String(err)}`)
    }

    await delay(1000)
  }

  console.log(
    `[cron/fines] cars=${cars.length} checked=${checked} newFines=${newFinesTotal} notified=${notified} failed=${errors.length}`
  )
  if (errors.length) console.error('[cron/fines] errors:', errors)

  return NextResponse.json({ checked, newFines: newFinesTotal, notified })
}

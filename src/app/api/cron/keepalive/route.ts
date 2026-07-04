import { NextResponse } from 'next/server'
import { db } from '@shared/lib/db'

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const count = await db.user.count()
  return NextResponse.json({ ok: true, users: count, timestamp: new Date().toISOString() })
}

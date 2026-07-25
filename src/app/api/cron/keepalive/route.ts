import { NextResponse } from 'next/server'
import { db } from '@shared/lib/db'

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const count = await db.user.count()

  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_ANON_KEY

  let restPing: { status: number } | { skipped: string }
  if (supabaseUrl && supabaseKey) {
    const res = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
      signal: AbortSignal.timeout(10000),
    })
    restPing = { status: res.status }
  } else {
    restPing = { skipped: 'SUPABASE_URL or SUPABASE_ANON_KEY not set' }
  }

  return NextResponse.json({
    ok: true,
    users: count,
    restPing,
    timestamp: new Date().toISOString(),
  })
}

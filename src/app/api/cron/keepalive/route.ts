import { NextResponse } from 'next/server'
import { db } from '@shared/lib/db'

type RestPing =
  | { status: number; reachedDb: true }
  | { status: number; body: string; reachedDb: false }
  | { error: string; reachedDb: false }
  | { skipped: string; reachedDb: false }

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // The REST ping goes FIRST: if the project is paused, it is what wakes it up.
  // A Prisma query against a sleeping database throws, so it must never run before this.
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_ANON_KEY

  let restPing: RestPing
  if (supabaseUrl && supabaseKey) {
    try {
      // Hit an actual table, not the API root — only a request that reaches Postgres
      // counts as project activity and resets the free-tier inactivity timer.
      const res = await fetch(`${supabaseUrl}/rest/v1/users?select=id&limit=1`, {
        headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
        signal: AbortSignal.timeout(10000),
      })
      if (res.ok) {
        restPing = { status: res.status, reachedDb: true }
      } else {
        // Non-2xx does NOT prove the database was touched: PostgREST answers an
        // unexposed table with 404 PGRST205 straight from its schema cache. Keep the
        // body so that case is distinguishable from a real permission/network fault.
        const body = (await res.text()).slice(0, 200)
        restPing = { status: res.status, body, reachedDb: false }
      }
    } catch (e) {
      restPing = { error: e instanceof Error ? e.message : String(e), reachedDb: false }
    }
  } else {
    restPing = { skipped: 'SUPABASE_URL or SUPABASE_ANON_KEY not set', reachedDb: false }
  }

  let dbResult: { users: number } | { error: string }
  try {
    dbResult = { users: await db.user.count() }
  } catch (e) {
    dbResult = { error: e instanceof Error ? e.message : String(e) }
  }

  // The route exists to prove the project is awake, so success is exactly "the ping
  // reached Postgres" — a skipped ping is the silent failure that caused the pauses.
  const ok = restPing.reachedDb

  return NextResponse.json(
    {
      ok,
      restPing,
      db: dbResult,
      timestamp: new Date().toISOString(),
    },
    { status: ok ? 200 : 503 },
  )
}

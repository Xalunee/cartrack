import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { captureMisconfigurationOnce } from '@shared/lib/monitoring/capture-once'
import { db } from '@shared/lib/db'

type RestPing =
  | { status: number; reachedDb: true }
  | { status: number; body: string; reachedDb: false }
  | { error: string; reachedDb: false }
  | { skipped: string; reachedDb: false }

export async function GET(req: Request) {
  if (!process.env.CRON_SECRET) {
    console.error('[cron/keepalive] CRON_SECRET is not set in this environment')
    await captureMisconfigurationOnce('[cron/keepalive] CRON_SECRET is not set')
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 })
  }
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
      // A fetch exception message carries the Supabase host and, for TLS/DNS faults,
      // resolver detail — log it, but never hand it back over HTTP.
      console.error('[cron/keepalive] REST ping failed:', e)
      Sentry.captureException(e, { tags: { area: 'cron', job: 'keepalive', step: 'rest-ping' } })
      restPing = { error: 'rest ping failed', reachedDb: false }
    }
  } else {
    restPing = { skipped: 'SUPABASE_URL or SUPABASE_ANON_KEY not set', reachedDb: false }
  }

  let dbResult: { users: number } | { error: string }
  try {
    dbResult = { users: await db.user.count() }
  } catch (e) {
    // Prisma errors routinely quote the connection string and host — keep them in
    // the Vercel logs and return only the fact that the query failed.
    console.error('[cron/keepalive] database query failed:', e)
    Sentry.captureException(e, { tags: { area: 'cron', job: 'keepalive', step: 'db-query' } })
    dbResult = { error: 'database unreachable' }
  }

  // The route exists to prove the project is awake, so success is exactly "the ping
  // reached Postgres" — a skipped ping is the silent failure that caused the pauses.
  const ok = restPing.reachedDb

  // Flush before responding: the instance may be frozen right after.
  if (!ok || 'error' in dbResult) await Sentry.flush(2000).catch(() => {})

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

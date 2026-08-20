import { NextResponse } from 'next/server'

/**
 * TEMPORARY — delete once GlitchTip is confirmed to be receiving events.
 *
 * The throw is deliberately uncaught: that routes it through `onRequestError`,
 * the same path every real route-handler failure takes, so a successful test
 * proves the whole chain and not just a manual capture call.
 */
export function GET(req: Request) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 })
  }
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  throw new Error('Sentry test error from CarTrack')
}

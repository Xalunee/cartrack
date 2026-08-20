import * as Sentry from '@sentry/nextjs'

/**
 * Attempts allowed per message for the life of the instance. Three is enough to
 * survive a brief outage at the reporting service without ever becoming a loop.
 */
const MAX_ATTEMPTS = 3

const attemptsSpent = new Map<string, number>()
const inFlight = new Map<string, Promise<void>>()

/**
 * Reports a missing environment variable a bounded number of times per server
 * instance.
 *
 * The cron routes answer this branch before checking the caller's secret — they
 * have to, since with the secret unset the comparison would degrade to
 * `Bearer undefined` — so anonymous callers reach it. Sending on every one of
 * them would turn a single unset variable into unbounded quota, while sending
 * exactly once loses the event whenever the flush fails, because Vercel can
 * freeze the instance the moment the route responds. A small attempt budget
 * covers both: a dropped event gets another chance, an unreachable service
 * cannot keep buying two-second waits.
 */
export function captureMisconfigurationOnce(message: string): Promise<void> {
  // A concurrent caller joins the attempt already running rather than sending a
  // second copy of the same event.
  const running = inFlight.get(message)
  if (running) return running

  const spent = attemptsSpent.get(message) ?? 0
  if (spent >= MAX_ATTEMPTS) return Promise.resolve()

  // Counted before delivery, not after it succeeds: otherwise an unreachable
  // service leaves the budget untouched and every request pays for a retry.
  attemptsSpent.set(message, spent + 1)

  const attempt = deliver(message).finally(() => inFlight.delete(message))
  inFlight.set(message, attempt)
  return attempt
}

async function deliver(message: string): Promise<void> {
  Sentry.captureMessage(message, 'error')
  const flushed = await Sentry.flush(2000).catch(() => false)
  // It arrived, so spend what is left of the budget and stay quiet from here.
  if (flushed) attemptsSpent.set(message, MAX_ATTEMPTS)
}

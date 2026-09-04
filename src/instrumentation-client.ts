/**
 * Browser-side error reporting.
 *
 * Next.js runs this file after the document and before React hydrates — which
 * is precisely why the SDK itself must not be in it. `@sentry/nextjs` is 146 KiB
 * gzipped, roughly a third of everything the dashboard downloads before it can
 * paint, and on an installed iOS web app that parse sits between the tap on the
 * icon and the first pixel. It buys nothing there: tracing, replay and profiling
 * are all off (see SHARED_SENTRY_OPTIONS), so `captureException` is the only
 * thing this app ever asks of it.
 *
 * So what ships eagerly is two listeners. They hold whatever throws in the gap,
 * the SDK arrives once the browser is idle, and the held errors are replayed
 * into it — the download moves off the critical path without a blind window.
 *
 * The `bundleSizeOptimizations` flags on `withSentryConfig` are not an
 * alternative: their `__SENTRY_TRACING__` define lives in the SDK's webpack
 * branch only, and this app builds with Turbopack.
 *
 * Worth knowing before "optimising" this back: an `await import()` hands over
 * the whole module namespace, so the SDK is no longer tree-shaken and the async
 * chunk is *larger* than the share it used to occupy in the eager bundle — about
 * 177 KiB gzipped against 75. That is the trade on purpose. Those bytes now
 * arrive after first paint instead of before hydration, which is the number an
 * installed app is judged on. If the total ever matters more than the timing,
 * the lever is a smaller SDK (`@sentry/browser` covers `captureException`), not
 * moving this back onto the critical path.
 */
import {
  CLIENT_DENIED_URLS,
  CLIENT_IGNORED_ERRORS,
  SHARED_SENTRY_OPTIONS,
} from '@shared/lib/monitoring/sentry-scrub'

type SentryModule = typeof import('@sentry/nextjs')

/**
 * The two entry points this app actually uses, once they have landed. Null for
 * the first seconds of every page load.
 */
let sentry: Pick<SentryModule, 'captureException' | 'captureRouterTransitionStart'> | null = null

/**
 * Errors thrown before the SDK landed.
 *
 * Bounded, because the failure most likely to happen this early is a render loop
 * — and an unbounded buffer would faithfully hold every iteration of it until
 * the tab ran out of memory. Ten is plenty: the first few carry the cause.
 */
const BUFFER_LIMIT = 10
const buffered: unknown[] = []

function buffer(error: unknown): void {
  if (buffered.length < BUFFER_LIMIT) buffered.push(error)
}

// `event.error` is absent for cross-origin script errors, where the message is
// all the browser is willing to say.
const onError = (event: ErrorEvent) => buffer(event.error ?? event.message)
const onRejection = (event: PromiseRejectionEvent) => buffer(event.reason)

async function loadSentry(): Promise<void> {
  const { init, captureException, captureRouterTransitionStart } = await import('@sentry/nextjs')

  // Detached here rather than after `init`: the SDK installs global handlers of
  // its own, and for as long as both sets are attached a single throw would be
  // recorded twice — once live by Sentry, once by us and again on replay. There
  // is no `await` between this and `init`, so nothing can slip through the gap.
  window.removeEventListener('error', onError)
  window.removeEventListener('unhandledrejection', onRejection)

  init({
    ...SHARED_SENTRY_OPTIONS,
    // Public by design: a DSN is write-only, it cannot read anything back.
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    // The NEXT_PUBLIC_ variant is the only one inlined into the client bundle; the
    // plain VERCEL_ENV the server reads would be undefined here, tagging every
    // preview deploy as production.
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,
    // Aborted requests, dropped connections and extension noise are filtered on
    // the client only — on the server the same messages mean a real outage.
    ignoreErrors: CLIENT_IGNORED_ERRORS,
    denyUrls: CLIENT_DENIED_URLS,
  })
  sentry = { captureException, captureRouterTransitionStart }

  for (const error of buffered.splice(0)) captureException(error)
}

function scheduleLoad(): void {
  const run = () => {
    // A failed chunk fetch must not become an unhandled rejection: our own
    // listeners are already gone by then, so it would have nowhere to go but the
    // console.
    void loadSentry().catch((e) => console.error('Sentry failed to load', e))
  }

  // Safari only learned `requestIdleCallback` in 17, and the installed iOS web
  // app is the platform this whole deferral exists for. The timeout keeps a busy
  // main thread from postponing reporting indefinitely.
  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(run, { timeout: 5000 })
  } else {
    window.setTimeout(run, 2000)
  }
}

// `enabled` is `NODE_ENV === 'production'`. In development `init` would be a
// no-op anyway, so skip the import outright and keep the dev bundle light too.
if (SHARED_SENTRY_OPTIONS.enabled) {
  window.addEventListener('error', onError)
  window.addEventListener('unhandledrejection', onRejection)

  // Waiting for `load` keeps the download behind the page's own resources; if
  // the document is already done, there is nothing left to wait for.
  if (document.readyState === 'complete') scheduleLoad()
  else window.addEventListener('load', scheduleLoad, { once: true })
}

/**
 * Next.js calls this on every client navigation. It forwards to the SDK once the
 * SDK exists and does nothing before that — which with `tracesSampleRate: 0` is
 * the same nothing it does today, but the wiring survives for whenever tracing
 * is turned on.
 */
export function onRouterTransitionStart(href: string, navigationType: string): void {
  sentry?.captureRouterTransitionStart(href, navigationType)
}

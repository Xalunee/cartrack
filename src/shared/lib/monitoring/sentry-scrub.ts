/**
 * Everything the Sentry/GlitchTip SDK sends passes through here first.
 *
 * Our requests carry values that must never leave the server: Telegram link
 * tokens (in the deep-link query string), STS numbers, session cookies, the cron
 * secret and the Supabase anon key. The SDK's own defaults are not enough — with
 * `sendDefaultPii` off it still attaches request headers, cookies and query
 * params, only running its generic denylist over them. So the scrubbing here is
 * deliberately blunt: drop whole categories rather than try to guess which field
 * of which payload holds the secret this time.
 */
import type { ErrorEvent } from '@sentry/nextjs'

const REDACTED = '[Filtered]'

/** Dropped from `event.request.headers` outright. */
const SENSITIVE_HEADERS = [
  'authorization',
  'cookie',
  'set-cookie',
  'x-telegram-bot-api-secret-token',
  'apikey',
  'x-api-key',
  'proxy-authorization',
]

/**
 * Any key whose name matches loses its value, at any depth of the event. The STS
 * alternative is spelled out rather than left as a bare `sts`: as a substring it
 * also hits `hosts`, `costs` and `requests`, and a field blanked by us reads
 * exactly like a field that was never set.
 */
const SENSITIVE_KEY =
  /sts[-_]?number|token|secret|password|passwd|pwd|api[-_]?key|apikey|authorization|cookie|credential|session/i

/** `stsNumber=1234567890`, `"stsNumber": "1234567890"` and friends inside free text. */
const STS_IN_TEXT = /(sts[-_]?number["'\s]*[:=]\s*["']?)([^\s,"'}&]+)/gi

/**
 * Credentials that leak through error *messages* rather than through structured
 * fields — Prisma quotes the connection string, grammY quotes the bot API URL,
 * and a Supabase key is a JWT that can turn up in either.
 */
const URL_CREDENTIALS = /([a-z][a-z0-9+.-]*:\/\/)[^\s/@:]+:[^\s/@]*@/gi
const TELEGRAM_BOT_TOKEN = /\/bot\d+:[A-Za-z0-9_-]+/g
const JWT_LIKE = /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]+/g

/** Extension frames and URLs: noise from the user's browser, never our bug. */
const EXTENSION_URL = /^(chrome|moz|safari-web|chrome-untrusted|ms-browser)-extension:\/\//

/**
 * Browser-only noise. Deliberately NOT part of the shared options: the SDK's
 * event filter matches these by substring against the message and against
 * `"${type}: ${value}"`, so on the server `The operation was aborted` would
 * swallow `AbortSignal.timeout` — which is exactly how the keepalive cron learns
 * that Supabase stopped answering. Nothing on the server may ignore an abort or
 * a failed fetch; both describe a real outage there.
 */
export const CLIENT_IGNORED_ERRORS: (string | RegExp)[] = [
  // The user's connection dropped, one message per engine.
  'Failed to fetch',
  'NetworkError',
  'Network request failed',
  'Load failed',
  'network error',
  'Failed to load resource',
  // Requests we cancel ourselves — polling and TanStack Query do this routinely.
  'AbortError',
  'The user aborted a request',
  'The operation was aborted',
  'signal is aborted without reason',
  'cancelled',
  'canceled',
  // Layout-observer chatter, never a real fault.
  'ResizeObserver loop limit exceeded',
  'ResizeObserver loop completed with undelivered notifications',
  // Browser extension noise.
  /^chrome-extension:\/\//,
  /^moz-extension:\/\//,
  'Extension context invalidated',
  'ResizeObserver is not defined',
  // Global handlers report a rejection with no value as this; there is no stack
  // to act on.
  'Non-Error promise rejection captured with value: undefined',
]

/** Stack frames from outside our bundle. Browser-only by nature. */
export const CLIENT_DENIED_URLS: (string | RegExp)[] = [
  /^chrome-extension:\/\//,
  /^moz-extension:\/\//,
  /^safari-web-extension:\/\//,
  /^chrome:\/\//,
  /extensions\//,
]

/** Everything before the `?` — the Telegram link token rides in the query string. */
function stripQuery(url: string): string {
  const cut = url.search(/[?#]/)
  return cut === -1 ? url : url.slice(0, cut)
}

function scrubText(value: string): string {
  return (
    value
      .replace(STS_IN_TEXT, `$1${REDACTED}`)
      .replace(URL_CREDENTIALS, `$1${REDACTED}@`)
      .replace(TELEGRAM_BOT_TOKEN, `/bot${REDACTED}`)
      .replace(JWT_LIKE, REDACTED)
      // A bare URL inside a message keeps its path but loses its parameters.
      .replace(/(https?:\/\/[^\s"']+)/g, (url) => stripQuery(url))
  )
}

/**
 * Walks the event in place, blanking sensitive keys and scrubbing free text.
 * Depth-limited and cycle-safe: this runs on every captured error.
 */
function scrubDeep(value: unknown, seen: WeakSet<object>, depth = 0): unknown {
  if (typeof value === 'string') return scrubText(value)
  if (depth > 8 || value === null || typeof value !== 'object') return value
  if (seen.has(value)) return value
  seen.add(value)

  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      value[i] = scrubDeep(value[i], seen, depth + 1)
    }
    return value
  }

  const record = value as Record<string, unknown>
  for (const key of Object.keys(record)) {
    if (SENSITIVE_KEY.test(key)) {
      record[key] = REDACTED
      continue
    }
    if (/^(url|href|uri|path|referer|referrer|request_url)$/i.test(key) && typeof record[key] === 'string') {
      record[key] = stripQuery(record[key] as string)
      continue
    }
    record[key] = scrubDeep(record[key], seen, depth + 1)
  }
  return record
}

function hasExtensionFrame(event: ErrorEvent): boolean {
  return (event.exception?.values ?? []).some((exception) =>
    (exception.stacktrace?.frames ?? []).some(
      (frame) => typeof frame.filename === 'string' && EXTENSION_URL.test(frame.filename)
    )
  )
}

/**
 * Last gate before an event leaves the process. Returning `null` drops it.
 *
 * Shared by the client, server and edge inits so there is exactly one place to
 * audit: whatever is stripped here is stripped everywhere.
 */
export function scrubEvent(event: ErrorEvent): ErrorEvent | null {
  if (hasExtensionFrame(event)) return null

  if (event.request) {
    // The body is the likeliest hiding place for a secret and we have never
    // needed it to diagnose anything, so it goes as a whole.
    delete event.request.data
    delete event.request.cookies
    delete event.request.query_string
    if (event.request.url) event.request.url = stripQuery(event.request.url)
    if (event.request.headers) {
      for (const header of Object.keys(event.request.headers)) {
        if (SENSITIVE_HEADERS.includes(header.toLowerCase())) {
          delete event.request.headers[header]
        }
      }
    }
  }

  // Server-side events would otherwise carry the whole process environment.
  delete event.contexts?.runtime?.env
  if (event.extra) event.extra = scrubDeep(event.extra, new WeakSet()) as typeof event.extra
  if (event.contexts) event.contexts = scrubDeep(event.contexts, new WeakSet()) as typeof event.contexts
  if (event.tags) event.tags = scrubDeep(event.tags, new WeakSet()) as typeof event.tags
  if (event.breadcrumbs) {
    event.breadcrumbs = scrubDeep(event.breadcrumbs, new WeakSet()) as typeof event.breadcrumbs
  }
  if (event.request?.headers) {
    event.request.headers = scrubDeep(event.request.headers, new WeakSet()) as Record<string, string>
  }
  if (event.exception?.values) {
    for (const exception of event.exception.values) {
      if (exception.value) exception.value = scrubText(exception.value)
    }
  }
  if (typeof event.message === 'string') event.message = scrubText(event.message)

  return event
}

/**
 * Init options every runtime shares. Errors only — tracing, replay and
 * profiling stay off: at our scale they burn the free GlitchTip quota and tell
 * us nothing.
 *
 * `environment` is deliberately absent: only NEXT_PUBLIC_ variables survive into
 * the client bundle, so each runtime names its own source and no init depends on
 * spread order to get it right.
 */
export const SHARED_SENTRY_OPTIONS = {
  tracesSampleRate: 0,
  // Local runs must not spend quota, and a missing DSN has to stay harmless.
  enabled: process.env.NODE_ENV === 'production',
  // Replaces the deprecated `sendDefaultPii: false`. Every category has to be
  // named: as soon as `dataCollection` is present the SDK's own defaults flip to
  // permissive for anything left out.
  dataCollection: {
    userInfo: false,
    cookies: false,
    httpHeaders: { request: { deny: SENSITIVE_HEADERS }, response: false },
    httpBodies: [],
    urlQueryParams: false,
    databaseQueryData: false,
    // Locals routinely hold the very values we are stripping elsewhere.
    stackFrameVariables: false,
    genAI: { inputs: false, outputs: false },
  },
  // No `ignoreErrors`/`denyUrls` here on purpose — see CLIENT_IGNORED_ERRORS.
  beforeSend: (event: ErrorEvent) => scrubEvent(event),
}

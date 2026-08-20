import { describe, expect, it } from 'vitest'
import type { ErrorEvent } from '@sentry/nextjs'
import {
  CLIENT_IGNORED_ERRORS,
  SHARED_SENTRY_OPTIONS,
  scrubEvent,
} from './sentry-scrub'

function event(overrides: Partial<ErrorEvent>): ErrorEvent {
  return { type: undefined, ...overrides } as ErrorEvent
}

describe('scrubEvent — request', () => {
  it('drops the body, cookies and query string wholesale', () => {
    const scrubbed = scrubEvent(
      event({
        request: {
          url: 'https://cartrack.app/api/telegram/webhook?token=A1b2C3d4E5f6G7h8I9j0',
          query_string: 'token=A1b2C3d4E5f6G7h8I9j0',
          cookies: { 'next-auth.session-token': 'abc' },
          data: { stsNumber: '1234567890' },
        },
      })
    )

    expect(scrubbed?.request?.data).toBeUndefined()
    expect(scrubbed?.request?.cookies).toBeUndefined()
    expect(scrubbed?.request?.query_string).toBeUndefined()
    expect(scrubbed?.request?.url).toBe('https://cartrack.app/api/telegram/webhook')
  })

  it('removes the auth, cookie and Telegram secret headers', () => {
    const scrubbed = scrubEvent(
      event({
        request: {
          headers: {
            Authorization: 'Bearer cron-secret',
            Cookie: 'session=abc',
            'x-telegram-bot-api-secret-token': 'webhook-secret',
            'user-agent': 'TelegramBot',
          },
        },
      })
    )

    expect(scrubbed?.request?.headers).toEqual({ 'user-agent': 'TelegramBot' })
  })
})

describe('scrubEvent — payload', () => {
  it('redacts stsNumber wherever it appears', () => {
    const scrubbed = scrubEvent(
      event({
        extra: { car: { stsNumber: '1234567890', plate: 'A123AA' } },
        breadcrumbs: [{ message: 'sync', data: { sts_number: '1234567890' } }],
        exception: { values: [{ value: 'fines lookup failed for stsNumber=1234567890' }] },
      })
    )

    expect(scrubbed?.extra).toEqual({ car: { stsNumber: '[Filtered]', plate: 'A123AA' } })
    expect(scrubbed?.breadcrumbs?.[0]?.data?.sts_number).toBe('[Filtered]')
    expect(scrubbed?.exception?.values?.[0]?.value).toBe(
      'fines lookup failed for stsNumber=[Filtered]'
    )
  })

  it('strips query parameters from URLs in breadcrumbs and messages', () => {
    const scrubbed = scrubEvent(
      event({
        message: 'failed GET https://cartrack.app/link?start=A1b2C3d4E5f6G7h8I9j0',
        breadcrumbs: [{ data: { url: 'https://cartrack.app/api/fines?token=secret' } }],
      })
    )

    expect(scrubbed?.message).toBe('failed GET https://cartrack.app/link')
    expect(scrubbed?.breadcrumbs?.[0]?.data?.url).toBe('https://cartrack.app/api/fines')
  })

  it('redacts credentials, bot tokens and JWTs quoted inside error messages', () => {
    const scrubbed = scrubEvent(
      event({
        exception: {
          values: [
            {
              value:
                'connect failed postgresql://user:hunter2@db.host/postgres ' +
                'https://api.telegram.org/bot123456:AA_bot-token/sendMessage ' +
                'apikey eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYW5vbiJ9.SflKxwRJSMeKKF2QT4',
            },
          ],
        },
      })
    )

    const value = scrubbed?.exception?.values?.[0]?.value ?? ''
    expect(value).not.toContain('hunter2')
    expect(value).not.toContain('AA_bot-token')
    expect(value).not.toContain('eyJhbGciOiJIUzI1NiJ9')
  })

  it('survives a cyclic payload', () => {
    const cyclic: Record<string, unknown> = { name: 'loop' }
    cyclic.self = cyclic
    expect(() => scrubEvent(event({ extra: { cyclic } }))).not.toThrow()
  })
})

describe('scrubEvent — noise', () => {
  it('drops events thrown from a browser extension', () => {
    const scrubbed = scrubEvent(
      event({
        exception: {
          values: [
            {
              value: 'boom',
              stacktrace: { frames: [{ filename: 'chrome-extension://abc/inject.js' }] },
            },
          ],
        },
      })
    )

    expect(scrubbed).toBeNull()
  })

  it('keeps events thrown from our own bundle', () => {
    const scrubbed = scrubEvent(
      event({
        exception: {
          values: [
            { value: 'boom', stacktrace: { frames: [{ filename: '/app/.next/server/page.js' }] } },
          ],
        },
      })
    )

    expect(scrubbed).not.toBeNull()
  })
})

/**
 * How the SDK's event-filters integration matches `ignoreErrors`: substring for
 * strings, `test()` for patterns, against the message and against
 * `"${type}: ${value}"`. Mirrored here so the assertions below are about real
 * filter behaviour and not about the shape of our own list.
 */
function ignoredBy(patterns: (string | RegExp)[], message: string): boolean {
  return patterns.some((pattern) =>
    typeof pattern === 'string' ? message.includes(pattern) : pattern.test(message)
  )
}

/** What a timed-out or dropped outgoing request actually looks like in Node. */
const SERVER_OUTAGE_MESSAGES = [
  // AbortSignal.timeout — the keepalive REST ping and the fines API call.
  'TimeoutError: The operation was aborted due to timeout',
  'AbortError: This operation was aborted',
  // undici, when the host is unreachable.
  'TypeError: fetch failed',
  'Error: getaddrinfo ENOTFOUND db.example.supabase.co',
]

describe('noise filtering stays on the client', () => {
  it('never filters an outage on the server or the edge', () => {
    const serverIgnored =
      (SHARED_SENTRY_OPTIONS as { ignoreErrors?: (string | RegExp)[] }).ignoreErrors ?? []

    expect(serverIgnored).toEqual([])
    for (const message of SERVER_OUTAGE_MESSAGES) {
      expect(ignoredBy(serverIgnored, message)).toBe(false)
    }
  })

  it('still filters the aborted-request messages in the browser', () => {
    expect(ignoredBy(CLIENT_IGNORED_ERRORS, 'AbortError: The user aborted a request.')).toBe(true)
    expect(ignoredBy(CLIENT_IGNORED_ERRORS, 'TypeError: Failed to fetch')).toBe(true)
    expect(ignoredBy(CLIENT_IGNORED_ERRORS, 'ResizeObserver loop limit exceeded')).toBe(true)
  })
})

describe('shared options stay runtime-agnostic', () => {
  it('does not carry an environment — each init names its own source', () => {
    // A shared `environment` only ever resolved correctly because the client init
    // happened to override it on a later line; reordering the spread would have
    // silently sent preview events as production.
    expect('environment' in SHARED_SENTRY_OPTIONS).toBe(false)
  })
})

describe('sensitive key matching', () => {
  it('blanks stsNumber but leaves field names that merely contain "sts"', () => {
    const scrubbed = scrubEvent(
      event({ extra: { stsNumber: '1234567890', sts_number: '1', hosts: ['db'], costs: 42, requests: 7 } })
    )

    expect(scrubbed?.extra).toEqual({
      stsNumber: '[Filtered]',
      sts_number: '[Filtered]',
      hosts: ['db'],
      costs: 42,
      requests: 7,
    })
  })
})

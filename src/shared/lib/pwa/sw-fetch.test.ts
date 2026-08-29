import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * These run the real `public/sw.js`, not a copy of its rules. The service worker
 * is plain script served as-is, so the only way to test what actually ships is to
 * evaluate that file with the worker globals stubbed and drive its fetch handler.
 *
 * What is being defended: an API route that nobody remembered to list in
 * CACHEABLE_API used to fall through to the cache-first branch meant for static
 * assets, which pinned its first response for that URL forever. /api/support
 * answered with an empty list before the user had written anything, and that
 * empty list was replayed on every later request — their own tickets never
 * appeared, on any reload.
 */

const SW_SOURCE = readFileSync(join(process.cwd(), 'public', 'sw.js'), 'utf8')

const ORIGIN = 'https://cartrack.test'

interface FetchEventStub {
  request: Request
  respondWith: (value: Response | Promise<Response>) => void
  waitUntil: (value: unknown) => void
  responded?: Promise<Response>
}

function loadServiceWorker() {
  const store = new Map<string, Response>()
  const listeners = new Map<string, (event: unknown) => void>()

  const cacheStub = {
    put: async (request: Request | string, response: Response) => {
      store.set(typeof request === 'string' ? request : request.url, response)
    },
    add: async () => {},
    match: async (request: Request | string) =>
      store.get(typeof request === 'string' ? request : request.url),
  }

  const caches = {
    open: async () => cacheStub,
    match: async (request: Request | string) =>
      store.get(typeof request === 'string' ? request : request.url),
    keys: async () => [] as string[],
    delete: async () => true,
  }

  const self = {
    addEventListener: (type: string, handler: (event: unknown) => void) => {
      listeners.set(type, handler)
    },
    skipWaiting: () => {},
    clients: { claim: async () => {}, matchAll: async () => [] },
    location: { origin: ORIGIN },
  }

  const fetchMock = vi.fn(
    async () =>
      new Response(JSON.stringify([{ id: 'ticket_1' }]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
  )

  // Deliberate: the shipped file is a classic worker script, and evaluating it is
  // the only way to test the rules that actually reach users.
  new Function('self', 'caches', 'fetch', 'console', SW_SOURCE)(self, caches, fetchMock, console)

  const onFetch = listeners.get('fetch')
  if (!onFetch) throw new Error('service worker registered no fetch listener')

  async function dispatch(path: string, init?: RequestInit) {
    const event: FetchEventStub = {
      request: new Request(`${ORIGIN}${path}`, init),
      respondWith: (value) => {
        event.responded = Promise.resolve(value)
      },
      waitUntil: () => {},
    }
    onFetch!(event)
    return event
  }

  return { dispatch, fetchMock, store }
}

describe('service worker fetch routing', () => {
  let sw: ReturnType<typeof loadServiceWorker>

  beforeEach(() => {
    sw = loadServiceWorker()
  })

  it('goes to the network for an API route nobody listed as cacheable', async () => {
    const event = await sw.dispatch('/api/support')

    expect(event.responded).toBeDefined()
    expect(sw.fetchMock).toHaveBeenCalledOnce()
    await expect((await event.responded!).json()).resolves.toEqual([{ id: 'ticket_1' }])
  })

  it('never replays a stale cached response for such a route', async () => {
    // Exactly the poisoned state the bug left behind: the empty list the endpoint
    // returned before the user had written anything.
    sw.store.set(
      `${ORIGIN}/api/support`,
      new Response('[]', { headers: { 'Content-Type': 'application/json' } })
    )

    const event = await sw.dispatch('/api/support')

    await expect((await event.responded!).json()).resolves.toEqual([{ id: 'ticket_1' }])
  })

  it('does not put an unlisted API response into a cache at all', async () => {
    const event = await sw.dispatch('/api/support')
    await event.responded

    // Give any stray cache write a turn to run before looking.
    await Promise.resolve()
    expect(sw.store.has(`${ORIGIN}/api/support`)).toBe(false)
  })

  it('still serves the listed API routes network-first', async () => {
    const event = await sw.dispatch('/api/car')

    expect(sw.fetchMock).toHaveBeenCalledOnce()
    await expect((await event.responded!).json()).resolves.toEqual([{ id: 'ticket_1' }])
  })

  it('leaves the auth routes alone entirely', async () => {
    const event = await sw.dispatch('/api/auth/session')

    expect(event.responded).toBeUndefined()
    expect(sw.fetchMock).not.toHaveBeenCalled()
  })

  it('still answers hashed static assets from the cache first', async () => {
    const cached = new Response('cached-bundle')
    sw.store.set(`${ORIGIN}/_next/static/chunk.js`, cached)

    const event = await sw.dispatch('/_next/static/chunk.js')

    await expect((await event.responded!).text()).resolves.toBe('cached-bundle')
    expect(sw.fetchMock).not.toHaveBeenCalled()
  })
})

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { init, captureException, captureRouterTransitionStart } = vi.hoisted(() => ({
  init: vi.fn(),
  captureException: vi.fn(),
  captureRouterTransitionStart: vi.fn(),
}))

vi.mock('@sentry/nextjs', () => ({ init, captureException, captureRouterTransitionStart }))

// `enabled` is normally `NODE_ENV === 'production'`, which is false under the
// test runner — the module would attach nothing at all.
vi.mock('@shared/lib/monitoring/sentry-scrub', () => ({
  SHARED_SENTRY_OPTIONS: { enabled: true },
  CLIENT_IGNORED_ERRORS: [],
  CLIENT_DENIED_URLS: [],
}))

type Listener = (event: unknown) => void

/**
 * The environment is `node`, so `window` has to be built by hand. Holding the
 * idle callback rather than running it is the whole point: the gap between the
 * page loading and the SDK arriving is what these tests are about.
 */
function installWindow() {
  const listeners = new Map<string, Set<Listener>>()
  let idle: (() => void) | null = null

  const win = {
    addEventListener(type: string, fn: Listener) {
      if (!listeners.has(type)) listeners.set(type, new Set())
      listeners.get(type)!.add(fn)
    },
    removeEventListener(type: string, fn: Listener) {
      listeners.get(type)?.delete(fn)
    },
    requestIdleCallback(cb: () => void) {
      idle = cb
    },
    setTimeout: globalThis.setTimeout.bind(globalThis),
  }

  globalThis.window = win as unknown as Window & typeof globalThis
  globalThis.document = { readyState: 'complete' } as Document

  return {
    /** Fires a listener the module attached, the way the browser would. */
    throwError: (error: unknown) =>
      listeners.get('error')?.forEach((fn) => fn({ error, message: 'boom' })),
    reject: (reason: unknown) =>
      listeners.get('unhandledrejection')?.forEach((fn) => fn({ reason })),
    listenerCount: (type: string) => listeners.get(type)?.size ?? 0,
    runIdle: () => idle?.(),
  }
}

async function loadModule() {
  vi.resetModules()
  return import('./instrumentation-client')
}

let browser: ReturnType<typeof installWindow>

beforeEach(() => {
  vi.clearAllMocks()
  browser = installWindow()
})

afterEach(() => {
  delete (globalThis as { window?: unknown }).window
  delete (globalThis as { document?: unknown }).document
})

describe('deferred Sentry start-up', () => {
  it('does not touch the SDK before the browser goes idle', async () => {
    await loadModule()

    expect(init).not.toHaveBeenCalled()
    // The listeners are the cheap part and must be up immediately, or the very
    // errors this deferral risks losing would be lost.
    expect(browser.listenerCount('error')).toBe(1)
    expect(browser.listenerCount('unhandledrejection')).toBe(1)
  })

  it('replays errors thrown before the SDK arrived', async () => {
    await loadModule()

    const early = new Error('thrown during hydration')
    const rejected = new Error('rejected during hydration')
    browser.throwError(early)
    browser.reject(rejected)
    expect(captureException).not.toHaveBeenCalled()

    browser.runIdle()
    await vi.waitFor(() => expect(init).toHaveBeenCalledTimes(1))

    expect(captureException).toHaveBeenCalledWith(early)
    expect(captureException).toHaveBeenCalledWith(rejected)
  })

  it('detaches its listeners once the SDK is in charge, so nothing is reported twice', async () => {
    await loadModule()

    browser.runIdle()
    await vi.waitFor(() => expect(init).toHaveBeenCalledTimes(1))

    expect(browser.listenerCount('error')).toBe(0)
    expect(browser.listenerCount('unhandledrejection')).toBe(0)

    // Sentry's own global handlers cover this one; ours must not add a copy.
    browser.throwError(new Error('after load'))
    expect(captureException).not.toHaveBeenCalled()
  })

  it('caps the buffer, so a render loop cannot fill memory before the SDK lands', async () => {
    await loadModule()

    for (let i = 0; i < 50; i++) browser.throwError(new Error(`loop ${i}`))

    browser.runIdle()
    await vi.waitFor(() => expect(init).toHaveBeenCalledTimes(1))

    expect(captureException).toHaveBeenCalledTimes(10)
    // The first ones are kept, not the last: they carry the cause.
    expect(captureException).toHaveBeenCalledWith(new Error('loop 0'))
  })

  it('keeps the router hook harmless until the SDK exists', async () => {
    const mod = await loadModule()

    expect(() => mod.onRouterTransitionStart('/dashboard', 'push')).not.toThrow()
    expect(captureRouterTransitionStart).not.toHaveBeenCalled()

    browser.runIdle()
    await vi.waitFor(() => expect(init).toHaveBeenCalledTimes(1))

    mod.onRouterTransitionStart('/mileage', 'push')
    expect(captureRouterTransitionStart).toHaveBeenCalledWith('/mileage', 'push')
  })
})

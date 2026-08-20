import { beforeEach, describe, expect, it, vi } from 'vitest'

const { captureMessage, flush } = vi.hoisted(() => ({
  captureMessage: vi.fn(),
  flush: vi.fn(),
}))

vi.mock('@sentry/nextjs', () => ({ captureMessage, flush }))

const MESSAGE = '[cron/notify] CRON_SECRET is not set'

/** Each test needs the counter to start empty — it lives for the module's life. */
async function freshHelper() {
  vi.resetModules()
  const helper = await import('./capture-once')
  return helper.captureMisconfigurationOnce
}

function deferred() {
  let resolve!: (value: boolean) => void
  const promise = new Promise<boolean>((r) => {
    resolve = r
  })
  return { promise, resolve }
}

beforeEach(() => {
  captureMessage.mockClear()
  flush.mockClear()
  flush.mockResolvedValue(true)
})

describe('captureMisconfigurationOnce', () => {
  it('sends once and then stays quiet while delivery succeeds', async () => {
    const capture = await freshHelper()

    await capture(MESSAGE)
    await capture(MESSAGE)
    await capture(MESSAGE)

    expect(captureMessage).toHaveBeenCalledTimes(1)
    expect(captureMessage).toHaveBeenCalledWith(MESSAGE, 'error')
  })

  it('leaves a retry when delivery fails', async () => {
    const capture = await freshHelper()
    flush.mockResolvedValue(false)

    await capture(MESSAGE)
    await capture(MESSAGE)

    expect(captureMessage).toHaveBeenCalledTimes(2)
  })

  it('stops after the attempt budget is spent, however long the service stays down', async () => {
    const capture = await freshHelper()
    flush.mockResolvedValue(false)

    for (let request = 0; request < 20; request++) {
      await capture(MESSAGE)
    }

    expect(captureMessage).toHaveBeenCalledTimes(3)
  })

  it('stops retrying as soon as one attempt gets through', async () => {
    const capture = await freshHelper()
    flush.mockResolvedValueOnce(false).mockResolvedValue(true)

    await capture(MESSAGE)
    await capture(MESSAGE)
    await capture(MESSAGE)

    expect(captureMessage).toHaveBeenCalledTimes(2)
  })

  it('does not double-send for two concurrent callers', async () => {
    const capture = await freshHelper()
    const pending = deferred()
    flush.mockReturnValue(pending.promise)

    const first = capture(MESSAGE)
    const second = capture(MESSAGE)
    pending.resolve(true)
    await Promise.all([first, second])

    expect(captureMessage).toHaveBeenCalledTimes(1)
  })

  it('counts each message separately', async () => {
    const capture = await freshHelper()

    await capture(MESSAGE)
    await capture('[cron/notify] TELEGRAM_BOT_TOKEN is not set')

    expect(captureMessage).toHaveBeenCalledTimes(2)
  })

  it('treats a rejected flush as a failed attempt rather than throwing', async () => {
    const capture = await freshHelper()
    flush.mockRejectedValue(new Error('transport exploded'))

    await expect(capture(MESSAGE)).resolves.toBeUndefined()

    flush.mockResolvedValue(true)
    await capture(MESSAGE)
    expect(captureMessage).toHaveBeenCalledTimes(2)
  })
})

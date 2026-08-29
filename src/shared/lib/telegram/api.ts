/**
 * The thin Telegram HTTP layer, shared by everything that sends without being a
 * bot handler: the weekly cron, the admin notifications, and the answers that go
 * back out through the user bot. Handlers inside a grammy `Bot` keep using `ctx`
 * — this exists for the places that only have a token and a chat id.
 */

const API_ROOT = 'https://api.telegram.org'

interface SentMessage {
  message_id: number
}

async function call<T>(token: string, method: string, body: BodyInit, headers?: HeadersInit) {
  const res = await fetch(`${API_ROOT}/bot${token}/${method}`, { method: 'POST', body, headers })
  const payload = (await res.json().catch(() => null)) as {
    ok: boolean
    result?: T
    description?: string
  } | null

  if (!res.ok || !payload?.ok) {
    // The token is in the URL, never in the message — this text reaches logs and
    // Sentry.
    throw new Error(`Telegram ${method} ${res.status}: ${payload?.description ?? 'unknown error'}`)
  }

  return payload.result as T
}

/** Sends text and returns the id of the message it became. */
export async function sendMessage(
  token: string,
  chatId: string,
  text: string,
  extra: Record<string, unknown> = {}
): Promise<number> {
  const message = await call<SentMessage>(
    token,
    'sendMessage',
    JSON.stringify({ chat_id: chatId, text, ...extra }),
    { 'Content-Type': 'application/json' }
  )
  return message.message_id
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(',')
  const mime = header.match(/^data:([^;]+);base64$/)?.[1] ?? 'application/octet-stream'
  const binary = Buffer.from(base64, 'base64')
  return new Blob([binary], { type: mime })
}

/**
 * Uploads a screenshot straight from the data URL the browser produced. It is
 * never written to disk or to a bucket on the way — we have no storage, and this
 * is the whole reason we do not need any.
 */
export async function sendPhotoDataUrl(
  token: string,
  chatId: string,
  dataUrl: string,
  caption?: string
): Promise<number> {
  const form = new FormData()
  form.set('chat_id', chatId)
  form.set('photo', dataUrlToBlob(dataUrl), 'screenshot.jpg')
  if (caption) form.set('caption', caption)

  const message = await call<SentMessage>(token, 'sendPhoto', form)
  return message.message_id
}

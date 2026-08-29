import { config } from 'dotenv'

config({ path: '.env.local' })
config()

/**
 * Both bots are registered from here rather than from a second script: the two
 * calls differ only in token, secret and path, and a sibling script would have to
 * repeat the HTTPS guard and the error handling that already live here — the
 * kind of duplication that drifts the moment one of them is fixed.
 *
 * The admin bot is optional. If its variables are absent the script says so and
 * still registers the user bot, so a local setup without an admin bot is not a
 * failure.
 */
interface BotTarget {
  label: string
  token: string | undefined
  secret: string | undefined
  path: string
  required: boolean
}

async function register(target: BotTarget, baseUrl: string): Promise<boolean> {
  if (!target.token || !target.secret) {
    if (target.required) {
      console.error(`✗ ${target.label}: token or webhook secret is missing`)
      return false
    }
    console.log(`— ${target.label}: not configured, skipped`)
    return true
  }

  const webhookUrl = `${baseUrl}${target.path}`

  const res = await fetch(`https://api.telegram.org/bot${target.token}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: webhookUrl, secret_token: target.secret }),
  })

  const data = await res.json()

  if (!res.ok || !data.ok) {
    // The token is in the URL, never in the output.
    console.error(`✗ ${target.label}: ${data.description ?? res.status}`)
    return false
  }

  console.log(`✓ ${target.label}: ${webhookUrl}`)
  return true
}

async function setWebhooks() {
  const url = process.env.NEXTAUTH_URL

  if (!url) {
    console.error('Missing env var: NEXTAUTH_URL')
    process.exit(1)
  }

  if (!url.startsWith('https://')) {
    console.error('NEXTAUTH_URL must be a public HTTPS URL before setting a Telegram webhook')
    console.error(`Current NEXTAUTH_URL: ${url}`)
    process.exit(1)
  }

  const targets: BotTarget[] = [
    {
      label: 'user bot',
      token: process.env.TELEGRAM_BOT_TOKEN,
      secret: process.env.TELEGRAM_WEBHOOK_SECRET,
      path: '/api/telegram/webhook',
      required: true,
    },
    {
      label: 'admin bot',
      token: process.env.TELEGRAM_ADMIN_BOT_TOKEN,
      secret: process.env.TELEGRAM_ADMIN_WEBHOOK_SECRET,
      path: '/api/telegram/admin-webhook',
      required: false,
    },
  ]

  const results = await Promise.all(targets.map((target) => register(target, url)))
  if (results.some((ok) => !ok)) process.exit(1)
}

setWebhooks()

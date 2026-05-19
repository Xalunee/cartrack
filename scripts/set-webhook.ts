async function setWebhook() {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET
  const url = process.env.NEXTAUTH_URL

  if (!token || !secret || !url) {
    console.error('Missing env vars: TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET, NEXTAUTH_URL')
    process.exit(1)
  }

  const webhookUrl = `${url}/api/telegram/webhook`

  const res = await fetch(
    `https://api.telegram.org/bot${token}/setWebhook`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: webhookUrl,
        secret_token: secret,
      }),
    }
  )

  const data = await res.json()
  console.log('Webhook set:', data)
  console.log('URL:', webhookUrl)
}

setWebhook()

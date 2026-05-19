import { Bot } from 'grammy'

const token = process.env.TELEGRAM_BOT_TOKEN
if (!token) {
  throw new Error('TELEGRAM_BOT_TOKEN is not set')
}

export const bot = new Bot(token)

let initPromise: Promise<void> | null = null

export function ensureBotInitialized() {
  initPromise ??= bot.init()
  return initPromise
}

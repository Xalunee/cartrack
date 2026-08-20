import * as Sentry from '@sentry/nextjs'

/**
 * Server-side entry point Next.js runs once per server instance. Each runtime
 * gets its own init file, so the edge bundle never pulls in Node-only code.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config')
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config')
  }
}

/**
 * Errors Next.js catches while rendering or running a route handler. Without
 * this, a failed Server Component only ever shows up in the Vercel logs.
 */
export const onRequestError = Sentry.captureRequestError

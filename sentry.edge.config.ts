/**
 * Edge runtime error reporting (middleware and any edge route). Loaded by
 * `src/instrumentation.ts` when `NEXT_RUNTIME === 'edge'`.
 */
import * as Sentry from '@sentry/nextjs'
import { SHARED_SENTRY_OPTIONS } from '@shared/lib/monitoring/sentry-scrub'

Sentry.init({
  ...SHARED_SENTRY_OPTIONS,
  dsn: process.env.SENTRY_DSN,
  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
})

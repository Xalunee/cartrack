/**
 * Node.js runtime error reporting. Loaded by `src/instrumentation.ts` — Next.js
 * calls `register()` once per server instance, before the first request.
 *
 * Points at GlitchTip, not sentry.io: only the DSN differs, the SDK is unchanged.
 */
import * as Sentry from '@sentry/nextjs'
import { SHARED_SENTRY_OPTIONS } from '@shared/lib/monitoring/sentry-scrub'

Sentry.init({
  ...SHARED_SENTRY_OPTIONS,
  // Absent DSN = reporting silently off. The build and the app must not care.
  dsn: process.env.SENTRY_DSN,
  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
})

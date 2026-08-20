/**
 * Browser-side error reporting. Next.js loads this after the document and before
 * React hydrates, so it catches errors thrown during the first render too.
 */
import * as Sentry from '@sentry/nextjs'
import {
  CLIENT_DENIED_URLS,
  CLIENT_IGNORED_ERRORS,
  SHARED_SENTRY_OPTIONS,
} from '@shared/lib/monitoring/sentry-scrub'

Sentry.init({
  ...SHARED_SENTRY_OPTIONS,
  // Public by design: a DSN is write-only, it cannot read anything back.
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  // The NEXT_PUBLIC_ variant is the only one inlined into the client bundle; the
  // plain VERCEL_ENV the server reads would be undefined here, tagging every
  // preview deploy as production.
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,
  // Aborted requests, dropped connections and extension noise are filtered on
  // the client only — on the server the same messages mean a real outage.
  ignoreErrors: CLIENT_IGNORED_ERRORS,
  denyUrls: CLIENT_DENIED_URLS,
})

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart

'use client'

import { useEffect } from 'react'
import './globals.css'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
    // A digest means the error came from the server, where `onRequestError`
    // already reported it with the real stack — this copy carries none.
    //
    // Imported here rather than at the top of the file: Next ships a segment's
    // error boundary inside that segment's client bundle, so a static import
    // would pull the whole 146 KiB SDK back onto the start-up path that
    // instrumentation-client.ts just cleared it from. Nothing needs it until
    // something has already gone wrong.
    if (!error.digest) {
      // The .catch matters after a redeploy: this page may be running against
      // chunk URLs that no longer exist, and by then instrumentation-client has
      // already dropped its own unhandledrejection listener — a failed import
      // would have nowhere to land but on top of the error already on screen.
      import('@sentry/nextjs')
        .then((Sentry) => Sentry.captureException(error))
        .catch(() => {})
    }
  }, [error])

  return (
    <html lang="ru">
      <body className="antialiased">
        <div className="min-h-svh flex flex-col items-center justify-center px-4">
          <div className="w-full max-w-sm text-center rounded-xl border p-8">
            <h1 className="text-lg font-semibold mb-2">Что-то пошло не так</h1>
            <p className="text-sm text-muted-foreground mb-6">
              Произошла критическая ошибка. Попробуйте перезагрузить страницу.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => reset()}
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                Попробовать снова
              </button>
              <button
                onClick={() => (window.location.href = '/dashboard')}
                className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium"
              >
                На главную
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}

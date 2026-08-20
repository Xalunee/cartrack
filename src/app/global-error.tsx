'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'
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
    if (!error.digest) Sentry.captureException(error)
  }, [error])

  return (
    <html lang="ru">
      <body className="antialiased">
        <div className="min-h-screen flex flex-col items-center justify-center px-4">
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

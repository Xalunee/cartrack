'use client'
import { QueryClient } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'
import { QUERY_CACHE_MAX_AGE, getQueryPersister } from '@shared/lib/query-persistence'

// The devtools package resolves to a no-op in production builds, so this guard
// buys no bytes — it says out loud that the panel is a development tool, which
// a bundle audit otherwise has to rediscover by grepping the output chunks.
const SHOW_DEVTOOLS = process.env.NODE_ENV !== 'production'

// Restored data must not outlive the build that shaped it: rename a field on the
// server and yesterday's cache would be rendered into today's markup, which
// fails as a blank widget or a crash rather than as stale text. Deploys are
// infrequent enough that busting the cache on each one costs almost nothing.
// The value is put on the environment by next.config.ts — see the note there.
const BUSTER = process.env.NEXT_PUBLIC_BUILD_ID || 'dev'

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Unchanged: restored entries are stale on arrival, so every mount
            // still refetches in the background. The cache decides what is on
            // screen for the first few hundred milliseconds, not what is true.
            staleTime: 60 * 1000,
            // Must not be below the persister's maxAge — see QUERY_CACHE_MAX_AGE.
            gcTime: QUERY_CACHE_MAX_AGE,
            retry: 1,
          },
        },
      })
  )
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: getQueryPersister(),
        maxAge: QUERY_CACHE_MAX_AGE,
        buster: BUSTER,
      }}
    >
      {children}
      {SHOW_DEVTOOLS && <ReactQueryDevtools initialIsOpen={false} />}
    </PersistQueryClientProvider>
  )
}

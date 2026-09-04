'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

// The devtools package resolves to a no-op in production builds, so this guard
// buys no bytes — it says out loud that the panel is a development tool, which
// a bundle audit otherwise has to rediscover by grepping the output chunks.
const SHOW_DEVTOOLS = process.env.NODE_ENV !== 'production'

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
          },
        },
      })
  )
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {SHOW_DEVTOOLS && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  )
}

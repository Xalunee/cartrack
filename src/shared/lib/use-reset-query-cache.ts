'use client'

import { useQueryClient } from '@tanstack/react-query'
import { clearPersistedQueryCache } from './query-persistence'

/**
 * Forgets everything the app knows about the current user — in memory and on
 * disk.
 *
 * Needed on both sides of a session change, not just on sign-out. The persisted
 * cache outlives the session cookie, so a user whose token simply expired lands
 * on /login with their data still in localStorage; whoever signs in next would
 * see it restored into the first frame of the dashboard, before their own
 * requests came back. Signing in therefore clears too.
 */
export function useResetQueryCache() {
  const queryClient = useQueryClient()

  return async function resetQueryCache(): Promise<void> {
    // Emptied first, dropped second. The persister writes on a one-second
    // throttle and a pending write carries the arguments it was handed last, so
    // clearing the client rewrites that pending snapshot to an empty one. The
    // saved copy can therefore reappear after `removeClient` — but only ever
    // empty, which is the point. The other order would let a write scheduled a
    // moment ago put the full cache straight back.
    queryClient.clear()
    await clearPersistedQueryCache()
  }
}

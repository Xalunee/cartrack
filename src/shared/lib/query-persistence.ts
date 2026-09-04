'use client'

/**
 * Persistence for the React Query cache.
 *
 * Without it every launch of the installed app starts from nothing: the
 * dashboard shows three skeletons and waits on /api/car, /api/mileage and
 * /api/maintenance before it can say anything, even when the answers have not
 * changed since yesterday. There is no service worker to fall back on either —
 * public/sw.js is a tombstone.
 *
 * With it the last known data is on screen in the first frame and the network
 * round trip becomes a background refresh.
 */
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { removeOldestQuery } from '@tanstack/query-persist-client-core'

/**
 * Named explicitly rather than left to the library's default so that signing out
 * can find it. Everything under it is the user's own data in plain text, which
 * is why removing it is part of sign-out and not an afterthought.
 */
export const QUERY_CACHE_KEY = 'cartrack-query-cache'

/**
 * How long a restored entry stays usable.
 *
 * This is also the floor for the client's `gcTime`: React Query drops anything
 * older than `gcTime` while rehydrating, so a shorter one would silently discard
 * most of what was saved and leave a cache that looks configured and never hits.
 */
export const QUERY_CACHE_MAX_AGE = 24 * 60 * 60 * 1000

let persister: ReturnType<typeof createAsyncStoragePersister> | null = null

/**
 * Built on first use rather than at module scope: the provider that needs it
 * renders on the server too, where there is no `window`. Given no storage the
 * persister degrades to a no-op, which is the right behaviour there and in a
 * browser that refuses localStorage outright.
 */
export function getQueryPersister() {
  persister ??= createAsyncStoragePersister({
    key: QUERY_CACHE_KEY,
    // localStorage satisfies the async storage interface — its methods simply
    // return their values rather than promises. The sync persister would do as
    // well but is deprecated in favour of this one.
    storage: typeof window === 'undefined' ? undefined : window.localStorage,
    // Without a retry the first QuotaExceededError ends persistence for good and
    // says nothing: the write loop gives up and every later save fails the same
    // way. /api/mileage returns the whole odometer history with no pagination,
    // so the users who cross the quota are the long-standing ones — exactly the
    // ones with the most to restore. Dropping the oldest query instead keeps the
    // rest of the cache alive.
    retry: removeOldestQuery,
  })
  return persister
}

/** Drops the saved cache. Sign-out's half of the bargain — see QUERY_CACHE_KEY. */
export async function clearPersistedQueryCache(): Promise<void> {
  await getQueryPersister().removeClient()
}

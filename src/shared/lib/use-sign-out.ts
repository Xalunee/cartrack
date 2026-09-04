'use client'

import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useResetQueryCache } from './use-reset-query-cache'

/**
 * Signing out, cache included.
 *
 * The persisted React Query cache holds the user's car, mileage, fines and
 * service history in plain localStorage, and localStorage outlives the session
 * cookie. Left alone, the next person to open the app on this device would be
 * looking at the previous one's data in the first frame — before any request had
 * a chance to come back 401.
 *
 * Both places that sign out go through here so that stays true for both.
 */
export function useSignOut() {
  const router = useRouter()
  const resetQueryCache = useResetQueryCache()

  return async function handleSignOut(): Promise<void> {
    await resetQueryCache()
    await signOut({ redirect: false })
    router.push('/login')
  }
}

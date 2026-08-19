'use client'

import { useCallback, useSyncExternalStore } from 'react'

/** Nothing to watch — the value is fixed the moment the client takes over. */
function subscribeNever() {
  return () => {}
}

const alwaysTrue = () => true
const alwaysFalse = () => false

/**
 * False while rendering on the server and during hydration, true from the first
 * client render onward. Lets a component read browser-only APIs (userAgent,
 * storage, viewport) without setting state from an effect: the server snapshot
 * keeps the hydration pass identical to the server HTML, and React re-renders
 * once on its own afterwards.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(subscribeNever, alwaysTrue, alwaysFalse)
}

/**
 * Reads a client-only boolean once hydration is done, `false` before that. Pass
 * a module-level getter that caches its own answer: React may call it on any
 * render and expects the same value back every time.
 */
export function useClientFlag(read: () => boolean): boolean {
  return useSyncExternalStore(subscribeNever, read, alwaysFalse)
}

/** Live match for a CSS media query. False on the server and during hydration. */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query)
      mql.addEventListener('change', onChange)
      return () => mql.removeEventListener('change', onChange)
    },
    [query]
  )

  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query])

  return useSyncExternalStore(subscribe, getSnapshot, alwaysFalse)
}

function subscribeNetwork(onChange: () => void) {
  window.addEventListener('online', onChange)
  window.addEventListener('offline', onChange)
  return () => {
    window.removeEventListener('online', onChange)
    window.removeEventListener('offline', onChange)
  }
}

const getIsOffline = () => !navigator.onLine

/** True while the browser reports no connection. False on the server. */
export function useIsOffline(): boolean {
  return useSyncExternalStore(subscribeNetwork, getIsOffline, alwaysFalse)
}

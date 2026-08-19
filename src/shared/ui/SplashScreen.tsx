'use client'

import { useEffect, useState } from 'react'
import { cn } from '@shared/lib/utils'
import { useClientFlag } from '@shared/lib/client-env'

const SHOWN_KEY = 'cartrack-splash-shown'
/** Time on screen before the fade-out starts, and the fade itself. */
const VISIBLE_MS = 800
const FADE_MS = 400

/** Client-only: reads session storage, the URL, the viewport and display-mode. */
function shouldShowSplash(): boolean {
  if (sessionStorage.getItem(SHOWN_KEY)) return false

  const path = window.location.pathname
  const isLanding = path === '/'
  const isAuthPage = path === '/login' || path === '/register'
  if (isLanding || isAuthPage) return false

  const isMobile = window.innerWidth < 768
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches

  return isMobile || isStandalone
}

/**
 * Answered once per page load and then cached: the effect below sets the session
 * flag, so asking a second time would return false and yank the splash away
 * mid-animation.
 */
let decision: boolean | null = null
function shouldShowSplashOnce(): boolean {
  if (decision === null) decision = shouldShowSplash()
  return decision
}

export function SplashScreen() {
  // False during SSR and hydration, so the first client pass renders exactly
  // what the server sent. Reading the URL rather than usePathname keeps this a
  // snapshot of the entry page — a later client-side navigation must not raise
  // the splash.
  const show = useClientFlag(shouldShowSplashOnce)
  const [fading, setFading] = useState(false)
  const [finished, setFinished] = useState(false)

  useEffect(() => {
    if (!show) return

    sessionStorage.setItem(SHOWN_KEY, '1')

    const fade = setTimeout(() => setFading(true), VISIBLE_MS)
    const hide = setTimeout(() => setFinished(true), VISIBLE_MS + FADE_MS)

    return () => {
      clearTimeout(fade)
      clearTimeout(hide)
    }
  }, [show])

  if (!show || finished) return null

  return (
    <div
      className={cn(
        'fixed inset-0 z-[100] flex items-center justify-center bg-background transition-opacity duration-400',
        fading ? 'opacity-0' : 'opacity-100'
      )}
    >
      <div className="flex flex-col items-center gap-3 animate-fade-in">
        <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center">
          <span className="text-primary-foreground font-bold text-lg">CT</span>
        </div>
        <p className="text-sm font-medium text-muted-foreground">CarTrack</p>
        <div className="h-0.5 w-16 bg-muted rounded-full overflow-hidden mt-2">
          <div className="h-full w-full bg-primary rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  )
}

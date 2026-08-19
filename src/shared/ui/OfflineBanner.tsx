'use client'

import { useEffect, useState } from 'react'
import { Wifi, WifiOff } from 'lucide-react'
import { cn } from '@shared/lib/utils'
import { useIsOffline } from '@shared/lib/client-env'

/** How long the green "reconnected" strip stays up. */
const RECONNECTED_MS = 3000

export function OfflineBanner() {
  const isOffline = useIsOffline()
  const [showReconnected, setShowReconnected] = useState(false)

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined

    // The browser only fires `online` after a real offline period, so the event
    // itself is the "was offline" signal — no extra state needed to track it.
    function handleOnline() {
      setShowReconnected(true)
      timer = setTimeout(() => setShowReconnected(false), RECONNECTED_MS)
    }

    window.addEventListener('online', handleOnline)

    return () => {
      window.removeEventListener('online', handleOnline)
      clearTimeout(timer)
    }
  }, [])

  if (!isOffline && !showReconnected) return null

  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 z-[70] flex items-center justify-center gap-2 py-2 px-4 text-xs font-medium transition-all duration-300 animate-fade-in',
        isOffline
          ? 'bg-destructive text-destructive-foreground'
          : 'bg-green-600 text-white'
      )}
    >
      {isOffline ? (
        <>
          <WifiOff className="h-3.5 w-3.5" />
          <span>Нет подключения к интернету</span>
        </>
      ) : (
        <>
          <Wifi className="h-3.5 w-3.5" />
          <span>Подключение восстановлено</span>
        </>
      )}
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { Wifi, WifiOff } from 'lucide-react'
import { cn } from '@shared/lib/utils'

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false)
  const [showReconnected, setShowReconnected] = useState(false)
  const [wasOffline, setWasOffline] = useState(false)

  useEffect(() => {
    function handleOffline() {
      setIsOffline(true)
      setWasOffline(true)
    }

    function handleOnline() {
      setIsOffline(false)
      if (wasOffline) {
        setShowReconnected(true)
        setTimeout(() => setShowReconnected(false), 3000)
      }
    }

    if (!navigator.onLine) {
      setIsOffline(true)
      setWasOffline(true)
    }

    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)

    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
    }
  }, [wasOffline])

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

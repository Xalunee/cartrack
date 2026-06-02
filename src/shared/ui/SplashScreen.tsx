'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { cn } from '@shared/lib/utils'

export function SplashScreen() {
  const [visible, setVisible] = useState(false)
  const [fading, setFading] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const alreadyShown = sessionStorage.getItem('cartrack-splash-shown')
    if (alreadyShown) return

    const isLanding = pathname === '/'
    const isAuthPage = pathname === '/login' || pathname === '/register'
    const isMobile = window.innerWidth < 768
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches

    if (!isLanding && !isAuthPage && (isMobile || isStandalone)) {
      setVisible(true)
      sessionStorage.setItem('cartrack-splash-shown', '1')

      const timer = setTimeout(() => {
        setFading(true)
        setTimeout(() => setVisible(false), 400)
      }, 800)

      return () => clearTimeout(timer)
    }
  }, [])

  if (!visible) return null

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

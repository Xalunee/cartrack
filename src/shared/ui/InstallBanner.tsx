'use client'

import { useState } from 'react'
import { Menu, Plus, Share, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useHydrated, useMediaQuery } from '@shared/lib/client-env'

const DISMISSED_KEY = 'cartrack-install-dismissed'

export function InstallBanner() {
  const hydrated = useHydrated()
  const isStandalone = useMediaQuery('(display-mode: standalone)')
  const [dismissed, setDismissed] = useState(false)

  function dismiss() {
    setDismissed(true)
    localStorage.setItem(DISMISSED_KEY, '1')
  }

  // Already installed, dismissed in this session, or not yet hydrated (browser
  // APIs below are unavailable on the server).
  if (!hydrated || isStandalone || dismissed) return null

  // Read at render rather than from an effect: the stored flag only changes via
  // dismiss(), which re-renders anyway.
  if (localStorage.getItem(DISMISSED_KEY)) return null

  const ua = navigator.userAgent
  const isIOS = /iPad|iPhone|iPod/.test(ua)
  const isAndroid = /Android/.test(ua)
  if (!isIOS && !isAndroid) return null

  const isSamsung = /SamsungBrowser/.test(ua)

  return (
    <div className="relative z-[60] bg-primary text-primary-foreground px-4 py-3 flex items-start gap-3 animate-fade-in">
      <div className="flex-1 text-sm">
        {isIOS ? (
          <>
            <p className="font-medium mb-1">Установи CarTrack на iPhone</p>
            <p className="text-xs opacity-80">
              Нажми <Share className="inline h-3.5 w-3.5 mx-0.5" /> внизу экрана, затем «На экран Домой» <Plus className="inline h-3.5 w-3.5 mx-0.5" />
            </p>
          </>
        ) : isSamsung ? (
          <>
            <p className="font-medium mb-1">Установи CarTrack</p>
            <p className="text-xs opacity-80">
              Нажми <Menu className="inline h-3.5 w-3.5 mx-0.5" /> внизу справа, затем «Добавить страницу к» → «Главный экран»
            </p>
          </>
        ) : (
          <>
            <p className="font-medium mb-1">Установи CarTrack</p>
            <p className="text-xs opacity-80">
              Нажми ⋮ в браузере, затем «Установить приложение»
            </p>
          </>
        )}
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0 text-primary-foreground hover:text-primary-foreground/80"
        onClick={dismiss}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}

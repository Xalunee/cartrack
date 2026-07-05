'use client'

import { useEffect, useState } from 'react'
import { Menu, Plus, Share, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function InstallBanner() {
  const [show, setShow] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isAndroid, setIsAndroid] = useState(false)
  const [isSamsung, setIsSamsung] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    const ua = navigator.userAgent
    setIsIOS(/iPad|iPhone|iPod/.test(ua))
    setIsAndroid(/Android/.test(ua))
    setIsSamsung(/SamsungBrowser/.test(ua))
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches)

    const dismissed = localStorage.getItem('cartrack-install-dismissed')
    if (!dismissed) {
      setShow(true)
    }
  }, [])

  if (isStandalone || !show) return null
  if (!isIOS && !isAndroid) return null

  function dismiss() {
    setShow(false)
    localStorage.setItem('cartrack-install-dismissed', '1')
  }

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

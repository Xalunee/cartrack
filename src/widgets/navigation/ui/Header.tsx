'use client'

import { Logo, ThemeToggle } from '@shared/ui'

export function Header() {
  return (
    <header className="flex items-center justify-between px-4 h-[calc(3rem+env(safe-area-inset-top))] pt-[env(safe-area-inset-top)] border-b border-border md:hidden sticky top-0 z-50 bg-background">
      <div className="flex items-center gap-2">
        <Logo size={24} />
        <span className="text-sm font-semibold tracking-tight">CarTrack</span>
      </div>
      <ThemeToggle />
    </header>
  )
}

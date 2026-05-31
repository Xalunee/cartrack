'use client'

import { ThemeToggle } from '@shared/ui'

export function Header() {
  return (
    <header className="flex items-center justify-between px-4 h-14 border-b md:hidden">
      <span className="text-base font-semibold tracking-tight">CarTrack</span>
      <ThemeToggle />
    </header>
  )
}

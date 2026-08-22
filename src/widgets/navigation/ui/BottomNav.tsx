'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@shared/lib/utils'
import { NAV_SECTIONS, isSectionActive } from '../model/navigation'

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border md:hidden bg-background pb-[env(safe-area-inset-bottom)]">
      {/* 3.5rem tall with the links stretched to fill it: 56px of tap target per
          tab, comfortably over the 44px floor, without the slack six tabs needed. */}
      <div className="flex items-stretch justify-around h-14 px-2">
        {NAV_SECTIONS.map((section) => {
          const Icon = section.icon
          const active = isSectionActive(section, pathname)
          return (
            <Link
              key={section.href}
              href={section.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-0.5 px-2 rounded-xl transition-colors',
                active
                  ? 'text-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs">{section.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

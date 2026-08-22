'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@shared/lib/utils'
import { NAV_SECTIONS, isSectionActive } from '../model/navigation'

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border md:hidden bg-background pb-[env(safe-area-inset-bottom)]">
      {/* 3rem tall with the links stretched to fill it: 48px of tap target per tab,
          still over the 44px floor on a phone with no home indicator, and tight
          enough that the bar reads as a rail rather than a panel. */}
      <div className="flex items-stretch justify-around h-12 px-2">
        {NAV_SECTIONS.map((section) => {
          const Icon = section.icon
          const active = isSectionActive(section, pathname)
          return (
            <Link
              key={section.href}
              href={section.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-px px-1 rounded-xl transition-colors',
                // The only difference between states is contrast and weight — no
                // colour, pill, or rule, so the bar stays quiet at this height.
                active
                  ? 'text-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              {/* Fixed 10px with a near-solid line-height: the label is an aid to the
                  icon, and nothing here may wrap onto a second line. */}
              <span className="text-[10px] leading-[1.1] whitespace-nowrap">{section.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

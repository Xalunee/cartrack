'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { cn } from '@shared/lib/utils'
import { Logo, ThemeToggle } from '@shared/ui'
import { useSignOut } from '@shared/lib/use-sign-out'
import { NAV_SECTIONS, isSectionActive, isChildActive } from '../model/navigation'

export function Sidebar() {
  const pathname = usePathname()
  const handleLogout = useSignOut()

  return (
    <aside className="border-border bg-background sticky top-0 hidden h-screen w-56 flex-col border-r p-3 md:flex">
      <div className="mb-2 flex items-center gap-2 px-3 py-4">
        <Logo size={24} />
        <span className="text-sm font-semibold tracking-tight">CarTrack</span>
      </div>
      {NAV_SECTIONS.map((section, index) => {
        const Icon = section.icon
        const active = isSectionActive(section, pathname)
        return (
          // Sections need air between them; nine links in one column read as a wall.
          <div key={section.href} className={cn('flex flex-col gap-0.5', index > 0 && 'mt-3')}>
            <Link
              href={section.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex items-center gap-2.5 rounded-md px-3 py-1.5 text-sm transition-colors',
                active
                  ? 'bg-accent text-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              )}
            >
              <Icon className="h-4 w-4" />
              {section.label}
            </Link>
            {section.children?.map((child) => {
              const childActive = isChildActive(child, pathname)
              return (
                <Link
                  key={child.href}
                  href={child.href}
                  aria-current={childActive ? 'page' : undefined}
                  className={cn(
                    'rounded-md py-1 pr-3 pl-9 text-[13px] transition-colors',
                    childActive
                      ? 'bg-accent/50 text-foreground font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/30'
                  )}
                >
                  {child.label}
                </Link>
              )
            })}
          </div>
        )
      })}
      <div className="border-border mt-auto border-t pt-2">
        <button
          onClick={handleLogout}
          className="text-muted-foreground hover:text-foreground hover:bg-accent/50 flex w-full items-center gap-2.5 rounded-md px-3 py-1.5 text-sm transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Выйти
        </button>
        <div className="flex items-center justify-between px-3 pt-1">
          <span className="text-muted-foreground text-sm">Тема</span>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  )
}

'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { cn } from '@shared/lib/utils'
import { Logo, ThemeToggle } from '@shared/ui'
import { signOut } from 'next-auth/react'
import { NAV_SECTIONS, isSectionActive } from '../model/navigation'

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await signOut({ redirect: false })
    router.push('/login')
  }

  return (
    <aside className="hidden md:flex flex-col w-48 border-r border-border bg-background h-screen sticky top-0 p-3 gap-0.5">
      <div className="flex items-center gap-2 px-3 py-4 mb-2">
        <Logo size={24} />
        <span className="text-sm font-semibold tracking-tight">CarTrack</span>
      </div>
      {NAV_SECTIONS.map((section) => {
        const Icon = section.icon
        const active = isSectionActive(section, pathname)
        return (
          <Link
            key={section.href}
            href={section.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm transition-colors',
              active
                ? 'bg-accent text-foreground font-medium'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
            )}
          >
            <Icon className="h-4 w-4" />
            {section.label}
          </Link>
        )
      })}
      <div className="mt-auto border-t border-border pt-2">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors w-full"
        >
          <LogOut className="h-4 w-4" />
          Выйти
        </button>
        <div className="pt-1 px-3 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Тема</span>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  )
}

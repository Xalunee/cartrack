'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Wrench, TrendingUp, AlertTriangle, Settings, LogOut } from 'lucide-react'
import { cn } from '@shared/lib/utils'
import { ThemeToggle } from '@shared/ui'
import { signOut } from 'next-auth/react'

const links = [
  { href: '/dashboard', label: 'Главная', icon: LayoutDashboard },
  { href: '/maintenance', label: 'Обслуживание', icon: Wrench },
  { href: '/mileage', label: 'Пробег', icon: TrendingUp },
  { href: '/events', label: 'События', icon: AlertTriangle },
  { href: '/settings', label: 'Настройки', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex flex-col w-56 border-r h-screen sticky top-0 p-4 gap-1">
      <div className="mb-6 px-3">
        <span className="text-lg font-semibold tracking-tight">CarTrack</span>
      </div>
      {links.map(({ href, label, icon: Icon }) => {
        const active = pathname === href
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
              active
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        )
      })}
      <button
        onClick={() => signOut({ callbackUrl: '/login' })}
        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors w-full mt-auto"
      >
        <LogOut className="h-4 w-4" />
        Выйти
      </button>
      <div className="pb-2 px-3 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Тема</span>
        <ThemeToggle />
      </div>
    </aside>
  )
}

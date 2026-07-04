'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
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
  const router = useRouter()

  async function handleLogout() {
    await signOut({ redirect: false })
    router.push('/login')
  }

  return (
    <aside className="hidden md:flex flex-col w-48 border-r border-border bg-background h-screen sticky top-0 p-3 gap-0.5">
      <div className="flex items-center gap-2 px-3 py-4 mb-2">
        <div className="h-6 w-6 rounded-md bg-foreground flex items-center justify-center">
          <span className="text-background font-bold text-[10px]">CT</span>
        </div>
        <span className="text-sm font-semibold tracking-tight">CarTrack</span>
      </div>
      {links.map(({ href, label, icon: Icon }) => {
        const active = pathname === href
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-2.5 px-3 py-1.5 rounded-md text-[13px] transition-colors',
              active
                ? 'bg-accent text-foreground font-medium'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        )
      })}
      <div className="mt-auto border-t border-border pt-2">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-md text-[13px] text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors w-full"
        >
          <LogOut className="h-4 w-4" />
          Выйти
        </button>
        <div className="pt-1 px-3 flex items-center justify-between">
          <span className="text-[13px] text-muted-foreground">Тема</span>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  )
}

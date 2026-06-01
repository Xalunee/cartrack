'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Wrench, TrendingUp, AlertTriangle, Settings } from 'lucide-react'
import { cn } from '@shared/lib/utils'

const links = [
  { href: '/dashboard', label: 'Главная', icon: LayoutDashboard },
  { href: '/maintenance', label: 'Сервис', icon: Wrench },
  { href: '/mileage', label: 'Пробег', icon: TrendingUp },
  { href: '/events', label: 'События', icon: AlertTriangle },
  { href: '/settings', label: 'Настройки', icon: Settings },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t md:hidden bg-background/80 backdrop-filter backdrop-blur-lg">
      <div className="flex items-center justify-around h-16 px-2">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-colors',
                active
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

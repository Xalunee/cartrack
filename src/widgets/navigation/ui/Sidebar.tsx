'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@shared/lib/utils'
import { APP_CONFIG } from '@shared/config'

const links = [
  { href: '/dashboard', label: 'Главная' },
  { href: '/maintenance', label: 'Обслуживание' },
  { href: '/mileage', label: 'Пробег' },
  { href: '/events', label: 'События' },
  { href: '/settings', label: 'Настройки' },
]

export function Sidebar() {
  const pathname = usePathname()
  return (
    <aside className="hidden md:flex flex-col w-56 border-r min-h-screen p-4 gap-1">
      <p className="font-semibold mb-4">{APP_CONFIG.name}</p>
      {links.map((l) => (
        <Link key={l.href} href={l.href} className={cn('px-3 py-2 rounded-md text-sm', pathname === l.href ? 'bg-accent font-medium' : 'hover:bg-accent/50')}>
          {l.label}
        </Link>
      ))}
    </aside>
  )
}

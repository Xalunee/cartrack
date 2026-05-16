'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@shared/lib/utils'

const links = [
  { href: '/dashboard', label: 'Главная' },
  { href: '/maintenance', label: 'ТО' },
  { href: '/mileage', label: 'Пробег' },
  { href: '/events', label: 'События' },
  { href: '/settings', label: 'Настройки' },
]

export function BottomNav() {
  const pathname = usePathname()
  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t bg-background flex">
      {links.map((l) => (
        <Link key={l.href} href={l.href} className={cn('flex-1 py-3 text-center text-xs', pathname === l.href && 'text-primary font-medium')}>
          {l.label}
        </Link>
      ))}
    </nav>
  )
}

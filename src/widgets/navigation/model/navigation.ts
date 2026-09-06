import { LayoutDashboard, Wrench, User, type LucideIcon } from 'lucide-react'

/**
 * The three navigation sections and the routes that belong to each.
 *
 * A tab stays highlighted for its whole subtree, and several routes live under a
 * tab whose href they are not — `/mileage` is opened from the dashboard, not from
 * a tab of its own. Exact-path matching cannot express that, so every section
 * lists its roots explicitly and the mapping is asserted by tests.
 *
 * `children` is the desktop sidebar's expanded list: the routes worth naming
 * inside a section. The mobile bar has no room for them and renders sections
 * only, so a child is a way in, never the only way in.
 */
export interface NavChild {
  href: string
  label: string
}

export interface NavSection {
  /** Where tapping the tab goes. */
  href: string
  label: string
  /** Kept on the section so a new tab cannot reach one navigation but not the other. */
  icon: LucideIcon
  /** Path prefixes this tab owns; a route matches a root or any child of it. */
  roots: string[]
  /** Sidebar-only sub-entries; each href must fall under one of `roots`. */
  children?: NavChild[]
}

export const NAV_SECTIONS: NavSection[] = [
  {
    href: '/dashboard',
    label: 'Главная',
    icon: LayoutDashboard,
    // The dashboard is a single screen; onboarding is a one-time wizard nobody
    // navigates back to, so there is nothing worth listing under it.
    roots: ['/dashboard', '/onboarding'],
  },
  {
    href: '/service',
    label: 'Сервис',
    icon: Wrench,
    // Mileage and maintenance are tiles on this page, so the tab they light up
    // has to be this one even though the dashboard links to them too. Order
    // matches the tiles: what you touch most often comes first.
    roots: ['/service', '/mileage', '/fuel', '/maintenance', '/events', '/fines', '/help'],
    children: [
      { href: '/mileage', label: 'Пробег' },
      { href: '/fuel', label: 'Топливо' },
      { href: '/maintenance', label: 'Обслуживание' },
      { href: '/events', label: 'События' },
      { href: '/fines', label: 'Штрафы' },
      { href: '/help', label: 'Помощь' },
    ],
  },
  {
    href: '/profile',
    label: 'Профиль',
    icon: User,
    // Settings moved behind the profile's gear icon and keeps its own route.
    roots: ['/profile', '/settings'],
    children: [{ href: '/settings', label: 'Настройки' }],
  },
]

function matchesRoot(pathname: string, root: string) {
  return pathname === root || pathname.startsWith(`${root}/`)
}

/** The section a route belongs to, or null for routes outside the app shell. */
export function resolveActiveSection(pathname: string): NavSection | null {
  return (
    NAV_SECTIONS.find((section) => section.roots.some((root) => matchesRoot(pathname, root))) ??
    null
  )
}

export function isSectionActive(section: NavSection, pathname: string): boolean {
  return resolveActiveSection(pathname)?.href === section.href
}

/** A sidebar sub-entry owns its own subtree, so `/maintenance/abc` keeps it lit. */
export function isChildActive(child: NavChild, pathname: string): boolean {
  return matchesRoot(pathname, child.href)
}

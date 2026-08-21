import { LayoutDashboard, Wrench, User, type LucideIcon } from 'lucide-react'

/**
 * The three navigation sections and the routes that belong to each.
 *
 * A tab stays highlighted for its whole subtree, and several routes live under a
 * tab whose href they are not — `/mileage` is opened from the dashboard, not from
 * a tab of its own. Exact-path matching cannot express that, so every section
 * lists its roots explicitly and the mapping is asserted by tests.
 */
export interface NavSection {
  /** Where tapping the tab goes. */
  href: string
  label: string
  /** Kept on the section so a new tab cannot reach one navigation but not the other. */
  icon: LucideIcon
  /** Path prefixes this tab owns; a route matches a root or any child of it. */
  roots: string[]
}

export const NAV_SECTIONS: NavSection[] = [
  {
    href: '/dashboard',
    label: 'Главная',
    icon: LayoutDashboard,
    // Mileage and maintenance are reached from the dashboard's own widgets, so
    // they read as part of it rather than as a separate destination.
    roots: ['/dashboard', '/mileage', '/maintenance', '/onboarding'],
  },
  {
    href: '/service',
    label: 'Сервис',
    icon: Wrench,
    roots: ['/service', '/events', '/fines'],
  },
  {
    href: '/profile',
    label: 'Профиль',
    icon: User,
    // Settings moved behind the profile's gear icon and keeps its own route.
    roots: ['/profile', '/settings'],
  },
]

function matchesRoot(pathname: string, root: string) {
  return pathname === root || pathname.startsWith(`${root}/`)
}

/** The section a route belongs to, or null for routes outside the app shell. */
export function resolveActiveSection(pathname: string): NavSection | null {
  return NAV_SECTIONS.find((section) => section.roots.some((root) => matchesRoot(pathname, root))) ?? null
}

export function isSectionActive(section: NavSection, pathname: string): boolean {
  return resolveActiveSection(pathname)?.href === section.href
}

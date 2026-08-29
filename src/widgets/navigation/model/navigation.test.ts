import { describe, it, expect } from 'vitest'
import { NAV_SECTIONS, resolveActiveSection, isSectionActive, isChildActive } from './navigation'

describe('NAV_SECTIONS', () => {
  it('has exactly three tabs', () => {
    expect(NAV_SECTIONS.map((s) => s.href)).toEqual(['/dashboard', '/service', '/profile'])
  })

  it('claims no route twice', () => {
    const roots = NAV_SECTIONS.flatMap((s) => s.roots)
    expect(new Set(roots).size).toBe(roots.length)
  })

  it('points every tab at a route it also owns', () => {
    for (const section of NAV_SECTIONS) {
      expect(resolveActiveSection(section.href)?.href).toBe(section.href)
    }
  })
})

describe('resolveActiveSection', () => {
  it.each([
    ['/dashboard', '/dashboard'],
    ['/mileage', '/service'],
    ['/maintenance', '/service'],
    ['/maintenance/abc123', '/service'],
    ['/onboarding', '/dashboard'],
    ['/service', '/service'],
    ['/events', '/service'],
    ['/fines', '/service'],
    ['/help', '/service'],
    ['/profile', '/profile'],
    ['/settings', '/profile'],
  ])('maps %s to the %s tab', (pathname, expected) => {
    expect(resolveActiveSection(pathname)?.href).toBe(expected)
  })

  it('returns null outside the app shell', () => {
    expect(resolveActiveSection('/')).toBeNull()
    expect(resolveActiveSection('/login')).toBeNull()
  })

  it('does not match a route that merely shares a prefix', () => {
    expect(resolveActiveSection('/servicebook')).toBeNull()
    expect(resolveActiveSection('/finesomething')).toBeNull()
  })
})

describe('section children', () => {
  const children = NAV_SECTIONS.flatMap((section) =>
    (section.children ?? []).map((child) => [section.href, child.href, child.label] as const)
  )

  it.each(children)('keeps %s owning its child %s (%s)', (sectionHref, childHref) => {
    expect(resolveActiveSection(childHref)?.href).toBe(sectionHref)
  })

  it('names no route twice across the whole sidebar', () => {
    const hrefs = children.map(([, childHref]) => childHref)
    expect(new Set(hrefs).size).toBe(hrefs.length)
  })

  it('lists help under service', () => {
    const service = NAV_SECTIONS.find((s) => s.href === '/service')
    expect(service?.children?.map((c) => c.href)).toContain('/help')
  })
})

describe('isChildActive', () => {
  const maintenance = { href: '/maintenance', label: 'Обслуживание' }

  it('matches the exact route', () => {
    expect(isChildActive(maintenance, '/maintenance')).toBe(true)
  })

  it('matches a child route', () => {
    expect(isChildActive(maintenance, '/maintenance/abc123')).toBe(true)
  })

  it('does not match a sibling or a shared prefix', () => {
    expect(isChildActive(maintenance, '/mileage')).toBe(false)
    expect(isChildActive(maintenance, '/maintenancelog')).toBe(false)
  })
})

describe('isSectionActive', () => {
  it('highlights one tab at a time', () => {
    const active = NAV_SECTIONS.filter((s) => isSectionActive(s, '/maintenance/abc123'))
    expect(active.map((s) => s.href)).toEqual(['/service'])
  })

  it('highlights nothing for an unowned route', () => {
    expect(NAV_SECTIONS.some((s) => isSectionActive(s, '/login'))).toBe(false)
  })
})

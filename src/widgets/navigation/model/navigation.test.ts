import { describe, it, expect } from 'vitest'
import { NAV_SECTIONS, resolveActiveSection, isSectionActive } from './navigation'

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
    ['/mileage', '/dashboard'],
    ['/maintenance', '/dashboard'],
    ['/maintenance/abc123', '/dashboard'],
    ['/onboarding', '/dashboard'],
    ['/service', '/service'],
    ['/events', '/service'],
    ['/fines', '/service'],
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

describe('isSectionActive', () => {
  it('highlights one tab at a time', () => {
    const active = NAV_SECTIONS.filter((s) => isSectionActive(s, '/maintenance/abc123'))
    expect(active.map((s) => s.href)).toEqual(['/dashboard'])
  })

  it('highlights nothing for an unowned route', () => {
    expect(NAV_SECTIONS.some((s) => isSectionActive(s, '/login'))).toBe(false)
  })
})

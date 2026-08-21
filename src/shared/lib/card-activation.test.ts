import { describe, it, expect } from 'vitest'
import { isInteractiveTarget, INTERACTIVE_SELECTOR } from './card-activation'

/** Stands in for an element whose ancestor chain matches the given selectors. */
function targetInside(...matching: string[]) {
  return {
    closest(selector: string) {
      const parts = selector.split(', ')
      return matching.some((m) => parts.includes(m)) ? {} : null
    },
  }
}

describe('isInteractiveTarget', () => {
  it.each([
    'button',
    'a',
    '[role="button"]',
    '[data-slot="dropdown-menu-trigger"]',
    '[data-slot="dialog-content"]',
    '[data-slot="alert-dialog-overlay"]',
    '[data-card-interactive]',
  ])('bails out on a click inside %s', (selector) => {
    expect(isInteractiveTarget(targetInside(selector))).toBe(true)
  })

  it('allows a click on plain card body content', () => {
    expect(isInteractiveTarget(targetInside('p', 'div'))).toBe(false)
  })

  it('treats a missing target as non-interactive', () => {
    expect(isInteractiveTarget(null)).toBe(false)
    expect(isInteractiveTarget(undefined)).toBe(false)
  })

  it('keeps every listed selector matchable as written', () => {
    for (const part of INTERACTIVE_SELECTOR.split(', ')) {
      expect(isInteractiveTarget(targetInside(part))).toBe(true)
    }
  })
})

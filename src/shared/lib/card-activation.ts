/**
 * Cards that navigate on tap also carry their own controls — buttons, row menus,
 * charts, and the dialogs those open. A click on any of them must not also count
 * as "open the card", so the handler asks this first.
 *
 * Dialog and menu content is portalled to the body, which does not save us:
 * React propagates events along its own tree, so a click inside an open dialog
 * still reaches the card's handler. Those slots have to be listed here.
 */
const INTERACTIVE_SELECTOR = [
  'a',
  'button',
  'input',
  'select',
  'textarea',
  'summary',
  'label',
  '[role="button"]',
  '[role="menuitem"]',
  '[data-slot="dropdown-menu-trigger"]',
  '[data-slot="dropdown-menu-content"]',
  '[data-slot="dialog-content"]',
  '[data-slot="dialog-overlay"]',
  '[data-slot="alert-dialog-content"]',
  '[data-slot="alert-dialog-overlay"]',
  '[data-slot="sheet-content"]',
  '[data-slot="sheet-overlay"]',
  // Escape hatch for controls with no element or slot of their own, such as the
  // chart surface and the tappable history rows.
  '[data-card-interactive]',
].join(', ')

/** Anything that answers `closest` — an Element in the browser, a stub in tests. */
interface ClosestTarget {
  closest(selector: string): unknown
}

export function isInteractiveTarget(target: ClosestTarget | null | undefined): boolean {
  return !!target?.closest(INTERACTIVE_SELECTOR)
}

export { INTERACTIVE_SELECTOR }

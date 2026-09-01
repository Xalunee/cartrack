/**
 * Plain labels, deliberately kept out of schema.ts: the events page reads them to
 * render its filter row, and importing them from the schema module would drag zod
 * onto a page that never validates anything.
 */
export const eventTypeLabels = {
  ACCIDENT: 'Авария',
  MALFUNCTION: 'Неисправность',
  FINE: 'Штраф',
  SERVICE: 'СТО',
  NOTE: 'Заметка',
} as const

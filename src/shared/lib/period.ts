import { subMonths, startOfMonth } from 'date-fns'
import type { Period } from '@shared/ui/PeriodSwitcher'

export const DEFAULT_PERIOD: Period = 'month'

/**
 * The period named as it reads inside a sentence — «За месяц», «Расход за год».
 * Shared so two cards side by side can never label the same switcher
 * differently.
 */
export const PERIOD_LABEL: Record<Period, string> = {
  month: 'месяц',
  halfyear: 'полгода',
  year: 'год',
}

/** How many calendar months, counting the current one, each period covers. */
const MONTHS: Record<Period, number> = {
  month: 1,
  halfyear: 6,
  year: 12,
}

/**
 * The first instant of the earliest calendar month the period covers.
 *
 * Anchored to the 1st rather than to today: «Месяц» means September, not the
 * thirty days back from whenever the card happens to be open, which used to pull
 * a tail of August in alongside it and made «Расходы за месяц» a sum over a
 * window no calendar agrees with.
 *
 * All three periods count the same way — the current month plus the N-1 before
 * it — so «Год» is the last twelve months, not the year to date. Year to date
 * would invert in January, where it starts on the 1st and «Полгода» reaches back
 * to August, leaving half a year wider than a year and «Месяц» identical to it.
 */
export function getPeriodStart(period: Period): Date {
  return startOfMonth(subMonths(new Date(), MONTHS[period] - 1))
}

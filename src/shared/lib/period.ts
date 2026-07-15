import { subMonths, startOfDay } from 'date-fns'
import type { Period } from '@shared/ui/PeriodSwitcher'

export const DEFAULT_PERIOD: Period = 'month'

export function getPeriodStart(period: Period): Date {
  const months = period === 'month' ? 1 : period === 'halfyear' ? 6 : 12
  return startOfDay(subMonths(new Date(), months))
}

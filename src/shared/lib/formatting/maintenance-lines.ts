import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import type { DrivingPace, MaintenanceStatus, RemainingResource } from '@shared/types'
import { calculateRemainingResource } from '@shared/lib/calculations/maintenance'

/**
 * One place for the way a maintenance item is written out to Telegram — both the
 * bot's status/alert replies and the weekly cron reminder. They used to format
 * the same numbers separately and had already drifted ("500 км" against
 * "осталось 500 км"); with one implementation a change to the wording cannot
 * reach one of them and miss the other.
 */

interface MaintenanceItemLike {
  name: string
  intervalKm: number | null
  intervalDays: number | null
  lastServiceMileage: number | null
  lastServiceDate: Date | null
}

const STATUS_EMOJI: Record<MaintenanceStatus, string> = {
  critical: '🔴',
  soon: '🟡',
  ok: '🟢',
}

/** Worst first, same order the web app lists items in. */
const STATUS_ORDER: Record<MaintenanceStatus, number> = { critical: 0, soon: 1, ok: 2 }

/** Short date, with the year only when it is not the current one. */
function shortDate(date: Date): string {
  const pattern = date.getFullYear() === new Date().getFullYear() ? 'd MMM' : 'd MMM yyyy'
  return format(date, pattern, { locale: ru })
}

export function remainingText(value: number, unit: string): string {
  const amount = Math.abs(value).toLocaleString('ru')
  if (value > 0) return `${amount} ${unit}`
  if (value === 0) return 'пора'
  return `просрочено на ${amount} ${unit}`
}

/**
 * One Telegram line per item. Whatever the shared calculation could not work out
 * — no intervals, or no last service to count from — surfaces as "нет данных".
 */
export function formatItemLine(name: string, resource: RemainingResource): string {
  const parts: string[] = []
  if (resource.remainingKm !== null) parts.push(remainingText(resource.remainingKm, 'км'))
  if (resource.remainingDays !== null) parts.push(remainingText(resource.remainingDays, 'дн.'))

  const unique = [...new Set(parts)]
  if (!unique.length) return `➖ ${name} — нет данных`

  // For a km interval the forecast adds something the numbers do not say: when
  // the current pace gets there. For a days-only item it just repeats the day
  // count, so it stays off those lines.
  if (resource.forecastDate && resource.remainingKm !== null) {
    unique.push(`~${shortDate(resource.forecastDate)}`)
  }

  return `${STATUS_EMOJI[resource.status]} ${name} — ${unique.join(' · ')}`
}

function withResources(
  items: MaintenanceItemLike[],
  currentMileage: number,
  pace: DrivingPace | null
) {
  return items
    .map((item) => ({
      name: item.name,
      resource: calculateRemainingResource(item, currentMileage, pace),
    }))
    .sort((a, b) => STATUS_ORDER[a.resource.status] - STATUS_ORDER[b.resource.status])
}

export function formatMaintenanceStatus(
  items: MaintenanceItemLike[],
  currentMileage: number,
  pace: DrivingPace | null
): string {
  if (!items.length) return 'Нет позиций обслуживания'

  return withResources(items, currentMileage, pace)
    .map(({ name, resource }) => formatItemLine(name, resource))
    .join('\n')
}

/** Only the items that need attention — an item without data never qualifies. */
export function formatAlerts(
  items: MaintenanceItemLike[],
  currentMileage: number,
  pace: DrivingPace | null
): string[] {
  return withResources(items, currentMileage, pace)
    .filter(({ resource }) => resource.status !== 'ok')
    .map(({ name, resource }) => formatItemLine(name, resource))
}

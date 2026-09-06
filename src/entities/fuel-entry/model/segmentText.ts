import type { FuelSegment } from '@shared/types'

export type FuelSegmentTone = 'ok' | 'warn' | 'muted'

export interface FuelSegmentLabel {
  text: string
  tone: FuelSegmentTone
}

export function formatConsumption(value: number): string {
  return `${value.toLocaleString('ru', { maximumFractionDigits: 1 })} л/100 км`
}

/**
 * Что написать под записью о заправке про расход.
 *
 * Пустое место — худший из вариантов: пользователь видит, что числа нет, и не
 * знает, копить ли ему данные, чинить ли запись или ждать. Поэтому строка есть
 * всегда, и каждая причина названа словами, а не статусом.
 */
export function describeFuelSegment(
  entry: { isFullTank: boolean },
  segment: FuelSegment | null
): FuelSegmentLabel {
  if (!segment) {
    return entry.isFullTank
      ? {
          text: 'Расход посчитается после следующей заправки до полного',
          tone: 'muted',
        }
      : {
          text: 'Неполная заправка — её литры войдут в расход следующего полного бака',
          tone: 'muted',
        }
  }

  switch (segment.status) {
    case 'ok':
      return {
        text: `${formatConsumption(segment.consumption!)} · ${segment.distanceKm!.toLocaleString('ru')} км от прошлой заправки до полного`,
        tone: 'ok',
      }
    case 'outlier':
      return {
        text: `${formatConsumption(segment.consumption!)} — не похоже на обычный расход этой машины, в среднее не идёт`,
        tone: 'warn',
      }
    case 'missing-mileage':
      return {
        text: 'Расход не посчитан: у этой или у прошлой заправки не записан одометр',
        tone: 'muted',
      }
    case 'missed-entry':
      return {
        text: 'Расход не посчитан: отмечена незаписанная заправка — литров в этом промежутке не хватает',
        tone: 'muted',
      }
    case 'no-distance':
      return {
        text: 'Расход не посчитан: одометр не вырос с прошлой заправки',
        tone: 'muted',
      }
  }
}

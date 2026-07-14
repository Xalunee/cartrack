import type { Prisma, PrismaClient } from '@prisma/client'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

type DbClient = PrismaClient | Prisma.TransactionClient

interface CandidatePoint {
  mileage: number
  recordedAt: Date
}

export type MileageValidationResult =
  | { ok: true }
  | {
      ok: false
      code: 'LOWER_THAN_EARLIER_LOG' | 'HIGHER_THAN_LATER_LOG'
      message: string
      suggestion: string
    }

function fmt(date: Date): string {
  return format(date, 'd MMM yyyy', { locale: ru })
}

/**
 * Odometer readings must be non-decreasing as recordedAt increases. Checks the
 * candidate against its nearest date-neighbours (prev/next) among the car's
 * existing logs, so out-of-order/backdated entries are caught before insert.
 */
export async function validateMileagePoint(
  tx: DbClient,
  carId: string,
  candidate: CandidatePoint,
  excludeLogId?: string
): Promise<MileageValidationResult> {
  const [prevByDate, nextByDate] = await Promise.all([
    tx.mileageLog.findFirst({
      where: {
        carId,
        recordedAt: { lte: candidate.recordedAt },
        ...(excludeLogId ? { id: { not: excludeLogId } } : {}),
      },
      orderBy: { recordedAt: 'desc' },
    }),
    tx.mileageLog.findFirst({
      where: {
        carId,
        recordedAt: { gt: candidate.recordedAt },
        ...(excludeLogId ? { id: { not: excludeLogId } } : {}),
      },
      orderBy: { recordedAt: 'asc' },
    }),
  ])

  if (prevByDate && candidate.mileage < prevByDate.mileage) {
    return {
      ok: false,
      code: 'LOWER_THAN_EARLIER_LOG',
      message: `На ${fmt(prevByDate.recordedAt)} уже есть запись ${prevByDate.mileage.toLocaleString('ru')} км.`,
      suggestion: `Значение на ${fmt(candidate.recordedAt)} не может быть меньше — одометр не крутится назад. Проверьте число или дату. Если запись ${prevByDate.mileage.toLocaleString('ru')} км ошибочная — сначала исправьте её в истории.`,
    }
  }

  if (nextByDate && candidate.mileage > nextByDate.mileage) {
    return {
      ok: false,
      code: 'HIGHER_THAN_LATER_LOG',
      message: `На ${fmt(nextByDate.recordedAt)} уже есть запись ${nextByDate.mileage.toLocaleString('ru')} км.`,
      suggestion: `Значение на ${fmt(candidate.recordedAt)} не может быть больше — одометр не крутится назад. Проверьте число или дату. Если запись ${nextByDate.mileage.toLocaleString('ru')} км ошибочная — сначала исправьте её в истории.`,
    }
  }

  return { ok: true }
}

/** Soft "large jump" check — not a hard block, just a confirm-dialog trigger. */
export function isBigJump(
  candidateMileage: number,
  referenceMileage: number,
  threshold = 1000
): { big: boolean; delta: number } {
  const delta = candidateMileage - referenceMileage
  return { big: delta >= threshold, delta }
}

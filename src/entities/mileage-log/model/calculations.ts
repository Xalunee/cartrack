import type { MileageLog } from './types'

export function latestMileage(logs: MileageLog[]): number {
  if (!logs.length) return 0
  return [...logs].sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())[0].mileage
}

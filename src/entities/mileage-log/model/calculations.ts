import type { MileageLog } from './types'

export function latestMileage(logs: MileageLog[]): number {
  if (!logs.length) return 0
  return [...logs].sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime())[0].km
}

import { isSameDay } from 'date-fns'

interface ActiveRecordCandidate {
  id: string
  mileage: number
  date: Date | string
}

interface ActiveRecordItemRef {
  lastServiceMileage: number | null
  lastServiceDate: Date | string | null
}

export function findActiveRecordId(
  records: ActiveRecordCandidate[],
  item: ActiveRecordItemRef
): string | null {
  if (!records.length) return null

  if (item.lastServiceMileage !== null && item.lastServiceDate) {
    const match = records.find(
      (r) =>
        r.mileage === item.lastServiceMileage &&
        isSameDay(new Date(r.date), new Date(item.lastServiceDate!))
    )
    if (match) return match.id
  }

  const [newest] = [...records].sort(
    (a, b) => b.mileage - a.mileage || new Date(b.date).getTime() - new Date(a.date).getTime()
  )
  return newest?.id ?? null
}

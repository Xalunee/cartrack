'use client'
import { useMileageQuery, MileageChart, latestMileage } from '@entities/mileage-log'

export function MileageTracker() {
  const { data, isLoading } = useMileageQuery()
  const logs = data?.logs ?? []

  if (isLoading) return <p className="text-sm text-muted-foreground">Загрузка...</p>

  return (
    <div>
      <p className="text-2xl font-bold">{latestMileage(logs).toLocaleString()} km</p>
      <MileageChart logs={logs} />
    </div>
  )
}

'use client'
import { useMaintenanceQuery, MaintenanceCard } from '@entities/maintenance-item'

export function MaintenanceList() {
  const { data: items = [], isPending } = useMaintenanceQuery()

  if (isPending) return <p className="text-sm text-muted-foreground">Загрузка...</p>

  return (
    <div className="grid gap-3">
      {items.map((item) => <MaintenanceCard key={item.id} item={item} />)}
    </div>
  )
}

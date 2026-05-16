'use client'
import { useMaintenanceQuery } from '@entities/maintenance-item'
import { MaintenanceCard } from '@entities/maintenance-item'
import { MAINTENANCE_STATUS } from '@shared/config'

export function StatusOverview() {
  const { data: items = [], isLoading } = useMaintenanceQuery()
  const critical = items.filter((i) => i.status === MAINTENANCE_STATUS.CRITICAL)

  if (isLoading) return <p className="text-sm text-muted-foreground">Загрузка...</p>

  return (
    <div className="grid gap-3">
      {critical.length === 0
        ? <p className="text-sm text-muted-foreground">Все системы в норме</p>
        : critical.map((item) => <MaintenanceCard key={item.id} item={item} />)}
    </div>
  )
}

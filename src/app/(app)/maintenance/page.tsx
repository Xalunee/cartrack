'use client'

import { useMaintenanceQuery } from '@entities/maintenance-item'
import { useCarQuery } from '@entities/car'
import { MaintenanceDialog } from '@features/add-maintenance'
import { StatusOverview } from '@widgets/status-overview'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default function MaintenancePage() {
  const { data: car } = useCarQuery()
  const { data: items, isLoading } = useMaintenanceQuery()

  const totalItems = items?.length ?? 0
  const criticalCount = items?.filter((i) => i.resource.status === 'critical').length ?? 0
  const soonCount = items?.filter((i) => i.resource.status === 'soon').length ?? 0
  const okCount = items?.filter((i) => i.resource.status === 'ok').length ?? 0
  const totalSpent = items?.reduce((sum, i) => sum + (i.lastServiceCost ?? 0), 0) ?? 0

  if (isLoading) {
    return (
      <div className="max-w-2xl md:max-w-4xl lg:max-w-5xl mx-auto px-4 py-6 space-y-6 page-enter">
        <div className="h-7 w-40 skeleton" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 skeleton rounded-xl" />)}
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 skeleton rounded-xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl md:max-w-4xl lg:max-w-5xl mx-auto px-4 py-6 space-y-5 page-enter">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Обслуживание</h1>
          {car && (
            <p className="text-sm text-muted-foreground tabular-nums">
              {car.brand} {car.model} · {car.currentMileage.toLocaleString('ru')} км
            </p>
          )}
        </div>
        <MaintenanceDialog trigger={
          <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Добавить</Button>
        } />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <CardContent className="p-3">
            <p className="text-xl font-semibold tabular-nums">{totalItems}</p>
            <p className="text-xs text-muted-foreground">Всего позиций</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xl font-semibold tabular-nums">{criticalCount + soonCount}</p>
            <p className="text-xs text-muted-foreground">
              {criticalCount > 0 && `${criticalCount} крит.`}
              {criticalCount > 0 && soonCount > 0 && ' + '}
              {soonCount > 0 && `${soonCount} скоро`}
              {criticalCount === 0 && soonCount === 0 && 'всё OK'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xl font-semibold tabular-nums">{okCount}</p>
            <p className="text-xs text-muted-foreground">В норме</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xl font-semibold tabular-nums">{totalSpent.toLocaleString('ru')} ₽</p>
            <p className="text-xs text-muted-foreground">Потрачено</p>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
          Позиции · {totalItems}
        </h2>
        <StatusOverview />
      </div>
    </div>
  )
}

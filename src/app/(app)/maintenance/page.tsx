'use client'

import { useMaintenanceQuery } from '@entities/maintenance-item'
import { useCarQuery } from '@entities/car'
import { MaintenanceDialog } from '@features/add-maintenance'
import { StatusOverview } from '@widgets/status-overview'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Wrench, AlertTriangle, DollarSign, CheckCircle } from 'lucide-react'

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
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 page-enter">
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
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 page-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Обслуживание</h1>
          {car && (
            <p className="text-sm text-muted-foreground">
              {car.brand} {car.model} · {car.currentMileage.toLocaleString('ru')} км
            </p>
          )}
        </div>
        <MaintenanceDialog trigger={
          <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Добавить</Button>
        } />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="glass">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Wrench className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Всего</span>
            </div>
            <p className="text-lg font-semibold">{totalItems}</p>
            <p className="text-[10px] text-muted-foreground">позиций</p>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
              <span className="text-xs text-muted-foreground">Внимание</span>
            </div>
            <p className="text-lg font-semibold">{criticalCount + soonCount}</p>
            <p className="text-[10px] text-muted-foreground">
              {criticalCount > 0 && `${criticalCount} крит.`}
              {criticalCount > 0 && soonCount > 0 && ' + '}
              {soonCount > 0 && `${soonCount} скоро`}
              {criticalCount === 0 && soonCount === 0 && 'всё OK'}
            </p>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="h-3.5 w-3.5 text-green-500" />
              <span className="text-xs text-muted-foreground">В норме</span>
            </div>
            <p className="text-lg font-semibold">{okCount}</p>
            <p className="text-[10px] text-muted-foreground">позиций</p>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Потрачено</span>
            </div>
            <p className="text-lg font-semibold">{totalSpent.toLocaleString('ru')}</p>
            <p className="text-[10px] text-muted-foreground">₽</p>
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Позиции · {totalItems}
          </h2>
        </div>
        <StatusOverview />
      </div>
    </div>
  )
}

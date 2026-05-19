'use client'

import { useCarQuery } from '@entities/car'
import { StatusOverview } from '@widgets/status-overview'
import { MileageTracker } from '@widgets/mileage-tracker'
import { SpendingChart } from '@widgets/spending-chart'
import { MaintenanceDialog } from '@features/add-maintenance'
import { LogMileageDialog } from '@features/log-mileage'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export function DashboardPage() {
  const { data: car, isLoading } = useCarQuery()

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            {isLoading ? '...' : car ? `${car.brand} ${car.model}` : 'CarTrack'}
          </h1>
          {car && (
            <p className="text-sm text-muted-foreground">
              {car.year} · {car.currentMileage.toLocaleString('ru')} км
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {car && (
            <LogMileageDialog
              currentMileage={car.currentMileage}
              trigger={
                <Button size="sm" variant="outline">
                  Пробег
                </Button>
              }
            />
          )}
          <MaintenanceDialog trigger={
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" /> Позиция
            </Button>
          } />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <MileageTracker />
        <SpendingChart />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Обслуживание
          </h2>
          <MaintenanceDialog trigger={
            <Button variant="ghost" size="sm">
              <Plus className="h-3.5 w-3.5 mr-1" /> Добавить
            </Button>
          } />
        </div>
        <StatusOverview />
      </div>
    </div>
  )
}

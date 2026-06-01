'use client'

import Link from 'next/link'
import { useCarQuery } from '@entities/car'
import { StatusOverview } from '@widgets/status-overview'
import { MileageTracker } from '@widgets/mileage-tracker'
import { SpendingChart } from '@widgets/spending-chart'
import { MaintenanceDialog } from '@features/add-maintenance'
import { LogMileageDialog } from '@features/log-mileage'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Car, Plus } from 'lucide-react'

export function DashboardPage() {
  const { data: car, isLoading } = useCarQuery()

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    )
  }

  if (!car) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-sm text-center">
          <CardContent className="pt-8 pb-8 space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Car className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">Добавьте свой автомобиль</h2>
              <p className="text-sm text-muted-foreground">
                Чтобы начать отслеживать обслуживание, добавьте свою машину
              </p>
            </div>
            <Link href="/onboarding" className={buttonVariants({ className: 'w-full' })}>
              Добавить машину
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 page-enter">
      <div className="flex items-start justify-between animate-fade-in">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            {car.brand} {car.model}
          </h1>
          <p className="text-sm text-muted-foreground">
            {car.year} · {car.currentMileage.toLocaleString('ru')} км
          </p>
        </div>
        <div className="flex gap-2">
          <LogMileageDialog
            currentMileage={car.currentMileage}
            trigger={
              <Button size="sm" variant="outline">
                Пробег
              </Button>
            }
          />
          <MaintenanceDialog trigger={
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" /> Позиция
            </Button>
          } />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 animate-fade-in-delay-1">
        <MileageTracker />
        <SpendingChart />
      </div>

      <div className="animate-fade-in-delay-2">
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

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQueryClient } from '@tanstack/react-query'
import { useCarQuery } from '@entities/car'
import { StatusOverview } from '@widgets/status-overview'
import { MileageTracker } from '@widgets/mileage-tracker'
import { SpendingChart } from '@widgets/spending-chart'
import { MaintenanceDialog } from '@features/add-maintenance'
import { LogMileageDialog } from '@features/log-mileage'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@shared/lib/utils'
import { Car, ChevronRight, Plus, RefreshCw } from 'lucide-react'

export function DashboardPage() {
  const { data: car, isLoading } = useCarQuery()
  const queryClient = useQueryClient()
  const [refreshing, setRefreshing] = useState(false)

  async function handleRefresh() {
    setRefreshing(true)
    await queryClient.invalidateQueries()
    setTimeout(() => setRefreshing(false), 500)
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl md:max-w-4xl lg:max-w-5xl mx-auto px-4 py-6 space-y-6 page-enter">
        <div className="flex items-start justify-between">
          <div>
            <div className="h-6 w-40 skeleton mb-2" />
            <div className="h-4 w-24 skeleton" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="h-48 skeleton rounded-xl" />
          <div className="h-48 skeleton rounded-xl" />
        </div>
        <div className="space-y-3">
          <div className="h-24 skeleton rounded-xl" />
          <div className="h-24 skeleton rounded-xl" />
        </div>
      </div>
    )
  }

  if (!car) {
    return (
      <div className="max-w-2xl md:max-w-4xl lg:max-w-5xl mx-auto px-4 py-6 flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-sm text-center">
          <CardContent className="pt-8 pb-8 space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Car className="h-6 w-6 text-muted-foreground" />
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
    <div className="max-w-2xl md:max-w-4xl lg:max-w-5xl mx-auto px-4 py-6 space-y-5 page-enter">
      <div className="flex items-center justify-between mb-5 animate-fade-in">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">
            {car.brand} {car.model}
          </h1>
          <p className="text-sm text-muted-foreground tabular-nums">
            {car.year} · {car.currentMileage.toLocaleString('ru')} км
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleRefresh}
            className="h-8 w-8 p-0"
            aria-label="Обновить данные"
          >
            <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
          </Button>
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 items-stretch animate-fade-in-delay-1">
        <MileageTracker />
        <SpendingChart />
      </div>

      <div className="animate-fade-in-delay-2">
        <div className="flex items-center justify-between mb-2">
          {/* The cards below open a single item, so the list page — and the
              replacement history on it — needs an entry point of its own. */}
          <Link
            href="/maintenance"
            className="group flex items-center gap-0.5 text-sm font-semibold text-foreground transition-colors hover:text-muted-foreground"
          >
            Обслуживание
            <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </Link>
          <MaintenanceDialog trigger={
            <Button variant="outline" size="sm">
              <Plus className="h-3.5 w-3.5 mr-1" /> Добавить
            </Button>
          } />
        </div>
        <StatusOverview />
      </div>
    </div>
  )
}

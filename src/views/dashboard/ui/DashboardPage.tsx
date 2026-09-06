'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useQueryClient } from '@tanstack/react-query'
import { useCarQuery } from '@entities/car'
import { useMileageQuery } from '@entities/mileage-log'
import { StatusOverview } from '@widgets/status-overview'
import { MileageTrackerSkeleton } from '@widgets/mileage-tracker/ui/MileageTrackerSkeleton'
import { SpendingChartSkeleton } from '@widgets/spending-chart/ui/SpendingChartSkeleton'
import { MaintenanceDialog } from '@features/add-maintenance'
import { LogMileageDialog } from '@features/log-mileage'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@shared/lib/utils'
import { Car, ChevronRight, Plus, RefreshCw } from 'lucide-react'

// Both widgets are charts: Recharts is the single heaviest dependency on this
// page and neither widget can draw anything until its query resolves, so the
// library has no business being in the bundle that blocks first paint. The
// loading states mirror each widget's own first render so the swap is silent.
//
// Both imports go through @widgets/lazy-charts so every chart in the app shares
// one chunk group — see that file for what two groups did to Recharts' module
// registry.
const MileageTracker = dynamic(
  () => import('@widgets/lazy-charts').then((m) => m.MileageTracker),
  { ssr: false, loading: () => <MileageTrackerSkeleton /> }
)
const SpendingChart = dynamic(() => import('@widgets/lazy-charts').then((m) => m.SpendingChart), {
  ssr: false,
  loading: () => <SpendingChartSkeleton />,
})

export function DashboardPage() {
  const { data: car, isPending } = useCarQuery()
  // Started here rather than left to the widget that needs it. MileageTracker
  // is the only reader of this query, and it travels inside the lazy Recharts
  // chunk — so asking from in there put a whole round trip *behind* 340 KiB of
  // download. StatusOverview already pulls /api/maintenance at hydration
  // because it is imported statically; this puts /api/mileage on the same
  // footing. React Query dedupes against the widget's own call by key.
  useMileageQuery()
  const queryClient = useQueryClient()
  const [refreshing, setRefreshing] = useState(false)

  async function handleRefresh() {
    setRefreshing(true)
    await queryClient.invalidateQueries()
    setTimeout(() => setRefreshing(false), 500)
  }

  // The car query deliberately does not gate this page. Returning a bare
  // skeleton here left both charts unmounted, and an unmounted `next/dynamic`
  // never starts fetching — so the Recharts chunk queued up *behind* the
  // /api/car response instead of travelling alongside it, and the widgets it
  // draws arrived a whole network round trip late. Rendering the frame
  // immediately lets the chunk, /api/maintenance and /api/mileage all leave at
  // once; each widget owns its own loading state.
  //
  // `isPending` guards the empty state below: without it the "add a car" card
  // would flash on every load, before the query that disproves it lands.
  //
  // It has to be `isPending`, not `isLoading`. `isLoading` is `isPending &&
  // isFetching`, and while the persisted cache is being restored the observer
  // is deliberately held back — fetchStatus is forced to 'idle' — so `isLoading`
  // reads false with no data in hand. That window covers the very first render,
  // prerender included, which baked this card into the static HTML and put it on
  // screen ahead of everything else. `isPending` is true whenever there is
  // neither data nor an error, which is the question actually being asked here.
  if (!isPending && !car) {
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
          {car ? (
            <>
              <h1 className="text-lg font-semibold tracking-tight">
                {car.brand} {car.model}
              </h1>
              <p className="text-sm text-muted-foreground tabular-nums">
                {car.year} · {car.currentMileage.toLocaleString('ru')} км
              </p>
            </>
          ) : (
            // Same box as the real heading, so nothing shifts when it arrives.
            <>
              <div className="h-6 w-40 skeleton mb-2" />
              <div className="h-4 w-24 skeleton" />
            </>
          )}
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
          {car ? (
            <LogMileageDialog
              currentMileage={car.currentMileage}
              trigger={
                <Button size="sm" variant="outline">
                  Пробег
                </Button>
              }
            />
          ) : (
            <Button size="sm" variant="outline" disabled>
              Пробег
            </Button>
          )}
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

'use client'

import Link from 'next/link'
import { formatDistanceToNowStrict } from 'date-fns'
import { ru } from 'date-fns/locale'
import { useUserQuery } from '@entities/user'
import { useCarQuery } from '@entities/car'
import { useMileageQuery } from '@entities/mileage-log'
import { useMaintenanceQuery } from '@entities/maintenance-item'
import { calculateProfileStats } from '@shared/lib/calculations/profile-stats'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Settings } from 'lucide-react'

export function ProfilePage() {
  const { data: user, isPending: userLoading } = useUserQuery()
  const { data: car, isPending: carLoading } = useCarQuery()
  const { data: mileage, isPending: mileageLoading } = useMileageQuery()
  const { data: items, isPending: itemsLoading } = useMaintenanceQuery()

  const stats = calculateProfileStats({
    logs: mileage?.logs ?? [],
    spentPerItem: items?.map((item) => item.totalSpent) ?? [],
    trackingStartedAt: car?.createdAt ?? null,
    now: new Date(),
  })

  // Every figure is derived from the four queries above, so the numbers only
  // stand still once all of them have answered.
  const statsLoading = carLoading || mileageLoading || itemsLoading

  const tiles = [
    {
      label: 'Пробег за время учёта',
      value: stats.trackedKm === null ? '—' : `${stats.trackedKm.toLocaleString('ru')} км`,
    },
    {
      label: 'Записей пробега',
      value: stats.readingsCount.toLocaleString('ru'),
    },
    {
      label: 'Потрачено на сервис',
      value: `${stats.totalSpent.toLocaleString('ru')} ₽`,
    },
    {
      label: 'Ведём учёт',
      value:
        stats.trackedSince === null
          ? '—'
          : stats.trackedDays === 0
            ? 'меньше дня'
            : formatDistanceToNowStrict(stats.trackedSince, { locale: ru }),
    },
  ]

  if (userLoading) {
    return (
      <div className="max-w-2xl md:max-w-4xl lg:max-w-5xl mx-auto px-4 py-6 space-y-5 page-enter">
        <div className="h-7 w-32 skeleton" />
        <div className="h-28 skeleton rounded-xl" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-20 skeleton rounded-xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl md:max-w-4xl lg:max-w-5xl mx-auto px-4 py-6 space-y-5 page-enter">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-lg font-semibold tracking-tight">Профиль</h1>
        <Link
          href="/settings"
          aria-label="Настройки"
          title="Настройки"
          className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Settings className="h-5 w-5" />
        </Link>
      </div>

      {/* Label left, value hard against the right edge — the same shape as the
          «Машина» card below, so neither leaves half the row empty. */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Аккаунт</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between gap-3 text-sm">
            <span className="shrink-0 text-muted-foreground">Имя</span>
            <span className="truncate">{user?.name ?? 'Без имени'}</span>
          </div>
          <div className="flex justify-between gap-3 text-sm">
            <span className="shrink-0 text-muted-foreground">Email</span>
            <span className="truncate">{user?.email ?? '—'}</span>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
          Статистика
        </h2>
        {statsLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-20 skeleton rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {tiles.map((tile) => (
              <Card key={tile.label}>
                <CardContent className="p-3">
                  <p className="text-xl font-semibold tabular-nums">{tile.value}</p>
                  <p className="text-xs text-muted-foreground">{tile.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {car && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Машина</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Модель</span>
              <span>{car.brand} {car.model}, {car.year}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Текущий пробег</span>
              <span className="tabular-nums">{car.currentMileage.toLocaleString('ru')} км</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

'use client'

import { useMaintenanceQuery } from '@entities/maintenance-item'
import { useCarQuery } from '@entities/car'
import { MaintenanceDialog } from '@features/add-maintenance'
import { CompleteServiceDialog } from '@features/complete-service'
import { StatusBadge, ResourceBar } from '@shared/ui'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Wrench } from 'lucide-react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { useRouter } from 'next/navigation'

export function StatusOverview() {
  const router = useRouter()
  const { data: items, isLoading } = useMaintenanceQuery()
  const { data: car } = useCarQuery()

  if (isLoading) {
    return (
      <div className="space-y-3 stagger-children">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-xl skeleton" />
        ))}
      </div>
    )
  }

  if (!items?.length) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8 gap-2">
          <Wrench className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground text-center">
            Нет позиций обслуживания. Добавьте первую.
          </p>
          <MaintenanceDialog trigger={
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" /> Добавить
            </Button>
          } />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-2 stagger-children">
      {items.map((item) => (
        <Card
          key={item.id}
          className="overflow-hidden card-hover cursor-pointer border-l-2 py-0"
          style={{ borderLeftColor: `hsl(var(--status-${item.resource.status}))` }}
          role="button"
          tabIndex={0}
          onClick={(event) => {
            const target = event.target as HTMLElement
            if (target.closest('[data-slot="dialog-content"], [data-slot="dialog-overlay"]')) return
            router.push(`/maintenance/${item.id}`)
          }}
          onKeyDown={(event) => {
            if (event.target !== event.currentTarget) return
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              router.push(`/maintenance/${item.id}`)
            }
          }}
        >
            <CardContent className="p-3">
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 tabular-nums">
                    {item.resource.remainingKm !== null && (
                      <span>
                        {item.resource.remainingKm > 0
                          ? `Осталось ${item.resource.remainingKm.toLocaleString('ru')} км`
                          : `Просрочено на ${Math.abs(item.resource.remainingKm).toLocaleString('ru')} км`}
                      </span>
                    )}
                    {item.resource.remainingKm !== null && item.resource.remainingDays !== null && (
                      <span> · </span>
                    )}
                    {item.resource.remainingDays !== null && (
                      <span>
                        {item.resource.remainingDays > 0
                          ? `${item.resource.remainingDays} дн.`
                          : `просрочено на ${Math.abs(item.resource.remainingDays)} дн.`}
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <StatusBadge status={item.resource.status} />
                  {car && (
                    <CompleteServiceDialog
                      itemId={item.id}
                      itemName={item.name}
                      prevMileage={item.lastServiceMileage ?? 0}
                      currentMileage={car.currentMileage}
                      trigger={
                        <Button
                          size="sm"
                          variant={item.resource.status === 'ok' ? 'outline' : 'default'}
                          className="h-7 px-2 text-xs"
                          onClick={(event) => {
                            event.preventDefault()
                            event.stopPropagation()
                          }}
                        >
                          Заменил
                        </Button>
                      }
                    />
                  )}
                  <MaintenanceDialog item={item} trigger={
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={(event) => {
                        event.preventDefault()
                        event.stopPropagation()
                      }}
                    >
                      <Wrench className="h-3.5 w-3.5" />
                    </Button>
                  } />
                </div>
              </div>
              <ResourceBar
                usedPercent={item.resource.usedPercent}
                status={item.resource.status}
              />
              {item.resource.forecastDate && (
                <p className="text-xs text-muted-foreground mt-1.5">
                  След. замена ~{format(new Date(item.resource.forecastDate), 'd MMM yyyy', { locale: ru })}
                </p>
              )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

'use client'

import { useMaintenanceQuery } from '@entities/maintenance-item'
import { MaintenanceDialog } from '@features/add-maintenance'
import { StatusBadge, ResourceBar } from '@shared/ui'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Wrench } from 'lucide-react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import Link from 'next/link'

export function StatusOverview() {
  const { data: items, isLoading } = useMaintenanceQuery()

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
        <CardContent className="flex flex-col items-center justify-center py-10 gap-3">
          <Wrench className="h-8 w-8 text-muted-foreground" />
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
    <div className="space-y-3 stagger-children">
      {items.map((item) => (
        <Link key={item.id} href={`/maintenance/${item.id}`}>
        <Card className="overflow-hidden card-hover hover:border-primary/30 cursor-pointer">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{item.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {item.resource.remainingKm !== null && (
                    <span>Осталось {item.resource.remainingKm.toLocaleString('ru')} км</span>
                  )}
                  {item.resource.remainingKm !== null && item.resource.remainingDays !== null && (
                    <span> · </span>
                  )}
                  {item.resource.remainingDays !== null && (
                    <span>
                      {item.resource.remainingDays > 0
                        ? `${item.resource.remainingDays} дн.`
                        : 'просрочено'}
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <StatusBadge status={item.resource.status} />
                <MaintenanceDialog item={item} trigger={
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
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
        </Link>
      ))}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useEventsQuery, CarEvent } from '@entities/event'
import { EventLog } from '@widgets/event-log'
import { AddEventDialog, eventTypeLabels } from '@features/add-event'
import { Button } from '@/components/ui/button'
import { Plus, AlertTriangle, Receipt, Wrench, FileText, Car } from 'lucide-react'

const typeIcons: Record<CarEvent['type'], typeof AlertTriangle> = {
  ACCIDENT: Car,
  MALFUNCTION: AlertTriangle,
  FINE: Receipt,
  SERVICE: Wrench,
  NOTE: FileText,
}

export default function EventsPage() {
  const { data: events } = useEventsQuery()
  const [filter, setFilter] = useState<CarEvent['type'] | 'ALL'>('ALL')

  const totalEvents = events?.length ?? 0
  const totalCost = events?.reduce((sum, event) => sum + (event.cost ?? 0), 0) ?? 0

  const typeCounts = events?.reduce((acc, event) => {
    acc[event.type] = (acc[event.type] ?? 0) + 1
    return acc
  }, {} as Record<string, number>) ?? {}

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 page-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">События</h1>
          <p className="text-sm text-muted-foreground">
            {totalEvents} событий · {totalCost > 0 ? `${totalCost.toLocaleString('ru')} ₽` : 'без расходов'}
          </p>
        </div>
        <AddEventDialog trigger={
          <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Добавить</Button>
        } />
      </div>

      {totalEvents > 0 && (
        <div className="flex gap-2 flex-wrap">
          <Button
            size="sm"
            variant={filter === 'ALL' ? 'default' : 'outline'}
            className="h-7 text-xs"
            onClick={() => setFilter('ALL')}
          >
            Все ({totalEvents})
          </Button>
          {(Object.keys(eventTypeLabels) as CarEvent['type'][]).map((type) => {
            const count = typeCounts[type] ?? 0
            if (count === 0) return null
            const Icon = typeIcons[type]
            return (
              <Button
                key={type}
                size="sm"
                variant={filter === type ? 'default' : 'outline'}
                className="h-7 text-xs"
                onClick={() => setFilter(type)}
              >
                <Icon className="h-3 w-3 mr-1" />
                {eventTypeLabels[type]} ({count})
              </Button>
            )
          })}
        </div>
      )}

      <EventLog filter={filter === 'ALL' ? undefined : filter} />
    </div>
  )
}

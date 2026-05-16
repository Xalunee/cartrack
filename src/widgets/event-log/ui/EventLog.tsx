'use client'
import { useEventQuery, EventItem } from '@entities/event'
import { Separator } from '@shared/ui'

export function EventLog() {
  const { data: events = [], isLoading } = useEventQuery()

  if (isLoading) return <p className="text-sm text-muted-foreground">Загрузка...</p>

  return (
    <div className="divide-y">
      {events.map((event, i) => (
        <div key={event.id}>
          <EventItem event={event} />
          {i < events.length - 1 && <Separator />}
        </div>
      ))}
    </div>
  )
}

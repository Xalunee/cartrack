import type { CarEvent } from '../model/types'

interface Props { event: CarEvent }

export function EventItem({ event }: Props) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-sm font-medium">{event.title}</p>
        <p className="text-xs text-muted-foreground">{new Date(event.occurredAt).toLocaleDateString('ru')}</p>
      </div>
      {event.cost != null && <p className="text-sm">{event.cost.toLocaleString()} ₽</p>}
    </div>
  )
}

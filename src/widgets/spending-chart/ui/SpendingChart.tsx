'use client'
import { useEventQuery } from '@entities/event'

export function SpendingChart() {
  const { data: events = [] } = useEventQuery()
  const total = events.reduce((sum, e) => sum + (e.cost ?? 0), 0)

  return (
    <div>
      <p className="text-2xl font-bold">{total.toLocaleString()} ₽</p>
      <p className="text-xs text-muted-foreground">Всего расходов</p>
    </div>
  )
}

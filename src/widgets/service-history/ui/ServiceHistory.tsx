'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { useAllServiceRecordsQuery, findActiveRecordId } from '@entities/service-record'
import { useMaintenanceQuery } from '@entities/maintenance-item'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@shared/lib/utils'
import { History, ChevronDown, ChevronUp } from 'lucide-react'

const COLLAPSE_THRESHOLD = 5

export function ServiceHistory() {
  const { data: records, isPending } = useAllServiceRecordsQuery()
  const { data: items } = useMaintenanceQuery()
  const [expanded, setExpanded] = useState(false)

  if (isPending) {
    return <div className="h-16 rounded-xl skeleton" />
  }

  const count = records?.length ?? 0

  if (count === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8 gap-2">
          <History className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground text-center">История замен пуста</p>
        </CardContent>
      </Card>
    )
  }

  const activeIds = new Set<string>()
  if (items) {
    for (const item of items) {
      const itemRecords = records!.filter((r) => r.maintenanceItemId === item.id)
      const activeId = findActiveRecordId(itemRecords, item)
      if (activeId) activeIds.add(activeId)
    }
  }

  const shouldCollapse = count > COLLAPSE_THRESHOLD
  const visibleRecords = shouldCollapse && !expanded ? records!.slice(0, COLLAPSE_THRESHOLD) : records!

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center justify-between w-full mb-1 group"
        disabled={!shouldCollapse}
      >
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          История замен · {count}
        </h2>
        {shouldCollapse && (
          expanded ? (
            <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          )
        )}
      </button>
      <p className="text-[11px] text-muted-foreground mb-2">
        Актуальная — замена, от которой сейчас идёт отсчёт
      </p>
      <Card>
        <CardContent className="p-0 divide-y">
          {visibleRecords.map((record) => {
            const isActive = activeIds.has(record.id)
            return (
              <div
                key={record.id}
                className={cn(
                  'flex items-center justify-between gap-3 px-4 py-2.5',
                  !isActive && 'opacity-70'
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p
                      className={cn(
                        'text-sm font-medium truncate',
                        !isActive && 'text-muted-foreground'
                      )}
                    >
                      {record.itemName}
                    </p>
                    {isActive && (
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded-md flex-shrink-0"
                        style={{
                          color: 'hsl(var(--status-ok))',
                          backgroundColor: 'hsl(var(--status-ok-bg))',
                        }}
                      >
                        Актуальная
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {record.mileage.toLocaleString('ru')} км ·{' '}
                    {format(new Date(record.date), 'd MMM yyyy', { locale: ru })}
                    {record.notes && <span> · {record.notes}</span>}
                  </p>
                </div>
                {record.cost !== null && (
                  <p className="text-sm tabular-nums flex-shrink-0">
                    {record.cost.toLocaleString('ru')} ₽
                  </p>
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>
      {shouldCollapse && !expanded && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full mt-1 text-xs text-muted-foreground"
          onClick={() => setExpanded(true)}
        >
          Показать все {count}
        </Button>
      )}
    </div>
  )
}

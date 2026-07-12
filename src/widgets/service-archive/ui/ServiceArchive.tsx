'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { useAllServiceRecordsQuery } from '@entities/service-record'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Archive, ChevronDown, ChevronUp } from 'lucide-react'

const COLLAPSE_THRESHOLD = 5

export function ServiceArchive() {
  const { data: records, isLoading } = useAllServiceRecordsQuery()
  const [expanded, setExpanded] = useState(false)

  if (isLoading) {
    return <div className="h-16 rounded-xl skeleton" />
  }

  const count = records?.length ?? 0

  if (count === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8 gap-2">
          <Archive className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground text-center">Архив замен пуст</p>
        </CardContent>
      </Card>
    )
  }

  const shouldCollapse = count > COLLAPSE_THRESHOLD
  const visibleRecords = shouldCollapse && !expanded ? records!.slice(0, COLLAPSE_THRESHOLD) : records!

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center justify-between w-full mb-2 group"
        disabled={!shouldCollapse}
      >
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Архив замен · {count}
        </h2>
        {shouldCollapse && (
          expanded ? (
            <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          )
        )}
      </button>
      <Card>
        <CardContent className="p-0 divide-y">
          {visibleRecords.map((record) => (
            <div key={record.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{record.itemName}</p>
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
          ))}
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

'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import {
  useServiceRecordsQuery,
  findActiveRecordId,
  type ServiceRecord,
} from '@entities/service-record'
import { EditServiceRecordDialog } from '@features/edit-service-record'
import { DeleteServiceRecordDialog } from '@features/delete-service-record'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@shared/lib/utils'
import { Pencil, Trash2, History } from 'lucide-react'

function TimelineRow({
  itemId,
  itemName,
  record,
  lowerBound,
  upperBound,
  cycleKm,
  isActive,
  onDeleted,
}: {
  itemId: string
  itemName: string
  record: ServiceRecord
  lowerBound: number | null
  upperBound: number | null
  cycleKm: number | null
  isActive: boolean
  onDeleted: (message: { text: string; extended: boolean }) => void
}) {
  return (
    <div className="py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0 flex-1">
          <span
            className="mt-1.5 h-2 w-2 rounded-full flex-shrink-0"
            style={{
              backgroundColor: isActive ? 'hsl(var(--status-ok))' : 'hsl(var(--muted-foreground) / 0.3)',
            }}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-medium tabular-nums">
                {record.mileage.toLocaleString('ru')} км
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
            <p className={cn('text-xs text-muted-foreground', !isActive && 'opacity-80')}>
              {format(new Date(record.date), 'd MMMM yyyy', { locale: ru })}
              {record.cost !== null && <span> · {record.cost.toLocaleString('ru')} ₽</span>}
            </p>
            {record.notes && (
              <p className="text-xs text-muted-foreground mt-1">{record.notes}</p>
            )}
            {cycleKm !== null && (
              <p className="text-xs text-muted-foreground mt-1 tabular-nums">
                {cycleKm.toLocaleString('ru')} км между заменами
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <EditServiceRecordDialog
            itemId={itemId}
            record={record}
            lowerBound={lowerBound}
            upperBound={upperBound}
            trigger={
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            }
          />
          <DeleteServiceRecordDialog
            itemId={itemId}
            itemName={itemName}
            record={record}
            onDeleted={onDeleted}
            trigger={
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            }
          />
        </div>
      </div>
    </div>
  )
}

interface ServiceTimelineProps {
  itemId: string
  item: { name: string; lastServiceMileage: number | null; lastServiceDate: Date | string | null }
}

/** Long enough to read a recomputed odometer figure without lingering. */
const NOTICE_MS = 4000
const SHORT_NOTICE_MS = 2000

export function ServiceTimeline({ itemId, item }: ServiceTimelineProps) {
  const { data: records, isPending } = useServiceRecordsQuery(itemId)

  // The outcome of a deletion is shown here rather than in the dialog: deleting a
  // record unmounts its row, and the dialog with it, before anything inside could
  // be read. Storing the message as a fresh object means a second deletion
  // replaces the first instead of queueing behind its timer.
  const [notice, setNotice] = useState<{ text: string; ms: number } | null>(null)

  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => setNotice(null), notice.ms)
    return () => clearTimeout(timer)
  }, [notice])

  function onDeleted(message: { text: string; extended: boolean }) {
    setNotice({ text: message.text, ms: message.extended ? NOTICE_MS : SHORT_NOTICE_MS })
  }

  const noticeLine = notice ? (
    <p className="text-sm pb-3" style={{ color: 'hsl(var(--status-ok))' }}>
      {notice.text}
    </p>
  ) : null

  if (isPending) {
    return <div className="h-40 rounded-xl skeleton" />
  }

  if (!records?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <History className="h-4 w-4" /> История замен
          </CardTitle>
        </CardHeader>
        <CardContent>
          {noticeLine}
          <p className="text-sm text-muted-foreground">Замен пока не было</p>
        </CardContent>
      </Card>
    )
  }

  const activeId = findActiveRecordId(records, item)

  // records are ordered newest first
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <History className="h-4 w-4" /> История замен
        </CardTitle>
      </CardHeader>
      <CardContent className="divide-y pt-0">
        {noticeLine}
        {records.map((record, index) => {
          const older = records[index + 1]
          const newer = records[index - 1]
          const cycleKm = older ? record.mileage - older.mileage : null
          return (
            <TimelineRow
              key={record.id}
              itemId={itemId}
              itemName={item.name}
              record={record}
              lowerBound={older?.mileage ?? null}
              upperBound={newer?.mileage ?? null}
              cycleKm={cycleKm}
              isActive={record.id === activeId}
              onDeleted={onDeleted}
            />
          )
        })}
      </CardContent>
    </Card>
  )
}

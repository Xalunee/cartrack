'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import {
  useServiceRecordsQuery,
  useDeleteServiceRecordMutation,
  type ServiceRecord,
} from '@entities/service-record'
import { EditServiceRecordDialog } from '@features/edit-service-record'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2, History } from 'lucide-react'

function TimelineRow({
  itemId,
  record,
  lowerBound,
  upperBound,
  cycleKm,
}: {
  itemId: string
  record: ServiceRecord
  lowerBound: number | null
  upperBound: number | null
  cycleKm: number | null
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const deleteMutation = useDeleteServiceRecordMutation(itemId)

  function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true)
      setTimeout(() => setConfirmDelete(false), 3000)
      return
    }
    deleteMutation.mutate(record.id)
  }

  return (
    <div className="py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium tabular-nums">
            {record.mileage.toLocaleString('ru')} км
          </p>
          <p className="text-xs text-muted-foreground">
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
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {confirmDelete ? (
              <span className="text-destructive">Точно?</span>
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

export function ServiceTimeline({ itemId }: { itemId: string }) {
  const { data: records, isLoading } = useServiceRecordsQuery(itemId)

  if (isLoading) {
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
          <p className="text-sm text-muted-foreground">Замен пока не было</p>
        </CardContent>
      </Card>
    )
  }

  // records are ordered newest mileage first
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <History className="h-4 w-4" /> История замен
        </CardTitle>
      </CardHeader>
      <CardContent className="divide-y pt-0">
        {records.map((record, index) => {
          const older = records[index + 1]
          const newer = records[index - 1]
          const cycleKm = older ? record.mileage - older.mileage : null
          return (
            <TimelineRow
              key={record.id}
              itemId={itemId}
              record={record}
              lowerBound={older?.mileage ?? null}
              upperBound={newer?.mileage ?? null}
              cycleKm={cycleKm}
            />
          )
        })}
      </CardContent>
    </Card>
  )
}

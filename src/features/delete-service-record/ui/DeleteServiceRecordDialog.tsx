'use client'

import { useState, type ReactNode } from 'react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  type ServiceRecord,
  useDeleteServiceRecordMutation,
  useServiceRecordPairQuery,
} from '@entities/service-record'

interface DeleteServiceRecordDialogProps {
  itemId: string
  itemName: string
  record: ServiceRecord
  /**
   * Reported upwards rather than shown here: deleting the record removes the row
   * this dialog lives in, so anything rendered inside it is unmounted by the list
   * refetch before it can be read. `extended` marks a message that says more than
   * "deleted" and so needs longer on screen.
   */
  onDeleted: (message: { text: string; extended: boolean }) => void
  trigger?: ReactNode
}

export function DeleteServiceRecordDialog({
  itemId,
  itemName,
  record,
  onDeleted,
  trigger,
}: DeleteServiceRecordDialogProps) {
  const [open, setOpen] = useState(false)
  const [deleteMileageLog, setDeleteMileageLog] = useState(false)

  const mutation = useDeleteServiceRecordMutation(itemId)
  // Whether a mileage point is paired with this record depends on the mileage
  // history, which the record list does not carry — so it is asked for only while
  // the confirmation is actually open.
  const {
    data: pair,
    isLoading: pairLoading,
    isError: pairFailed,
  } = useServiceRecordPairQuery(record.id, open)

  function onOpenChange(next: boolean) {
    setOpen(next)
    if (next) setDeleteMileageLog(false)
  }

  function onDelete() {
    mutation.mutate(
      { id: record.id, deleteMileageLog },
      {
        onSuccess: (result) => {
          const parts = ['Замена удалена.']

          // Asked for but not carried out: between opening this dialog and
          // confirming, the point stopped matching, so the server left it alone.
          if (deleteMileageLog && result.pair !== 'deleted') {
            parts.push('Запись пробега определить не удалось — она осталась в истории.')
          }

          if (result.currentMileageChanged) {
            parts.push(`Пробег пересчитан: ${result.currentMileage.toLocaleString('ru')} км`)
          }

          onDeleted({ text: parts.join(' '), extended: parts.length > 1 })
          setOpen(false)
        },
      }
    )
  }

  const showCheckbox = pair?.found === true

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger ?? <Button size="sm">Удалить</Button>}</DialogTrigger>
      <DialogContent className="sm:max-w-md" onClick={(event) => event.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>Удалить замену?</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {itemName} · {record.mileage.toLocaleString('ru')} км ·{' '}
            {format(new Date(record.date), 'd MMMM', { locale: ru })}
          </p>

          {pairLoading && <div className="h-14 rounded-md skeleton" />}

          {pairFailed && (
            <p className="text-xs text-muted-foreground">
              Не удалось проверить связанную запись пробега — она останется в истории.
            </p>
          )}

          {showCheckbox && (
            <div className="rounded-md border p-3">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 flex-shrink-0 accent-destructive"
                  checked={deleteMileageLog}
                  onChange={(event) => setDeleteMileageLog(event.target.checked)}
                />
                <span className="text-sm">Удалить и запись пробега</span>
              </label>
              <p className="text-xs text-muted-foreground mt-1.5 ml-[1.625rem]">
                Иначе точка {record.mileage.toLocaleString('ru')} км останется в истории как
                обычная запись пробега.
              </p>
              {pair.lowersCurrentMileage && (
                <p className="text-xs mt-2 ml-[1.625rem]" style={{ color: 'hsl(var(--status-soon))' }}>
                  Это последняя запись — текущий пробег уменьшится:{' '}
                  <span className="tabular-nums">
                    {pair.currentMileage.toLocaleString('ru')} →{' '}
                    {pair.mileageAfterDelete.toLocaleString('ru')}
                  </span>
                </p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={onDelete}
              disabled={mutation.isPending || pairLoading}
            >
              {mutation.isPending ? 'Удаление...' : 'Удалить'}
            </Button>
          </div>

        {mutation.error && (
          <p className="text-sm text-destructive">{mutation.error.message}</p>
        )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

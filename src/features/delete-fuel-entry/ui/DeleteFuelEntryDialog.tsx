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
  useDeleteFuelEntryMutation,
  useFuelEntryPairQuery,
  type FuelEntry,
} from '@entities/fuel-entry'

interface DeleteFuelEntryDialogProps {
  entry: FuelEntry
  /**
   * Reported upwards rather than shown here: the dialog is unmounted with the
   * page it sits on as soon as the delete lands.
   */
  onDeleted: (message: string) => void
  trigger?: ReactNode
}

/**
 * The same choice deleting a service record offers, for the same reason: the
 * fill-up is gone, but the odometer really did read that number on that day, and
 * whether that point stays in the history is the user's call, not ours.
 */
export function DeleteFuelEntryDialog({
  entry,
  onDeleted,
  trigger,
}: DeleteFuelEntryDialogProps) {
  const [open, setOpen] = useState(false)
  const [deleteMileageLog, setDeleteMileageLog] = useState(false)

  const mutation = useDeleteFuelEntryMutation()
  const {
    data: pair,
    isLoading: pairLoading,
    isError: pairFailed,
  } = useFuelEntryPairQuery(entry.id, open)

  function onOpenChange(next: boolean) {
    setOpen(next)
    if (next) setDeleteMileageLog(false)
  }

  function onDelete() {
    mutation.mutate(
      { id: entry.id, deleteMileageLog },
      {
        onSuccess: (result) => {
          const parts = ['Заправка удалена.']

          // Asked for but not carried out: between opening this dialog and
          // confirming, the point stopped matching, so the server left it alone.
          if (deleteMileageLog && result.pair !== 'deleted') {
            parts.push('Запись пробега определить не удалось — она осталась в истории.')
          }
          if (result.currentMileageChanged) {
            parts.push(`Пробег пересчитан: ${result.currentMileage.toLocaleString('ru')} км`)
          }

          onDeleted(parts.join(' '))
          setOpen(false)
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger ?? <Button size="sm">Удалить</Button>}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Удалить заправку?</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-muted-foreground text-sm">
            {entry.liters.toLocaleString('ru')} л ·{' '}
            {entry.totalCost.toLocaleString('ru')} ₽ ·{' '}
            {format(new Date(entry.date), 'd MMMM yyyy', { locale: ru })}
          </p>

          <p className="text-muted-foreground text-xs">
            Расход между заправками пересчитается: соседний промежуток может стать
            непосчитуемым.
          </p>

          {pairLoading && <div className="skeleton h-14 rounded-md" />}

          {pairFailed && (
            <p className="text-muted-foreground text-xs">
              Не удалось проверить связанную запись пробега — она останется в истории.
            </p>
          )}

          {pair?.found === true && (
            <div className="rounded-md border p-3">
              <label className="flex cursor-pointer items-start gap-2.5">
                <input
                  type="checkbox"
                  className="accent-destructive mt-0.5 h-4 w-4 flex-shrink-0"
                  checked={deleteMileageLog}
                  onChange={(event) => setDeleteMileageLog(event.target.checked)}
                />
                <span className="text-sm">Удалить и запись пробега</span>
              </label>
              <p className="text-muted-foreground mt-1.5 ml-[1.625rem] text-xs">
                Иначе точка {pair.log!.mileage.toLocaleString('ru')} км останется в истории как
                обычная запись пробега.
              </p>
              {pair.lowersCurrentMileage && (
                <p
                  className="mt-2 ml-[1.625rem] text-xs"
                  style={{ color: 'hsl(var(--status-soon))' }}
                >
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
            <p className="text-destructive text-sm">{mutation.error.message}</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

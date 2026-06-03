'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { format } from 'date-fns'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useLogMileageMutation, useUpdateMileageLogMutation } from '@entities/mileage-log'
import { logMileageSchema, type LogMileageFormValues } from '../model/schema'
import type { MileageLog } from '@entities/mileage-log'

const LARGE_JUMP_THRESHOLD = 1000

interface LogMileageDialogProps {
  currentMileage: number
  trigger?: ReactNode
  editLog?: MileageLog
  onClose?: () => void
}

export function LogMileageDialog({
  currentMileage,
  trigger,
  editLog,
  onClose,
}: LogMileageDialogProps) {
  const isEdit = !!editLog
  const [open, setOpen] = useState(!trigger && isEdit ? true : false)
  const [pendingValues, setPendingValues] = useState<LogMileageFormValues | null>(null)

  const createMutation = useLogMileageMutation()
  const updateMutation = useUpdateMileageLogMutation()
  const mutation = isEdit ? updateMutation : createMutation

  const defaultDate = editLog
    ? format(new Date(editLog.recordedAt), "yyyy-MM-dd'T'HH:mm").slice(0, 10)
    : format(new Date(), "yyyy-MM-dd")

  const form = useForm<LogMileageFormValues>({
    resolver: zodResolver(logMileageSchema),
    defaultValues: {
      mileage: isEdit ? editLog.mileage : currentMileage,
      note: isEdit ? (editLog.note ?? '') : '',
      recordedAt: defaultDate,
    },
  })

  function handleClose() {
    setOpen(false)
    form.reset()
    onClose?.()
  }

  function onSubmit(values: LogMileageFormValues) {
    const prevMileage = isEdit ? editLog.mileage : currentMileage
    const jump = values.mileage - prevMileage

    if (jump >= LARGE_JUMP_THRESHOLD) {
      setPendingValues(values)
      return
    }

    submitValues(values)
  }

  function submitValues(values: LogMileageFormValues) {
    if (isEdit) {
      const recordedAt = values.recordedAt
        ? new Date(values.recordedAt).toISOString()
        : undefined
      ;(mutation as typeof updateMutation).mutate(
        {
          id: editLog.id,
          data: {
            mileage: values.mileage,
            note: values.note || null,
            recordedAt,
          },
        },
        {
          onSuccess: () => handleClose(),
        }
      )
    } else {
      ;(mutation as typeof createMutation).mutate(
        { mileage: values.mileage, note: values.note },
        {
          onSuccess: () => handleClose(),
        }
      )
    }
    setPendingValues(null)
  }

  const dialogContent = (
    <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto mx-4">
      <DialogHeader>
        <DialogTitle>{isEdit ? 'Редактировать запись' : 'Обновить пробег'}</DialogTitle>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="mileage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Пробег (км)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder={String(isEdit ? editLog.mileage : currentMileage)}
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="recordedAt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Дата записи</FormLabel>
                <FormControl>
                  <Input type="date" {...field} value={field.value ?? defaultDate} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="note"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Заметка (необязательно)</FormLabel>
                <FormControl>
                  <textarea
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                    placeholder="Например: после поездки в Москву"
                    {...field}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Отмена
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </div>
          {mutation.isError && (
            <p className="text-sm text-destructive">
              {mutation.error?.message ?? 'Ошибка сохранения'}
            </p>
          )}
        </form>
      </Form>
    </DialogContent>
  )

  return (
    <>
      {trigger ? (
        <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true) }}>
          <DialogTrigger asChild>{trigger}</DialogTrigger>
          {dialogContent}
        </Dialog>
      ) : (
        <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true) }}>
          {dialogContent}
        </Dialog>
      )}

      <AlertDialog open={!!pendingValues} onOpenChange={(v) => { if (!v) setPendingValues(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Большой скачок пробега</AlertDialogTitle>
            <AlertDialogDescription>
              Вы вводите пробег{' '}
              <span className="font-semibold">
                {pendingValues?.mileage.toLocaleString('ru')} км
              </span>
              {' '}— это на{' '}
              <span className="font-semibold">
                {pendingValues
                  ? (pendingValues.mileage - (isEdit ? editLog.mileage : currentMileage)).toLocaleString('ru')
                  : 0}{' '}
                км
              </span>{' '}
              больше текущего. Всё верно?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Исправить</AlertDialogCancel>
            <AlertDialogAction onClick={() => pendingValues && submitValues(pendingValues)}>
              Да, всё верно
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

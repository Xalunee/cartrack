'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

import { Button } from '@/components/ui/button'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ApiError } from '@shared/api/client'
import { isBigJump, LARGE_JUMP_THRESHOLD } from '@shared/lib/calculations/mileage-validation'
import {
  useLogMileageMutation,
  useUpdateMileageLogMutation,
  useMileageQuery,
} from '@entities/mileage-log'
import {
  logMileageSchema,
  currentMileageSchema,
  historyMileageSchema,
  type LogMileageFormValues,
  type CurrentMileageFormValues,
  type HistoryMileageFormValues,
} from '../model/schema'
import type { MileageLog } from '@entities/mileage-log'

function findDateNeighbours(logs: MileageLog[], recordedAt: Date) {
  const sorted = [...logs].sort(
    (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
  )
  let prev: MileageLog | undefined
  let next: MileageLog | undefined
  for (const log of sorted) {
    const t = new Date(log.recordedAt).getTime()
    if (t <= recordedAt.getTime()) prev = log
    else if (!next) next = log
  }
  return { prev, next }
}

/** Instant client-side mirror of the server's monotonicity check — the server remains the source of truth. */
function clientValidateHistoryPoint(
  logs: MileageLog[],
  mileage: number,
  recordedAt: Date
): { ok: true } | { ok: false; message: string; suggestion: string } {
  const { prev, next } = findDateNeighbours(logs, recordedAt)

  if (prev && mileage < prev.mileage) {
    return {
      ok: false,
      message: `На ${format(new Date(prev.recordedAt), 'd MMM yyyy', { locale: ru })} уже есть запись ${prev.mileage.toLocaleString('ru')} км.`,
      suggestion:
        'Значение не может быть меньше — одометр не крутится назад. Проверьте число или дату.',
    }
  }
  if (next && mileage > next.mileage) {
    return {
      ok: false,
      message: `На ${format(new Date(next.recordedAt), 'd MMM yyyy', { locale: ru })} уже есть запись ${next.mileage.toLocaleString('ru')} км.`,
      suggestion:
        'Значение не может быть больше — одометр не крутится назад. Проверьте число или дату.',
    }
  }
  return { ok: true }
}

/**
 * Everything inside LogMileageDialog that costs bundle weight: two react-hook-form
 * instances, the zod resolvers and the three schemas. It is loaded when the dialog
 * opens and mounted only while it is, so each open starts from clean defaults.
 *
 * The big-jump confirmation lives here too — it is driven by form submission and
 * portals to the body, so nesting it under the dialog changes nothing on screen.
 */
export function LogMileageDialogBody({
  currentMileage,
  editLog,
  onDone,
}: {
  currentMileage: number
  editLog?: MileageLog
  onDone: () => void
}) {
  if (editLog) {
    return <EditMileageBody editLog={editLog} onDone={onDone} />
  }
  return <CreateMileageBody currentMileage={currentMileage} onDone={onDone} />
}

function CreateMileageBody({
  currentMileage,
  onDone,
}: {
  currentMileage: number
  onDone: () => void
}) {
  const [tab, setTab] = useState<'current' | 'history'>('current')
  const [pendingValues, setPendingValues] = useState<CurrentMileageFormValues | null>(null)
  const [historyError, setHistoryError] = useState<{ message: string; suggestion: string } | null>(
    null
  )

  const createMutation = useLogMileageMutation()
  const { data } = useMileageQuery()
  const logs = data?.logs ?? []

  const today = format(new Date(), 'yyyy-MM-dd')

  const currentForm = useForm<CurrentMileageFormValues>({
    resolver: zodResolver(currentMileageSchema),
    defaultValues: { mileage: currentMileage, note: '' },
  })

  const historyForm = useForm<HistoryMileageFormValues>({
    resolver: zodResolver(historyMileageSchema),
    defaultValues: { mileage: currentMileage, recordedAt: today, note: '' },
  })

  const handleClose = onDone

  function onSubmitCurrent(values: CurrentMileageFormValues) {
    const { big } = isBigJump(values.mileage, currentMileage, LARGE_JUMP_THRESHOLD)
    if (big) {
      setPendingValues(values)
      return
    }
    submitCurrent(values)
  }

  function submitCurrent(values: CurrentMileageFormValues) {
    createMutation.mutate(
      { mileage: values.mileage, note: values.note },
      { onSuccess: () => handleClose() }
    )
    setPendingValues(null)
  }

  function onSubmitHistory(values: HistoryMileageFormValues) {
    setHistoryError(null)
    const recordedAt = new Date(values.recordedAt)
    const check = clientValidateHistoryPoint(logs, values.mileage, recordedAt)
    if (!check.ok) {
      setHistoryError(check)
      return
    }

    createMutation.mutate(
      { mileage: values.mileage, note: values.note, recordedAt: recordedAt.toISOString() },
      {
        onSuccess: () => handleClose(),
        onError: (err) => {
          if (err instanceof ApiError) {
            setHistoryError({ message: err.message, suggestion: err.suggestion ?? '' })
          }
        },
      }
    )
  }

  return (
    <>
      <Tabs value={tab} onValueChange={(v) => setTab(v as 'current' | 'history')}>
        <TabsList className="w-full">
          <TabsTrigger value="current" className="flex-1">
            Текущий пробег
          </TabsTrigger>
          <TabsTrigger value="history" className="flex-1">
            Добавить в историю
          </TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="pt-4">
          <Form {...currentForm}>
            <form onSubmit={currentForm.handleSubmit(onSubmitCurrent)} className="space-y-4">
              <FormField
                control={currentForm.control}
                name="mileage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Пробег (км)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder={String(currentMileage)}
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <p className="text-muted-foreground text-xs">
                      Запись будет сохранена сегодняшним числом
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={currentForm.control}
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Заметка (необязательно)</FormLabel>
                    <FormControl>
                      <textarea
                        className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full resize-none rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
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
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Сохранение...' : 'Сохранить'}
                </Button>
              </div>
              {createMutation.isError && tab === 'current' && (
                <p className="text-destructive text-sm">
                  {createMutation.error?.message ?? 'Ошибка сохранения'}
                </p>
              )}
            </form>
          </Form>
        </TabsContent>

        <TabsContent value="history" className="pt-4">
          <Form {...historyForm}>
            <form onSubmit={historyForm.handleSubmit(onSubmitHistory)} className="space-y-4">
              <p className="text-muted-foreground -mt-1 text-xs">
                Для восстановления пропущенных записей. Текущий пробег не изменится.
              </p>
              <FormField
                control={historyForm.control}
                name="mileage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Пробег (км)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={historyForm.control}
                name="recordedAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Дата</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={historyForm.control}
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Заметка (необязательно)</FormLabel>
                    <FormControl>
                      <textarea
                        className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full resize-none rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
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
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Сохранение...' : 'Сохранить'}
                </Button>
              </div>
              {historyError && (
                <div className="text-destructive space-y-0.5 text-sm">
                  <p>{historyError.message}</p>
                  {historyError.suggestion && <p>{historyError.suggestion}</p>}
                </div>
              )}
            </form>
          </Form>
        </TabsContent>
      </Tabs>

      <AlertDialog
        open={!!pendingValues}
        onOpenChange={(v) => {
          if (!v) setPendingValues(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Большой скачок пробега</AlertDialogTitle>
            <AlertDialogDescription>
              Вы вводите пробег{' '}
              <span className="font-semibold">
                {pendingValues?.mileage.toLocaleString('ru')} км
              </span>{' '}
              — это на{' '}
              <span className="font-semibold">
                {pendingValues ? (pendingValues.mileage - currentMileage).toLocaleString('ru') : 0}{' '}
                км
              </span>{' '}
              больше текущего. Всё верно?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Исправить</AlertDialogCancel>
            <AlertDialogAction onClick={() => pendingValues && submitCurrent(pendingValues)}>
              Да, всё верно
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function EditMileageBody({ editLog, onDone }: { editLog: MileageLog; onDone: () => void }) {
  const [pendingValues, setPendingValues] = useState<LogMileageFormValues | null>(null)
  const updateMutation = useUpdateMileageLogMutation()

  const defaultDate = format(new Date(editLog.recordedAt), "yyyy-MM-dd'T'HH:mm").slice(0, 10)

  const form = useForm<LogMileageFormValues>({
    resolver: zodResolver(logMileageSchema),
    defaultValues: {
      mileage: editLog.mileage,
      note: editLog.note ?? '',
      recordedAt: defaultDate,
    },
  })

  const handleClose = onDone

  function onSubmit(values: LogMileageFormValues) {
    const jump = values.mileage - editLog.mileage
    if (jump >= LARGE_JUMP_THRESHOLD) {
      setPendingValues(values)
      return
    }
    submitValues(values)
  }

  function submitValues(values: LogMileageFormValues) {
    const recordedAt = values.recordedAt ? new Date(values.recordedAt).toISOString() : undefined
    updateMutation.mutate(
      {
        id: editLog.id,
        data: { mileage: values.mileage, note: values.note || null, recordedAt },
      },
      { onSuccess: () => handleClose() }
    )
    setPendingValues(null)
  }

  return (
    <>
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
                    placeholder={String(editLog.mileage)}
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
                    className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full resize-none rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
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
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </div>
          {updateMutation.isError && (
            <p className="text-destructive text-sm">
              {updateMutation.error?.message ?? 'Ошибка сохранения'}
            </p>
          )}
        </form>
      </Form>

      <AlertDialog
        open={!!pendingValues}
        onOpenChange={(v) => {
          if (!v) setPendingValues(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Большой скачок пробега</AlertDialogTitle>
            <AlertDialogDescription>
              Вы вводите пробег{' '}
              <span className="font-semibold">
                {pendingValues?.mileage.toLocaleString('ru')} км
              </span>{' '}
              — это на{' '}
              <span className="font-semibold">
                {pendingValues ? (pendingValues.mileage - editLog.mileage).toLocaleString('ru') : 0}{' '}
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

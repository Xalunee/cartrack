'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useCompleteServiceMutation } from '@entities/service-record'
import { ApiError } from '@shared/api/client'
import { createCompleteServiceSchema, type CompleteServiceFormValues } from '../model/schema'

function todayIso() {
  return new Date().toISOString().split('T')[0]
}

/**
 * The body of CompleteServiceDialog: the form and the confirmation that replaces
 * it. Split out so react-hook-form, the zod resolver and the schema load on open
 * rather than on first paint. Mounted only while the dialog is open, so defaults
 * are fresh each time and no reset on open is needed.
 */
export function CompleteServiceDialogForm({
  itemId,
  prevMileage,
  currentMileage,
  onDone,
}: {
  itemId: string
  prevMileage: number
  currentMileage: number
  onDone: () => void
}) {
  const [confirmation, setConfirmation] = useState<{ text: string; closeAfterMs: number } | null>(
    null
  )

  // The confirmation closes the dialog on a timer. Owning that timer in an effect
  // ties it to the message it belongs to: clearing or replacing the confirmation,
  // and unmounting, all cancel it. A loose setTimeout would survive a close and
  // fire into a dialog the user had since reopened, shutting it over fresh input.
  useEffect(() => {
    if (!confirmation) return
    const timer = setTimeout(onDone, confirmation.closeAfterMs)
    return () => clearTimeout(timer)
  }, [confirmation, onDone])

  const mutation = useCompleteServiceMutation(itemId)

  const schema = createCompleteServiceSchema(prevMileage)
  const form = useForm<CompleteServiceFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      mileage: currentMileage,
      date: todayIso(),
      cost: undefined,
      notes: '',
    },
  })

  function onSubmit(values: CompleteServiceFormValues) {
    mutation.mutate(
      { ...values, date: new Date(values.date).toISOString() },
      {
        onSuccess: (updated) => {
          const forecast = updated.resource.forecastDate
            ? format(new Date(updated.resource.forecastDate), 'd MMM yyyy', { locale: ru })
            : updated.resource.remainingKm !== null && updated.resource.remainingKm > 0
              ? `через ${updated.resource.remainingKm.toLocaleString('ru')} км`
              : null

          const advanced = values.mileage > currentMileage
          const advancedNote = advanced
            ? `Текущий пробег обновлён: ${values.mileage.toLocaleString('ru')} км.`
            : null

          const base = [
            'Записано.',
            advancedNote,
            forecast ? `Следующая замена ~${forecast}` : null,
          ]
            .filter(Boolean)
            .join(' ')

          setConfirmation({
            text: updated.mileageLogWarning ? `${base}\n${updated.mileageLogWarning}` : base,
            closeAfterMs: updated.mileageLogWarning ? 2400 : 1200,
          })
        },
      }
    )
  }

  return (
    <>
      {confirmation ? (
        <p className="py-4 text-sm whitespace-pre-line" style={{ color: 'hsl(var(--status-ok))' }}>
          {confirmation.text}
        </p>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="mileage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Пробег замены (км)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      value={field.value ?? ''}
                      onChange={(event) =>
                        field.onChange(event.target.value ? Number(event.target.value) : undefined)
                      }
                    />
                  </FormControl>
                  <p className="text-muted-foreground text-xs">Пробег на момент замены</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Дата</FormLabel>
                  <FormControl>
                    <Input type="date" className="w-full min-w-0 text-sm" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Стоимость (₽)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="4500"
                      {...field}
                      value={field.value ?? ''}
                      onChange={(event) =>
                        field.onChange(event.target.value ? Number(event.target.value) : undefined)
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Заметка</FormLabel>
                  <FormControl>
                    <textarea
                      className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full resize-none rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Использовано масло 5W-30..."
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onDone}>
                Отмена
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Сохранение...' : 'Заменил'}
              </Button>
            </div>

            {mutation.error && (
              <div className="text-destructive space-y-0.5 text-sm">
                <p>{mutation.error.message ?? 'Ошибка'}</p>
                {mutation.error instanceof ApiError && mutation.error.suggestion && (
                  <p className="text-xs">{mutation.error.suggestion}</p>
                )}
              </div>
            )}
          </form>
        </Form>
      )}
    </>
  )
}

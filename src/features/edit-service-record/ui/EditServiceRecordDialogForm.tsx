'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

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
import { type ServiceRecord, useUpdateServiceRecordMutation } from '@entities/service-record'
import { createEditServiceRecordSchema, type EditServiceRecordFormValues } from '../model/schema'

/**
 * The body of EditServiceRecordDialog: the form and the confirmation that
 * replaces it. Split out so react-hook-form, the zod resolver and the schema
 * load on open. Mounted only while open, so defaults come fresh from `record`.
 */
export function EditServiceRecordDialogForm({
  itemId,
  record,
  lowerBound,
  upperBound,
  onDone,
}: {
  itemId: string
  record: ServiceRecord
  lowerBound: number | null
  upperBound: number | null
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

  const mutation = useUpdateServiceRecordMutation(itemId)

  const schema = createEditServiceRecordSchema(lowerBound, upperBound)
  const form = useForm<EditServiceRecordFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      mileage: record.mileage,
      date: new Date(record.date).toISOString().split('T')[0],
      cost: record.cost ?? undefined,
      notes: record.notes ?? '',
    },
  })

  function onSubmit(values: EditServiceRecordFormValues) {
    mutation.mutate(
      {
        id: record.id,
        data: { ...values, date: new Date(values.date).toISOString() },
      },
      {
        // Same shape as the complete dialog: the record is saved either way, but
        // when the paired mileage point could not be matched the user has to be
        // told, or they walk away from a desync the server already spotted.
        onSuccess: (updated) => {
          setConfirmation({
            text: updated.mileageLogWarning
              ? `Сохранено.\n${updated.mileageLogWarning}`
              : 'Сохранено.',
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
                  <FormLabel>Пробег (км)</FormLabel>
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
                {mutation.isPending ? 'Сохранение...' : 'Сохранить'}
              </Button>
            </div>

            {mutation.error && (
              <p className="text-destructive text-sm">{mutation.error.message ?? 'Ошибка'}</p>
            )}
          </form>
        </Form>
      )}
    </>
  )
}

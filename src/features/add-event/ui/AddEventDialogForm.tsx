'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useQueryClient } from '@tanstack/react-query'

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
import { apiClient } from '@shared/api/client'
import { CarEvent, useUpdateEventMutation } from '@entities/event'
import { addEventSchema, type AddEventFormValues } from '../model/schema'
import { eventTypeLabels } from '../model/eventTypes'

const EVENT_QUERY_KEY = ['events'] as const

/**
 * The body of AddEventDialog. Split out so react-hook-form, the zod resolver and
 * the schema load on open. Mounted only while the dialog is open, so defaults are
 * read fresh from `event` each time and the reset-on-open effect is unnecessary.
 */
export function AddEventDialogForm({ event, onDone }: { event?: CarEvent; onDone: () => void }) {
  const queryClient = useQueryClient()
  const updateMutation = useUpdateEventMutation()
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isEdit = !!event

  const form = useForm<AddEventFormValues>({
    resolver: zodResolver(addEventSchema),
    defaultValues: {
      type: event?.type ?? 'NOTE',
      title: event?.title ?? '',
      description: event?.description ?? '',
      cost: event?.cost ?? undefined,
      occurredAt: event?.occurredAt
        ? new Date(event.occurredAt).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
    },
  })

  async function onSubmit(values: AddEventFormValues) {
    setIsPending(true)
    setError(null)
    try {
      const payload = {
        ...values,
        occurredAt: values.occurredAt ? new Date(values.occurredAt).toISOString() : undefined,
      }

      if (isEdit && event) {
        await updateMutation.mutateAsync({ id: event.id, data: payload })
      } else {
        await apiClient('/api/events', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
        queryClient.invalidateQueries({ queryKey: EVENT_QUERY_KEY })
      }
      onDone()
    } catch (eventError: unknown) {
      setError(eventError instanceof Error ? eventError.message : 'Ошибка сохранения')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Тип</FormLabel>
              <FormControl>
                <select
                  className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
                  {...field}
                >
                  {Object.entries(eventTypeLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Название</FormLabel>
              <FormControl>
                <Input placeholder="Пробил колесо на трассе" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Описание (необязательно)</FormLabel>
              <FormControl>
                <textarea
                  className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full resize-none rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Подробности..."
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="cost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Стоимость (₽)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="0"
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
            name="occurredAt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Дата</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    className="w-full min-w-0 text-sm"
                    {...field}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onDone}>
            Отмена
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Сохранение...' : isEdit ? 'Сохранить' : 'Добавить'}
          </Button>
        </div>
        {error && <p className="text-destructive text-sm">{error}</p>}
      </form>
    </Form>
  )
}

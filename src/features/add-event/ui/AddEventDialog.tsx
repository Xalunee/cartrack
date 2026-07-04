'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { useQueryClient } from '@tanstack/react-query'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
import {
  addEventSchema,
  type AddEventFormValues,
  eventTypeLabels,
} from '../model/schema'

const EVENT_QUERY_KEY = ['events'] as const

interface AddEventDialogProps {
  trigger?: ReactNode
  event?: CarEvent
}

export function AddEventDialog({ trigger, event }: AddEventDialogProps) {
  const [open, setOpen] = useState(false)
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

  useEffect(() => {
    if (open) {
      form.reset({
        type: event?.type ?? 'NOTE',
        title: event?.title ?? '',
        description: event?.description ?? '',
        cost: event?.cost ?? undefined,
        occurredAt: event?.occurredAt
          ? new Date(event.occurredAt).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
      })
    }
  }, [open, event, form])

  async function onSubmit(values: AddEventFormValues) {
    setIsPending(true)
    setError(null)
    try {
      const payload = {
        ...values,
        occurredAt: values.occurredAt
          ? new Date(values.occurredAt).toISOString()
          : undefined,
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
      setOpen(false)
      if (!isEdit) form.reset()
    } catch (eventError: unknown) {
      setError(
        eventError instanceof Error ? eventError.message : 'Ошибка сохранения'
      )
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? <Button variant="default">Добавить событие</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Редактировать событие' : 'Новое событие'}</DialogTitle>
        </DialogHeader>
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
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
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
                          field.onChange(
                            event.target.value
                              ? Number(event.target.value)
                              : undefined
                          )
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
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Отмена
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Сохранение...' : isEdit ? 'Сохранить' : 'Добавить'}
              </Button>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

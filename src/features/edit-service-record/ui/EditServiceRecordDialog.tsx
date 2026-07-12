'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'

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
import { type ServiceRecord, useUpdateServiceRecordMutation } from '@entities/service-record'
import { createEditServiceRecordSchema, type EditServiceRecordFormValues } from '../model/schema'

interface EditServiceRecordDialogProps {
  itemId: string
  record: ServiceRecord
  lowerBound: number | null
  upperBound: number | null
  trigger?: ReactNode
}

export function EditServiceRecordDialog({
  itemId,
  record,
  lowerBound,
  upperBound,
  trigger,
}: EditServiceRecordDialogProps) {
  const [open, setOpen] = useState(false)
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

  function onOpenChange(next: boolean) {
    setOpen(next)
    if (next) {
      form.reset({
        mileage: record.mileage,
        date: new Date(record.date).toISOString().split('T')[0],
        cost: record.cost ?? undefined,
        notes: record.notes ?? '',
      })
    }
  }

  function onSubmit(values: EditServiceRecordFormValues) {
    mutation.mutate(
      {
        id: record.id,
        data: { ...values, date: new Date(values.date).toISOString() },
      },
      { onSuccess: () => setOpen(false) }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger ?? <Button size="sm">Редактировать</Button>}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Редактировать замену</DialogTitle>
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
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Отмена
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Сохранение...' : 'Сохранить'}
              </Button>
            </div>

            {mutation.error && (
              <p className="text-sm text-destructive">{mutation.error.message ?? 'Ошибка'}</p>
            )}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

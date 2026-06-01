'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState, type ReactNode } from 'react'
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
import { Separator } from '@/components/ui/separator'
import {
  type MaintenanceItem,
  useCreateMaintenanceMutation,
  useUpdateMaintenanceMutation,
} from '@entities/maintenance-item'
import { maintenanceSchema, type MaintenanceFormValues } from '../model/schema'

interface MaintenanceDialogProps {
  item?: MaintenanceItem
  trigger?: ReactNode
}

export function MaintenanceDialog({ item, trigger }: MaintenanceDialogProps) {
  const [open, setOpen] = useState(false)
  const createMutation = useCreateMaintenanceMutation()
  const updateMutation = useUpdateMaintenanceMutation()
  const isEdit = !!item

  const form = useForm<MaintenanceFormValues>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: {
      name: item?.name ?? '',
      intervalKm: item?.intervalKm ?? undefined,
      intervalDays: item?.intervalDays ?? undefined,
      lastServiceMileage: item?.lastServiceMileage ?? undefined,
      lastServiceDate: item?.lastServiceDate
        ? new Date(item.lastServiceDate).toISOString().split('T')[0]
        : '',
      lastServiceCost: item?.lastServiceCost ?? undefined,
      lastServiceNotes: item?.lastServiceNotes ?? '',
    },
  })

  useEffect(() => {
    if (open && item) {
      form.reset({
        name: item.name,
        intervalKm: item.intervalKm ?? undefined,
        intervalDays: item.intervalDays ?? undefined,
        lastServiceMileage: item.lastServiceMileage ?? undefined,
        lastServiceDate: item.lastServiceDate
          ? new Date(item.lastServiceDate).toISOString().split('T')[0]
          : '',
        lastServiceCost: item.lastServiceCost ?? undefined,
        lastServiceNotes: item.lastServiceNotes ?? '',
      })
    }
  }, [open, item, form])

  function onSubmit(values: MaintenanceFormValues) {
    const payload = {
      ...values,
      lastServiceDate: values.lastServiceDate
        ? new Date(values.lastServiceDate).toISOString()
        : undefined,
    }

    if (isEdit && item) {
      updateMutation.mutate(
        { id: item.id, data: payload },
        {
          onSuccess: () => {
            setOpen(false)
          },
        }
      )
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          setOpen(false)
          form.reset()
        },
      })
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending
  const error = createMutation.error || updateMutation.error

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant={isEdit ? 'ghost' : 'default'}>
            {isEdit ? 'Редактировать' : 'Добавить позицию'}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Редактировать' : 'Добавить позицию обслуживания'}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Название</FormLabel>
                  <FormControl>
                    <Input placeholder="Замена масла" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />
            <p className="text-sm font-medium text-muted-foreground">
              Интервал замены
            </p>

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="intervalKm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Каждые (км)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="10000"
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
                name="intervalDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Каждые (дней)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="365"
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
            </div>

            <Separator />
            <p className="text-sm font-medium text-muted-foreground">
              Последняя замена
            </p>

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="lastServiceMileage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Пробег (км)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="85000"
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
                name="lastServiceDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Дата</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="lastServiceCost"
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
              name="lastServiceNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Заметки</FormLabel>
                  <FormControl>
                    <textarea
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
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
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Отмена
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Сохранение...' : isEdit ? 'Сохранить' : 'Добавить'}
              </Button>
            </div>

            {error && (
              <p className="text-sm text-destructive">
                {error.message ?? 'Ошибка'}
              </p>
            )}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useCompleteServiceMutation } from '@entities/service-record'
import { createCompleteServiceSchema, type CompleteServiceFormValues } from '../model/schema'

interface CompleteServiceDialogProps {
  itemId: string
  itemName: string
  prevMileage: number
  currentMileage: number
  trigger?: ReactNode
}

function todayIso() {
  return new Date().toISOString().split('T')[0]
}

export function CompleteServiceDialog({
  itemId,
  itemName,
  prevMileage,
  currentMileage,
  trigger,
}: CompleteServiceDialogProps) {
  const [open, setOpen] = useState(false)
  const [confirmation, setConfirmation] = useState<string | null>(null)
  const mutation = useCompleteServiceMutation(itemId)

  const schema = createCompleteServiceSchema(prevMileage, currentMileage)
  const form = useForm<CompleteServiceFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      mileage: currentMileage,
      date: todayIso(),
      cost: undefined,
      notes: '',
    },
  })

  function onOpenChange(next: boolean) {
    setOpen(next)
    if (next) {
      setConfirmation(null)
      form.reset({
        mileage: currentMileage,
        date: todayIso(),
        cost: undefined,
        notes: '',
      })
    }
  }

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

          const base = forecast ? `Записано. Следующая замена ~${forecast}` : 'Записано.'
          setConfirmation(updated.mileageLogWarning ? `${base}\n${updated.mileageLogWarning}` : base)
          setTimeout(() => setOpen(false), updated.mileageLogWarning ? 2400 : 1200)
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger ?? <Button size="sm">Заменил</Button>}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Заменил: {itemName}</DialogTitle>
        </DialogHeader>
        {confirmation ? (
          <p className="text-sm py-4 whitespace-pre-line" style={{ color: 'hsl(var(--status-ok))' }}>
            {confirmation}
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
                          field.onChange(
                            event.target.value ? Number(event.target.value) : undefined
                          )
                        }
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">Пробег на момент замены</p>
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
                          field.onChange(
                            event.target.value ? Number(event.target.value) : undefined
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
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Заметка</FormLabel>
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
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? 'Сохранение...' : 'Заменил'}
                </Button>
              </div>

              {mutation.error && (
                <p className="text-sm text-destructive">{mutation.error.message ?? 'Ошибка'}</p>
              )}
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  )
}

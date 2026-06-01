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
import { useLogMileageMutation } from '@entities/mileage-log'
import { logMileageSchema, type LogMileageFormValues } from '../model/schema'

interface LogMileageDialogProps {
  currentMileage: number
  trigger?: ReactNode
}

export function LogMileageDialog({
  currentMileage,
  trigger,
}: LogMileageDialogProps) {
  const [open, setOpen] = useState(false)
  const mutation = useLogMileageMutation()

  const form = useForm<LogMileageFormValues>({
    resolver: zodResolver(logMileageSchema),
    defaultValues: { mileage: currentMileage, note: '' },
  })

  function onSubmit(values: LogMileageFormValues) {
    mutation.mutate(values, {
      onSuccess: () => {
        setOpen(false)
        form.reset()
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? <Button variant="default">Обновить пробег</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Обновить пробег</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="mileage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Текущий пробег (км)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder={String(currentMileage)}
                      {...field}
                      onChange={(event) =>
                        field.onChange(Number(event.target.value))
                      }
                    />
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
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
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
    </Dialog>
  )
}

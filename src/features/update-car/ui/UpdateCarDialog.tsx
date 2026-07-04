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
import { type Car, useUpdateCarMutation } from '@entities/car'
import { updateCarSchema, type UpdateCarFormValues } from '../model/schema'

interface UpdateCarDialogProps {
  car: Car
  trigger?: ReactNode
}

export function UpdateCarDialog({ car, trigger }: UpdateCarDialogProps) {
  const [open, setOpen] = useState(false)
  const mutation = useUpdateCarMutation()

  const form = useForm<UpdateCarFormValues>({
    resolver: zodResolver(updateCarSchema),
    defaultValues: {
      brand: car.brand,
      model: car.model,
      year: car.year,
      licensePlate: car.licensePlate ?? '',
      currentMileage: car.currentMileage,
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        brand: car.brand,
        model: car.model,
        year: car.year,
        licensePlate: car.licensePlate ?? '',
        currentMileage: car.currentMileage,
      })
    }
  }, [open, car, form])

  function onSubmit(values: UpdateCarFormValues) {
    mutation.mutate(values, {
      onSuccess: () => setOpen(false),
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? <Button variant="outline">Редактировать</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Данные автомобиля</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="brand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Марка</FormLabel>
                    <FormControl>
                      <Input placeholder="Toyota" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Модель</FormLabel>
                    <FormControl>
                      <Input placeholder="Camry" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Год</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="2019"
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
                name="licensePlate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Госномер</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="А123БВ77"
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="currentMileage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Текущий пробег (км)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
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
                {mutation.error?.message ?? 'Ошибка'}
              </p>
            )}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

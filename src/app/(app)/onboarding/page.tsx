'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Car } from 'lucide-react'
import { apiClient } from '@shared/api/client'

const schema = z.object({
  brand: z.string().min(1, 'Введите марку'),
  model: z.string().min(1, 'Введите модель'),
  year: z
    .number()
    .int()
    .min(1900, 'Некорректный год')
    .max(new Date().getFullYear() + 1, 'Некорректный год'),
  licensePlate: z.string().optional(),
  currentMileage: z
    .number()
    .int()
    .min(0, 'Пробег не может быть отрицательным'),
})

type FormValues = z.infer<typeof schema>

export default function OnboardingPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      brand: '',
      model: '',
      year: new Date().getFullYear(),
      licensePlate: '',
      currentMileage: 0,
    },
  })

  async function onSubmit(values: FormValues) {
    setIsPending(true)
    setError(null)

    try {
      await apiClient('/api/car', {
        method: 'POST',
        body: JSON.stringify(values),
      })
      router.push('/dashboard')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка создания машины')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Car className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Добавьте свой автомобиль</CardTitle>
          <p className="text-sm text-muted-foreground">
            Заполните данные вашей машины для начала работы
          </p>
        </CardHeader>
        <CardContent>
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
                      <FormLabel>Год выпуска</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="2019"
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
                  name="licensePlate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Госномер</FormLabel>
                      <FormControl>
                        <Input placeholder="А123БВ77" {...field} value={field.value ?? ''} />
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
                        placeholder="87000"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? 'Создание...' : 'Начать'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}

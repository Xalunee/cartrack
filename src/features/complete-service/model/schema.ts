import { z } from 'zod'

export function createCompleteServiceSchema(prevMileage: number) {
  return z.object({
    mileage: z
      .number()
      .int()
      .min(prevMileage, 'Пробег замены не может быть меньше предыдущей замены'),
    date: z.string().refine((value) => new Date(value) <= new Date(), {
      message: 'Дата не может быть в будущем',
    }),
    cost: z.number().min(0).optional(),
    notes: z.string().optional(),
  })
}

export type CompleteServiceFormValues = z.infer<ReturnType<typeof createCompleteServiceSchema>>

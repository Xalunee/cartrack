import { z } from 'zod'

export const updateCarSchema = z.object({
  brand: z.string().min(1, 'Введите марку'),
  model: z.string().min(1, 'Введите модель'),
  year: z
    .number({ error: 'Введите год' })
    .int()
    .min(1900)
    .max(new Date().getFullYear() + 1),
  licensePlate: z.string().optional(),
  currentMileage: z.number().int().min(0),
})

export type UpdateCarFormValues = z.infer<typeof updateCarSchema>

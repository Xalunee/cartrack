import { z } from 'zod'

export const logMileageSchema = z.object({
  mileage: z
    .number({ error: 'Введите число' })
    .int()
    .min(0, 'Пробег не может быть отрицательным'),
  note: z.string().optional(),
})

export type LogMileageFormValues = z.infer<typeof logMileageSchema>

import { z } from 'zod'

export const logMileageSchema = z.object({
  mileage: z
    .number({ error: 'Введите число' })
    .int()
    .min(0, 'Пробег не может быть отрицательным'),
  note: z.string().optional(),
  recordedAt: z.string().optional(),
})

export type LogMileageFormValues = z.infer<typeof logMileageSchema>

export const currentMileageSchema = z.object({
  mileage: z
    .number({ error: 'Введите число' })
    .int()
    .min(0, 'Пробег не может быть отрицательным'),
  note: z.string().optional(),
})

export type CurrentMileageFormValues = z.infer<typeof currentMileageSchema>

export const historyMileageSchema = z.object({
  mileage: z
    .number({ error: 'Введите число' })
    .int()
    .min(0, 'Пробег не может быть отрицательным'),
  recordedAt: z.string().min(1, 'Укажите дату'),
  note: z.string().optional(),
})

export type HistoryMileageFormValues = z.infer<typeof historyMileageSchema>

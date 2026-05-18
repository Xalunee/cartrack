import { z } from 'zod'

export const eventTypeLabels = {
  ACCIDENT: 'Авария',
  MALFUNCTION: 'Неисправность',
  FINE: 'Штраф',
  SERVICE: 'СТО',
  NOTE: 'Заметка',
} as const

export const addEventSchema = z.object({
  type: z.enum(['ACCIDENT', 'MALFUNCTION', 'FINE', 'SERVICE', 'NOTE']),
  title: z.string().min(1, 'Введите название'),
  description: z.string().optional(),
  cost: z.number().min(0).optional(),
  occurredAt: z.string().optional(),
})

export type AddEventFormValues = z.infer<typeof addEventSchema>

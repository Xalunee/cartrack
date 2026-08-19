import { z } from 'zod'
import { costField, nameField, pastDateField, textField } from '@shared/lib/validation/limits'

export const eventTypeLabels = {
  ACCIDENT: 'Авария',
  MALFUNCTION: 'Неисправность',
  FINE: 'Штраф',
  SERVICE: 'СТО',
  NOTE: 'Заметка',
} as const

export const addEventSchema = z.object({
  type: z.enum(['ACCIDENT', 'MALFUNCTION', 'FINE', 'SERVICE', 'NOTE']),
  title: nameField('Введите название'),
  description: textField().optional(),
  cost: costField().optional(),
  occurredAt: pastDateField().optional(),
})

export type AddEventFormValues = z.infer<typeof addEventSchema>

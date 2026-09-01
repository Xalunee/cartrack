import { z } from 'zod'
import { costField, nameField, optionalPastDateField, textField } from '@shared/lib/validation/limits'

export const addEventSchema = z.object({
  type: z.enum(['ACCIDENT', 'MALFUNCTION', 'FINE', 'SERVICE', 'NOTE']),
  title: nameField('Введите название'),
  description: textField().optional(),
  cost: costField().optional(),
  occurredAt: optionalPastDateField(),
})

export type AddEventFormValues = z.infer<typeof addEventSchema>

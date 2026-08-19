import { z } from 'zod'
import { costField, mileageField, pastDateField, textField } from '@shared/lib/validation/limits'

export function createCompleteServiceSchema(prevMileage: number) {
  return z.object({
    mileage: mileageField().min(
      prevMileage,
      'Пробег замены не может быть меньше предыдущей замены'
    ),
    date: pastDateField(),
    cost: costField().optional(),
    notes: textField().optional(),
  })
}

export type CompleteServiceFormValues = z.infer<ReturnType<typeof createCompleteServiceSchema>>

import { z } from 'zod'
import { costField, mileageField, pastDateField, textField } from '@shared/lib/validation/limits'

export function createEditServiceRecordSchema(lowerBound: number | null, upperBound: number | null) {
  let mileage = mileageField()
  if (lowerBound !== null) {
    mileage = mileage.min(lowerBound + 1, 'Пробег должен быть больше предыдущей замены в истории')
  }
  if (upperBound !== null) {
    mileage = mileage.max(upperBound - 1, 'Пробег должен быть меньше следующей замены в истории')
  }

  return z.object({
    mileage,
    date: pastDateField(),
    cost: costField().optional(),
    notes: textField().optional(),
  })
}

export type EditServiceRecordFormValues = z.infer<ReturnType<typeof createEditServiceRecordSchema>>

import { z } from 'zod'

export function createEditServiceRecordSchema(lowerBound: number | null, upperBound: number | null) {
  let mileage = z.number().int()
  if (lowerBound !== null) {
    mileage = mileage.min(lowerBound + 1, 'Пробег должен быть больше предыдущей замены в истории')
  }
  if (upperBound !== null) {
    mileage = mileage.max(upperBound - 1, 'Пробег должен быть меньше следующей замены в истории')
  }

  return z.object({
    mileage,
    date: z.string(),
    cost: z.number().min(0).optional(),
    notes: z.string().optional(),
  })
}

export type EditServiceRecordFormValues = z.infer<ReturnType<typeof createEditServiceRecordSchema>>

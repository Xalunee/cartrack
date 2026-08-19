import { z } from 'zod'
import { mileageField, optionalPastDateField, pastDateField, textField } from '@shared/lib/validation/limits'

export const logMileageSchema = z.object({
  mileage: mileageField(),
  note: textField().optional(),
  recordedAt: optionalPastDateField(),
})

export type LogMileageFormValues = z.infer<typeof logMileageSchema>

export const currentMileageSchema = z.object({
  mileage: mileageField(),
  note: textField().optional(),
})

export type CurrentMileageFormValues = z.infer<typeof currentMileageSchema>

export const historyMileageSchema = z.object({
  mileage: mileageField(),
  recordedAt: pastDateField(),
  note: textField().optional(),
})

export type HistoryMileageFormValues = z.infer<typeof historyMileageSchema>

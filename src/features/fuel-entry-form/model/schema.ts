import { z } from 'zod'
import {
  costField,
  litersField,
  mileageField,
  optionalNameField,
  pastDateField,
  textField,
} from '@shared/lib/validation/limits'

/**
 * One schema for adding and for editing: the fields are the same, and a second
 * copy is a second place for a bound to drift away from the route's.
 */
export const fuelEntrySchema = z.object({
  liters: litersField(),
  totalCost: costField(),
  date: pastDateField(),
  // The number inputs hand back `undefined` when emptied, which is exactly what
  // an unrecorded odometer is.
  mileage: mileageField().optional(),
  isFullTank: z.boolean(),
  hasMissedEntry: z.boolean(),
  station: optionalNameField(),
  fuelType: optionalNameField(),
  notes: textField().optional(),
})

export type FuelEntryFormValues = z.infer<typeof fuelEntrySchema>

/** Common grades, as a shortcut — the field stays free text underneath. */
export const FUEL_TYPES = ['АИ-92', 'АИ-95', 'АИ-98', 'АИ-100', 'ДТ', 'Газ'] as const

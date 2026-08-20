import { z } from 'zod'
import { licensePlateField, nameField, yearField } from '@shared/lib/validation/limits'

/**
 * No currentMileage here on purpose — it is derived from the mileage log history,
 * not an editable car attribute. Corrections go through the mileage flow.
 */
export const updateCarSchema = z.object({
  brand: nameField('Введите марку'),
  model: nameField('Введите модель'),
  year: yearField(),
  licensePlate: licensePlateField().optional(),
})

export type UpdateCarFormValues = z.infer<typeof updateCarSchema>

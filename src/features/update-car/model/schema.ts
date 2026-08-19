import { z } from 'zod'
import { licensePlateField, mileageField, nameField, yearField } from '@shared/lib/validation/limits'

export const updateCarSchema = z.object({
  brand: nameField('Введите марку'),
  model: nameField('Введите модель'),
  year: yearField(),
  licensePlate: licensePlateField().optional(),
  currentMileage: mileageField(),
})

export type UpdateCarFormValues = z.infer<typeof updateCarSchema>

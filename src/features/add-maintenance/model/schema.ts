import { z } from 'zod'
import {
  costField,
  intervalDaysField,
  intervalKmField,
  mileageField,
  nameField,
  pastDateField,
  textField,
} from '@shared/lib/validation/limits'

export const maintenanceSchema = z
  .object({
    name: nameField('Введите название'),
    intervalKm: intervalKmField().optional(),
    intervalDays: intervalDaysField().optional(),
    lastServiceMileage: mileageField().optional(),
    lastServiceDate: pastDateField().optional(),
    lastServiceCost: costField().optional(),
    lastServiceNotes: textField().optional(),
  })
  .refine((data) => data.intervalKm || data.intervalDays, {
    message: 'Укажите интервал — по км или по дням',
    path: ['intervalKm'],
  })

export type MaintenanceFormValues = z.infer<typeof maintenanceSchema>

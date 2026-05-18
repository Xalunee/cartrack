import { z } from 'zod'

export const maintenanceSchema = z
  .object({
    name: z.string().min(1, 'Введите название'),
    intervalKm: z.number().int().positive().optional(),
    intervalDays: z.number().int().positive().optional(),
    lastServiceMileage: z.number().int().min(0).optional(),
    lastServiceDate: z.string().optional(),
    lastServiceCost: z.number().min(0).optional(),
    lastServiceNotes: z.string().optional(),
  })
  .refine((data) => data.intervalKm || data.intervalDays, {
    message: 'Укажите интервал — по км или по дням',
    path: ['intervalKm'],
  })

export type MaintenanceFormValues = z.infer<typeof maintenanceSchema>

import { z } from 'zod'

export const stsSchema = z.object({
  stsNumber: z
    .string()
    .length(10, 'СТС должен содержать 10 символов')
    .regex(/^[0-9A-Za-zА-Яа-яЁё]+$/, 'Только цифры и буквы'),
})

export type StsFormValues = z.infer<typeof stsSchema>

import { z } from 'zod'
import { LIMITS, passwordField } from '@shared/lib/validation/limits'

export const changePasswordSchema = z
  .object({
    // Bounded but with no minimum, matching the route: this is an existing
    // credential being checked, not a new one being set, so a length rule
    // introduced after the account was created must not gate it.
    currentPassword: z
      .string()
      .min(1, 'Введите текущий пароль')
      .max(LIMITS.passwordLength, `Не больше ${LIMITS.passwordLength} символов`),
    newPassword: passwordField(),
    confirmPassword: z.string().min(1, 'Повторите новый пароль'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
  })
  // Caught here rather than server-side: the request would succeed and report a
  // change that never happened, which is worse than a plain validation error.
  .refine((d) => d.newPassword !== d.currentPassword, {
    message: 'Новый пароль совпадает с текущим',
    path: ['newPassword'],
  })

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>

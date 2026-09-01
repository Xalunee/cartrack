'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2, Lock } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { PasswordInput } from '@/components/ui/password-input'
import { useUpdateUserMutation } from '@entities/user'
import { WRONG_PASSWORD_MESSAGE } from '@shared/config'
import { changePasswordSchema, type ChangePasswordFormValues } from '../model/schema'

const SAVED_NOTICE_MS = 2500

export function ChangePasswordCard() {
  const mutation = useUpdateUserMutation()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })

  // The confirmation is a transient notice, so it has to clear itself — and clear
  // its timer if the page leaves before it fires.
  useEffect(() => {
    if (!saved) return
    const timer = setTimeout(() => setSaved(false), SAVED_NOTICE_MS)
    return () => clearTimeout(timer)
  }, [saved])

  function onSubmit(values: ChangePasswordFormValues) {
    setError(null)
    mutation.mutate(
      { currentPassword: values.currentPassword, newPassword: values.newPassword },
      {
        onSuccess: () => {
          form.reset()
          setSaved(true)
        },
        onError: (e) => {
          const message = e instanceof Error ? e.message : 'Не удалось изменить пароль'
          // A wrong current password is the user's typo in a field that is still on
          // screen — say so on the field so the fix is where the mistake is.
          if (message === WRONG_PASSWORD_MESSAGE) {
            form.setError('currentPassword', { message })
            form.setValue('currentPassword', '')
          } else {
            setError(message)
          }
        },
      },
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Lock className="h-4 w-4" />
          Смена пароля
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Текущий пароль</FormLabel>
                  <FormControl>
                    <PasswordInput
                      autoComplete="current-password"
                      placeholder="••••••••"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Новый пароль</FormLabel>
                  <FormControl>
                    <PasswordInput
                      autoComplete="new-password"
                      placeholder="••••••••"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Повторите новый пароль</FormLabel>
                  <FormControl>
                    <PasswordInput
                      autoComplete="new-password"
                      placeholder="••••••••"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex items-center justify-end gap-3">
              {saved && (
                <span
                  className="flex items-center gap-1 text-sm"
                  style={{ color: 'hsl(var(--status-ok))' }}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Пароль изменён
                </span>
              )}
              <Button type="submit" size="sm" disabled={mutation.isPending}>
                {mutation.isPending ? 'Обновление...' : 'Обновить пароль'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

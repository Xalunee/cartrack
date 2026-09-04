'use client'

import { signIn } from 'next-auth/react'
import { useResetQueryCache } from '@shared/lib/use-reset-query-cache'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { emailField, nameField, passwordField } from '@shared/lib/validation/limits'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Logo } from '@shared/ui'
import { apiClient } from '@shared/api/client'

const schema = z
  .object({
    name: nameField('Введите имя'),
    email: emailField(),
    password: passwordField(),
    confirmPassword: z.string().min(1, 'Повторите пароль'),
  })
  // A typo in the password is otherwise invisible until the first login fails,
  // by which point the account already exists with the wrong hash.
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
  })

type FormValues = z.infer<typeof schema>

export default function RegisterPage() {
  const router = useRouter()
  const resetQueryCache = useResetQueryCache()
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  })

  async function onSubmit(values: FormValues) {
    setIsPending(true)
    setError(null)

    try {
      await apiClient('/api/auth/register', {
        method: 'POST',
        // Only the three fields the route accepts — the confirmation never
        // leaves the browser.
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          password: values.password,
        }),
      })

      const result = await signIn('credentials', {
        email: values.email,
        password: values.password,
        redirect: false,
      })

      if (result?.error) {
        setError('Регистрация успешна, но не удалось войти. Попробуйте войти вручную.')
      } else {
        // A fresh account must not inherit whatever the previous user of this
        // device left in the persisted cache.
        await resetQueryCache()
        router.push('/onboarding')
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка регистрации')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="page-enter flex min-h-svh items-center justify-center px-4 py-8">
      <Card className="glass w-full max-w-sm">
        <CardHeader>
          <CardTitle className="flex items-center justify-center gap-2">
            <Logo size={22} />
            CarTrack
          </CardTitle>
          <p className="text-muted-foreground text-center text-sm">Создайте аккаунт</p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Имя</FormLabel>
                    <FormControl>
                      <Input autoComplete="name" placeholder="Александр" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                // With a resolver, a field change only lifts that field's own
                // error into form state, so fixing a typo here would leave
                // "Пароли не совпадают" hanging under a confirmation that now
                // matches. deps re-runs the other field too.
                rules={{ deps: ['confirmPassword'] }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Пароль</FormLabel>
                    <FormControl>
                      <PasswordInput
                        autoComplete="new-password"
                        placeholder="Минимум 6 символов"
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
                    <FormLabel>Повторите пароль</FormLabel>
                    <FormControl>
                      <PasswordInput
                        autoComplete="new-password"
                        placeholder="Ещё раз тот же пароль"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {error && <p className="text-destructive text-sm">{error}</p>}
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? 'Регистрация...' : 'Зарегистрироваться'}
              </Button>
            </form>
          </Form>
          <p className="text-muted-foreground mt-4 text-center text-sm">
            Уже есть аккаунт?{' '}
            <Link href="/login" className="text-primary underline">
              Войти
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

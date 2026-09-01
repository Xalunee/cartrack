'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useQueryClient } from '@tanstack/react-query'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { CAR_QUERY_KEY } from '@entities/car'
import { apiClient } from '@shared/api/client'
import { useCheckFinesMutation } from '@entities/fine'
import { stsSchema, type StsFormValues } from '../model/schema'

/**
 * The body of StsDialog, split out so its form graph loads on open. Mounted only
 * while the dialog is open, so `currentValue` is picked up fresh on every open.
 */
export function StsDialogForm({
  currentValue,
  onDone,
}: {
  currentValue?: string
  onDone: () => void
}) {
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const checkMutation = useCheckFinesMutation()

  const form = useForm<StsFormValues>({
    resolver: zodResolver(stsSchema),
    defaultValues: { stsNumber: currentValue ?? '' },
  })

  async function onSubmit(values: StsFormValues) {
    setIsSaving(true)
    setError(null)
    try {
      await apiClient('/api/car', {
        method: 'PATCH',
        body: JSON.stringify({ stsNumber: values.stsNumber }),
      })
      await queryClient.invalidateQueries({ queryKey: CAR_QUERY_KEY })
      onDone()
      checkMutation.mutate()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка сохранения')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="stsNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Номер СТС</FormLabel>
              <FormControl>
                <Input placeholder="9920389197" maxLength={10} {...field} />
              </FormControl>
              <p className="text-muted-foreground text-xs">
                Серия и номер свидетельства о регистрации, например 9920389197
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onDone}>
            Отмена
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </div>

        {error && <p className="text-destructive text-sm">{error}</p>}
      </form>
    </Form>
  )
}

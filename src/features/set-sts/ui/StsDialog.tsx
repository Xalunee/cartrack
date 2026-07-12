'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { useQueryClient } from '@tanstack/react-query'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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

interface StsDialogProps {
  trigger: ReactNode
  currentValue?: string
}

export function StsDialog({ trigger, currentValue }: StsDialogProps) {
  const [open, setOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const checkMutation = useCheckFinesMutation()

  const form = useForm<StsFormValues>({
    resolver: zodResolver(stsSchema),
    defaultValues: { stsNumber: currentValue ?? '' },
  })

  function onOpenChange(next: boolean) {
    setOpen(next)
    if (next) {
      setError(null)
      form.reset({ stsNumber: currentValue ?? '' })
    }
  }

  async function onSubmit(values: StsFormValues) {
    setIsSaving(true)
    setError(null)
    try {
      await apiClient('/api/car', {
        method: 'PATCH',
        body: JSON.stringify({ stsNumber: values.stsNumber }),
      })
      await queryClient.invalidateQueries({ queryKey: CAR_QUERY_KEY })
      setOpen(false)
      checkMutation.mutate()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка сохранения')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Укажите СТС</DialogTitle>
        </DialogHeader>
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
                  <p className="text-xs text-muted-foreground">
                    Серия и номер свидетельства о регистрации, например 9920389197
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Отмена
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Сохранение...' : 'Сохранить'}
              </Button>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

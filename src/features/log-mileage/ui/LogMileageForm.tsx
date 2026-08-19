'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { mileageField } from '@shared/lib/validation/limits'
import { Button, Input, Label } from '@shared/ui'
import { useLogMileageMutation } from '../model/useMutation'

const schema = z.object({ mileage: mileageField().positive('Пробег должен быть больше нуля') })
type FormData = z.infer<typeof schema>

export function LogMileageForm() {
  const { register, handleSubmit } = useForm<FormData>({ resolver: zodResolver(schema) })
  const mutation = useLogMileageMutation()

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate({ mileage: d.mileage }))}>
      <Label htmlFor="mileage">Пробег (km)</Label>
      <Input id="mileage" type="number" {...register('mileage', { valueAsNumber: true })} />
      <Button type="submit" disabled={mutation.isPending}>Сохранить</Button>
    </form>
  )
}

'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button, Input, Label } from '@shared/ui'
import { useLogMileageMutation } from '../model/useMutation'

const schema = z.object({ km: z.number().positive() })
type FormData = z.infer<typeof schema>

export function LogMileageForm({ carId }: { carId: string }) {
  const { register, handleSubmit } = useForm<FormData>({ resolver: zodResolver(schema) })
  const mutation = useLogMileageMutation()

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate({ carId, km: d.km, loggedAt: new Date().toISOString() }))}>
      <Label htmlFor="km">Пробег (km)</Label>
      <Input id="km" type="number" {...register('km', { valueAsNumber: true })} />
      <Button type="submit" disabled={mutation.isPending}>Сохранить</Button>
    </form>
  )
}

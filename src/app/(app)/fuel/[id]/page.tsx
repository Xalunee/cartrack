'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  useFuelEntriesQuery,
  useFuelEntryQuery,
  useUpdateFuelEntryMutation,
  pricePerLiter,
} from '@entities/fuel-entry'
import { DeleteFuelEntryDialog } from '@features/delete-fuel-entry'
import { FuelEntryForm, toDateInputValue } from '@features/fuel-entry-form'
import type { FuelEntryFormValues } from '@features/fuel-entry-form'

export default function FuelEntryPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { data: entry, isPending } = useFuelEntryQuery(id)
  // The same suggestions the add form offers — the list is already cached from
  // the page this one is opened from.
  const { data: list } = useFuelEntriesQuery()
  const mutation = useUpdateFuelEntryMutation()
  const [warning, setWarning] = useState<string | null>(null)

  function onSubmit(values: FuelEntryFormValues) {
    mutation.mutate(
      {
        id,
        data: {
          liters: values.liters,
          totalCost: values.totalCost,
          date: new Date(values.date).toISOString(),
          // `null` where the field was cleared: the route has to tell "I did not
          // look at the odometer after all" from "I did not touch this field",
          // because only the first one removes the paired mileage point.
          mileage: values.mileage ?? null,
          isFullTank: values.isFullTank,
          hasMissedEntry: values.hasMissedEntry,
          station: values.station ?? null,
          fuelType: values.fuelType ?? null,
          notes: values.notes ?? null,
        },
      },
      {
        onSuccess: (updated) => {
          if (updated.mileageLogWarning) {
            setWarning(updated.mileageLogWarning)
            return
          }
          router.push('/fuel')
        },
      }
    )
  }

  if (isPending) {
    return (
      <div className="page-enter mx-auto max-w-2xl space-y-4 px-4 py-6">
        <div className="skeleton h-7 w-40" />
        <div className="skeleton h-96 rounded-xl" />
      </div>
    )
  }

  if (!entry) {
    return (
      <div className="page-enter mx-auto max-w-2xl px-4 py-6">
        <p className="text-muted-foreground">Заправка не найдена</p>
      </div>
    )
  }

  const perLiter = pricePerLiter(entry)

  return (
    <div className="page-enter mx-auto max-w-2xl space-y-5 px-4 py-6">
      <div className="mb-1 flex items-center gap-3">
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-semibold tracking-tight">Заправка</h1>
          {perLiter !== null && (
            <p className="text-muted-foreground text-sm tabular-nums">
              {perLiter.toLocaleString('ru', { maximumFractionDigits: 2 })} ₽ за литр
            </p>
          )}
        </div>
        <DeleteFuelEntryDialog
          entry={entry}
          onDeleted={() => router.push('/fuel')}
          trigger={
            <Button variant="ghost" size="sm" className="text-destructive h-8 w-8 p-0">
              <Trash2 className="h-4 w-4" />
            </Button>
          }
        />
      </div>

      {warning && (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm leading-relaxed">{warning}</p>
            <Button className="mt-3" size="sm" onClick={() => router.push('/fuel')}>
              К списку заправок
            </Button>
          </CardContent>
        </Card>
      )}

      <FuelEntryForm
        defaultValues={{
          liters: entry.liters,
          totalCost: entry.totalCost,
          date: toDateInputValue(new Date(entry.date)),
          mileage: entry.mileage ?? undefined,
          isFullTank: entry.isFullTank,
          hasMissedEntry: entry.hasMissedEntry,
          station: entry.station ?? '',
          fuelType: entry.fuelType ?? '',
          notes: entry.notes ?? '',
        }}
        stations={list?.stations ?? []}
        submitLabel="Сохранить"
        pending={mutation.isPending}
        error={mutation.error}
        onSubmit={onSubmit}
        onCancel={() => router.push('/fuel')}
      />
    </div>
  )
}

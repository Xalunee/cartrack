'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { DialogFormSkeleton } from '@shared/ui/DialogFormSkeleton'
import { useCarQuery } from '@entities/car'
import { useCreateFuelEntryMutation, useFuelEntriesQuery } from '@entities/fuel-entry'
import { FuelEntryForm, toDateInputValue } from '@features/fuel-entry-form'
import type { FuelEntryFormValues } from '@features/fuel-entry-form'
import type { FuelReceiptQr } from '@shared/lib/fuel-receipt-qr'

// The camera, the QR decoder and everything they pull in have no business in the
// bundle of a page that may well be filled in by hand — and on the phones that
// need the JavaScript decoder, it is downloaded only once the camera opens.
const ReceiptScanner = dynamic(
  () => import('@features/scan-fuel-receipt').then((m) => m.ReceiptScanner),
  { ssr: false, loading: () => <div className="skeleton h-9 w-full rounded-md" /> }
)

export default function NewFuelEntryPage() {
  const router = useRouter()
  const { data: car, isPending: carPending } = useCarQuery()
  const { data } = useFuelEntriesQuery()
  const mutation = useCreateFuelEntryMutation()

  const [scan, setScan] = useState<FuelReceiptQr | null>(null)
  const [warning, setWarning] = useState<string | null>(null)

  function onSubmit(values: FuelEntryFormValues) {
    mutation.mutate(
      {
        liters: values.liters,
        totalCost: values.totalCost,
        date: new Date(values.date).toISOString(),
        mileage: values.mileage,
        isFullTank: values.isFullTank,
        hasMissedEntry: values.hasMissedEntry,
        station: values.station || undefined,
        fuelType: values.fuelType || undefined,
        notes: values.notes || undefined,
      },
      {
        onSuccess: (created) => {
          // The entry is saved either way; a mileage point that could not be
          // written is the one thing the user would not otherwise notice, so it
          // is shown here instead of vanishing with the navigation.
          if (created.mileageLogWarning) {
            setWarning(created.mileageLogWarning)
            return
          }
          router.push('/fuel')
        },
      }
    )
  }

  if (warning) {
    return (
      <div className="page-enter mx-auto max-w-2xl space-y-4 px-4 py-6">
        <h1 className="text-lg font-semibold tracking-tight">Заправка записана</h1>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm leading-relaxed">{warning}</p>
          </CardContent>
        </Card>
        <div className="flex gap-2">
          <Button onClick={() => router.push('/fuel')}>К списку заправок</Button>
          <Button variant="outline" onClick={() => router.push('/mileage')}>
            Открыть пробег
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="page-enter mx-auto max-w-2xl space-y-5 px-4 py-6">
      <div className="mb-1 flex items-center gap-3">
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-lg font-semibold tracking-tight">Новая заправка</h1>
      </div>

      {/* `useForm` reads its defaults once, at mount. Rendering the form before
          the car answers would mount it with an empty odometer and never fill
          it in — and the field is legitimately optional, so nobody would notice:
          the entry would save without a reading and quietly take no part in
          consumption or cost per kilometre. Waiting is what /fuel/[id] already
          does with the entry it edits, and a skeleton for one round trip is the
          cheaper half of that trade. */}
      {carPending ? (
        <DialogFormSkeleton rows={5} />
      ) : (
        <FuelEntryForm
          defaultValues={{
            liters: undefined,
            totalCost: undefined,
            date: toDateInputValue(new Date()),
            mileage: car?.currentMileage,
            isFullTank: true,
            hasMissedEntry: false,
            station: '',
            fuelType: '',
            notes: '',
          }}
          stations={data?.stations ?? []}
          submitLabel="Записать"
          pending={mutation.isPending}
          error={mutation.error}
          onSubmit={onSubmit}
          onCancel={() => router.push('/fuel')}
          prefill={scan}
        >
          {/* Scanning and typing are two ways in, not a path and its fallback: the
            scan only fills the sum and the date, and the fields below stay open
            the whole time. */}
          <ReceiptScanner onScanned={setScan} />
        </FuelEntryForm>
      )}
    </div>
  )
}

'use client'

import dynamic from 'next/dynamic'
import { useCallback, useState, type ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { DialogFormSkeleton } from '@shared/ui/DialogFormSkeleton'
import type { ServiceRecord } from '@entities/service-record'

// One of these hangs off every row of the service timeline; the form behind it
// loads when a row is actually opened for editing.
const EditServiceRecordDialogForm = dynamic(
  () => import('./EditServiceRecordDialogForm').then((m) => m.EditServiceRecordDialogForm),
  { ssr: false, loading: () => <DialogFormSkeleton rows={4} /> }
)

interface EditServiceRecordDialogProps {
  itemId: string
  record: ServiceRecord
  lowerBound: number | null
  upperBound: number | null
  trigger?: ReactNode
}

export function EditServiceRecordDialog({
  itemId,
  record,
  lowerBound,
  upperBound,
  trigger,
}: EditServiceRecordDialogProps) {
  const [open, setOpen] = useState(false)
  const close = useCallback(() => setOpen(false), [])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger ?? <Button size="sm">Редактировать</Button>}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Редактировать замену</DialogTitle>
        </DialogHeader>
        <EditServiceRecordDialogForm
          itemId={itemId}
          record={record}
          lowerBound={lowerBound}
          upperBound={upperBound}
          onDone={close}
        />
      </DialogContent>
    </Dialog>
  )
}

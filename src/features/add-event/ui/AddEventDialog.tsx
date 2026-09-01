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
import type { CarEvent } from '@entities/event'

// The event log renders one of these per row; none of them shows a form until
// it is opened, so the form graph waits for that instead of for first paint.
const AddEventDialogForm = dynamic(
  () => import('./AddEventDialogForm').then((m) => m.AddEventDialogForm),
  { ssr: false, loading: () => <DialogFormSkeleton rows={4} /> }
)

interface AddEventDialogProps {
  trigger?: ReactNode
  event?: CarEvent
}

export function AddEventDialog({ trigger, event }: AddEventDialogProps) {
  const [open, setOpen] = useState(false)
  const close = useCallback(() => setOpen(false), [])
  const isEdit = !!event

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? <Button variant="default">Добавить событие</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Редактировать событие' : 'Новое событие'}</DialogTitle>
        </DialogHeader>
        <AddEventDialogForm event={event} onDone={close} />
      </DialogContent>
    </Dialog>
  )
}

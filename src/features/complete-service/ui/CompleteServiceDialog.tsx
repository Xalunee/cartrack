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

// This dialog sits on every maintenance card on the dashboard, so its form graph
// would otherwise be on the critical path for a page that shows no form at all.
const CompleteServiceDialogForm = dynamic(
  () => import('./CompleteServiceDialogForm').then((m) => m.CompleteServiceDialogForm),
  { ssr: false, loading: () => <DialogFormSkeleton rows={4} /> }
)

interface CompleteServiceDialogProps {
  itemId: string
  itemName: string
  prevMileage: number
  currentMileage: number
  trigger?: ReactNode
}

export function CompleteServiceDialog({
  itemId,
  itemName,
  prevMileage,
  currentMileage,
  trigger,
}: CompleteServiceDialogProps) {
  const [open, setOpen] = useState(false)
  const close = useCallback(() => setOpen(false), [])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger ?? <Button size="sm">Заменил</Button>}</DialogTrigger>
      <DialogContent className="sm:max-w-md" onClick={(event) => event.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>Заменил: {itemName}</DialogTitle>
        </DialogHeader>
        <CompleteServiceDialogForm
          itemId={itemId}
          prevMileage={prevMileage}
          currentMileage={currentMileage}
          onDone={close}
        />
      </DialogContent>
    </Dialog>
  )
}

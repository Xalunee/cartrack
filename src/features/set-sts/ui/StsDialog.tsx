'use client'

import dynamic from 'next/dynamic'
import { useCallback, useState, type ReactNode } from 'react'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { DialogFormSkeleton } from '@shared/ui/DialogFormSkeleton'

const StsDialogForm = dynamic(
  () => import('./StsDialogForm').then((m) => m.StsDialogForm),
  { ssr: false, loading: () => <DialogFormSkeleton rows={1} /> }
)

interface StsDialogProps {
  trigger: ReactNode
  currentValue?: string
}

export function StsDialog({ trigger, currentValue }: StsDialogProps) {
  const [open, setOpen] = useState(false)
  const close = useCallback(() => setOpen(false), [])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Укажите СТС</DialogTitle>
        </DialogHeader>
        <StsDialogForm currentValue={currentValue} onDone={close} />
      </DialogContent>
    </Dialog>
  )
}

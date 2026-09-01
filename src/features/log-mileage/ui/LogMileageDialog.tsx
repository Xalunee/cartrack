'use client'

import dynamic from 'next/dynamic'
import { useState, type ReactNode } from 'react'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { DialogFormSkeleton } from '@shared/ui/DialogFormSkeleton'
import type { MileageLog } from '@entities/mileage-log'

// Trigger and shell render with the page; the two forms behind this dialog pull
// react-hook-form, the zod resolvers and three schemas, so they wait for an open.
const LogMileageDialogBody = dynamic(
  () => import('./LogMileageDialogBody').then((m) => m.LogMileageDialogBody),
  { ssr: false, loading: () => <DialogFormSkeleton rows={3} /> }
)

interface LogMileageDialogProps {
  currentMileage: number
  trigger?: ReactNode
  editLog?: MileageLog
  onClose?: () => void
}

export function LogMileageDialog({
  currentMileage,
  trigger,
  editLog,
  onClose,
}: LogMileageDialogProps) {
  const isEdit = !!editLog
  // Without a trigger the dialog is driven by its own mounting — the edit flow
  // renders it in response to a menu choice and expects it open straight away.
  const [open, setOpen] = useState(!trigger && isEdit)

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) onClose?.()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Редактировать запись' : 'Обновить пробег'}</DialogTitle>
        </DialogHeader>
        <LogMileageDialogBody
          currentMileage={currentMileage}
          editLog={editLog}
          onDone={() => handleOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

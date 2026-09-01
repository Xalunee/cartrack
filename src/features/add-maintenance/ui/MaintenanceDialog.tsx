'use client'

import dynamic from 'next/dynamic'
import { useState, type ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { DialogFormSkeleton } from '@shared/ui/DialogFormSkeleton'
import { type MaintenanceItem } from '@entities/maintenance-item'

// The trigger and the dialog shell are cheap and must render with the page; the
// form body drags react-hook-form, the zod resolver and the schema behind it, so
// it only loads once someone actually opens the dialog.
const MaintenanceDialogForm = dynamic(
  () => import('./MaintenanceDialogForm').then((m) => m.MaintenanceDialogForm),
  { ssr: false, loading: () => <DialogFormSkeleton rows={6} /> }
)

interface MaintenanceDialogProps {
  item?: MaintenanceItem
  trigger?: ReactNode
}

export function MaintenanceDialog({ item, trigger }: MaintenanceDialogProps) {
  const [open, setOpen] = useState(false)
  const isEdit = !!item

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant={isEdit ? 'ghost' : 'default'}>
            {isEdit ? 'Редактировать' : 'Добавить позицию'}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" onClick={(event) => event.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Редактировать' : 'Добавить позицию обслуживания'}
          </DialogTitle>
        </DialogHeader>
        <MaintenanceDialogForm item={item} onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}

'use client'
import { Button, Input, Label } from '@shared/ui'

export function AddMaintenanceForm() {
  return (
    <form>
      <Label htmlFor="name">Название</Label>
      <Input id="name" placeholder="Замена масла" />
      <Button type="submit">Добавить</Button>
    </form>
  )
}

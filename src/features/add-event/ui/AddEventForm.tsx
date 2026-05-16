'use client'
import { Button, Input, Label } from '@shared/ui'

export function AddEventForm() {
  return (
    <form>
      <Label htmlFor="title">Событие</Label>
      <Input id="title" placeholder="ТО у дилера" />
      <Button type="submit">Добавить</Button>
    </form>
  )
}

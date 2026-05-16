'use client'
import { Button, Input, Label } from '@shared/ui'

export function UpdateCarForm() {
  return (
    <form>
      <Label htmlFor="mileage">Текущий пробег (km)</Label>
      <Input id="mileage" type="number" />
      <Button type="submit">Обновить</Button>
    </form>
  )
}

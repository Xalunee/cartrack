'use client'
import { Button } from '@shared/ui'

export function ExportButton() {
  return <Button variant="outline" onClick={() => window.print()}>Экспорт PDF</Button>
}

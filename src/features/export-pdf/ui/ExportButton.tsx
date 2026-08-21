'use client'

import { Button } from '@/components/ui/button'
import { FileDown } from 'lucide-react'
import { useExportPdf } from '../model/useExportPdf'

export function ExportButton() {
  const { exportPdf, generating, ready } = useExportPdf()

  return (
    <Button onClick={exportPdf} disabled={generating || !ready} variant="outline" size="sm">
      <FileDown className="h-4 w-4 mr-2" />
      {generating ? 'Формирование...' : 'Экспорт в PDF'}
    </Button>
  )
}

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileDown } from 'lucide-react'
import { useCarQuery } from '@entities/car'
import { useMaintenanceQuery } from '@entities/maintenance-item'
import { useEventsQuery } from '@entities/event'

export function ExportButton() {
  const { data: car } = useCarQuery()
  const { data: maintenanceItems } = useMaintenanceQuery()
  const { data: events } = useEventsQuery()
  const [generating, setGenerating] = useState(false)

  async function handleExport() {
    if (!car) return
    setGenerating(true)
    try {
      // Dynamic import to avoid SSR issues with @react-pdf/renderer
      const { pdf } = await import('@react-pdf/renderer')
      const { CarHistoryPDF } = await import('./CarHistoryPDF')

      const blob = await pdf(
        <CarHistoryPDF
          car={car}
          maintenanceItems={maintenanceItems ?? []}
          events={events ?? []}
        />
      ).toBlob()

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `CarTrack-${car.brand}-${car.model}-${new Date().toISOString().split('T')[0]}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error('PDF generation failed:', e)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <Button onClick={handleExport} disabled={generating || !car} variant="outline" size="sm">
      <FileDown className="h-4 w-4 mr-2" />
      {generating ? 'Формирование...' : 'Экспорт в PDF'}
    </Button>
  )
}

'use client'

import { useState } from 'react'
import { useCarQuery } from '@entities/car'
import { useMaintenanceQuery } from '@entities/maintenance-item'
import { useEventsQuery } from '@entities/event'

/**
 * The export is offered from more than one place — the settings screen and the
 * service hub — and both need the same three queries plus the same lazy renderer
 * import, so the behaviour lives here and the buttons stay presentational.
 */
export function useExportPdf() {
  const { data: car } = useCarQuery()
  const { data: maintenanceItems } = useMaintenanceQuery()
  const { data: events } = useEventsQuery()
  const [generating, setGenerating] = useState(false)

  async function exportPdf() {
    if (!car || generating) return
    setGenerating(true)
    try {
      // Dynamic import to avoid SSR issues with @react-pdf/renderer
      const { pdf } = await import('@react-pdf/renderer')
      const { CarHistoryPDF } = await import('../ui/CarHistoryPDF')

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

  return { exportPdf, generating, ready: !!car }
}

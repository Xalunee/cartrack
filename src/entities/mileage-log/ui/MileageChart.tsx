'use client'
import type { MileageLog } from '../model/types'

interface Props { logs: MileageLog[] }

export function MileageChart({ logs }: Props) {
  return (
    <div className="flex h-32 items-end gap-1">
      {logs.slice(-12).map((log) => (
        <div key={log.id} className="flex-1 bg-primary rounded-t" style={{ minHeight: 4 }} title={`${log.mileage} km`} />
      ))}
    </div>
  )
}

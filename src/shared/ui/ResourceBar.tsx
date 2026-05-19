import { cn } from '@shared/lib/utils'
import { MaintenanceStatus } from '@shared/types'

interface ResourceBarProps {
  usedPercent: number
  status: MaintenanceStatus
  className?: string
}

const colorMap: Record<MaintenanceStatus, string> = {
  ok: 'bg-green-500',
  soon: 'bg-yellow-500',
  critical: 'bg-red-500',
}

export function ResourceBar({ usedPercent, status, className }: ResourceBarProps) {
  return (
    <div className={cn('h-1.5 w-full rounded-full bg-muted overflow-hidden', className)}>
      <div
        className={cn('h-full rounded-full transition-all', colorMap[status])}
        style={{ width: `${Math.min(usedPercent, 100)}%` }}
      />
    </div>
  )
}

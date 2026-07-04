import { cn } from '@shared/lib/utils'
import { MaintenanceStatus } from '@shared/types'

interface ResourceBarProps {
  usedPercent: number
  status: MaintenanceStatus
  className?: string
}

const colorMap: Record<MaintenanceStatus, string> = {
  ok: 'hsl(var(--status-ok))',
  soon: 'hsl(var(--status-soon))',
  critical: 'hsl(var(--status-critical))',
}

export function ResourceBar({ usedPercent, status, className }: ResourceBarProps) {
  return (
    <div className={cn('h-1 w-full rounded-full bg-muted overflow-hidden', className)}>
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${Math.min(usedPercent, 100)}%`, backgroundColor: colorMap[status] }}
      />
    </div>
  )
}

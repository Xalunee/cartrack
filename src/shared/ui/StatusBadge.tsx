import { MaintenanceStatus } from '@shared/types'
import { cn } from '@shared/lib/utils'

interface StatusBadgeProps {
  status: MaintenanceStatus
  className?: string
}

const config: Record<MaintenanceStatus, { label: string; style: React.CSSProperties }> = {
  ok: { label: 'OK', style: { color: 'hsl(var(--status-ok))', backgroundColor: 'hsl(var(--status-ok-bg))' } },
  soon: { label: 'Скоро', style: { color: 'hsl(var(--status-soon))', backgroundColor: 'hsl(var(--status-soon-bg))' } },
  critical: { label: 'Критично', style: { color: 'hsl(var(--status-critical))', backgroundColor: 'hsl(var(--status-critical-bg))' } },
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const { label, style } = config[status]
  return (
    <span
      className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium', className)}
      style={style}
    >
      {label}
    </span>
  )
}

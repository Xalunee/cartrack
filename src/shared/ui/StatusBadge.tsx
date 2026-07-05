import { MaintenanceStatus } from '@shared/types'
import { cn } from '@shared/lib/utils'

interface StatusBadgeProps {
  status: MaintenanceStatus
  className?: string
}

const config: Record<MaintenanceStatus, { label: string; style: React.CSSProperties }> = {
  ok: { label: 'OK', style: { color: 'white', backgroundColor: 'hsl(var(--status-ok))' } },
  soon: { label: 'Скоро', style: { color: 'white', backgroundColor: 'hsl(var(--status-soon))' } },
  critical: { label: 'Критично', style: { color: 'white', backgroundColor: 'hsl(var(--status-critical))' } },
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const { label, style } = config[status]
  return (
    <span
      className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium', className)}
      style={style}
    >
      {label}
    </span>
  )
}

import { Badge } from '@/components/ui/badge'
import { MaintenanceStatus } from '@shared/types'
import { cn } from '@shared/lib/utils'

interface StatusBadgeProps {
  status: MaintenanceStatus
  className?: string
}

const config: Record<MaintenanceStatus, { label: string; className: string }> = {
  ok: { label: 'OK', className: 'bg-green-100 text-green-700 hover:bg-green-100' },
  soon: { label: 'Скоро', className: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100' },
  critical: { label: 'Критично', className: 'bg-red-100 text-red-700 hover:bg-red-100' },
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const { label, className: statusClass } = config[status]
  return (
    <Badge className={cn(statusClass, className)}>
      {label}
    </Badge>
  )
}

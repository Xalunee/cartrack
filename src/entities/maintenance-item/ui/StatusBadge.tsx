import { Badge } from '@shared/ui'
import type { MaintenanceStatus } from '@shared/config'

const variants: Record<MaintenanceStatus, 'default' | 'secondary' | 'destructive'> = {
  ok: 'default',
  soon: 'secondary',
  critical: 'destructive',
}

export function StatusBadge({ status }: { status: MaintenanceStatus }) {
  return <Badge variant={variants[status]}>{status.toUpperCase()}</Badge>
}

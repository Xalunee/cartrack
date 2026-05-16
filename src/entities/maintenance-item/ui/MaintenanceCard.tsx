import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui'
import type { MaintenanceItem } from '../model/types'
import { StatusBadge } from './StatusBadge'

interface Props { item: MaintenanceItem }

export function MaintenanceCard({ item }: Props) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{item.name}</CardTitle>
        <StatusBadge status={item.status} />
      </CardHeader>
      <CardContent>
        {item.nextDueKm && <p className="text-xs text-muted-foreground">Due at {item.nextDueKm.toLocaleString()} km</p>}
      </CardContent>
    </Card>
  )
}

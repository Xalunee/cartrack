import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui'
import type { MaintenanceItemWithStatus } from '../model/types'
import { StatusBadge } from './StatusBadge'

interface Props { item: MaintenanceItemWithStatus }

export function MaintenanceCard({ item }: Props) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{item.name}</CardTitle>
        <StatusBadge status={item.resource.status} />
      </CardHeader>
      <CardContent>
        {item.resource.remainingKm !== null && (
          <p className="text-xs text-muted-foreground">
            {item.resource.remainingKm.toLocaleString()} km remaining
          </p>
        )}
      </CardContent>
    </Card>
  )
}

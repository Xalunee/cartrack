import { StatusOverview } from '@widgets/status-overview'
import { MaintenanceDialog } from '@features/add-maintenance'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export function MaintenancePage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Обслуживание</h1>
        <MaintenanceDialog trigger={
          <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Добавить</Button>
        } />
      </div>
      <StatusOverview />
    </div>
  )
}

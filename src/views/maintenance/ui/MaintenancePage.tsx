import { MaintenanceList } from '@widgets/maintenance-list'
import { AddMaintenanceForm } from '@features/add-maintenance'

export function MaintenancePage() {
  return (
    <div className="space-y-6 p-4">
      <h1 className="text-xl font-bold">Обслуживание</h1>
      <AddMaintenanceForm />
      <MaintenanceList />
    </div>
  )
}

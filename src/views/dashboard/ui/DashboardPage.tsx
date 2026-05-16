import { StatusOverview } from '@widgets/status-overview'
import { MileageTracker } from '@widgets/mileage-tracker'
import { SpendingChart } from '@widgets/spending-chart'

export function DashboardPage() {
  return (
    <div className="space-y-6 p-4">
      <h1 className="text-xl font-bold">Главная</h1>
      <MileageTracker />
      <StatusOverview />
      <SpendingChart />
    </div>
  )
}

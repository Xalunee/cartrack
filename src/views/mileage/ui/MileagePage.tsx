import { MileageTracker } from '@widgets/mileage-tracker'
import { LogMileageForm } from '@features/log-mileage'

export function MileagePage() {
  return (
    <div className="space-y-6 p-4">
      <h1 className="text-xl font-bold">Пробег</h1>
      <LogMileageForm carId="" />
      <MileageTracker />
    </div>
  )
}

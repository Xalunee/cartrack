import { MileageTracker } from '@widgets/mileage-tracker'

export function MileagePage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 page-enter">
      <h1 className="text-xl font-semibold mb-4">Пробег</h1>
      <MileageTracker />
    </div>
  )
}

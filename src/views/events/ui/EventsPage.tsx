import { EventLog } from '@widgets/event-log'
import { AddEventForm } from '@features/add-event'

export function EventsPage() {
  return (
    <div className="space-y-6 p-4">
      <h1 className="text-xl font-bold">События</h1>
      <AddEventForm />
      <EventLog />
    </div>
  )
}

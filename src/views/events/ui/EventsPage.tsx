import { EventLog } from '@widgets/event-log'
import { AddEventDialog } from '@features/add-event'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export function EventsPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5 page-enter">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-lg font-semibold tracking-tight">События</h1>
        <AddEventDialog trigger={
          <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Добавить</Button>
        } />
      </div>
      <EventLog />
    </div>
  )
}

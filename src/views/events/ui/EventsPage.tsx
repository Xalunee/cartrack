import { AddEventDialog } from '@features/add-event'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export function EventsPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">События</h1>
        <AddEventDialog trigger={
          <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Добавить</Button>
        } />
      </div>
      <p className="text-sm text-muted-foreground">Журнал событий — в следующей версии</p>
    </div>
  )
}

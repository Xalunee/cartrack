'use client'

import { useEventsQuery, useDeleteEventMutation, CarEvent } from '@entities/event'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Trash2, AlertTriangle, Wrench, Receipt, FileText, Car } from 'lucide-react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { cn } from '@shared/lib/utils'
import { useState } from 'react'

const typeConfig: Record<CarEvent['type'], { label: string; icon: typeof AlertTriangle; className: string }> = {
  ACCIDENT: { label: 'Авария', icon: Car, className: 'bg-red-100 text-red-700' },
  MALFUNCTION: { label: 'Неисправность', icon: AlertTriangle, className: 'bg-yellow-100 text-yellow-700' },
  FINE: { label: 'Штраф', icon: Receipt, className: 'bg-orange-100 text-orange-700' },
  SERVICE: { label: 'СТО', icon: Wrench, className: 'bg-blue-100 text-blue-700' },
  NOTE: { label: 'Заметка', icon: FileText, className: 'bg-gray-100 text-gray-700' },
}

export function EventLog() {
  const { data: events, isLoading } = useEventsQuery()
  const deleteMutation = useDeleteEventMutation()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  function handleDelete(id: string) {
    if (deletingId === id) {
      deleteMutation.mutate(id, {
        onSuccess: () => setDeletingId(null),
      })
    } else {
      setDeletingId(id)
      setTimeout(() => setDeletingId(null), 3000)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-3 stagger-children">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-xl skeleton" />
        ))}
      </div>
    )
  }

  if (!events?.length) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-10 gap-3">
          <FileText className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground text-center">
            Нет событий. Добавьте первое.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3 stagger-children">
      {events.map((event) => {
        const config = typeConfig[event.type]
        const Icon = config.icon
        return (
          <Card key={event.id} className="overflow-hidden card-hover">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={cn('p-2 rounded-lg flex-shrink-0', config.className.split(' ')[0])}>
                    <Icon className={cn('h-4 w-4', config.className.split(' ')[1])} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-medium text-sm truncate">{event.title}</p>
                      <Badge className={cn('text-[10px] flex-shrink-0', config.className)}>
                        {config.label}
                      </Badge>
                    </div>
                    {event.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {event.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(event.occurredAt), 'd MMM yyyy', { locale: ru })}
                      </span>
                      {event.cost !== null && event.cost > 0 && (
                        <span className="text-xs font-medium">
                          {event.cost.toLocaleString('ru')} ₽
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn('h-7 w-7 p-0 flex-shrink-0', deletingId === event.id && 'text-destructive')}
                  onClick={() => handleDelete(event.id)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

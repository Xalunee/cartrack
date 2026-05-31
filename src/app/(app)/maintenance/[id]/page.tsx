'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@shared/api/client'
import { MaintenanceItemWithStatus, useDeleteMaintenanceMutation } from '@entities/maintenance-item'
import { MaintenanceDialog } from '@features/add-maintenance'
import { StatusBadge, ResourceBar } from '@shared/ui'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Pencil, Trash2, Calendar, Route, Banknote, FileText } from 'lucide-react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { useState } from 'react'

export default function MaintenanceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const deleteMutation = useDeleteMaintenanceMutation()

  const { data: item, isLoading } = useQuery({
    queryKey: ['maintenance', id],
    queryFn: () => apiClient<MaintenanceItemWithStatus>(`/api/maintenance/${id}`),
  })

  function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true)
      setTimeout(() => setConfirmDelete(false), 3000)
      return
    }
    deleteMutation.mutate(id, {
      onSuccess: () => router.push('/maintenance'),
    })
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-40 bg-muted animate-pulse rounded-xl" />
        <div className="h-60 bg-muted animate-pulse rounded-xl" />
      </div>
    )
  }

  if (!item) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <p className="text-muted-foreground">Позиция не найдена</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold">{item.name}</h1>
        </div>
        <StatusBadge status={item.resource.status} />
      </div>

      {/* Resource card */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-end justify-between mb-3">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Износ ресурса</p>
              <p className="text-3xl font-semibold">{item.resource.usedPercent}%</p>
            </div>
            {item.resource.forecastDate && (
              <div className="text-right">
                <p className="text-sm text-muted-foreground">След. замена</p>
                <p className="text-lg font-medium">
                  ~{format(new Date(item.resource.forecastDate), 'd MMM yyyy', { locale: ru })}
                </p>
              </div>
            )}
          </div>
          <ResourceBar usedPercent={item.resource.usedPercent} status={item.resource.status} className="h-2" />
          <div className="flex gap-4 mt-3">
            {item.resource.remainingKm !== null && (
              <p className="text-sm text-muted-foreground">
                Осталось: {item.resource.remainingKm.toLocaleString('ru')} км
              </p>
            )}
            {item.resource.remainingDays !== null && (
              <p className="text-sm text-muted-foreground">
                {item.resource.remainingDays > 0
                  ? `${item.resource.remainingDays} дн.`
                  : 'просрочено'}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Параметры</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {item.intervalKm && (
            <div className="flex items-center gap-3">
              <Route className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <p className="text-sm">Интервал: каждые {item.intervalKm.toLocaleString('ru')} км</p>
            </div>
          )}
          {item.intervalDays && (
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <p className="text-sm">Интервал: каждые {item.intervalDays} дн.</p>
            </div>
          )}

          <Separator />
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Последняя замена</p>

          {item.lastServiceDate && (
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <p className="text-sm">{format(new Date(item.lastServiceDate), 'd MMMM yyyy', { locale: ru })}</p>
            </div>
          )}
          {item.lastServiceMileage !== null && (
            <div className="flex items-center gap-3">
              <Route className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <p className="text-sm">При {item.lastServiceMileage.toLocaleString('ru')} км</p>
            </div>
          )}
          {item.lastServiceCost !== null && (
            <div className="flex items-center gap-3">
              <Banknote className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <p className="text-sm">{item.lastServiceCost.toLocaleString('ru')} ₽</p>
            </div>
          )}
          {item.lastServiceNotes && (
            <div className="flex items-center gap-3">
              <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <p className="text-sm text-muted-foreground">{item.lastServiceNotes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <MaintenanceDialog
          item={item}
          trigger={
            <Button variant="outline" className="flex-1">
              <Pencil className="h-4 w-4 mr-2" /> Редактировать
            </Button>
          }
        />
        <Button
          variant={confirmDelete ? 'destructive' : 'outline'}
          onClick={handleDelete}
          disabled={deleteMutation.isPending}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          {confirmDelete ? 'Точно удалить?' : 'Удалить'}
        </Button>
      </div>
    </div>
  )
}

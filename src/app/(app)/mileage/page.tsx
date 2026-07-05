'use client'

import { useState } from 'react'
import { useCarQuery } from '@entities/car'
import { useMileageQuery, useDeleteMileageLogMutation, type MileageLog } from '@entities/mileage-log'
import { LogMileageDialog } from '@features/log-mileage'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Plus, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts'
import { format, formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'

export default function MileagePage() {
  const { data: car } = useCarQuery()
  const { data, isLoading } = useMileageQuery()
  const deleteMutation = useDeleteMileageLogMutation()
  const [editingLog, setEditingLog] = useState<MileageLog | null>(null)
  const [deletingLog, setDeletingLog] = useState<MileageLog | null>(null)

  const chartData = data?.logs
    ?.slice()
    .reverse()
    .map((log) => ({
      date: format(new Date(log.recordedAt), 'd MMM', { locale: ru }),
      fullDate: format(new Date(log.recordedAt), 'd MMMM yyyy', { locale: ru }),
      mileage: log.mileage,
      note: log.note || null,
    }))

  const logs = data?.logs ?? []
  const totalLogs = logs.length
  const lastLog = logs[0]
  const firstLog = logs[logs.length - 1]
  const totalKm = lastLog && firstLog ? lastLog.mileage - firstLog.mileage : 0

  if (isLoading) {
    return (
      <div className="max-w-2xl md:max-w-4xl lg:max-w-5xl mx-auto px-4 py-6 space-y-6 page-enter">
        <div className="h-7 w-32 skeleton" />
        <div className="h-64 skeleton rounded-xl" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-24 skeleton rounded-xl" />
          <div className="h-24 skeleton rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl md:max-w-4xl lg:max-w-5xl mx-auto px-4 py-6 space-y-5 page-enter">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Пробег</h1>
          {car && (
            <p className="text-sm text-muted-foreground tabular-nums">
              {car.brand} {car.model} · {car.currentMileage.toLocaleString('ru')} км
            </p>
          )}
        </div>
        {car && (
          <LogMileageDialog
            currentMileage={car.currentMileage}
            trigger={
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" /> Внести
              </Button>
            }
          />
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <CardContent className="p-3">
            <p className="text-xl font-semibold tabular-nums">{car?.currentMileage.toLocaleString('ru') ?? '—'}</p>
            <p className="text-xs text-muted-foreground">Текущий, км</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xl font-semibold tabular-nums">{data?.pace ? `~${Math.round(data.pace.kmPerWeek)}` : '—'}</p>
            <p className="text-xs text-muted-foreground">Темп, км/неделю</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xl font-semibold tabular-nums">{totalLogs}</p>
            <p className="text-xs text-muted-foreground">Записей всего</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xl font-semibold">
              {lastLog ? formatDistanceToNow(new Date(lastLog.recordedAt), { locale: ru, addSuffix: true }) : '—'}
            </p>
            <p className="text-xs text-muted-foreground">Последний</p>
          </CardContent>
        </Card>
      </div>

      {chartData && chartData.length >= 2 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Динамика пробега</CardTitle>
          </CardHeader>
          <CardContent className="select-none">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                  tickLine={false}
                  axisLine={false}
                  padding={{ left: 16, right: 16 }}
                />
                <YAxis hide domain={['dataMin - 200', 'dataMax + 200']} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const d = payload[0].payload
                    return (
                      <div className="bg-popover text-popover-foreground border rounded-lg px-3 py-2 text-xs shadow-md">
                        <p className="font-medium">{d.mileage?.toLocaleString('ru')} км</p>
                        <p className="text-muted-foreground">{d.fullDate}</p>
                        {d.note && <p className="text-muted-foreground mt-0.5">{d.note}</p>}
                      </div>
                    )
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="mileage"
                  stroke="hsl(var(--chart-line))"
                  strokeWidth={2}
                  dot={{ r: 3, fill: 'hsl(var(--chart-line))', strokeWidth: 0 }}
                  activeDot={{ r: 5, strokeWidth: 2, stroke: 'hsl(var(--card))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
          История · {totalLogs} записей
        </h2>
        {logs.length > 0 ? (
          <div className="space-y-2 stagger-children">
            {logs.map((log, i) => {
              const prev = logs[i + 1]
              const diff = prev ? log.mileage - prev.mileage : null
              return (
                <Card key={log.id} className="card-hover">
                  <CardContent className="p-3 flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium tabular-nums">{log.mileage.toLocaleString('ru')} км</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(log.recordedAt), 'd MMMM yyyy, HH:mm', { locale: ru })}
                        {log.note && <span> · {log.note}</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {diff !== null && diff > 0 && (
                        <span className="text-xs font-medium text-muted-foreground tabular-nums">
                          +{diff.toLocaleString('ru')} км
                        </span>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
                          <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditingLog(log)}>
                            <Pencil className="h-3.5 w-3.5" />
                            Редактировать
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem variant="destructive" onClick={() => setDeletingLog(log)}>
                            <Trash2 className="h-3.5 w-3.5" />
                            Удалить
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-sm text-muted-foreground">Нет записей пробега</p>
            </CardContent>
          </Card>
        )}
      </div>
      {editingLog && car && (
        <LogMileageDialog
          key={editingLog.id}
          currentMileage={car.currentMileage}
          editLog={editingLog}
          onClose={() => setEditingLog(null)}
        />
      )}

      <AlertDialog open={!!deletingLog} onOpenChange={(v) => { if (!v) setDeletingLog(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить запись?</AlertDialogTitle>
            <AlertDialogDescription>
              Запись{' '}
              <span className="font-semibold">
                {deletingLog?.mileage.toLocaleString('ru')} км
              </span>{' '}
              от{' '}
              {deletingLog && format(new Date(deletingLog.recordedAt), 'd MMMM yyyy', { locale: ru })}{' '}
              будет удалена. Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deletingLog) {
                  deleteMutation.mutate(deletingLog.id, {
                    onSuccess: () => setDeletingLog(null),
                  })
                }
              }}
            >
              {deleteMutation.isPending ? 'Удаление...' : 'Удалить'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

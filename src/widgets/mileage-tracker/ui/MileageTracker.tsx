'use client'

import { useState } from 'react'
import { useMileageQuery, useDeleteMileageLogMutation, type MileageLog } from '@entities/mileage-log'
import { useCarQuery } from '@entities/car'
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
import { cn } from '@shared/lib/utils'
import { TrendingUp, Plus, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

export function MileageTracker() {
  const { data: car } = useCarQuery()
  const { data, isLoading } = useMileageQuery()
  const deleteMutation = useDeleteMileageLogMutation()

  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [editingLog, setEditingLog] = useState<MileageLog | null>(null)
  const [deletingLog, setDeletingLog] = useState<MileageLog | null>(null)

  const chartData = data?.logs
    .slice()
    .reverse()
    .slice(-10)
    .map((log) => ({
      date: format(new Date(log.recordedAt), 'd MMM', { locale: ru }),
      mileage: log.mileage,
      note: log.note || null,
    }))

  return (
    <>
      <Card className="h-full">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Пробег
            </CardTitle>
            {car && (
              <LogMileageDialog
                currentMileage={car.currentMileage}
                trigger={
                  <Button size="sm" variant="outline">
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Внести
                  </Button>
                }
              />
            )}
          </div>
        </CardHeader>
        <CardContent>
          {car && (
            <div className="mb-4">
              <p className="text-4xl font-bold tracking-tight tabular-nums">
                {car.currentMileage.toLocaleString('ru')}
                <span className="text-sm font-normal text-muted-foreground ml-1.5">км</span>
              </p>
              {data?.pace && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  ~{Math.round(data.pace.kmPerWeek)} км/неделю
                </p>
              )}
            </div>
          )}
          {isLoading && <div className="h-32 skeleton" />}
          {chartData && chartData.length >= 2 && (
            <div className="select-none">
              <ResponsiveContainer width="100%" height={140}>
                <LineChart
                  data={chartData}
                  margin={{ top: 8, right: 8, bottom: 0, left: 8 }}
                  style={{ cursor: 'default' }}
                >
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    hide
                    domain={['dataMin - 100', 'dataMax + 100']}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null
                      const d = payload[0].payload
                      return (
                        <div className="bg-popover text-popover-foreground border rounded-lg px-3 py-2 text-xs shadow-md">
                          <p className="font-medium">{d.mileage?.toLocaleString('ru')} км</p>
                          <p className="text-muted-foreground">{label}</p>
                          {d.note && <p className="text-muted-foreground mt-0.5">{d.note}</p>}
                          {!d.note && <p className="text-muted-foreground mt-0.5 italic">Без метки</p>}
                        </div>
                      )
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="mileage"
                    stroke="hsl(var(--chart-line))"
                    strokeWidth={2}
                    dot={(props: { cx?: number; cy?: number; index?: number }) => {
                      const { cx, cy, index } = props
                      const isActive = index === activeIndex
                      return (
                        <circle
                          key={index}
                          cx={cx}
                          cy={cy}
                          r={isActive ? 6 : 3}
                          fill="hsl(var(--chart-line))"
                          stroke={isActive ? 'hsl(var(--card))' : 'none'}
                          strokeWidth={isActive ? 2 : 0}
                          className="transition-all duration-200"
                        />
                      )
                    }}
                    activeDot={{ r: 5, strokeWidth: 2, stroke: 'hsl(var(--card))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
          {chartData && chartData.length < 2 && (
            <p className="text-xs text-muted-foreground text-center py-4">
              Добавьте ещё пробег для графика
            </p>
          )}
          {data?.logs && data.logs.length > 0 && (
            <div className="mt-4">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">История</p>
              {data.logs.slice(0, 5).map((log) => {
                const chartIndex = chartData
                  ? chartData.findIndex((d) => d.mileage === log.mileage)
                  : -1

                return (
                  <div
                    key={log.id}
                    className={cn(
                      'flex items-center justify-between py-2 border-b border-border last:border-0 rounded px-1 -mx-1 transition-colors',
                      activeIndex === chartIndex && 'bg-accent'
                    )}
                  >
                    <div
                      className="flex-1 cursor-pointer min-w-0"
                      onClick={() => setActiveIndex(chartIndex === activeIndex ? null : chartIndex)}
                    >
                      <span className="text-[13px] tabular-nums">{log.mileage.toLocaleString('ru')} км</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {format(new Date(log.recordedAt), 'd MMM', { locale: ru })}
                      </span>
                      {log.note && (
                        <span className="text-xs text-muted-foreground ml-1">· {log.note}</span>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        className="flex h-6 w-6 shrink-0 ml-1 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingLog(log)}>
                          <Pencil className="h-3.5 w-3.5" />
                          Редактировать
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setDeletingLog(log)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Удалить
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

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
    </>
  )
}

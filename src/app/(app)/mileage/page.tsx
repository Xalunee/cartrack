'use client'

import { useCarQuery } from '@entities/car'
import { useMileageQuery } from '@entities/mileage-log'
import { LogMileageDialog } from '@features/log-mileage'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, TrendingUp, Calendar, Route, Clock } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { format, formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'

export default function MileagePage() {
  const { data: car } = useCarQuery()
  const { data, isLoading } = useMileageQuery()

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
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 page-enter">
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
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 page-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Пробег</h1>
          {car && (
            <p className="text-sm text-muted-foreground">
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
        <Card className="glass">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Route className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Текущий</span>
            </div>
            <p className="text-lg font-semibold">{car?.currentMileage.toLocaleString('ru') ?? '—'}</p>
            <p className="text-[10px] text-muted-foreground">км</p>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Темп</span>
            </div>
            <p className="text-lg font-semibold">{data?.pace ? `~${Math.round(data.pace.kmPerWeek)}` : '—'}</p>
            <p className="text-[10px] text-muted-foreground">км/неделю</p>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Записей</span>
            </div>
            <p className="text-lg font-semibold">{totalLogs}</p>
            <p className="text-[10px] text-muted-foreground">всего</p>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Последний</span>
            </div>
            <p className="text-lg font-semibold">
              {lastLog ? formatDistanceToNow(new Date(lastLog.recordedAt), { locale: ru, addSuffix: true }) : '—'}
            </p>
          </CardContent>
        </Card>
      </div>

      {chartData && chartData.length >= 2 && (
        <Card className="glass">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Динамика пробега</CardTitle>
          </CardHeader>
          <CardContent className="select-none">
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
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
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ r: 3, fill: 'hsl(var(--primary))' }}
                  activeDot={{ r: 6, strokeWidth: 2, stroke: 'hsl(var(--background))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
          История · {totalLogs} записей
        </h2>
        {logs.length > 0 ? (
          <div className="space-y-2 stagger-children">
            {logs.map((log, i) => {
              const prev = logs[i + 1]
              const diff = prev ? log.mileage - prev.mileage : null
              return (
                <Card key={log.id} className="card-hover">
                  <CardContent className="p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{log.mileage.toLocaleString('ru')} км</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(log.recordedAt), 'd MMMM yyyy, HH:mm', { locale: ru })}
                        {log.note && <span> · {log.note}</span>}
                      </p>
                    </div>
                    {diff !== null && diff > 0 && (
                      <span className="text-xs font-medium text-muted-foreground">
                        +{diff.toLocaleString('ru')} км
                      </span>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-sm text-muted-foreground">Нет записей пробега</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

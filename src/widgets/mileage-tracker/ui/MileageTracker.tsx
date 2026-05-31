'use client'

import { useMileageQuery } from '@entities/mileage-log'
import { useCarQuery } from '@entities/car'
import { LogMileageDialog } from '@features/log-mileage'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TrendingUp, Plus } from 'lucide-react'
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

  const chartData = data?.logs
    .slice()
    .reverse()
    .slice(-10)
    .map((log) => ({
      date: format(new Date(log.recordedAt), 'd MMM', { locale: ru }),
      mileage: log.mileage,
    }))

  return (
    <Card>
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
            <p className="text-3xl font-semibold tracking-tight">
              {car.currentMileage.toLocaleString('ru')}
              <span className="text-base font-normal text-muted-foreground ml-1">км</span>
            </p>
            {data?.pace && (
              <p className="text-xs text-muted-foreground mt-1">
                ~{Math.round(data.pace.kmPerWeek)} км/неделю
              </p>
            )}
          </div>
        )}
        {isLoading && <div className="h-32 bg-muted animate-pulse rounded-lg" />}
        {chartData && chartData.length >= 2 && (
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={chartData}>
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis hide domain={['auto', 'auto']} />
              <Tooltip
                formatter={(value) => [`${Number(value).toLocaleString('ru')} км`, 'Пробег']}
                labelStyle={{ fontSize: 12 }}
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
              />
              <Line
                type="monotone"
                dataKey="mileage"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
        {chartData && chartData.length < 2 && (
          <p className="text-xs text-muted-foreground text-center py-4">
            Добавьте ещё пробег для графика
          </p>
        )}
        {data?.logs && data.logs.length > 0 && (
          <div className="mt-4 space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">История</p>
            {data.logs.slice(0, 5).map((log) => (
              <div key={log.id} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                <div>
                  <span className="text-sm">{log.mileage.toLocaleString('ru')} км</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    {format(new Date(log.recordedAt), 'd MMM', { locale: ru })}
                  </span>
                  {log.note && (
                    <span className="text-xs text-muted-foreground ml-1">· {log.note}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

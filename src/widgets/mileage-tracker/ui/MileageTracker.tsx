'use client'

import { useState } from 'react'
import { useMileageQuery } from '@entities/mileage-log'
import { useCarQuery } from '@entities/car'
import { LogMileageDialog } from '@features/log-mileage'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@shared/lib/utils'
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
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

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
    <Card className="glass card-hover">
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
        {isLoading && <div className="h-32 skeleton" />}
        {chartData && chartData.length >= 2 && (
          <div className="select-none">
            <ResponsiveContainer width="100%" height={120}>
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
                style={{ cursor: 'default' }}
              >
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
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
                    const data = payload[0].payload
                    return (
                      <div className="bg-popover text-popover-foreground border rounded-lg px-3 py-2 text-xs shadow-md">
                        <p className="font-medium">{data.mileage?.toLocaleString('ru')} км</p>
                        <p className="text-muted-foreground">{label}</p>
                        {data.note && <p className="text-muted-foreground mt-0.5">{data.note}</p>}
                        {!data.note && <p className="text-muted-foreground mt-0.5 italic">Без метки</p>}
                      </div>
                    )
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="mileage"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={(props: { cx?: number; cy?: number; index?: number }) => {
                    const { cx, cy, index } = props
                    const isActive = index === activeIndex
                    return (
                      <circle
                        key={index}
                        cx={cx}
                        cy={cy}
                        r={isActive ? 7 : 4}
                        fill="hsl(var(--primary))"
                        stroke={isActive ? 'hsl(var(--background))' : 'none'}
                        strokeWidth={isActive ? 3 : 0}
                        className="transition-all duration-200"
                      />
                    )
                  }}
                  activeDot={{ r: 6, strokeWidth: 2, stroke: 'hsl(var(--background))' }}
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
          <div className="mt-4 space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">История</p>
            {data.logs.slice(0, 5).map((log) => {
              const chartIndex = chartData
                ? chartData.findIndex((d) => d.mileage === log.mileage)
                : -1

              return (
                <div
                  key={log.id}
                  className={cn(
                    'flex items-center justify-between py-1.5 border-b border-border/50 last:border-0 cursor-pointer rounded px-1 -mx-1 transition-colors',
                    activeIndex === chartIndex && 'bg-primary/10'
                  )}
                  onClick={() => setActiveIndex(chartIndex === activeIndex ? null : chartIndex)}
                >
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
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

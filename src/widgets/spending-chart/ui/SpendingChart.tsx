'use client'

import { useState } from 'react'
import { useMaintenanceQuery } from '@entities/maintenance-item'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PeriodSwitcher, type Period } from '@shared/ui'
import { getPeriodStart, DEFAULT_PERIOD, PERIOD_LABEL } from '@shared/lib/period'
import { cn } from '@shared/lib/utils'
import { BarChart2 } from 'lucide-react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

/** Matches the mileage card, so the two read the same way down the dashboard. */
const HISTORY_LIMIT = 3

export function SpendingChart() {
  const { data: items } = useMaintenanceQuery()
  const [period, setPeriod] = useState<Period>(DEFAULT_PERIOD)

  const periodStart = getPeriodStart(period)

  const itemsInPeriod = items?.map((item) => ({
    id: item.id,
    name: item.name,
    spentInPeriod: item.serviceRecords
      .filter((r) => new Date(r.date) >= periodStart)
      .reduce((sum, r) => sum + (r.cost ?? 0), 0),
  }))

  const total = itemsInPeriod?.reduce((sum, item) => sum + item.spentInPeriod, 0) ?? 0

  const topItems = itemsInPeriod
    ?.filter((item) => item.spentInPeriod > 0)
    .sort((a, b) => b.spentInPeriod - a.spentInPeriod)
    .slice(0, 5)

  const chartData = topItems?.map((item) => ({
    name: item.name.length > 12 ? item.name.slice(0, 12) + '…' : item.name,
    fullName: item.name,
    cost: item.spentInPeriod,
  }))

  // The chart and the list above it answer «на что уходит за период» — they are
  // the same five numbers, one the legend of the other, and both empty out when
  // the period holds nothing. This answers «что было последним» instead, so it
  // ignores the period the way the mileage card's history does: an empty month
  // should still show that something was serviced in July.
  const recentRecords = items
    ?.flatMap((item) => item.serviceRecords.map((record) => ({ ...record, itemName: item.name })))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, HISTORY_LIMIT)

  const hasHistory = Boolean(recentRecords?.length)

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-y-2">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart2 className="h-4 w-4" />
              Расходы
            </CardTitle>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              За {PERIOD_LABEL[period]}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <PeriodSwitcher value={period} onChange={setPeriod} />
            <span className="text-base font-semibold tabular-nums">
              {total.toLocaleString('ru')} ₽
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        {chartData && chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%" minHeight={180} className="flex-1 select-none [-webkit-tap-highlight-color:transparent]">
            <BarChart data={chartData} barSize={28}>
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis hide />
              <Tooltip
                cursor={{ fill: 'color-mix(in srgb, var(--muted-foreground) 8%, transparent)' }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const d = payload[0]
                  return (
                    <div className="bg-popover text-popover-foreground border rounded-lg px-3 py-2 text-xs shadow-md">
                      <p className="font-medium">{Number(d.value).toLocaleString('ru')} ₽</p>
                      <p className="text-muted-foreground">{d.payload.fullName}</p>
                    </div>
                  )
                }}
              />
              <Bar dataKey="cost" radius={[4, 4, 0, 0]} fill="hsl(var(--chart-line))" />
            </BarChart>
          </ResponsiveContainer>
        ) : null}
        {topItems && topItems.length > 0 ? (
          <div className="mt-2 space-y-1.5">
            {topItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-2 text-xs">
                <span className="text-muted-foreground truncate">{item.name}</span>
                <span className="tabular-nums flex-shrink-0">
                  {item.spentInPeriod.toLocaleString('ru')} ₽
                </span>
              </div>
            ))}
          </div>
        ) : (
          // Without history below, the empty state takes the slack so the card
          // keeps its height next to the mileage one. With history below there is
          // something to sit under, and stretching would push it off the fold.
          <div
            className={cn(
              'flex flex-col items-center justify-center gap-1.5 py-8',
              !hasHistory && 'flex-1'
            )}
          >
            <BarChart2 className="h-6 w-6 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Нет данных за период</p>
          </div>
        )}
        {hasHistory && recentRecords && (
          <div className="mt-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">История</p>
            {recentRecords.map((record) => (
              <div
                key={record.id}
                className="flex items-center justify-between gap-2 py-2 border-b border-border last:border-0"
              >
                <div className="min-w-0">
                  <span className="text-sm tabular-nums">
                    {record.cost === null ? 'Без суммы' : `${record.cost.toLocaleString('ru')} ₽`}
                  </span>
                  <span className="text-xs text-muted-foreground ml-2">
                    {format(new Date(record.date), 'd MMM', { locale: ru })}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground truncate">{record.itemName}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

'use client'

import { useMaintenanceQuery } from '@entities/maintenance-item'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart2 } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

export function SpendingChart() {
  const { data: items } = useMaintenanceQuery()

  const totalYear = items?.reduce((sum, item) => sum + (item.lastServiceCost ?? 0), 0) ?? 0

  const topItems = items
    ?.filter((item) => item.lastServiceCost)
    .sort((a, b) => (b.lastServiceCost ?? 0) - (a.lastServiceCost ?? 0))
    .slice(0, 5)

  const chartData = topItems?.map((item) => ({
    name: item.name.length > 12 ? item.name.slice(0, 12) + '…' : item.name,
    fullName: item.name,
    cost: item.lastServiceCost ?? 0,
  }))

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart2 className="h-4 w-4" />
            Расходы
          </CardTitle>
          <span className="text-base font-semibold tabular-nums">
            {totalYear.toLocaleString('ru')} ₽
          </span>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        {chartData && chartData.length >= 2 ? (
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
                  {(item.lastServiceCost ?? 0).toLocaleString('ru')} ₽
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-1.5 py-6">
            <BarChart2 className="h-6 w-6 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Нет данных о расходах</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

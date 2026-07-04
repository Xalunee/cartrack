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
  Cell,
} from 'recharts'

export function SpendingChart() {
  const { data: items } = useMaintenanceQuery()

  const totalYear = items?.reduce((sum, item) => sum + (item.lastServiceCost ?? 0), 0) ?? 0

  const chartData = items
    ?.filter((item) => item.lastServiceCost)
    .sort((a, b) => (b.lastServiceCost ?? 0) - (a.lastServiceCost ?? 0))
    .slice(0, 5)
    .map((item) => ({
      name: item.name.length > 12 ? item.name.slice(0, 12) + '…' : item.name,
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
          <ResponsiveContainer width="100%" height={160} className="flex-1">
            <BarChart data={chartData} barSize={28}>
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis hide />
              <Tooltip
                formatter={(value) => [`${Number(value).toLocaleString('ru')} ₽`, 'Стоимость']}
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
              />
              <Bar dataKey="cost" radius={[4, 4, 0, 0]}>
                {chartData.map((_, index) => (
                  <Cell
                    key={index}
                    fill={index === 0 ? 'hsl(var(--chart-line))' : 'hsl(var(--muted-foreground) / 0.25)'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
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

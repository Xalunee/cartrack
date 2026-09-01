'use client'

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export interface MileageChartPoint {
  date: string
  fullDate: string
  mileage: number
  note: string | null
}

/**
 * The mileage history line chart, in its own module so Recharts stays out of the
 * bundle that has to arrive before /mileage paints. The card around it renders
 * from the same data, so the page can show its frame while this loads.
 */
export function MileageHistoryChart({ data }: { data: MileageChartPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
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
              <div className="bg-popover text-popover-foreground rounded-lg border px-3 py-2 text-xs shadow-md">
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
  )
}

'use client'

import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Banknote, Fuel, TrendingUp } from 'lucide-react'
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from 'recharts'
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PeriodSwitcher, type Period } from '@shared/ui'
import { DEFAULT_PERIOD, getPeriodStart, PERIOD_LABEL } from '@shared/lib/period'
import { cn } from '@shared/lib/utils'
import { formatConsumption, type FuelEntryWithSegment } from '@entities/fuel-entry'
import {
  calculateConsumptionSeries,
  calculateCostPerKm,
  calculateFuelSpending,
  calculatePriceSeries,
  detectConsumptionRise,
  stationsWorthFiltering,
  type FuelStatsEntry,
} from '@shared/lib/calculations/fuel-stats'
import { ConsumptionHealthNote } from './ConsumptionHealthNote'

const CHART_HEIGHT = 160
const AXIS_TICK = { fontSize: 10, fill: 'var(--muted-foreground)' }

/** One shared tooltip body, so three charts cannot drift apart in style. */
function tooltipContent(formatValue: (value: number) => string) {
  return function FuelChartTooltip({
    active,
    payload,
    label,
  }: TooltipContentProps<ValueType, NameType>) {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-popover text-popover-foreground rounded-lg border px-3 py-2 text-xs shadow-md">
        <p className="font-medium tabular-nums">{formatValue(Number(payload[0].value))}</p>
        <p className="text-muted-foreground">{String(label ?? '')}</p>
      </div>
    )
  }
}

function EmptyChart({ text }: { text: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-1.5"
      style={{ height: CHART_HEIGHT }}
    >
      <p className="text-muted-foreground text-xs">{text}</p>
    </div>
  )
}

interface FuelStatsProps {
  entries: FuelEntryWithSegment[]
  /** Взвешенное среднее из расчёта — период его не меняет. */
  averageConsumption: number | null
  basedOnSegments: number
}

/**
 * Всё на этой карточке выводится из уже загруженного списка заправок: ни одного
 * запроса и ни одного поля в базе за этими числами не стоит.
 */
export function FuelStats({ entries, averageConsumption, basedOnSegments }: FuelStatsProps) {
  const [period, setPeriod] = useState<Period>(DEFAULT_PERIOD)
  const [station, setStation] = useState<string | null>(null)

  const statsEntries: FuelStatsEntry[] = useMemo(
    () =>
      entries.map((entry) => ({
        id: entry.id,
        date: new Date(entry.date),
        mileage: entry.mileage,
        liters: entry.liters,
        totalCost: entry.totalCost,
        station: entry.station,
      })),
    [entries]
  )

  const segments = useMemo(
    () => entries.map((entry) => entry.segment).filter((s) => s !== null),
    [entries]
  )

  // Пересчитывается при смене периода, поэтому граница берётся здесь, а не
  // прячется внутри мемо с другими зависимостями.
  const periodStartMs = getPeriodStart(period).getTime()
  const spending = useMemo(
    () => calculateFuelSpending(statsEntries, { periodStart: new Date(periodStartMs), now: new Date() }),
    [statsEntries, periodStartMs]
  )

  const costPerKm = useMemo(() => calculateCostPerKm(statsEntries), [statsEntries])
  const consumptionSeries = useMemo(() => calculateConsumptionSeries(segments), [segments])
  const rise = useMemo(() => detectConsumptionRise(segments), [segments])
  const stations = useMemo(() => stationsWorthFiltering(statsEntries), [statsEntries])
  const priceSeries = useMemo(
    () => calculatePriceSeries(statsEntries, { station }),
    [statsEntries, station]
  )

  const consumptionData = consumptionSeries.map((point) => ({
    label: format(point.date, 'd MMM', { locale: ru }),
    consumption: Number(point.consumption.toFixed(2)),
  }))

  const priceData = priceSeries.map((point) => ({
    label: format(point.date, 'd MMM', { locale: ru }),
    price: Number(point.pricePerLiter.toFixed(2)),
  }))

  const spendingData = spending.months.map((month) => ({
    label: format(month.start, 'LLL', { locale: ru }),
    spent: Math.round(month.spent),
  }))

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-center justify-between gap-y-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Fuel className="h-4 w-4" />
              Расход
            </CardTitle>
            {/* Число, за которым сюда приходят, — за всё время: переключатель
                периода двигает график и итог, но не его. */}
            <span className="text-base font-semibold tabular-nums">
              {averageConsumption === null ? '—' : formatConsumption(averageConsumption)}
            </span>
          </div>
          <p className="text-muted-foreground mt-0.5 text-[11px]">
            {basedOnSegments > 0
              ? `Среднее по ${basedOnSegments} промежуткам между полными баками`
              : 'Появится после двух заправок до полного бака'}
          </p>
        </CardHeader>
        <CardContent>
          {consumptionData.length >= 2 ? (
            <ResponsiveContainer width="100%" height={CHART_HEIGHT} className="select-none">
              <LineChart data={consumptionData} margin={{ top: 4, right: 8, bottom: 0, left: -24 }}>
                <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={false} />
                <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} width={40} domain={['dataMin - 1', 'dataMax + 1']} />
                <Tooltip content={tooltipContent((v) => formatConsumption(v))} />
                <Line
                  type="monotone"
                  dataKey="consumption"
                  stroke="hsl(var(--chart-line))"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart text="Тренд появится, когда промежутков станет два" />
          )}
          <ConsumptionHealthNote rise={rise} computedSegments={consumptionSeries.length} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-center justify-between gap-y-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4" />
              Цена литра
            </CardTitle>
            {priceData.length > 0 && (
              <span className="text-base font-semibold tabular-nums">
                {priceData[priceData.length - 1].price.toLocaleString('ru')} ₽
              </span>
            )}
          </div>
          {stations.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {/* Без фильтра скачок цены неотличим от поездки на другую АЗС. */}
              {[null, ...stations].map((option) => (
                <button
                  key={option ?? 'all'}
                  type="button"
                  onClick={() => setStation(option)}
                  className={cn(
                    'rounded-md px-2 py-0.5 text-[11px] transition-colors',
                    station === option
                      ? 'bg-accent text-foreground font-medium'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {option ?? 'Все'}
                </button>
              ))}
            </div>
          )}
        </CardHeader>
        <CardContent>
          {priceData.length >= 2 ? (
            <ResponsiveContainer width="100%" height={CHART_HEIGHT} className="select-none">
              <LineChart data={priceData} margin={{ top: 4, right: 8, bottom: 0, left: -24 }}>
                <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={false} />
                <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} width={40} domain={['dataMin - 2', 'dataMax + 2']} />
                <Tooltip content={tooltipContent((v) => `${v.toLocaleString('ru')} ₽/л`)} />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="hsl(var(--chart-line))"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart
              text={
                priceData.length === 1
                  ? 'Одна заправка — тренда ещё нет'
                  : station
                    ? 'На этой заправке записей нет'
                    : 'Заправок пока нет'
              }
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-center justify-between gap-y-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Banknote className="h-4 w-4" />
                Траты на топливо
              </CardTitle>
              <p className="text-muted-foreground mt-0.5 text-[11px]">За {PERIOD_LABEL[period]}</p>
            </div>
            <div className="flex items-center gap-2">
              <PeriodSwitcher value={period} onChange={setPeriod} />
              <span className="text-base font-semibold tabular-nums">
                {Math.round(spending.periodTotal).toLocaleString('ru')} ₽
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {spending.periodTotal > 0 ? (
            <ResponsiveContainer width="100%" height={CHART_HEIGHT} className="select-none">
              <BarChart data={spendingData} barSize={28} margin={{ top: 4, right: 8, bottom: 0, left: -24 }}>
                <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={false} />
                <YAxis hide />
                <Tooltip
                  cursor={{ fill: 'color-mix(in srgb, var(--muted-foreground) 8%, transparent)' }}
                  content={tooltipContent((v) => `${v.toLocaleString('ru')} ₽`)}
                />
                <Bar dataKey="spent" radius={[4, 4, 0, 0]} fill="hsl(var(--chart-line))" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart text="Нет заправок за период" />
          )}

          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <p className="text-xl font-semibold tabular-nums">
                {costPerKm === null
                  ? '—'
                  : `${costPerKm.costPerKm.toLocaleString('ru', { maximumFractionDigits: 2 })} ₽`}
              </p>
              <p className="text-muted-foreground text-xs">
                {/* Ради этого числа секция и нужна: оно делает «потратил
                    40 000» величиной, которую есть с чем сравнить. */}
                За километр
                {costPerKm !== null && (
                  <span> · по {costPerKm.distanceKm.toLocaleString('ru')} км</span>
                )}
              </p>
            </div>
            <div>
              <p className="text-xl font-semibold tabular-nums">
                {Math.round(spending.total).toLocaleString('ru')} ₽
              </p>
              <p className="text-muted-foreground text-xs">За всё время</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

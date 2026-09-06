'use client'

import { useMemo } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { ChevronRight, Fuel, Plus } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useCarQuery } from '@entities/car'
import { detectMissedFillUp } from '@shared/lib/calculations/fuel-stats'
import { FuelStatsSkeleton, MissedFillUpCard } from '@widgets/fuel-stats'
import {
  describeFuelSegment,
  formatConsumption,
  pricePerLiter,
  useFuelEntriesQuery,
  type FuelEntryWithSegment,
} from '@entities/fuel-entry'

// Three charts' worth of Recharts has no business in the bundle of a page whose
// point is the list below them — and the statistics cannot draw anything until
// /api/fuel answers anyway. The skeleton is the cards' own resting shape, so the
// list does not jump when the chunk lands.
//
// Through @widgets/lazy-charts, not straight at the widget: every Recharts
// import in the app goes through that one module so the library lands in one
// chunk group. See the note there.
const FuelStats = dynamic(() => import('@widgets/lazy-charts').then((m) => m.FuelStats), {
  ssr: false,
  loading: () => <FuelStatsSkeleton />,
})

const TONE_STYLE = {
  ok: { color: 'hsl(var(--status-ok))' },
  warn: { color: 'hsl(var(--status-soon))' },
  muted: undefined,
} as const

function FuelEntryRow({ entry }: { entry: FuelEntryWithSegment }) {
  const perLiter = pricePerLiter(entry)
  const label = describeFuelSegment(entry, entry.segment)

  return (
    <Link
      href={`/fuel/${entry.id}`}
      className="focus-visible:ring-ring/50 block rounded-xl outline-none focus-visible:ring-[3px]"
    >
      <Card className="card-hover">
        <CardContent className="flex items-center gap-3 p-3">
          <div className="min-w-0 flex-1 space-y-0.5">
            <p className="text-sm font-medium tabular-nums">
              {entry.liters.toLocaleString('ru')} л · {entry.totalCost.toLocaleString('ru')} ₽
              {perLiter !== null && (
                <span className="text-muted-foreground font-normal">
                  {' '}
                  · {perLiter.toLocaleString('ru', { maximumFractionDigits: 2 })} ₽/л
                </span>
              )}
            </p>
            <p className="text-muted-foreground text-xs">
              {format(new Date(entry.date), 'd MMMM yyyy', { locale: ru })}
              {entry.mileage !== null && (
                <span className="tabular-nums"> · {entry.mileage.toLocaleString('ru')} км</span>
              )}
              {entry.station && <span> · {entry.station}</span>}
              {!entry.isFullTank && <span> · не до полного</span>}
            </p>
            <p className="text-xs leading-snug" style={TONE_STYLE[label.tone]}>
              {label.text}
            </p>
          </div>
          <ChevronRight className="text-muted-foreground h-4 w-4 shrink-0" />
        </CardContent>
      </Card>
    </Link>
  )
}

export default function FuelPage() {
  const { data, isPending } = useFuelEntriesQuery()
  const { data: car } = useCarQuery()

  // Пробег машины и её же история заправок — ничего сверх того, что на странице
  // уже загружено.
  const missed = useMemo(
    () =>
      car && data
        ? detectMissedFillUp({
            entries: data.entries.map((entry) => ({
              id: entry.id,
              date: new Date(entry.date),
              mileage: entry.mileage,
              liters: entry.liters,
              totalCost: entry.totalCost,
              station: entry.station,
            })),
            currentMileage: car.currentMileage,
          })
        : null,
    [car, data]
  )

  if (isPending) {
    return (
      <div className="page-enter mx-auto max-w-2xl space-y-4 px-4 py-6 md:max-w-4xl lg:max-w-5xl">
        <div className="skeleton h-7 w-32" />
        <div className="skeleton h-20 rounded-xl" />
        <div className="skeleton h-20 rounded-xl" />
        <div className="skeleton h-20 rounded-xl" />
      </div>
    )
  }

  const entries = data?.entries ?? []

  return (
    <div className="page-enter mx-auto max-w-2xl space-y-5 px-4 py-6 md:max-w-4xl lg:max-w-5xl">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Топливо</h1>
          <p className="text-muted-foreground text-sm">
            {data && data.averageConsumption !== null
              ? `Средний расход ${formatConsumption(data.averageConsumption)} · по ${data.basedOnSegments} промежуткам`
              : 'Заправки, расход и траты на топливо'}
          </p>
        </div>
        <Link href="/fuel/new">
          <Button size="sm">
            <Plus className="mr-1 h-4 w-4" /> Заправка
          </Button>
        </Link>
      </div>

      {missed && <MissedFillUpCard missed={missed} />}

      {entries.length > 0 && (
        <FuelStats
          entries={entries}
          averageConsumption={data?.averageConsumption ?? null}
          basedOnSegments={data?.basedOnSegments ?? 0}
        />
      )}

      {entries.length > 0 ? (
        <div className="stagger-children space-y-2">
          <h2 className="text-muted-foreground mb-2 text-xs font-medium tracking-wider uppercase">
            История · {entries.length}
          </h2>
          {entries.map((entry) => (
            <FuelEntryRow key={entry.id} entry={entry} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="space-y-2 px-6 py-10 text-center">
            <Fuel className="text-muted-foreground mx-auto h-6 w-6" />
            <p className="text-sm font-medium">Заправок пока нет</p>
            {/* The first entry alone can never show a consumption figure, and a
                dash where a number should be reads as a bug. So the rule is said
                here, before the first entry, rather than explained after it. */}
            <p className="text-muted-foreground mx-auto max-w-sm text-xs leading-relaxed">
              Расход считается между двумя заправками до полного бака: первая задаёт точку
              отсчёта, вторая даёт число. До второй полной заправки будут видны только траты —
              это нормально, а не ошибка.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

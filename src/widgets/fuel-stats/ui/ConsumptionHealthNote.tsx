'use client'

import Link from 'next/link'
import { Activity, ChevronRight } from 'lucide-react'

import {
  MIN_SEGMENTS_FOR_HEALTH_SIGNAL,
  type ConsumptionRise,
} from '@shared/lib/calculations/fuel-stats'

function percent(value: number): string {
  return `${Math.round(value * 100)}%`
}

function consumption(value: number): string {
  return value.toLocaleString('ru', { maximumFractionDigits: 1 })
}

interface ConsumptionHealthNoteProps {
  rise: ConsumptionRise | null
  /** Сколько посчитанных промежутков есть сейчас — для честного «пока рано». */
  computedSegments: number
}

/**
 * Наблюдение, а не сигнализация. Растущий расход бывает симптомом — забитый
 * фильтр, свечи, спущенные шины, — и мы единственные, кто может это заметить,
 * потому что обслуживание у нас уже есть. Но он же бывает похолоданием и
 * пробками, поэтому здесь нет диагноза: есть число, его сравнение с собственной
 * нормой машины и дверь в обслуживание.
 */
export function ConsumptionHealthNote({ rise, computedSegments }: ConsumptionHealthNoteProps) {
  // Пока истории мало, говорить нечего — и молчать молча тоже неправильно:
  // человек должен знать, что наблюдение появится, а не решить, что его нет.
  if (!rise) {
    if (computedSegments >= MIN_SEGMENTS_FOR_HEALTH_SIGNAL) return null
    return (
      <p className="text-muted-foreground mt-3 text-xs leading-snug">
        Рост расхода начнём замечать после {MIN_SEGMENTS_FOR_HEALTH_SIGNAL} посчитанных
        промежутков — сейчас {computedSegments}. По меньшему числу отличить износ от зимы
        нельзя.
      </p>
    )
  }

  return (
    <div className="mt-3 rounded-md border p-3">
      <div className="flex items-start gap-2">
        <Activity className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'hsl(var(--status-soon))' }} />
        <div className="space-y-1.5">
          <p className="text-sm leading-snug">
            Последние {rise.recentSegments} промежутка — {consumption(rise.recentConsumption)}{' '}
            л/100 км, на {percent(rise.risePercent)} выше{' '}
            {rise.seasonMatched ? 'того же времени год назад' : 'обычного для этой машины'} (
            {consumption(rise.baselineConsumption)}).
          </p>
          <p className="text-muted-foreground text-xs leading-snug">
            Так бывает от забитого воздушного фильтра, изношенных свечей или спущенных шин.
            {!rise.seasonMatched &&
              ' Часть роста может быть сезонной — зимой расход честно выше; сравнить с прошлой зимой пока не с чем.'}{' '}
            Это наблюдение, а не диагноз.
          </p>
          <Link
            href="/maintenance"
            className="text-foreground inline-flex items-center gap-0.5 text-xs font-medium hover:underline"
          >
            Посмотреть обслуживание
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  )
}

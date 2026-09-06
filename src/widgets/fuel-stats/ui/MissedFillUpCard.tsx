'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { ChevronRight, HelpCircle } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import type { MissedFillUp } from '@shared/lib/calculations/fuel-stats'

/**
 * Не напоминание «пора заправиться» — приложение об этом знать не может и лезть
 * туда не должно. Это замечание о качестве данных: машина проехала больше, чем
 * когда-либо проезжала между заправками, значит одну, скорее всего, забыли
 * внести — и из-за неё расход считается по неполным литрам.
 *
 * Порог — из собственной истории машины: 600 км это три бака у одной и половина
 * у другой.
 */
export function MissedFillUpCard({ missed }: { missed: MissedFillUp }) {
  return (
    <Card>
      <CardContent className="flex items-start gap-3 p-4">
        <HelpCircle className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
        <div className="space-y-1.5">
          <p className="text-sm leading-snug">
            С последней заправки{' '}
            {format(new Date(missed.lastEntryDate), 'd MMMM', { locale: ru })} машина проехала{' '}
            <span className="tabular-nums">{missed.kmSinceLastEntry.toLocaleString('ru')} км</span>
            {' — '}обычно вы заправляетесь каждые{' '}
            <span className="tabular-nums">{Math.round(missed.typicalKm).toLocaleString('ru')} км</span>.
            Похоже, одна заправка не внесена.
          </p>
          <p className="text-muted-foreground text-xs leading-snug">
            Добавьте её с той датой, когда заправлялись — расход и цена километра посчитаются по
            полным литрам, а не по половине.
          </p>
          <Link
            href="/fuel/new"
            className="text-foreground inline-flex items-center gap-0.5 text-xs font-medium hover:underline"
          >
            Внести пропущенную заправку
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

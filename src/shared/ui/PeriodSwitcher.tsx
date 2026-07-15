'use client'

import { cn } from '@shared/lib/utils'

export type Period = 'month' | 'halfyear' | 'year'

const PERIODS: { value: Period; label: string }[] = [
  { value: 'month', label: 'Месяц' },
  { value: 'halfyear', label: 'Полгода' },
  { value: 'year', label: 'Год' },
]

interface PeriodSwitcherProps {
  value: Period
  onChange: (p: Period) => void
}

export function PeriodSwitcher({ value, onChange }: PeriodSwitcherProps) {
  return (
    <div className="flex items-center gap-0.5">
      {PERIODS.map((p) => (
        <button
          key={p.value}
          type="button"
          onClick={() => onChange(p.value)}
          className={cn(
            'text-[11px] px-2 py-0.5 rounded-md transition-colors',
            value === p.value
              ? 'bg-accent text-foreground font-medium'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {p.label}
        </button>
      ))}
    </div>
  )
}

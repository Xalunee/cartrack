'use client'

import { format, formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'
import { ShieldAlert, CheckCircle2, RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useCarQuery } from '@entities/car'
import { useFinesQuery, useCheckFinesMutation, useToggleFinePaidMutation, Fine } from '@entities/fine'
import { StsDialog } from '@features/set-sts'

function FakeFineCard({ title, sum, discount }: { title: string; sum: string; discount?: string }) {
  return (
    <Card>
      <CardContent className="py-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{title}</p>
          {discount && <p className="text-xs mt-1" style={{ color: 'hsl(var(--status-soon))' }}>{discount}</p>}
        </div>
        <span className="text-sm font-semibold tabular-nums shrink-0">{sum}</span>
      </CardContent>
    </Card>
  )
}

function LockedPreview() {
  return (
    <div className="relative min-h-[420px]">
      <div className="space-y-2 blur-[6px] select-none pointer-events-none" aria-hidden="true">
        <FakeFineCard title="Превышение скорости на 20–40 км/ч" sum="500 ₽" discount="Скидка до 15.07" />
        <FakeFineCard title="Нарушение правил остановки" sum="1 500 ₽" />
        <FakeFineCard title="Проезд на запрещающий сигнал" sum="1 000 ₽" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <Card className="max-w-sm mx-4 text-center shadow-lg">
          <CardContent className="pt-8 pb-6">
            <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-muted">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <h2 className="text-base font-semibold mb-1.5">Проверка штрафов ГИБДД</h2>
            <p className="text-[13px] text-muted-foreground mb-4">
              Укажите номер СТС — и CarTrack будет проверять штрафы автоматически
              и напоминать про скидку 50% в Telegram.
            </p>
            <StsDialog trigger={<Button size="sm">Указать СТС</Button>} />
            <p className="text-[11px] text-muted-foreground mt-3">
              СТС хранится только для проверки штрафов. Можно удалить в любой момент.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function FineRow({ fine }: { fine: Fine }) {
  const toggleMutation = useToggleFinePaidMutation()
  const hasDiscount =
    fine.enableDiscount && fine.dateDiscount && new Date(fine.dateDiscount) > new Date()

  return (
    <Card className={fine.isPaid ? 'opacity-50' : undefined}>
      <CardContent className="py-3 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium line-clamp-2">{fine.koapText || 'Штраф ГИБДД'}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {[fine.koapCode, fine.dateDecision ? format(new Date(fine.dateDecision), 'd MMM yyyy', { locale: ru }) : null]
              .filter(Boolean)
              .join(' · ')}
          </p>
          {hasDiscount && fine.dateDiscount && (
            <span
              className="inline-flex mt-1.5 items-center rounded-md px-2 py-0.5 text-[11px] font-medium text-white"
              style={{ backgroundColor: 'hsl(var(--status-soon))' }}
            >
              Скидка до {format(new Date(fine.dateDiscount), 'd MMM', { locale: ru })}
            </span>
          )}
        </div>
        <div className="text-right shrink-0 space-y-1.5">
          {hasDiscount ? (
            <div>
              <div className="text-sm font-semibold tabular-nums">{(fine.sum / 2).toLocaleString('ru')} ₽</div>
              <div className="text-xs text-muted-foreground line-through tabular-nums">
                {fine.sum.toLocaleString('ru')} ₽
              </div>
            </div>
          ) : (
            <div className="text-sm font-semibold tabular-nums">{fine.sum.toLocaleString('ru')} ₽</div>
          )}
          <Button
            size="sm"
            variant={fine.isPaid ? 'outline' : 'default'}
            className="h-6 text-[11px] px-2"
            disabled={toggleMutation.isPending}
            onClick={() => toggleMutation.mutate({ id: fine.id, isPaid: !fine.isPaid })}
          >
            {fine.isPaid ? 'Оплачен' : 'Отметить оплаченным'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function FinesContent() {
  const { data, isLoading } = useFinesQuery()
  const checkMutation = useCheckFinesMutation()

  if (isLoading || !data) {
    return (
      <div className="space-y-2">
        <div className="h-16 skeleton rounded-xl" />
        <div className="h-16 skeleton rounded-xl" />
        <div className="h-16 skeleton rounded-xl" />
      </div>
    )
  }

  const unpaid = data.fines.filter((f) => !f.isPaid)
  const unpaidSum = unpaid.reduce((sum, f) => {
    const hasDiscount = f.enableDiscount && f.dateDiscount && new Date(f.dateDiscount) > new Date()
    return sum + (hasDiscount ? f.sum / 2 : f.sum)
  }, 0)
  const withDiscount = unpaid.filter(
    (f) => f.enableDiscount && f.dateDiscount && new Date(f.dateDiscount) > new Date()
  )
  const nearestDiscountDate = withDiscount
    .map((f) => new Date(f.dateDiscount!))
    .sort((a, b) => a.getTime() - b.getTime())[0]

  const sorted = [...data.fines].sort((a, b) => Number(a.isPaid) - Number(b.isPaid))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold">Штрафы</h1>
          <p className="text-sm text-muted-foreground">
            {data.lastCheckAt
              ? `Последняя проверка: ${formatDistanceToNow(new Date(data.lastCheckAt), { locale: ru, addSuffix: true })}`
              : 'Ещё не проверялось'}
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          disabled={checkMutation.isPending}
          onClick={() => checkMutation.mutate()}
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-1 ${checkMutation.isPending ? 'animate-spin' : ''}`} />
          {checkMutation.isPending ? 'Проверка...' : 'Проверить сейчас'}
        </Button>
      </div>

      {checkMutation.error && (
        <p className="text-sm text-destructive">{checkMutation.error.message}</p>
      )}

      {data.fines.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          <Card>
            <CardContent className="py-3">
              <p className="text-xs text-muted-foreground">Неоплачено</p>
              <p className="text-sm font-semibold mt-0.5 tabular-nums">
                {unpaid.length} штрафов · {unpaidSum.toLocaleString('ru')} ₽
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-3">
              <p className="text-xs text-muted-foreground">Со скидкой 50%</p>
              <p className="text-sm font-semibold mt-0.5 tabular-nums">
                {withDiscount.length}
                {nearestDiscountDate ? ` · до ${format(nearestDiscountDate, 'd MMM', { locale: ru })}` : ''}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {data.fines.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <CheckCircle2 className="h-8 w-8 mx-auto mb-2" style={{ color: 'hsl(var(--status-ok))' }} />
            <p className="text-sm font-medium">Штрафов нет. Так держать!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {sorted.map((fine) => (
            <FineRow key={fine.id} fine={fine} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function FinesPage() {
  const { data: car, isPending: carLoading } = useCarQuery()

  if (carLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4 page-enter">
        <div className="h-7 w-32 skeleton" />
        <div className="h-40 skeleton rounded-xl" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 page-enter">
      {car?.stsNumber ? <FinesContent /> : <LockedPreview />}
    </div>
  )
}

'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@shared/lib/utils'
import {
  AlertTriangle,
  ChevronRight,
  Gauge,
  HelpCircle,
  Receipt,
  Wrench,
  type LucideIcon,
} from 'lucide-react'

const TILE_CLASS = 'h-full text-left card-hover transition-colors'
/** The ring goes on the link, which is what actually takes focus. */
const TILE_WRAPPER_CLASS =
  'rounded-xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50'

interface TileBodyProps {
  icon: LucideIcon
  title: string
  description: string
}

function TileBody({ icon: Icon, title, description }: TileBodyProps) {
  return (
    <CardContent className="flex h-full flex-col gap-2 p-4">
      <Icon className="text-muted-foreground h-5 w-5" />
      <div className="space-y-0.5">
        <p className="text-sm leading-tight font-medium">{title}</p>
        <p className="text-muted-foreground text-xs leading-snug">{description}</p>
      </div>
    </CardContent>
  )
}

const linkTiles: (TileBodyProps & { href: string })[] = [
  {
    href: '/mileage',
    icon: Gauge,
    title: 'Пробег',
    description: 'Показания одометра и история записей',
  },
  {
    href: '/maintenance',
    icon: Wrench,
    title: 'Обслуживание',
    description: 'Ресурс деталей, выполненные работы и расходы',
  },
  {
    href: '/events',
    icon: AlertTriangle,
    title: 'События',
    description: 'Аварии, поломки и заметки по машине',
  },
  {
    href: '/fines',
    icon: Receipt,
    title: 'Штрафы',
    description: 'Неоплаченные штрафы ГИБДД и сроки скидки 50%',
  },
]

export function ServicePage() {
  return (
    <div className="page-enter mx-auto max-w-2xl space-y-5 px-4 py-6 md:max-w-4xl lg:max-w-5xl">
      <div className="mb-5">
        <h1 className="text-lg font-semibold tracking-tight">Сервис</h1>
        <p className="text-muted-foreground text-sm">
          Пробег, обслуживание, события и штрафы по машине
        </p>
      </div>

      <div className="stagger-children grid grid-cols-2 gap-3 lg:grid-cols-4">
        {linkTiles.map((tile) => (
          <Link key={tile.href} href={tile.href} className={TILE_WRAPPER_CLASS}>
            <Card className={TILE_CLASS}>
              <TileBody {...tile} />
            </Card>
          </Link>
        ))}
      </div>

      {/* Help is about the app, not the car, so it sits apart from the tiles. */}
      <Link href="/help" className={cn(TILE_WRAPPER_CLASS, 'block')}>
        <Card className={TILE_CLASS}>
          <CardContent className="flex items-center gap-3 p-4">
            <HelpCircle className="text-muted-foreground h-5 w-5 shrink-0" />
            <div className="space-y-0.5">
              <p className="text-sm leading-tight font-medium">Помощь и поддержка</p>
              <p className="text-muted-foreground text-xs leading-snug">
                Частые вопросы и обращение в поддержку
              </p>
            </div>
            <ChevronRight className="text-muted-foreground ml-auto h-4 w-4 shrink-0" />
          </CardContent>
        </Card>
      </Link>
    </div>
  )
}

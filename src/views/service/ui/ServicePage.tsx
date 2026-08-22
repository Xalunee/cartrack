'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { AlertTriangle, Receipt, Wrench, type LucideIcon } from 'lucide-react'

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
    <CardContent className="p-4 flex flex-col gap-2 h-full">
      <Icon className="h-5 w-5 text-muted-foreground" />
      <div className="space-y-0.5">
        <p className="text-sm font-medium leading-tight">{title}</p>
        <p className="text-xs text-muted-foreground leading-snug">{description}</p>
      </div>
    </CardContent>
  )
}

const linkTiles: (TileBodyProps & { href: string })[] = [
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
  {
    href: '/maintenance',
    icon: Wrench,
    title: 'Обслуживание',
    description: 'Ресурс деталей, выполненные работы и расходы',
  },
]

export function ServicePage() {
  return (
    <div className="max-w-2xl md:max-w-4xl lg:max-w-5xl mx-auto px-4 py-6 space-y-5 page-enter">
      <div className="mb-5">
        <h1 className="text-lg font-semibold tracking-tight">Сервис</h1>
        <p className="text-sm text-muted-foreground">
          Штрафы, история обслуживания и события по машине
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 stagger-children">
        {linkTiles.map((tile) => (
          <Link key={tile.href} href={tile.href} className={TILE_WRAPPER_CLASS}>
            <Card className={TILE_CLASS}>
              <TileBody {...tile} />
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}

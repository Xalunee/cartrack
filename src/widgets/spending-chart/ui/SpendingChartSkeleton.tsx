import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart2 } from 'lucide-react'

/**
 * Stands in for SpendingChart while its chunk is in flight — same Card, header
 * and flex-1 body as the widget's own no-data render, so nothing moves when the
 * real chart arrives.
 */
export function SpendingChartSkeleton() {
  return (
    <Card className="h-full flex flex-col" aria-hidden>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-y-2">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart2 className="h-4 w-4" />
              Расходы
            </CardTitle>
            <div className="h-3 w-16 skeleton mt-1" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-32 skeleton rounded-md" />
            <div className="h-5 w-20 skeleton" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div className="flex-1 min-h-[180px] skeleton rounded-md" />
        <div className="mt-2 space-y-1.5">
          <div className="h-4 w-full skeleton" />
          <div className="h-4 w-full skeleton" />
        </div>
      </CardContent>
    </Card>
  )
}

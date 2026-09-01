import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp } from 'lucide-react'

/**
 * Stands in for MileageTracker while its chunk is in flight. It mirrors the
 * widget's own loading render — same Card, same header row, same 4xl number
 * block, same h-32 chart placeholder — so the swap costs no layout shift.
 */
export function MileageTrackerSkeleton() {
  return (
    <Card className="h-full" aria-hidden>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-y-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Пробег
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="h-8 w-32 skeleton rounded-md" />
            <div className="h-8 w-24 skeleton rounded-md" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="h-10 w-40 skeleton" />
          <div className="h-4 w-28 skeleton mt-1" />
        </div>
        <div className="h-32 skeleton" />
      </CardContent>
    </Card>
  )
}

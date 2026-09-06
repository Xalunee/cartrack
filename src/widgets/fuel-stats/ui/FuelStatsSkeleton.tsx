import { Card, CardContent, CardHeader } from '@/components/ui/card'

/**
 * The shape the three cards settle into, so the page does not jump when the
 * Recharts chunk lands. Mirrors FuelStats: header row, chart box, footer row.
 */
export function FuelStatsSkeleton() {
  return (
    <div className="space-y-4">
      {[0, 1, 2].map((card) => (
        <Card key={card}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="skeleton h-5 w-32" />
              <div className="skeleton h-5 w-20" />
            </div>
            <div className="skeleton mt-1 h-3 w-48" />
          </CardHeader>
          <CardContent>
            <div className="skeleton h-[160px] rounded-md" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// FuelStats is deliberately NOT re-exported here. It carries Recharts, and a
// static import of this barrel would drag the library into the importing page's
// first-paint bundle — which is exactly what the dynamic import through
// @widgets/lazy-charts exists to avoid. Import the chart from there; everything
// that is safe to load eagerly lives below.
export { FuelStatsSkeleton } from './ui/FuelStatsSkeleton'
export { MissedFillUpCard } from './ui/MissedFillUpCard'

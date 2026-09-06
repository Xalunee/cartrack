// Every Recharts-bearing widget is loaded through this one module on purpose.
//
// Pointing separate `next/dynamic` calls at separate modules produced separate
// chunk groups, and each group carried its own copy of Recharts: two 343 KiB
// chunks registering the *same* 67 module ids, reselect among them. Where two
// such groups load at once — as both dashboard charts do — the second script to
// arrive re-registered ids the first had already registered, and a consumer
// sub-chunk could end up holding a namespace object whose exports were never
// assigned: Recharts' internal `createSelector` came back `undefined` and the
// chart subtree died with `(0,D.createSelector) is not a function`. Arrival
// order decides whether it happens, which is why it hit some loads and not
// others.
//
// One module means one chunk group, one registration of those ids, and one copy
// of Recharts for the whole app. A page therefore also downloads the widget code
// of charts it does not show — a few KiB of components next to the 343 KiB
// library they all share, which is the cheap side of this trade by two orders of
// magnitude. `scripts/check-chunk-graph.ts` fails the build if a second copy
// ever appears, so a new chart belongs in this file, not in a dynamic import of
// its own.
export { MileageTracker } from '@widgets/mileage-tracker/ui/MileageTracker'
export { SpendingChart } from '@widgets/spending-chart/ui/SpendingChart'
export { FuelStats } from '@widgets/fuel-stats/ui/FuelStats'

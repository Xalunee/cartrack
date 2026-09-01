// Both dashboard charts are loaded through this one module on purpose.
//
// Pointing two `next/dynamic` calls at two different modules produced two
// separate chunk groups, and each group carried its own copy of Recharts: two
// 343 KiB chunks registering the *same* 67 module ids, reselect among them. On
// the dashboard both groups load at once, so the second script to arrive
// re-registered ids the first had already registered, and a consumer sub-chunk
// could end up holding a namespace object whose exports were never assigned —
// Recharts' internal `createSelector` came back `undefined` and the chart
// subtree died with `(0,D.createSelector) is not a function`. Arrival order
// decides whether it happens, which is why it hit some loads and not others.
//
// One module means one chunk group, one registration of those ids, and one copy
// of Recharts instead of two. Both widgets always mount on this page, so
// sharing a chunk costs nothing.
export { MileageTracker } from '@widgets/mileage-tracker/ui/MileageTracker'
export { SpendingChart } from '@widgets/spending-chart/ui/SpendingChart'

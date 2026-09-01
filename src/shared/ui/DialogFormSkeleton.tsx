/**
 * Placeholder for a dialog body whose form chunk is still downloading. The
 * dialog shell itself opens instantly; this fills it for the one network
 * round-trip the form graph costs, sized like the fields it stands in for.
 */
export function DialogFormSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-4" aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-3.5 w-24 skeleton" />
          <div className="h-9 w-full skeleton rounded-md" />
        </div>
      ))}
      <div className="flex justify-end gap-2 pt-2">
        <div className="h-9 w-24 skeleton rounded-md" />
        <div className="h-9 w-24 skeleton rounded-md" />
      </div>
    </div>
  )
}

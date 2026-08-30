interface MotifProps {
  className?: string
}

/**
 * Extra automotive line-art for the auth background. These live on lucide's
 * 24x24 grid at lucide's own 1.5 stroke width so they can sit next to `Cog`,
 * `Fuel` and friends without one of them reading as heavier than the rest —
 * mixing weights is what makes a scattered background look like clip art.
 */

/** Tyre seen face-on: sidewall, rim and eight tread ticks. */
export function TyreMotif({ className }: MotifProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.2 2.2M16.9 16.9l2.2 2.2M19.1 4.9l-2.2 2.2M7.1 16.9l-2.2 2.2" />
    </svg>
  )
}

/** Long-spouted oil can. */
export function OilCanMotif({ className }: MotifProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M4 13.5A1.5 1.5 0 0 1 5.5 12H14v4.5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
      <path d="M7 12V9.5h3.5V12" />
      <path d="M14 12.5 21 7" />
      <path d="M19 6l2 1-.7 2" />
    </svg>
  )
}

/** Piston with its rings and connecting rod. */
export function PistonMotif({ className }: MotifProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M8 3h8a1 1 0 0 1 1 1v7H7V4a1 1 0 0 1 1-1z" />
      <path d="M7 6h10M7 8.5h10" />
      <path d="M12 11v5.5" />
      <circle cx="12" cy="19" r="2.5" />
    </svg>
  )
}

/** Scissor jack: arms, threaded rod, base and lifting pad. */
export function JackMotif({ className }: MotifProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 4 5.5 12 12 20l6.5-8z" />
      <path d="M8.5 3.5h7M8.5 20.5h7" />
      <path d="M5.5 12h13" />
    </svg>
  )
}

interface IllustrationProps {
  className?: string
}

export function ChartIllustration({ className }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 90 80"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* axes */}
      <path d="M14 8 L14 66 L80 66" />
      {/* rising line */}
      <path d="M22 58 L38 46 L50 52 L70 24" />
      {/* star at the peak */}
      <path d="M70 10 L72.5 17 L79.5 17 L74 21.5 L76 28.5 L70 24.5 L64 28.5 L66 21.5 L60.5 17 L67.5 17 Z" />
    </svg>
  )
}

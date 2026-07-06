interface IllustrationProps {
  className?: string
}

export function RouteIllustration({ className }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 120 60"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* dotted winding road */}
      <path
        d="M8 50 C24 50 24 20 42 20 C60 20 60 46 78 46 C92 46 96 30 100 24"
        strokeDasharray="2 7"
      />
      {/* start dot */}
      <circle cx="8" cy="50" r="3" fill="currentColor" stroke="none" />
      {/* location pin at the end */}
      <path d="M104 8 C111 8 115 13 115 19 C115 26 104 34 104 34 C104 34 93 26 93 19 C93 13 97 8 104 8 Z" />
      <circle cx="104" cy="19" r="3.5" />
    </svg>
  )
}

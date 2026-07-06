interface AccentProps {
  className?: string
}

/** Hand-drawn wavy underline for emphasizing words */
export function Underline({ className }: AccentProps) {
  return (
    <svg
      viewBox="0 0 120 12"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path d="M3 7 C22 3 38 10 58 6 C78 2 96 9 117 5" />
    </svg>
  )
}

/** Hand-drawn curved arrow pointing from text to a visual */
export function Arrow({ className }: AccentProps) {
  return (
    <svg
      viewBox="0 0 80 60"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M6 10 C30 8 58 16 68 44" />
      <path d="M58 40 L69 46 L72 34" />
    </svg>
  )
}

/** Small 4-point sparkle/star */
export function Sparkle({ className }: AccentProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 2 C12.5 7 13.5 10.5 22 12 C13.5 13.5 12.5 17 12 22 C11.5 17 10.5 13.5 2 12 C10.5 10.5 11.5 7 12 2 Z" />
    </svg>
  )
}

/** Hand-drawn circle scribble for circling a word */
export function Circle({ className }: AccentProps) {
  return (
    <svg
      viewBox="0 0 120 70"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path d="M62 6 C30 4 8 18 8 35 C8 55 42 64 68 63 C98 62 114 47 112 31 C110 16 88 6 58 7" />
    </svg>
  )
}

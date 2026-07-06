interface IllustrationProps {
  className?: string
}

export function WrenchIllustration({ className }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 80 80"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* wrench */}
      <path d="M50 22 A11 11 0 1 0 58 39 L66 47 A5 5 0 0 1 59 54 L51 46 A11 11 0 0 1 38 33 L45 40 L52 33 L45 26 Z" />
      {/* motion lines */}
      <path d="M20 20 L27 25 M14 30 L22 33 M16 44 L24 44" />
    </svg>
  )
}

interface IllustrationProps {
  className?: string
}

export function CarIllustration({ className }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 120 80"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* body */}
      <path d="M8 52 C8 46 12 44 18 44 L30 44 C34 34 42 27 55 27 L74 27 C82 27 88 31 93 40 L104 44 C110 45 113 48 113 53 L113 58 C113 60 111 61 109 61 L102 61" />
      <path d="M78 61 L40 61" />
      <path d="M16 61 L9 61 C8.5 61 8 60 8 58 Z" />
      {/* roof + windows */}
      <path d="M38 44 L45 31 M60 27 L60 44 M76 44 L72 30" />
      {/* wheels */}
      <circle cx="28" cy="61" r="9" />
      <circle cx="90" cy="61" r="9" />
      <circle cx="28" cy="61" r="2.5" />
      <circle cx="90" cy="61" r="2.5" />
      {/* headlight */}
      <path d="M107 49 L112 49" />
    </svg>
  )
}

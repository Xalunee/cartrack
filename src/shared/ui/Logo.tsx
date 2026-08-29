/**
 * The CarTrack mark: a CT monogram read as road geometry — the C is a curve
 * with a solid centre marking, the T a crossbar over a tapering stem with a
 * dashed one. The T's strokes are thinner than the C's on purpose, so the arc
 * keeps the visual weight.
 *
 * Single source for the in-app mark. The standalone copies that live outside
 * the CSS cascade (public/icons/icon.svg and the binaries generated from it)
 * repeat the same geometry with literal colours.
 */

/** The plate's own colour, doubling as the knockout for the road markings. */
const PLATE = 'var(--brand-mark)'

type LogoProps = {
  /** Rendered edge in px. The mark is drawn in viewBox units, so it scales cleanly. */
  size?: number
  className?: string
  /**
   * Accessible name. Omit where the mark sits next to a visible "CarTrack"
   * wordmark — there the SVG is decorative and announcing it just repeats.
   */
  title?: string
}

export function Logo({ size = 24, className, title }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      className={className}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      <rect width="120" height="120" rx="27" fill={PLATE} />
      <g transform="translate(41, 60)">
        <path
          d="M15.5 -23.5 A 19.5 19.5 0 1 0 15.5 23.5"
          fill="none"
          stroke="#fff"
          strokeWidth="8.2"
          strokeLinecap="round"
        />
        <path
          d="M15.5 -23.5 A 19.5 19.5 0 1 0 15.5 23.5"
          fill="none"
          stroke={PLATE}
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </g>
      <g transform="translate(83, 60)">
        <line
          x1="-14"
          y1="-24"
          x2="14"
          y2="-24"
          stroke="#fff"
          strokeWidth="7.4"
          strokeLinecap="round"
        />
        <path d="M-4.4 -20.5 L-6.4 25 L6.4 25 L4.4 -20.5 Z" fill="#fff" />
        <line
          x1="0"
          y1="-15"
          x2="0"
          y2="21"
          stroke={PLATE}
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeDasharray="3.3 4.6"
        />
      </g>
    </svg>
  )
}

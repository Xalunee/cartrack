interface IllustrationProps {
  className?: string
  /**
   * Turn the rims. Opt-in, because the car is only actually moving in the auth
   * background — on the landing page it is a still life, and wheels spinning
   * under a parked car read as a glitch rather than as life.
   */
  spinningWheels?: boolean
}

/**
 * A detailed side-view sedan — proper greenhouse, door line, wheel arches and
 * spoked rims that turn. Kept separate from `CarIllustration`, which is the
 * flatter, hand-drawn mark the landing page is built around: the two are not
 * interchangeable, and the landing must not shift when this one changes.
 */
export function CarSideIllustration({ className, spinningWheels = false }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 200 84"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* body: rear bumper, boot, roofline, bonnet, nose, then the sills with
          an arch cut out over each wheel */}
      <path d="M14 62 L14 51 C14 46 17 43 22 42 L46 38 C56 27 67 24 85 24 L104 24 C118 24 129 29 138 38 L172 43 C184 45 190 49 190 55 L190 62 L166 62 A14 14 0 0 0 138 62 L66 62 A14 14 0 0 0 38 62 Z" />

      {/* greenhouse: rear window, B-pillar gap, front window with the A-pillar rake */}
      <path d="M50 39 L59 29 L79 29 L79 39 Z" />
      <path d="M86 39 L86 29 L104 29 C112 29 119 32 126 39 Z" />

      {/* door shut line and handle */}
      <path d="M82 39 L82 59" />
      <path d="M92 45 L99 45" />

      {/* wing mirror */}
      <path d="M126 35 L133 33" />

      {/* lights */}
      <path d="M184 50 L189 50" />
      <path d="M15 48 L21 48" />

      {/* Wheels. The tyre stays put and only the rim turns inside it — a rotating
          circle is invisible, and spinning the outline too would make the whole
          wheel look like it wobbles if the arcs are ever a pixel off centre.
          transform-box is set explicitly: where the default is still border-box
          the origin resolves against the group's own bounding box, which puts it
          outside the rim and makes the disc orbit the car instead of spinning.
          Under view-box the px origin is read in viewBox user units, so it also
          survives any change of rendered size. */}
      <circle cx="52" cy="62" r="14" />
      <g
        className={spinningWheels ? 'wheel-spin' : undefined}
        style={{ transformBox: 'view-box', transformOrigin: '52px 62px' }}
      >
        <circle cx="52" cy="62" r="6" />
        <path d="M52 52 L52 56 M52 68 L52 72 M42 62 L46 62 M58 62 L62 62" />
        {/* valve stem: breaks the rim's four-fold symmetry so the spin reads as
            one turn instead of four indistinguishable quarters */}
        <path d="M59 55 L61 53" />
      </g>
      <circle cx="152" cy="62" r="14" />
      <g
        className={spinningWheels ? 'wheel-spin' : undefined}
        style={{ transformBox: 'view-box', transformOrigin: '152px 62px' }}
      >
        <circle cx="152" cy="62" r="6" />
        <path d="M152 52 L152 56 M152 68 L152 72 M142 62 L146 62 M158 62 L162 62" />
        <path d="M159 55 L161 53" />
      </g>
    </svg>
  )
}

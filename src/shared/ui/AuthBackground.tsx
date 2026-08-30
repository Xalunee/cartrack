import { Cog, Droplet, Gauge } from 'lucide-react'

import {
  CarSideIllustration,
  RouteIllustration,
  WrenchIllustration,
  Sparkle,
} from './illustrations'

/**
 * Decoration behind the login and register cards. Everything here is
 * `aria-hidden` and non-interactive: it exists to make the only two screens a
 * signed-out person sees look like part of the app, and it must never take a
 * click meant for the form on top of it.
 *
 * The side pieces are hidden below `sm` — at 375px they would sit under the
 * card rather than around it — while the road and the gradient stay on every
 * width, so the small screen still gets the motif.
 */
export function AuthBackground() {
  return (
    <div
      aria-hidden="true"
      className="gradient-mesh-auth pointer-events-none absolute inset-0 overflow-hidden select-none"
    >
      <div className="text-foreground absolute inset-0 opacity-[0.07] dark:opacity-[0.09]">
        <WrenchIllustration className="absolute top-[8%] left-[6%] hidden size-24 sm:block" />
        <RouteIllustration className="absolute top-[12%] right-[5%] hidden w-40 sm:block" />
        <Cog className="absolute top-[38%] left-[12%] hidden size-10 sm:block" strokeWidth={1.5} />
        <Gauge
          className="absolute right-[12%] bottom-[30%] hidden size-12 sm:block"
          strokeWidth={1.5}
        />
        <Droplet
          className="absolute top-[22%] left-[24%] hidden size-7 sm:block"
          strokeWidth={1.5}
        />
        <Sparkle className="absolute top-[62%] right-[28%] hidden size-5 sm:block" />
      </div>

      {/* Road: a solid verge, a dashed centre line that scrolls, and a car
          crossing it. Both animations stop under prefers-reduced-motion. */}
      <div className="text-foreground absolute inset-x-0 bottom-0 h-32">
        <div className="absolute inset-x-0 bottom-12 h-px bg-current opacity-[0.14]" />
        <svg
          className="absolute inset-x-0 bottom-[22px] h-2 w-full opacity-[0.12]"
          viewBox="0 0 1200 8"
          preserveAspectRatio="none"
          fill="none"
        >
          <path
            d="M0 4 H1200"
            stroke="currentColor"
            strokeWidth={2}
            strokeDasharray="28 22"
            className="auth-lane"
          />
        </svg>
        <div className="auth-drive absolute bottom-[26px] left-0">
          <CarSideIllustration spinningWheels className="w-32 opacity-[0.13] dark:opacity-[0.16]" />
        </div>
      </div>
    </div>
  )
}

import { Battery, Cog, Droplet, Fuel, Gauge, KeyRound, Milestone, TrafficCone } from 'lucide-react'

import {
  CarSideIllustration,
  JackMotif,
  OilCanMotif,
  PistonMotif,
  RouteIllustration,
  Sparkle,
  TyreMotif,
  WrenchIllustration,
} from './illustrations'

/**
 * Decoration behind the login and register cards. Everything here is
 * `aria-hidden` and non-interactive: it exists to make the only two screens a
 * signed-out person sees look like part of the app, and it must never take a
 * click meant for the form on top of it.
 *
 * The side pieces are hidden below `sm` — at 375px the card is 343px of a
 * 375px viewport, so there are no side gaps left to put anything in. What a
 * phone does have is the strip above the card: measured, the taller of the two
 * cards (register, 444px) still starts 112px down on the shortest phone worth
 * supporting, so a shallow band across the top is free on every handset. The
 * `sm:hidden` icons live there, and the road and the gradient stay on every
 * width, so the small screen gets the motif rather than a bare gradient.
 *
 * Two layers, not one. The outer layer is the larger, slightly stronger set
 * pinned to the edges; the inner layer is smaller and fainter and creeps in
 * toward the card, so density falls off as you move to the middle instead of
 * leaving a hole. The inner layer waits for `lg`: the card is a fixed 24rem, so
 * below 1024px the band those icons occupy is underneath the card rather than
 * beside it. Nothing in either layer enters the centre column — the card is the
 * only reason the page exists, and the background must not compete with it.
 */
export function AuthBackground() {
  return (
    <div
      aria-hidden="true"
      className="gradient-mesh-auth pointer-events-none absolute inset-0 overflow-hidden select-none"
    >
      {/* Outer layer: the big shapes, hugging the edges. */}
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
        <PistonMotif className="absolute top-[19%] left-[12%] hidden size-11 rotate-[12deg] sm:block" />
        <TyreMotif className="absolute top-[55%] left-[7%] hidden size-14 -rotate-[8deg] sm:block" />
        <OilCanMotif className="absolute top-[76%] left-[9%] hidden size-11 rotate-[6deg] sm:block" />
        <Fuel
          className="absolute top-[70%] left-[4%] hidden size-9 -rotate-[6deg] sm:block"
          strokeWidth={1.5}
        />
        <KeyRound
          className="absolute top-[46%] right-[6%] hidden size-9 rotate-[18deg] sm:block"
          strokeWidth={1.5}
        />
        <JackMotif className="absolute top-[28%] right-[17%] hidden size-9 sm:block" />
        <Milestone
          className="absolute top-[72%] right-[10%] hidden size-11 -rotate-[4deg] sm:block"
          strokeWidth={1.5}
        />
        <Battery
          className="absolute right-[7%] bottom-[10%] hidden size-10 rotate-[8deg] sm:block"
          strokeWidth={1.5}
        />
        <TrafficCone
          className="absolute top-[5%] right-[14%] hidden size-8 sm:block"
          strokeWidth={1.5}
        />

        {/* Phones: the top band only, and nothing below 13% of the height —
            that is where the register card starts on a 667px screen. */}
        <Cog
          className="absolute top-[3%] left-[8%] size-8 rotate-[10deg] sm:hidden"
          strokeWidth={1.5}
        />
        <KeyRound
          className="absolute top-[3%] right-[13%] size-7 -rotate-[18deg] sm:hidden"
          strokeWidth={1.5}
        />
        <TyreMotif className="absolute top-[8%] left-[24%] size-6 sm:hidden" />
        <Sparkle className="absolute top-[9%] right-[6%] size-4 sm:hidden" />
      </div>

      {/* Inner layer: smaller, fainter, and allowed nearer the card. */}
      <div className="text-foreground absolute inset-0 opacity-[0.04] dark:opacity-[0.055]">
        <TyreMotif className="absolute top-[31%] left-[22%] hidden size-6 lg:block" />
        <Cog
          className="absolute top-[52%] left-[25%] hidden size-7 rotate-[20deg] lg:block"
          strokeWidth={1.5}
        />
        <Sparkle className="absolute top-[24%] left-[26%] hidden size-4 lg:block" />
        <Gauge className="absolute top-[80%] left-[21%] hidden size-6 lg:block" strokeWidth={1.5} />
        <PistonMotif className="absolute top-[66%] left-[26%] hidden size-6 -rotate-[14deg] lg:block" />
        <Sparkle className="absolute top-[62%] right-[24%] hidden size-4 lg:block" />
        <Droplet
          className="absolute top-[74%] right-[26%] hidden size-5 lg:block"
          strokeWidth={1.5}
        />
        <Fuel
          className="absolute top-[40%] right-[22%] hidden size-6 rotate-[8deg] lg:block"
          strokeWidth={1.5}
        />
        <KeyRound
          className="absolute top-[17%] right-[23%] hidden size-6 -rotate-[22deg] lg:block"
          strokeWidth={1.5}
        />
        <OilCanMotif className="absolute top-[87%] right-[20%] hidden size-6 lg:block" />

        {/* Phones again: the two nearest the middle of the top band, fainter and
            smaller than the pair at its edges, so the falloff toward the centre
            reads the same as it does on a desktop. */}
        <Droplet className="absolute top-[4%] left-[45%] size-5 sm:hidden" strokeWidth={1.5} />
        <Fuel
          className="absolute top-[9%] right-[33%] size-5 rotate-[8deg] sm:hidden"
          strokeWidth={1.5}
        />
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
          {/* Exhaust smoke. Kept out of `CarSideIllustration` on purpose: the
              plume needs room to leave the car's 200x84 viewBox, and widening
              that box would change the aspect ratio the landing page sizes the
              same car by. Instead it rides along inside `.auth-drive`, offset
              so the puffs start at the pipe: the car renders 128px wide from a
              200-unit box, so a user unit is 0.64px and the tip at (12, 67.5)
              lands 7.7px from the left edge and 10.6px up from the bottom.
              `overflow-visible` lets the puffs drift past the box. */}
          <svg
            className="absolute bottom-[3px] left-[-35px] size-12 overflow-visible opacity-[0.07] blur-[1.5px] dark:opacity-[0.1]"
            viewBox="0 0 52 52"
            fill="currentColor"
            stroke="none"
          >
            <circle className="auth-puff auth-puff-1" cx="46" cy="44" r="3" />
            <circle className="auth-puff auth-puff-2" cx="44" cy="42" r="4" />
            <circle className="auth-puff auth-puff-3" cx="47.5" cy="41.5" r="3.5" />
            <circle className="auth-puff auth-puff-4" cx="45" cy="43.5" r="4.5" />
          </svg>
          <CarSideIllustration
            spinningWheels
            exhaust
            className="w-32 opacity-[0.13] dark:opacity-[0.16]"
          />
        </div>
      </div>
    </div>
  )
}

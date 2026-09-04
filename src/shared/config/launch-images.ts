/**
 * iOS launch images — the picture the system shows between the tap on the home
 * screen icon and the app's first paint.
 *
 * An installed iOS web app gets no loading indicator of its own: until the HTML
 * paints, the screen is a flat fill of the manifest's `background_color`. This
 * table is what turns that blank into the mark on the app's own background.
 *
 * It lives here because two places need to agree on it exactly:
 * `scripts/generate-icons.ts` writes one PNG per device per colour scheme, and
 * `src/app/layout.tsx` emits the `<link>` that claims it. Adding a device to
 * one and not the other yields either an unclaimed file or a 404 behind a
 * media query — both silent.
 */

/**
 * A device's *logical* viewport and its pixel ratio. Those are what the `media`
 * attribute matches on; the file's pixel dimensions are the product of the two.
 *
 * Portrait only: the manifest locks orientation, so landscape entries would
 * never match.
 */
export interface LaunchDevice {
  width: number
  height: number
  ratio: number
}

export const LAUNCH_DEVICES: readonly LaunchDevice[] = [
  { width: 320, height: 568, ratio: 2 }, // SE (1st gen)
  { width: 375, height: 667, ratio: 2 }, // 8, SE (2nd/3rd gen)
  { width: 414, height: 736, ratio: 3 }, // 8 Plus
  { width: 375, height: 812, ratio: 3 }, // X, XS, 11 Pro, 12/13 mini
  { width: 414, height: 896, ratio: 2 }, // XR, 11
  { width: 414, height: 896, ratio: 3 }, // XS Max, 11 Pro Max
  { width: 390, height: 844, ratio: 3 }, // 12, 13, 14
  { width: 428, height: 926, ratio: 3 }, // 12/13 Pro Max, 14 Plus
  { width: 393, height: 852, ratio: 3 }, // 14 Pro, 15, 15 Pro, 16
  { width: 430, height: 932, ratio: 3 }, // 14 Pro Max, 15 Plus/Pro Max, 16 Plus
  { width: 402, height: 874, ratio: 3 }, // 16 Pro
  { width: 440, height: 956, ratio: 3 }, // 16 Pro Max
]

export const LAUNCH_SCHEMES = ['light', 'dark'] as const
export type LaunchScheme = (typeof LAUNCH_SCHEMES)[number]

/**
 * The app's own `--background`, from src/app/globals.css. iOS paints its fill
 * behind the image, so a mismatch reads as a flash of the wrong colour.
 */
export const LAUNCH_BACKGROUNDS: Record<LaunchScheme, string> = {
  light: '#fafafa',
  dark: '#121212',
}

/** Mark width as a share of the screen's shorter edge. */
export const LAUNCH_MARK_SHARE = 0.22

export function launchImagePath(device: LaunchDevice, scheme: LaunchScheme): string {
  return `/icons/startup/${device.width * device.ratio}x${device.height * device.ratio}-${scheme}.png`
}

/**
 * Safari matches a startup image on the logical viewport and the pixel ratio,
 * never on the file's own size — two devices can share a resolution and still
 * need different entries.
 */
export function launchImageMedia(device: LaunchDevice, scheme: LaunchScheme): string {
  return [
    `(device-width: ${device.width}px)`,
    `(device-height: ${device.height}px)`,
    `(-webkit-device-pixel-ratio: ${device.ratio})`,
    '(orientation: portrait)',
    `(prefers-color-scheme: ${scheme})`,
  ].join(' and ')
}

import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Providers } from '@app/providers'
import { OfflineBanner } from '@shared/ui/OfflineBanner'
import {
  LAUNCH_BACKGROUNDS,
  LAUNCH_DEVICES,
  LAUNCH_SCHEMES,
  launchImageMedia,
  launchImagePath,
} from '@shared/config/launch-images'
import './globals.css'

// The interface is Russian throughout, so Cyrillic is not an extra — without it
// every heading and label fell back to whatever the system had.
const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin', 'cyrillic'] })

// `preload: false` because the mono face is used on two routes — the error
// page's stack trace, and the code and STS fields in settings — yet the
// preload link sits in the layout, so every route paid for the file up front.
// It now loads on the routes that render it.
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  preload: false,
})

export const metadata: Metadata = {
  title: 'CarTrack — знай свою машину',
  description: 'Трекер обслуживания автомобиля',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'CarTrack',
    // The launch image is the only loading indicator an installed iOS web app
    // gets: until the HTML paints there is nothing on screen but a flat fill of
    // the manifest's `background_color`. Safari matches at most one of these
    // and ignores the rest, so the list costs one ~25 KB request on launch.
    // A device the table misses falls back to that flat fill, which is why
    // `background_color` has to stay truthful.
    startupImage: LAUNCH_DEVICES.flatMap((device) =>
      LAUNCH_SCHEMES.map((scheme) => ({
        url: launchImagePath(device, scheme),
        media: launchImageMedia(device, scheme),
      }))
    ),
  },
  icons: {
    // src/app/favicon.ico (16/32/48) is linked by Next's file convention on its
    // own, so listing it here would only duplicate the tag. These two cover the
    // clients that prefer a vector or a large bitmap over the .ico.
    icon: [
      { url: '/icons/icon.svg', type: 'image/svg+xml' },
      { url: '/icons/icon-192.png', type: 'image/png', sizes: '192x192' },
    ],
    apple: '/icons/icon-192.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  // Both values are `--background` from globals.css, matching
  // LAUNCH_BACKGROUNDS. They used to be #ffffff/#0a0a0a, a shade off the page
  // in either theme, which showed as a seam against the browser's own chrome.
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: LAUNCH_BACKGROUNDS.light },
    { media: '(prefers-color-scheme: dark)', color: LAUNCH_BACKGROUNDS.dark },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>{children}</Providers>
        <OfflineBanner />
      </body>
    </html>
  )
}

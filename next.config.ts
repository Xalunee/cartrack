import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // public/sw.js is now a tombstone whose only job is to unregister the
        // service worker we used to ship. A client only runs it once the
        // browser fetches a *new* script at this URL, so the file must never be
        // answered from a cache — that would leave the old worker, and its
        // network-first navigation handler, in charge for another day.
        source: '/sw.js',
        headers: [{ key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' }],
      },
    ]
  },
};

export default withSentryConfig(nextConfig, {
  // No auth token for GlitchTip, so nothing is uploaded at build time. Stack
  // traces stay minified until an org/project slug and an auth token exist.
  sourcemaps: { disable: true },
  // Build-time telemetry would go to sentry.io, which is not our instance.
  telemetry: false,
  // Creating a release needs an auth token we do not have; skipping it keeps the
  // build output clean. Events still group fine without one.
  release: { create: false },
});

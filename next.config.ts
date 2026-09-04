import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

// Identifies the build to the client, where it busts the persisted React Query
// cache so yesterday's shape is never hydrated into today's markup.
//
// Derived here, from the plain VERCEL_* variables, because those are always
// present in the build environment — the NEXT_PUBLIC_ variants are only there if
// the project happens to expose system variables, and a buster that quietly
// falls back to a constant is a buster that never busts. Assigned onto the
// process so Next inlines it the same way it inlines any other NEXT_PUBLIC_ value.
//
// Empty counts as absent. A variable that exists but is blank is the ordinary
// shape of a misconfigured CI step, and `??` would happily carry it through and
// pin the buster to "" for every build after it.
process.env.NEXT_PUBLIC_BUILD_ID =
  [
    process.env.NEXT_PUBLIC_BUILD_ID,
    process.env.VERCEL_DEPLOYMENT_ID,
    process.env.VERCEL_GIT_COMMIT_SHA,
  ].find(Boolean) ?? 'dev';

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

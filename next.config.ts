import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  /* config options here */
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

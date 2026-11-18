import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Dev assets are blocked for non-localhost origins by default. The app is
  // opened at 127.0.0.1:3100, so allow that hostname to hydrate correctly.
  allowedDevOrigins: ["127.0.0.1"],
  // The workspace root also contains an unrelated portfolio lockfile. Pinning
  // the Turbopack root here keeps module resolution inside this app.
  turbopack: { root: __dirname },
  // Curriculum pages opt into `force-dynamic` individually so no stale
  // vocabulary is ever prerendered from the live providers.
};

export default nextConfig;

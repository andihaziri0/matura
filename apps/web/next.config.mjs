import { withSentryConfig } from '@sentry/nextjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@matura/shared', '@matura/sdk', '@matura/ui'],
  experimental: {
    typedRoutes: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: '**.r2.cloudflarestorage.com' },
      { protocol: 'https', hostname: '**.r2.dev' },
      { protocol: 'https', hostname: '**.akademiaas.com' },
    ],
  },
  // Workspace packages (`@matura/*`) ship TypeScript sources with NodeNext-style
  // `.js` import specifiers (e.g. `import './enums.js'` resolving to `enums.ts`).
  // Next/webpack does not apply that mapping for `transpilePackages` by default,
  // so map the extensions explicitly here. Matches `moduleResolution: "Bundler"`
  // in `tsconfig.base.json`.
  webpack: (config) => {
    config.resolve.extensionAlias = {
      ...(config.resolve.extensionAlias ?? {}),
      '.js': ['.ts', '.tsx', '.js'],
      '.mjs': ['.mts', '.mjs'],
    };
    return config;
  },
};

// Wrap with Sentry. When SENTRY_AUTH_TOKEN / SENTRY_ORG / SENTRY_PROJECT are
// missing (local dev, CI), source-map upload is silently skipped — the runtime
// SDK still works. `silent: !process.env.CI` keeps the build log clean locally.
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,

  // Don't generate the Sentry tunnel route; we don't proxy events through our
  // own domain. If ad-blockers become a problem we can revisit.
  tunnelRoute: undefined,

  // Hide source maps from the public bundle but still upload them to Sentry.
  hideSourceMaps: true,

  // Auto-instrument Vercel cron monitors when added.
  webpack: {
    automaticVercelMonitors: true,
  },
});

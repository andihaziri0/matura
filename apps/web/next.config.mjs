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

export default nextConfig;

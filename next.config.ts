import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/lib/i18n/request.ts');

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Burmese font rendering + low-3G PWA target
  experimental: {
    optimizePackageImports: ['@telegram-apps/sdk'],
  },
};

export default withNextIntl(nextConfig);
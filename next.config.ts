import type {NextConfig} from 'next';
import { withSentryConfig } from '@sentry/nextjs';

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          ...securityHeaders,
          {
            key: 'X-Robots-Tag',
            value: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
          },
        ],
      },
      {
        source: '/(.*)\\.(ico|png|jpg|jpeg|webp|avif|svg|woff2|woff)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },

    ];
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    deviceSizes: [390, 640, 768, 1024, 1200, 1920],
    imageSizes: [48, 96, 192, 384],
    formats: ['image/avif', 'image/webp'],
    qualities: [75],
    minimumCacheTTL: 604800,
    remotePatterns: [],
  },
  env: {
    NEXT_PUBLIC_BUILD_ID: process.env.NEXT_BUILD_ID ?? Date.now().toString(),
  },
  experimental: {
    optimizePackageImports: ['lucide-react', '@xyflow/react', 'dagre', 'motion'],
  },
};

export default withSentryConfig(nextConfig, {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  widenClientFileUpload: true,
  disableLogger: true,
});


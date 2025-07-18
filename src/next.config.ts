import type {NextConfig} from 'next';

const isDev = process.env.NODE_ENV !== 'production';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      }
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: isDev
              ? "frame-ancestors 'self' https://*.firebase.app https://*.web.app https://*.cloudworkstations.dev; upgrade-insecure-requests; connect-src 'self' ws: wss: https:;"
              : "frame-ancestors 'self' https://*.firebase.app https://*.web.app; upgrade-insecure-requests; connect-src 'self' wss: https:;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

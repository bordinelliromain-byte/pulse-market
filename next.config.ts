import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'maps.googleapis.com' },
      { protocol: 'https', hostname: 'maps.gstatic.com' },
    ],
  },

  async redirects() {
    return [
      {
        source: '/',
        has: [{ type: 'host', value: 'whatmarket.fr' }],
        destination: '/whatmarket',
        permanent: false,
      },
      {
        source: '/',
        has: [{ type: 'host', value: 'www.whatmarket.fr' }],
        destination: '/whatmarket',
        permanent: false,
      },
    ]
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self), payment=()' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://client.crisp.chat https://js.stripe.com https://maps.googleapis.com",
              "style-src 'self' 'unsafe-inline' https://client.crisp.chat https://fonts.googleapis.com https://unpkg.com",
              // ✅ Unsplash + Supabase + Google Maps images
              "img-src 'self' data: blob: https://*.supabase.co https://client.crisp.chat https://*.crisp.chat https://image.crisp.chat https://images.unsplash.com https://maps.googleapis.com https://maps.gstatic.com https://*.googleapis.com",
              "font-src 'self' https://client.crisp.chat https://fonts.gstatic.com",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://client.crisp.chat wss://client.crisp.chat wss://client.relay.crisp.chat wss://client.relay.rescue.crisp.chat https://maps.googleapis.com",
              // ✅ Google Maps iframes
              "frame-src https://js.stripe.com https://hooks.stripe.com https://www.google.com https://maps.google.com",
              "worker-src blob:",
            ].join('; ')
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' },
        ],
      },
    ]
  },
};

export default nextConfig;
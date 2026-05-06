import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
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
          // Empêche le clickjacking (ton site dans une iframe d'un autre site)
          { key: 'X-Frame-Options', value: 'DENY' },

          // Empêche le MIME sniffing (exécution de fichiers déguisés)
          { key: 'X-Content-Type-Options', value: 'nosniff' },

          // Force HTTPS pour 1 an
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },

          // Bloque les infos de navigation (referrer)
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },

          // Désactive les fonctionnalités sensibles du navigateur
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },

          // Content Security Policy — contrôle ce qui peut s'exécuter sur tes pages
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://client.crisp.chat https://js.stripe.com https://maps.googleapis.com",
              "style-src 'self' 'unsafe-inline' https://client.crisp.chat",
              "img-src 'self' data: blob: https://*.supabase.co https://client.crisp.chat https://*.crisp.chat https://image.crisp.chat",
              "font-src 'self' https://client.crisp.chat",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://client.crisp.chat wss://client.crisp.chat https://api-iam.intercom.io",
              "frame-src https://js.stripe.com https://hooks.stripe.com",
              "worker-src blob:",
            ].join('; ')
          },
        ],
      },

      // Headers spécifiques aux routes API — plus stricts
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
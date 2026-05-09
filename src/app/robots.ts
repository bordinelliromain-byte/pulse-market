import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard',
          '/dashboard/',
          '/api/',
          '/auth/callback',
          '/auth/reset',
        ],
      },
    ],
    sitemap: 'https://pulse-market.fr/sitemap.xml',
  }
}
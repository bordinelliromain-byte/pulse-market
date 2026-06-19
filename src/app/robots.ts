import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // ═══════════════════════════════════════
      // RÈGLE GÉNÉRALE — Tous les bots
      // ═══════════════════════════════════════
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          // Espaces privés
          '/dashboard',
          '/dashboard/',
          // API et backend
          '/api/',
          // Auth (callbacks et resets)
          '/auth/callback',
          '/auth/reset',
          // Pages de vérification AOT (privées)
          '/verif/',
          // Pages internes
          '/admin',
          '/_next/',
        ],
      },

      // ═══════════════════════════════════════
      // GOOGLEBOT — Règles spécifiques
      // ═══════════════════════════════════════
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/dashboard',
          '/api/',
          '/admin',
        ],
      },

      // ═══════════════════════════════════════
      // BLOQUE LES BOTS NUISIBLES (économise ton budget de crawl)
      // ═══════════════════════════════════════
      {
        userAgent: ['SemrushBot', 'AhrefsBot', 'DotBot'],
        disallow: '/',
      },
    ],
    sitemap: 'https://pulse-market.fr/sitemap.xml',
    host: 'https://pulse-market.fr',
  }
}
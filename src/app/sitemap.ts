import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://pulse-market.fr'
  const now = new Date()

  return [
    // ═══════════════════════════════════════
    // PAGES PRINCIPALES — Priorité MAX
    // ═══════════════════════════════════════
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0,
    },

    // ✅ NOUVEAU : page devis (entonnoir de conversion)
    {
      url: `${baseUrl}/devis`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.95,
    },

    // ═══════════════════════════════════════
    // PAGES D'AUTHENTIFICATION
    // ═══════════════════════════════════════
    {
      url: `${baseUrl}/auth`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/auth/mairie`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },

    // ═══════════════════════════════════════
    // PAGES LÉGALES — Indexables mais priorité basse
    // ═══════════════════════════════════════
    {
      url: `${baseUrl}/mentions-legales`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/cgu`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/confidentialite`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/cgv`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]
}
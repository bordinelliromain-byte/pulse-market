// src/lib/seo.ts
// ── Utilitaires SEO centralisés ─────────────────────────────────────────

// Génère un slug propre depuis n'importe quelle string
export function toSlug(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')   // supprime accents
    .replace(/[^a-z0-9\s-]/g, '')      // supprime caractères spéciaux
    .trim()
    .replace(/\s+/g, '-')              // espaces → tirets
    .replace(/-+/g, '-')               // tirets multiples → un seul
}

// Extrait la ville depuis location_name
export function extractVille(locationName: string): string {
  if (!locationName) return ''
  const parts = locationName.split(',')
  return parts[parts.length - 1]?.trim() || parts[0]?.trim() || locationName
}

// Alt tag dynamique pour une image de marché
export function altMarche(eventTitle: string, ville?: string): string {
  if (ville) return `${eventTitle} — Marché de ${ville}`
  return `${eventTitle} — Marché local`
}

// Alt tag dynamique pour une image d'exposant
export function altExposant(nom: string, ville?: string, produits?: string): string {
  if (ville && produits) return `Stand de ${nom} — ${produits} au marché de ${ville}`
  if (ville) return `Stand de ${nom} au marché de ${ville}`
  return `Exposant ${nom} — Marché local`
}

// Alt tag pour les logos
export function altLogo(brand: 'PulseMarket' | 'Whatmarket'): string {
  return brand === 'PulseMarket'
    ? 'PulseMarket — Gestion numérique des marchés municipaux'
    : 'Whatmarket — Découvrez les marchés locaux près de chez vous'
}

// Génère le titre SEO d'une page forain
export function titleForain(nom: string, ville?: string): string {
  if (ville) return `${nom} — Exposant au marché de ${ville} | Whatmarket`
  return `${nom} — Exposant sur les marchés locaux | Whatmarket`
}

// Génère la description SEO d'une page forain
export function descriptionForain(nom: string, produits?: string, ville?: string): string {
  const prod = produits || 'produits locaux'
  const loc = ville ? `au marché de ${ville}` : 'sur les marchés locaux'
  return `Découvrez le stand de ${nom} — ${prod} ${loc}. Infos pratiques, emplacement et horaires sur Whatmarket.`
}
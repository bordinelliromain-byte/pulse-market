import DOMPurify from 'isomorphic-dompurify'

/**
 * Nettoie une string — supprime tout HTML et JavaScript
 * Utilisé avant chaque INSERT/UPDATE en base de données
 */
export function sanitize(input: string): string {
  if (!input || typeof input !== 'string') return ''
  return DOMPurify.sanitize(input.trim(), {
    ALLOWED_TAGS: [],   // aucun tag HTML autorisé
    ALLOWED_ATTR: [],   // aucun attribut autorisé
  })
}

/**
 * Nettoie un objet entier — applique sanitize sur toutes les strings
 */
export function sanitizeAll<T extends Record<string, any>>(obj: T): T {
  const clean: Record<string, any> = {}
  for (const [key, val] of Object.entries(obj)) {
    if (typeof val === 'string') {
      clean[key] = sanitize(val)
    } else {
      clean[key] = val
    }
  }
  return clean as T
}
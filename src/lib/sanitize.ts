// src/lib/sanitize.ts
// ═════════════════════════════════════════════════════════════
// PULSEMARKET — Sanitization sans dépendance externe
// Compatible Vercel/serverless (pas de jsdom, DOMPurify, etc.)
// ═════════════════════════════════════════════════════════════

/**
 * Sanitize une string : échappe les caractères HTML dangereux
 * Protection anti-XSS pour les inputs utilisateur.
 *
 * Usage :
 *   const safe = sanitize(userInput)
 *   // <script>alert('xss')</script> → &lt;script&gt;alert(&#39;xss&#39;)&lt;/script&gt;
 */
export function sanitize(input: any): string {
  if (input === null || input === undefined) return ''
  const str = String(input)
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/\//g, '&#x2F;')
    .replace(/`/g, '&#x60;')
    .replace(/=/g, '&#x3D;')
}

/**
 * Sanitize tous les champs string d'un objet (récursif).
 *
 * Usage :
 *   const safe = sanitizeAll({ name: '<script>', count: 5, nested: { x: 'y' } })
 *   // → { name: '&lt;script&gt;', count: 5, nested: { x: 'y' } }
 */
export function sanitizeAll<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj

  // String → sanitize
  if (typeof obj === 'string') {
    return sanitize(obj) as any
  }

  // Number, boolean → garder tel quel
  if (typeof obj === 'number' || typeof obj === 'boolean') {
    return obj
  }

  // Array → récursif sur chaque élément
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeAll(item)) as any
  }

  // Object → récursif sur chaque valeur
  if (typeof obj === 'object') {
    const result: any = {}
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        result[key] = sanitizeAll((obj as any)[key])
      }
    }
    return result as T
  }

  return obj
}

/**
 * Sanitize spécifiquement pour insertion dans HTML (plus strict).
 * À utiliser quand tu mets une valeur dans un template HTML.
 */
export function sanitizeHtml(input: any): string {
  return sanitize(input)
}

/**
 * Sanitize pour SQL — déjà géré par Supabase/Postgres mais au cas où.
 * Retire les caractères dangereux pour SQL.
 */
export function sanitizeSql(input: any): string {
  if (input === null || input === undefined) return ''
  return String(input).replace(/['";\\]/g, '')
}

/**
 * Sanitize un email : trim + lowercase + remove dangerous chars
 */
export function sanitizeEmail(input: any): string {
  if (!input) return ''
  return String(input)
    .trim()
    .toLowerCase()
    .replace(/[<>'"]/g, '')
}

/**
 * Sanitize un nom : trim + remove HTML tags
 */
export function sanitizeName(input: any): string {
  if (!input) return ''
  return String(input)
    .trim()
    .replace(/<[^>]*>/g, '')
    .substring(0, 200)
}
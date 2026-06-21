// src/lib/validation.ts
// ═════════════════════════════════════════════════════════════
// PULSEMARKET — Validation centralisée avec Zod
// Schémas réutilisables + helpers pour API routes
// ═════════════════════════════════════════════════════════════

import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'

// ═════════════════════════════════════════════════════════════
// SCHEMAS DE BASE
// ═════════════════════════════════════════════════════════════

// ─── Email ───
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('Email invalide')
  .max(254, 'Email trop long')

// ─── UUID Supabase ───
export const uuidSchema = z
  .string()
  .uuid('UUID invalide')

// ─── Texte court (nom, titre, etc.) ───
export const shortTextSchema = z
  .string()
  .trim()
  .min(1, 'Champ requis')
  .max(200, 'Texte trop long (max 200)')

// ─── Texte long (message, description) ───
export const longTextSchema = z
  .string()
  .trim()
  .max(5000, 'Texte trop long (max 5000)')
  .optional()

// ─── SIREN (9 chiffres) ───
export const sirenSchema = z
  .string()
  .regex(/^\d{9}$/, 'SIREN invalide (9 chiffres requis)')

// ─── SIRET (14 chiffres) ───
export const siretSchema = z
  .string()
  .regex(/^\d{14}$/, 'SIRET invalide (14 chiffres requis)')

// ─── Téléphone FR ───
export const phoneSchema = z
  .string()
  .regex(/^(\+33|0)[1-9]\d{8}$/, 'Téléphone invalide')
  .optional()

// ─── URL HTTPS uniquement ───
export const httpsUrlSchema = z
  .string()
  .url('URL invalide')
  .refine(url => url.startsWith('https://'), 'HTTPS requis')

// ─── Montant en euros (centimes) ───
export const amountSchema = z
  .number()
  .int('Montant doit être un entier')
  .min(50, 'Montant minimum 0.50€')
  .max(10000000, 'Montant maximum 100 000€')

// ─── Mot de passe fort ───
export const passwordSchema = z
  .string()
  .min(8, 'Minimum 8 caractères')
  .max(72, 'Maximum 72 caractères') // limite bcrypt
  .refine(p => /[A-Z]/.test(p), 'Au moins 1 majuscule')
  .refine(p => /[a-z]/.test(p), 'Au moins 1 minuscule')
  .refine(p => /\d/.test(p), 'Au moins 1 chiffre')

// ─── Rôle ───
export const roleSchema = z.enum(['exposant', 'organisateur', 'placier'])

// ─── Statut candidature ───
export const candidatureStatusSchema = z.enum(['pending', 'validated', 'rejected', 'paid', 'present'])

// ─── Rôle équipe ───
export const teamRoleSchema = z.enum(['admin', 'editeur', 'lecteur'])

// ═════════════════════════════════════════════════════════════
// SCHEMAS PAR ROUTE API
// ═════════════════════════════════════════════════════════════

// ─── /api/send-email ───
export const sendEmailSchema = z.object({
  type: z.string().min(1).max(50),
  to: emailSchema,
  data: z.record(z.string(), z.any()).default({}),
  replyTo: emailSchema.optional(),
  cc: z.array(emailSchema).max(10).optional(),
  bcc: z.array(emailSchema).max(10).optional(),
})

// ─── /api/invite-placier ───
export const invitePlacierSchema = z.object({
  email: emailSchema,
  full_name: shortTextSchema,
})

// ─── /api/verify-siren ───
export const verifySirenSchema = z.object({
  siren: sirenSchema,
})

// ─── /api/audit-log ───
export const auditLogSchema = z.object({
  action: shortTextSchema,
  details: z.record(z.string(), z.any()).optional(),
  target_id: uuidSchema.optional(),
  target_type: z.string().max(50).optional(),
})

// ─── /api/notify-devis ───
export const notifyDevisSchema = z.object({
  nom: shortTextSchema,
  email: emailSchema,
  telephone: phoneSchema,
  organisation: shortTextSchema,
  message: longTextSchema,
})

// ─── /api/create-checkout-session ───
export const createCheckoutSchema = z.object({
  candidatureId: uuidSchema,
  eventTitle: shortTextSchema,
  amount: amountSchema,
})

// ─── /api/create-express-checkout ───
export const createExpressCheckoutSchema = z.object({
  eventId: uuidSchema,
  nom: shortTextSchema,
  email: emailSchema,
  montant: amountSchema,
})

// ─── /api/create-pro-checkout ───
export const createProCheckoutSchema = z.object({
  userId: uuidSchema,
  email: emailSchema,
})

// ─── /api/delete-account ───
export const deleteAccountSchema = z.object({
  confirmation: z.literal('SUPPRIMER MON COMPTE'),
})

// ─── /api/security-alert ───
export const securityAlertSchema = z.object({
  type: shortTextSchema,
  userId: uuidSchema.optional(),
  details: z.record(z.string(), z.any()).optional(),
})

// ═════════════════════════════════════════════════════════════
// HELPERS POUR API ROUTES
// ═════════════════════════════════════════════════════════════

/**
 * Parse et valide le body d'une requête API avec un schéma Zod.
 * Retourne soit les données validées soit une NextResponse d'erreur.
 *
 * Usage :
 * const result = await validateBody(req, sendEmailSchema)
 * if (result instanceof NextResponse) return result
 * const { type, to, data } = result
 */
export async function validateBody<T extends z.ZodType>(
  req: NextRequest,
  schema: T
): Promise<z.infer<T> | NextResponse> {
  try {
    const body = await req.json()
    const result = schema.safeParse(body)

    if (!result.success) {
      return NextResponse.json({
        error: 'Données invalides',
        details: result.error.issues.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      }, { status: 400 })
    }

    return result.data
  } catch (err) {
    return NextResponse.json({
      error: 'JSON invalide',
    }, { status: 400 })
  }
}

/**
 * Valide les query params d'une requête.
 */
export function validateQuery<T extends z.ZodType>(
  searchParams: URLSearchParams,
  schema: T
): z.infer<T> | NextResponse {
  const obj = Object.fromEntries(searchParams.entries())
  const result = schema.safeParse(obj)

  if (!result.success) {
    return NextResponse.json({
      error: 'Paramètres invalides',
      details: result.error.issues.map(e => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    }, { status: 400 })
  }

  return result.data
}

// ═════════════════════════════════════════════════════════════
// RATE LIMITER PARTAGÉ
// ═════════════════════════════════════════════════════════════

const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

// Nettoyage périodique pour éviter les fuites mémoire
setInterval(() => {
  const now = Date.now()
  rateLimitStore.forEach((val, key) => {
    if (now > val.resetAt) rateLimitStore.delete(key)
  })
}, 60_000)

interface RateLimitOptions {
  /** Nombre max de requêtes dans la fenêtre */
  max?: number
  /** Fenêtre en millisecondes (défaut: 60000 = 1 min) */
  windowMs?: number
  /** Préfixe de clé (utile pour distinguer les endpoints) */
  keyPrefix?: string
}

/**
 * Rate limiter générique par IP.
 *
 * Usage :
 * const limited = checkRateLimit(req, { max: 10 })
 * if (limited) return limited
 */
export function checkRateLimit(
  req: NextRequest,
  options: RateLimitOptions = {}
): NextResponse | null {
  const { max = 10, windowMs = 60_000, keyPrefix = 'global' } = options

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || 'unknown'

  const key = `${keyPrefix}:${ip}`
  const now = Date.now()
  const entry = rateLimitStore.get(key)

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs })
    return null
  }

  if (entry.count >= max) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
    return NextResponse.json({
      error: `Trop de requêtes. Réessayez dans ${retryAfter}s.`,
    }, {
      status: 429,
      headers: {
        'Retry-After': retryAfter.toString(),
        'X-RateLimit-Limit': max.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': entry.resetAt.toString(),
      },
    })
  }

  entry.count++
  return null
}

// ═════════════════════════════════════════════════════════════
// PRESETS DE RATE LIMITING
// ═════════════════════════════════════════════════════════════

/** Endpoints sensibles : 5 req/min */
export const RATE_LIMIT_STRICT = { max: 5, windowMs: 60_000 }

/** Endpoints normaux : 10 req/min */
export const RATE_LIMIT_NORMAL = { max: 10, windowMs: 60_000 }

/** Endpoints publics : 30 req/min */
export const RATE_LIMIT_PUBLIC = { max: 30, windowMs: 60_000 }

/** Stripe checkout : 3 req/min (évite spam de paiement) */
export const RATE_LIMIT_CHECKOUT = { max: 3, windowMs: 60_000 }

/** Email : 10 req/min */
export const RATE_LIMIT_EMAIL = { max: 10, windowMs: 60_000 }
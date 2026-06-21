// src/app/api/send-email/route.ts
// ═════════════════════════════════════════════════════════════
// PULSEMARKET — API SEND EMAIL
// Route centralisée pour envoyer tous les emails transactionnels
// ═════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { sanitize, sanitizeAll } from '@/lib/sanitize'
import { EMAIL_TEMPLATES, type EmailType } from '@/lib/email-templates'

const resend = new Resend(process.env.RESEND_API_KEY)

// ─── FROM par défaut ───
const FROM_DEFAULT = process.env.RESEND_FROM_EMAIL || 'PulseMarket <noreply@pulse-market.fr>'

// ─── FROM custom par type (string keys pour supporter "boost_confirmation" qui n'est pas dans le registry) ───
const FROM_BY_TYPE: Record<string, string> = {
  boost_confirmation: 'Whatmarket <noreply@pulse-market.fr>',
  rgpd_deletion_request: 'PulseMarket RGPD <rgpd@pulse-market.fr>',
}

// ─── Tous les types autorisés (registry + boost_confirmation legacy) ───
const ALLOWED_TYPES = [...Object.keys(EMAIL_TEMPLATES), 'boost_confirmation']

// ─── Rate limiting (par IP) ───
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string, max = 10): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 })
    return true
  }
  if (entry.count >= max) return false
  entry.count++
  return true
}

// ─── Validation email ───
function isValidEmail(email: string): boolean {
  if (typeof email !== 'string') return false
  if (email.length > 254) return false
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email)
}

// ═════════════════════════════════════════════════════════════
// POST /api/send-email
// Body : { type, to, data, replyTo?, cc?, bcc?, attachments? }
// ═════════════════════════════════════════════════════════════
export async function POST(req: NextRequest) {
  try {
    // ─── Rate limit ───
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: 'Trop de requêtes. Réessayez dans 1 minute.' }, { status: 429 })
    }

    // ─── Parse body ───
    const body = await req.json()
    const { type, to, data, replyTo, cc, bcc, attachments } = body

    // ─── Validation type ───
    if (!type || !ALLOWED_TYPES.includes(type)) {
      return NextResponse.json({
        error: 'Type email invalide',
        available: ALLOWED_TYPES,
      }, { status: 400 })
    }

    // ─── Validation destinataire ───
    if (!to || !isValidEmail(to)) {
      return NextResponse.json({ error: 'Destinataire invalide' }, { status: 400 })
    }

    // ─── Validation data ───
    if (!data || typeof data !== 'object') {
      return NextResponse.json({ error: 'Data manquante ou invalide' }, { status: 400 })
    }

    // ─── Sanitize ───
    const safeTo = sanitize(to)
    const safeData = sanitizeAll(data)

    // ═══════════════════════════════════════════════════════════
    // CAS SPÉCIAL : boost_confirmation (utilise lib externe + PDF)
    // ═══════════════════════════════════════════════════════════
    if (type === 'boost_confirmation') {
      const { generateBoostEmailHTML } = await import('@/lib/sendBoostEmail')
      const { generateBoostInvoice } = await import('@/lib/generateBoostInvoice')

      const subject = `${safeData.nom} — Votre pub est en ligne sur Whatmarket !`
      const html = generateBoostEmailHTML({
        nom: safeData.nom,
        offre: safeData.offre,
        eventTitle: safeData.eventTitle,
        eventId: safeData.eventId,
      })

      const pdfBytes = await generateBoostInvoice({
        nom: safeData.nom,
        offre: safeData.offre,
        eventTitle: safeData.eventTitle,
        email: safeTo,
        amount: safeData.amount || 20,
        stripeSessionId: safeData.stripeSessionId || '',
      })
      const pdfBase64 = Buffer.from(pdfBytes).toString('base64')

      const { data: emailData, error } = await resend.emails.send({
        from: FROM_BY_TYPE.boost_confirmation || FROM_DEFAULT,
        to: safeTo,
        subject,
        html,
        ...(replyTo && { replyTo }),
        attachments: [{
          filename: `facture-whatmarket-${(safeData.nom || 'forain').replace(/\s/g, '-').toLowerCase()}.pdf`,
          content: pdfBase64,
        }],
      } as any)

      if (error) throw error
      return NextResponse.json({ success: true, id: emailData?.id })
    }

    // ═══════════════════════════════════════════════════════════
    // ENVOI STANDARD (tous les autres types)
    // ═══════════════════════════════════════════════════════════
    const generator = EMAIL_TEMPLATES[type as EmailType]
    const { subject, html } = generator(safeData)

    if (!subject || !html) {
      return NextResponse.json({ error: 'Template invalide' }, { status: 500 })
    }

    const from = FROM_BY_TYPE[type] || FROM_DEFAULT

    const { data: emailData, error } = await resend.emails.send({
      from,
      to: safeTo,
      subject,
      html,
      ...(replyTo && { replyTo }),
      ...(cc && { cc }),
      ...(bcc && { bcc }),
      ...(attachments && { attachments }),
    } as any)

    if (error) throw error

    return NextResponse.json({ success: true, id: emailData?.id, type })

  } catch (err: any) {
    console.error('[send-email] Error:', err)
    return NextResponse.json({
      error: 'Erreur lors de l\'envoi de l\'email',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined,
    }, { status: 500 })
  }
}

// ═════════════════════════════════════════════════════════════
// GET /api/send-email
// Liste les types d'emails disponibles (utile en dev)
// ═════════════════════════════════════════════════════════════
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({
    available: ALLOWED_TYPES,
    from_default: FROM_DEFAULT,
  })
}
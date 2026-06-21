// src/app/api/send-email/route.ts
// ═════════════════════════════════════════════════════════════
// PULSEMARKET — API SEND EMAIL
// Route centralisée pour envoyer tous les emails transactionnels
// ═════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { z } from 'zod'
import { sanitize, sanitizeAll } from '@/lib/sanitize'
import { EMAIL_TEMPLATES, type EmailType } from '@/lib/email-templates'
import {
  validateBody,
  checkRateLimit,
  emailSchema,
  RATE_LIMIT_EMAIL,
} from '@/lib/validation'

const resend = new Resend(process.env.RESEND_API_KEY)

// ─── FROM par défaut ───
const FROM_DEFAULT = process.env.RESEND_FROM_EMAIL || 'PulseMarket <noreply@pulse-market.fr>'

// ─── FROM custom par type ───
const FROM_BY_TYPE: Record<string, string> = {
  boost_confirmation: 'Whatmarket <noreply@pulse-market.fr>',
  rgpd_deletion_request: 'PulseMarket RGPD <rgpd@pulse-market.fr>',
}

// ─── Tous les types autorisés (registry + boost_confirmation legacy) ───
const ALLOWED_TYPES = [...Object.keys(EMAIL_TEMPLATES), 'boost_confirmation']

// ─── Schéma Zod ───
const sendEmailSchema = z.object({
  type: z.string().min(1, 'Type requis').refine(
    (val) => ALLOWED_TYPES.includes(val),
    { message: 'Type email non autorisé' }
  ),
  to: emailSchema,
  data: z.record(z.string(), z.any()).default({}),
  replyTo: emailSchema.optional(),
  cc: z.array(emailSchema).max(10, 'Maximum 10 CC').optional(),
  bcc: z.array(emailSchema).max(10, 'Maximum 10 BCC').optional(),
  attachments: z.array(z.object({
    filename: z.string().max(200),
    content: z.string(),
  })).max(5, 'Maximum 5 pièces jointes').optional(),
})

// ═════════════════════════════════════════════════════════════
// POST /api/send-email
// Body : { type, to, data, replyTo?, cc?, bcc?, attachments? }
// ═════════════════════════════════════════════════════════════
export async function POST(req: NextRequest) {
  try {
    // ─── 1. Rate limit (10 emails / min / IP) ───
    const limited = checkRateLimit(req, {
      ...RATE_LIMIT_EMAIL,
      keyPrefix: 'send-email',
    })
    if (limited) return limited

    // ─── 2. Validation Zod ───
    const result = await validateBody(req, sendEmailSchema)
    if (result instanceof NextResponse) return result
    const { type, to, data, replyTo, cc, bcc, attachments } = result

    // ─── 3. Vérifier env vars ───
    if (!process.env.RESEND_API_KEY) {
      console.error('[send-email] RESEND_API_KEY manquant')
      return NextResponse.json({ error: 'Configuration serveur invalide' }, { status: 500 })
    }

    // ─── 4. Sanitize destinataire + data ───
    const safeTo = sanitize(to)
    const safeData = sanitizeAll(data)

    // ═══════════════════════════════════════════════════════════
    // CAS SPÉCIAL : boost_confirmation (utilise lib externe + PDF)
    // ═══════════════════════════════════════════════════════════
    if (type === 'boost_confirmation') {
      try {
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

        if (error) {
          console.error('[send-email] Boost Resend error:', error)
          return NextResponse.json({ error: 'Erreur envoi email boost' }, { status: 500 })
        }

        return NextResponse.json({ success: true, id: emailData?.id })
      } catch (boostErr: any) {
        console.error('[send-email] Boost generation error:', boostErr)
        return NextResponse.json({ error: 'Erreur génération boost' }, { status: 500 })
      }
    }

    // ═══════════════════════════════════════════════════════════
    // ENVOI STANDARD (tous les autres types)
    // ═══════════════════════════════════════════════════════════
    const generator = EMAIL_TEMPLATES[type as EmailType]
    if (!generator) {
      console.error('[send-email] Generator manquant pour type:', type)
      return NextResponse.json({ error: 'Template introuvable' }, { status: 500 })
    }

    const { subject, html } = generator(safeData)

    if (!subject || !html) {
      console.error('[send-email] Template invalide pour type:', type)
      return NextResponse.json({ error: 'Template invalide' }, { status: 500 })
    }

    const from = FROM_BY_TYPE[type] || FROM_DEFAULT

    const { data: emailData, error } = await resend.emails.send({
      from,
      to: safeTo,
      subject,
      html,
      ...(replyTo && { replyTo }),
      ...(cc && cc.length > 0 && { cc }),
      ...(bcc && bcc.length > 0 && { bcc }),
      ...(attachments && attachments.length > 0 && { attachments }),
    } as any)

    if (error) {
      console.error('[send-email] Resend error:', error)
      return NextResponse.json({ error: 'Erreur envoi email' }, { status: 500 })
    }

    return NextResponse.json({ success: true, id: emailData?.id, type })

  } catch (err: any) {
    console.error('[send-email] Error:', err)
    return NextResponse.json({
      error: 'Erreur lors de l\'envoi de l\'email',
      ...(process.env.NODE_ENV === 'development' && { details: err.message }),
    }, { status: 500 })
  }
}

// ═════════════════════════════════════════════════════════════
// GET /api/send-email
// Liste les types d'emails disponibles (uniquement en dev)
// ═════════════════════════════════════════════════════════════
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({
    available: ALLOWED_TYPES,
    from_default: FROM_DEFAULT,
    from_by_type: FROM_BY_TYPE,
  })
}
// src/app/api/create-express-checkout/route.ts
// ═════════════════════════════════════════════════════════════
// PULSEMARKET — Create Express Checkout (paiement placier rapide)
// Crée une session Stripe pour un paiement express sur le terrain
// Utilisé par les placiers quand un forain arrive sans candidature
// ═════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { z } from 'zod'
import { securityLog } from '@/lib/securityLog'
import {
  validateBody,
  checkRateLimit,
  emailSchema,
  RATE_LIMIT_CHECKOUT,
} from '@/lib/validation'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

// ─── Schéma Zod strict ───
const expressCheckoutSchema = z.object({
  nom: z.string().trim().min(1, 'Nom requis').max(200, 'Nom trop long'),
  email: emailSchema,
  montant: z.union([
    z.number(),
    z.string().transform((val) => parseFloat(val)),
  ]).refine(
    (val) => !isNaN(val) && val > 0 && val <= 10000,
    { message: 'Montant invalide (entre 0,01€ et 10 000€)' }
  ),
  eventTitle: z.string().trim().max(200).optional(),
  eventId: z.string().max(100).optional(),
})

// ═════════════════════════════════════════════════════════════
// POST /api/create-express-checkout
// ═════════════════════════════════════════════════════════════
export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('x-real-ip')
      || 'unknown'

    // ─── 1. Rate limit (3/min - checkout strict) ───
    const limited = checkRateLimit(req, {
      ...RATE_LIMIT_CHECKOUT,
      keyPrefix: 'create-express-checkout',
    })
    if (limited) {
      await securityLog({
        action: 'rate_limit_atteint',
        ip,
        details: { route: 'create-express-checkout' }
      })
      return limited
    }

    // ─── 2. Vérifier env vars critiques ───
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('[create-express-checkout] STRIPE_SECRET_KEY manquant')
      return NextResponse.json({ error: 'Configuration serveur invalide' }, { status: 500 })
    }
    if (!process.env.NEXT_PUBLIC_APP_URL) {
      console.error('[create-express-checkout] NEXT_PUBLIC_APP_URL manquant')
      return NextResponse.json({ error: 'Configuration serveur invalide' }, { status: 500 })
    }

    // ─── 3. Validation Zod ───
    const result = await validateBody(req, expressCheckoutSchema)
    if (result instanceof NextResponse) return result
    const { nom, email, montant, eventTitle, eventId } = result

    const appUrl = process.env.NEXT_PUBLIC_APP_URL

    // ─── 4. Créer la session Stripe ───
    let session: Stripe.Checkout.Session
    try {
      session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        customer_email: email,
        line_items: [{
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Place marché — ${(eventTitle || 'Marché PulseMarket').substring(0, 100)}`,
              description: `Forain : ${nom.substring(0, 100)} · Paiement express placier`,
            },
            unit_amount: Math.round(montant * 100), // En centimes
          },
          quantity: 1,
        }],
        success_url: `${appUrl}/paiement-express/success?session_id={CHECKOUT_SESSION_ID}&email=${encodeURIComponent(email)}&nom=${encodeURIComponent(nom)}&event=${encodeURIComponent(eventTitle || '')}&montant=${montant}`,
        cancel_url: `${appUrl}/dashboard/placier`,
        metadata: {
          type: 'express',
          nom: nom.substring(0, 500),
          email: email.substring(0, 500),
          eventId: (eventId || '').substring(0, 500),
          eventTitle: (eventTitle || '').substring(0, 500),
        },
        expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // 30 min
      })
    } catch (stripeErr: any) {
      console.error('[create-express-checkout] Stripe error:', stripeErr.message)
      return NextResponse.json({
        error: 'Erreur Stripe lors de la création du paiement'
      }, { status: 502 })
    }

    // ─── 5. Log paiement initié ───
    await securityLog({
      action: 'paiement_initie',
      ip,
      details: {
        type: 'express',
        nom,
        email,
        montant,
        eventId,
        sessionId: session.id,
      }
    })

    return NextResponse.json({
      url: session.url,
      sessionId: session.id
    })

  } catch (err: any) {
    console.error('[create-express-checkout] Error:', err)
    return NextResponse.json({
      error: 'Erreur serveur',
      ...(process.env.NODE_ENV === 'development' && { details: err.message }),
    }, { status: 500 })
  }
}
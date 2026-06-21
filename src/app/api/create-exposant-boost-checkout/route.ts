// src/app/api/create-exposant-boost-checkout/route.ts
// ═════════════════════════════════════════════════════════════
// PULSEMARKET — Create Exposant Boost Checkout
// Boost "À ne pas manquer" pour un exposant (15€ / marché)
// ═════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { securityLog } from '@/lib/securityLog'
import {
  validateBody,
  checkRateLimit,
  emailSchema,
  uuidSchema,
  RATE_LIMIT_CHECKOUT,
} from '@/lib/validation'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

// ─── Constantes boost ───
const BOOST_PRICE_CENTS = 1500 // 15€

// ─── Schéma Zod strict ───
const exposantBoostSchema = z.object({
  nom: z.string().trim().min(1, 'Nom requis').max(200, 'Nom trop long'),
  offre: z.string().trim().max(200).optional(),
  stand: z.string().trim().max(100).optional(),
  eventId: uuidSchema,
  eventTitle: z.string().trim().max(200).optional(),
  email: emailSchema,
  exposantId: uuidSchema.optional(),
})

// ═════════════════════════════════════════════════════════════
// POST /api/create-exposant-boost-checkout
// ═════════════════════════════════════════════════════════════
export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('x-real-ip')
      || 'unknown'

    // ─── 1. Rate limit (3/min - strict pour checkout) ───
    const limited = checkRateLimit(req, {
      ...RATE_LIMIT_CHECKOUT,
      keyPrefix: 'create-exposant-boost',
    })
    if (limited) {
      await securityLog({
        action: 'rate_limit_atteint',
        ip,
        details: { route: 'create-exposant-boost-checkout' }
      })
      return limited
    }

    // ─── 2. Vérifier env vars critiques ───
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('[create-exposant-boost] STRIPE_SECRET_KEY manquant')
      return NextResponse.json({ error: 'Configuration serveur invalide' }, { status: 500 })
    }
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('[create-exposant-boost] SUPABASE_SERVICE_ROLE_KEY manquant')
      return NextResponse.json({ error: 'Configuration serveur invalide' }, { status: 500 })
    }
    if (!process.env.NEXT_PUBLIC_APP_URL) {
      console.error('[create-exposant-boost] NEXT_PUBLIC_APP_URL manquant')
      return NextResponse.json({ error: 'Configuration serveur invalide' }, { status: 500 })
    }

    // ─── 3. Validation Zod ───
    const result = await validateBody(req, exposantBoostSchema)
    if (result instanceof NextResponse) return result
    const { nom, offre, stand, eventId, eventTitle, email, exposantId } = result

    // ─── 4. Client Supabase admin ───
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // ─── 5. Vérifier que l'événement existe ET est publié ───
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, status, title')
      .eq('id', eventId)
      .single()

    if (eventError || !event) {
      return NextResponse.json({ error: 'Événement introuvable' }, { status: 404 })
    }

    if (event.status !== 'published') {
      return NextResponse.json({ error: 'Événement non disponible' }, { status: 403 })
    }

    // ─── 6. Vérifier qu'aucun boost actif n'existe déjà pour cet event ───
    const { count } = await supabase
      .from('exposant_boosts')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .eq('status', 'active')

    if ((count || 0) >= 1) {
      return NextResponse.json({
        error: 'Le slot "À ne pas manquer" est déjà pris pour ce marché.'
      }, { status: 400 })
    }

    // ─── 7. ✅ Si exposantId fourni, vérifier qu'il existe et matche l'email ───
    if (exposantId) {
      const { data: exposant } = await supabase
        .from('profiles')
        .select('id, role, email')
        .eq('id', exposantId)
        .single()

      if (!exposant) {
        return NextResponse.json({ error: 'Exposant introuvable' }, { status: 404 })
      }

      if (exposant.role !== 'exposant') {
        await securityLog({
          action: 'acces_non_autorise',
          ip,
          userId: exposantId,
          details: { reason: 'role_non_autorise', route: 'exposant-boost' }
        })
        return NextResponse.json({ error: 'Réservé aux exposants' }, { status: 403 })
      }

      // Anti-fraude : email doit matcher
      if (exposant.email && exposant.email.toLowerCase() !== email.toLowerCase()) {
        await securityLog({
          action: 'acces_non_autorise',
          ip,
          userId: exposantId,
          details: { reason: 'email_mismatch', route: 'exposant-boost' }
        })
        return NextResponse.json({ error: 'Email ne correspond pas au compte' }, { status: 403 })
      }
    }

    // ─── 8. Création session Stripe ───
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
              name: `À ne pas manquer — ${(eventTitle || event.title || '').substring(0, 100)}`,
              description: `${nom.substring(0, 100)}${offre ? ` · ${offre.substring(0, 100)}` : ''}`,
            },
            unit_amount: BOOST_PRICE_CENTS,
          },
          quantity: 1,
        }],
        metadata: {
          nom: nom.substring(0, 500),
          offre: (offre || '').substring(0, 500),
          stand: (stand || '').substring(0, 500),
          eventId,
          eventTitle: (eventTitle || event.title || '').substring(0, 500),
          email: email.substring(0, 500),
          exposantId: exposantId || '',
          type: 'exposant_boost',
        },
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/boost/success?nom=${encodeURIComponent(nom)}&event=${encodeURIComponent(eventTitle || event.title || '')}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
        expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // 30 min
      })
    } catch (stripeErr: any) {
      console.error('[create-exposant-boost] Stripe error:', stripeErr.message)
      return NextResponse.json({
        error: 'Erreur Stripe lors de la création du paiement'
      }, { status: 502 })
    }

    // ─── 9. Log paiement initié ───
    await securityLog({
      action: 'paiement_initie',
      ip,
      userId: exposantId,
      details: {
        type: 'exposant_boost',
        eventId,
        nom,
        sessionId: session.id,
      }
    })

    return NextResponse.json({
      url: session.url,
      sessionId: session.id
    })

  } catch (err: any) {
    console.error('[create-exposant-boost] Error:', err)
    return NextResponse.json({
      error: 'Erreur serveur',
      ...(process.env.NODE_ENV === 'development' && { details: err.message }),
    }, { status: 500 })
  }
}
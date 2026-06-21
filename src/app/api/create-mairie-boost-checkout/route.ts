// src/app/api/create-mairie-boost-checkout/route.ts
// ═════════════════════════════════════════════════════════════
// PULSEMARKET — Create Mairie Boost Checkout
// Boost "marché en vedette" sur Whatmarket (200€ / 7 jours)
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
const BOOST_PRICE_CENTS = 20000 // 200€
const BOOST_DURATION_DAYS = 7

// ─── Schéma Zod strict ───
const mairieBoostSchema = z.object({
  eventId: uuidSchema,
  eventTitle: z.string().trim().max(200).optional(),
  email: emailSchema,
  organisateurId: uuidSchema,
})

// ═════════════════════════════════════════════════════════════
// POST /api/create-mairie-boost-checkout
// ═════════════════════════════════════════════════════════════
export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('x-real-ip')
      || 'unknown'

    // ─── 1. Rate limit (3/min - strict pour checkout) ───
    const limited = checkRateLimit(req, {
      ...RATE_LIMIT_CHECKOUT,
      keyPrefix: 'create-mairie-boost',
    })
    if (limited) {
      await securityLog({
        action: 'rate_limit_atteint',
        ip,
        details: { route: 'create-mairie-boost-checkout' }
      })
      return limited
    }

    // ─── 2. Vérifier env vars critiques ───
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('[create-mairie-boost] STRIPE_SECRET_KEY manquant')
      return NextResponse.json({ error: 'Configuration serveur invalide' }, { status: 500 })
    }
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('[create-mairie-boost] SUPABASE_SERVICE_ROLE_KEY manquant')
      return NextResponse.json({ error: 'Configuration serveur invalide' }, { status: 500 })
    }
    if (!process.env.NEXT_PUBLIC_APP_URL) {
      console.error('[create-mairie-boost] NEXT_PUBLIC_APP_URL manquant')
      return NextResponse.json({ error: 'Configuration serveur invalide' }, { status: 500 })
    }

    // ─── 3. Validation Zod ───
    const result = await validateBody(req, mairieBoostSchema)
    if (result instanceof NextResponse) return result
    const { eventId, email, organisateurId } = result

    // ─── 4. Client Supabase admin ───
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // ─── 5. Vérifier que l'organisateur existe et est validé ───
    const { data: organisateur, error: orgError } = await supabase
      .from('profiles')
      .select('id, role, organisateur_status, email')
      .eq('id', organisateurId)
      .single()

    if (orgError || !organisateur) {
      return NextResponse.json({ error: 'Organisateur introuvable' }, { status: 404 })
    }

    if (organisateur.role !== 'organisateur') {
      await securityLog({
        action: 'acces_non_autorise',
        ip,
        userId: organisateurId,
        details: { reason: 'role_non_autorise', route: 'mairie-boost' }
      })
      return NextResponse.json({ error: 'Réservé aux organisateurs' }, { status: 403 })
    }

    // ─── 6. ✅ Sécurité : l'email doit matcher l'email de l'organisateur ───
    if (organisateur.email && organisateur.email.toLowerCase() !== email.toLowerCase()) {
      await securityLog({
        action: 'acces_non_autorise',
        ip,
        userId: organisateurId,
        details: { reason: 'email_mismatch', route: 'mairie-boost' }
      })
      return NextResponse.json({ error: 'Email ne correspond pas au compte' }, { status: 403 })
    }

    // ─── 7. Vérifier que l'événement appartient bien à cet organisateur ───
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, organisateur_id, title')
      .eq('id', eventId)
      .single()

    if (eventError || !event) {
      return NextResponse.json({ error: 'Événement introuvable' }, { status: 404 })
    }

    if (event.organisateur_id !== organisateurId) {
      await securityLog({
        action: 'acces_non_autorise',
        ip,
        userId: organisateurId,
        details: { reason: 'event_not_owned', eventId }
      })
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    // ─── 8. Vérifier qu'il n'y a pas déjà un boost actif ───
    const { count } = await supabase
      .from('mairie_boosts')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())

    if ((count || 0) >= 1) {
      return NextResponse.json(
        { error: 'Ce marché est déjà mis en avant cette semaine.' },
        { status: 400 }
      )
    }

    // ─── 9. Création session Stripe ───
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
              name: `Marché en vedette — ${(event.title || '').substring(0, 100)}`,
              description: `Position 1 sur Whatmarket pendant ${BOOST_DURATION_DAYS} jours`,
            },
            unit_amount: BOOST_PRICE_CENTS,
          },
          quantity: 1,
        }],
        metadata: {
          eventId,
          eventTitle: (event.title || '').substring(0, 500),
          organisateurId,
          type: 'mairie_boost',
        },
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/organisateur?boost=success&event=${encodeURIComponent(event.title || '')}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/organisateur`,
        expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // 30 min
      })
    } catch (stripeErr: any) {
      console.error('[create-mairie-boost] Stripe error:', stripeErr.message)
      return NextResponse.json({
        error: 'Erreur Stripe lors de la création du paiement'
      }, { status: 502 })
    }

    // ─── 10. Log paiement initié ───
    await securityLog({
      action: 'paiement_initie',
      ip,
      userId: organisateurId,
      details: {
        type: 'mairie_boost',
        eventId,
        sessionId: session.id,
      }
    })

    return NextResponse.json({
      url: session.url,
      sessionId: session.id
    })

  } catch (err: any) {
    console.error('[create-mairie-boost] Error:', err)
    return NextResponse.json({
      error: 'Erreur serveur',
      ...(process.env.NODE_ENV === 'development' && { details: err.message }),
    }, { status: 500 })
  }
}
// src/app/api/create-pro-checkout/route.ts
// ═════════════════════════════════════════════════════════════
// PULSEMARKET — Create Pro Checkout (Abonnement Pro 20€/mois)
// Crée une session Stripe subscription pour upgrade exposant en Pro
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

// ─── Price ID Stripe (Pro 20€/mois) ───
const STRIPE_PRO_PRICE_ID = process.env.STRIPE_PRO_PRICE_ID || 'price_1TVZvAFRBJwog5h6dc8NLegx'

// ─── Schéma Zod strict ───
const proCheckoutSchema = z.object({
  userId: uuidSchema,
  email: emailSchema,
})

// ═════════════════════════════════════════════════════════════
// POST /api/create-pro-checkout
// ═════════════════════════════════════════════════════════════
export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('x-real-ip')
      || 'unknown'

    // ─── 1. Rate limit (3/min - strict pour checkout) ───
    const limited = checkRateLimit(req, {
      ...RATE_LIMIT_CHECKOUT,
      keyPrefix: 'create-pro-checkout',
    })
    if (limited) {
      await securityLog({
        action: 'rate_limit_atteint',
        ip,
        details: { route: 'create-pro-checkout' }
      })
      return limited
    }

    // ─── 2. Vérifier env vars critiques ───
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('[create-pro-checkout] STRIPE_SECRET_KEY manquant')
      return NextResponse.json({ error: 'Configuration serveur invalide' }, { status: 500 })
    }
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('[create-pro-checkout] SUPABASE_SERVICE_ROLE_KEY manquant')
      return NextResponse.json({ error: 'Configuration serveur invalide' }, { status: 500 })
    }
    if (!process.env.NEXT_PUBLIC_APP_URL) {
      console.error('[create-pro-checkout] NEXT_PUBLIC_APP_URL manquant')
      return NextResponse.json({ error: 'Configuration serveur invalide' }, { status: 500 })
    }

    // ─── 3. Validation Zod ───
    const result = await validateBody(req, proCheckoutSchema)
    if (result instanceof NextResponse) return result
    const { userId, email } = result

    // ─── 4. Client Supabase admin ───
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // ─── 5. Vérifier l'utilisateur ───
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, plan, stripe_customer_id, email')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })
    }

    // ─── 6. Check : seulement les exposants peuvent upgrade ───
    if (profile.role !== 'exposant') {
      await securityLog({
        action: 'acces_non_autorise',
        ip,
        userId,
        details: { reason: 'role_non_autorise', actualRole: profile.role }
      })
      return NextResponse.json({ error: 'Réservé aux exposants' }, { status: 403 })
    }

    // ─── 7. Check : pas déjà Pro ───
    if (profile.plan === 'pro') {
      return NextResponse.json({ error: 'Vous êtes déjà Pro' }, { status: 400 })
    }

    // ─── 8. ✅ Sécurité : l'email du body doit matcher l'email du profil ───
    // (évite qu'un user passe l'email de quelqu'un d'autre)
    if (profile.email && profile.email.toLowerCase() !== email.toLowerCase()) {
      await securityLog({
        action: 'acces_non_autorise',
        ip,
        userId,
        details: { reason: 'email_mismatch' }
      })
      return NextResponse.json({ error: 'Email ne correspond pas au compte' }, { status: 403 })
    }

    // ─── 9. Créer ou récupérer le customer Stripe ───
    let customerId = profile.stripe_customer_id

    if (!customerId) {
      try {
        const customer = await stripe.customers.create({
          email,
          metadata: { userId },
        })
        customerId = customer.id

        await supabase
          .from('profiles')
          .update({ stripe_customer_id: customerId })
          .eq('id', userId)
      } catch (stripeErr: any) {
        console.error('[create-pro-checkout] Stripe customer error:', stripeErr.message)
        return NextResponse.json({
          error: 'Erreur création client Stripe'
        }, { status: 502 })
      }
    }

    // ─── 10. Créer la session Stripe (mode subscription) ───
    let session: Stripe.Checkout.Session
    try {
      session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'subscription',
        customer: customerId,
        line_items: [{
          price: STRIPE_PRO_PRICE_ID,
          quantity: 1,
        }],
        metadata: {
          userId,
          type: 'pro_subscription',
        },
        subscription_data: {
          metadata: { userId },
        },
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?pro=success`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
        expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // 30 min
      })
    } catch (stripeErr: any) {
      console.error('[create-pro-checkout] Stripe checkout error:', stripeErr.message)
      return NextResponse.json({
        error: 'Erreur création session Stripe'
      }, { status: 502 })
    }

    // ─── 11. Log paiement initié ───
    await securityLog({
      action: 'paiement_initie',
      ip,
      userId,
      details: {
        type: 'pro_subscription',
        sessionId: session.id
      }
    })

    return NextResponse.json({
      url: session.url,
      sessionId: session.id
    })

  } catch (err: any) {
    console.error('[create-pro-checkout] Error:', err)
    return NextResponse.json({
      error: 'Erreur serveur',
      ...(process.env.NODE_ENV === 'development' && { details: err.message }),
    }, { status: 500 })
  }
}
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 5
const WINDOW_MS = 60_000

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return true
  }
  if (entry.count >= RATE_LIMIT) return false
  entry.count++
  return true
}

setInterval(() => {
  const now = Date.now()
  rateLimitMap.forEach((val, key) => { if (now > val.resetAt) rateLimitMap.delete(key) })
}, 5 * 60_000)

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('x-real-ip')
      || 'unknown'

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Trop de requêtes. Réessayez dans une minute.' },
        { status: 429 }
      )
    }

    const body = await req.json()
    const { userId, email } = body

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: 'userId manquant' }, { status: 400 })
    }
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Email invalide' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Vérifier que l'utilisateur existe et est un exposant
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, plan, stripe_customer_id')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })
    }

    if (profile.role !== 'exposant') {
      return NextResponse.json({ error: 'Réservé aux exposants' }, { status: 403 })
    }

    if (profile.plan === 'pro') {
      return NextResponse.json({ error: 'Vous êtes déjà Pro' }, { status: 400 })
    }

    // Créer ou récupérer le customer Stripe
    let customerId = profile.stripe_customer_id
    if (!customerId) {
      const customer = await stripe.customers.create({
        email,
        metadata: { userId },
      })
      customerId = customer.id

      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId)
    }

    // Créer la session Stripe (mode subscription)
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer: customerId,
      line_items: [{
        price: 'price_1TVZvAFRBJwog5h6dc8NLegx',
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
    })

    return NextResponse.json({ url: session.url, sessionId: session.id })

  } catch (err: any) {
    console.error('Pro checkout error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
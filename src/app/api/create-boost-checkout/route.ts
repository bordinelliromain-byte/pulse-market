import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

// ── RATE LIMITER ──────────────────────────────────────────────────────────
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

// ── ROUTE ─────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    // ✅ 1. Rate limiting
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('x-real-ip')
      || 'unknown'

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Trop de requêtes. Réessayez dans une minute.' },
        { status: 429 }
      )
    }

    // ✅ 2. Validation des inputs
    const body = await req.json()
    const { nom, offre, detail, adresse, photoUrl, eventId, eventTitle, email } = body

    if (!nom || typeof nom !== 'string' || nom.length > 200) {
      return NextResponse.json({ error: 'Nom invalide' }, { status: 400 })
    }
    if (!eventId || typeof eventId !== 'string' || eventId.length > 100) {
      return NextResponse.json({ error: 'eventId invalide' }, { status: 400 })
    }
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Email invalide' }, { status: 400 })
    }

    // ✅ 3. Vérifier que l'événement existe et est publié
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, status, title')
      .eq('id', eventId)
      .single()

    if (eventError || !event) {
      return NextResponse.json({ error: 'Événement introuvable' }, { status: 404 })
    }

    if (event.status !== 'published') {
      return NextResponse.json({ error: 'Cet événement n\'est pas disponible' }, { status: 403 })
    }

    // ✅ 4. Vérifier max 3 slots pub par marché
    const { count } = await supabase
      .from('ads')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .eq('status', 'active')

    if ((count || 0) >= 3) {
      return NextResponse.json(
        { error: 'Les 3 emplacements publicitaires de ce marché sont déjà pris.' },
        { status: 400 }
      )
    }

    // ✅ 5. Création session Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: email,
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: `Boost My Business — ${event.title?.substring(0, 100)}`,
            description: `${nom.substring(0, 100)} · ${offre?.substring(0, 100) || ''}`,
          },
          unit_amount: 2000, // 20€
        },
        quantity: 1,
      }],
      metadata: {
        nom: nom.substring(0, 100),
        offre: offre?.substring(0, 100) || '',
        detail: detail?.substring(0, 200) || '',
        adresse: adresse?.substring(0, 200) || '',
        photoUrl: photoUrl?.substring(0, 500) || '',
        eventId,
        eventTitle: event.title?.substring(0, 100) || '',
        email: email.substring(0, 200),
        type: 'boost',
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/pro/ads/success?session_id={CHECKOUT_SESSION_ID}&nom=${encodeURIComponent(nom)}&event=${encodeURIComponent(event.title || '')}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pro/ads/new`,
    })

    return NextResponse.json({ url: session.url, sessionId: session.id })

  } catch (err: any) {
    console.error('Stripe boost error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
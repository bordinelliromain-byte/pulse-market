import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

// ── RATE LIMITER ──────────────────────────────────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 3      // max 3 requêtes
const WINDOW_MS = 60_000  // par minute

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
    const { eventId, eventTitle, email, organisateurId } = body

    if (!eventId || typeof eventId !== 'string' || eventId.length > 100) {
      return NextResponse.json({ error: 'eventId invalide' }, { status: 400 })
    }
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Email invalide' }, { status: 400 })
    }
    if (!organisateurId || typeof organisateurId !== 'string') {
      return NextResponse.json({ error: 'organisateurId manquant' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // ✅ 3. Vérifier que l'événement appartient bien à cet organisateur
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, organisateur_id, title')
      .eq('id', eventId)
      .single()

    if (eventError || !event) {
      return NextResponse.json({ error: 'Événement introuvable' }, { status: 404 })
    }

    if (event.organisateur_id !== organisateurId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    // ✅ 4. Vérifier qu'il n'y a pas déjà un boost actif
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

    // ✅ 5. Création session Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: email,
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: `Marché en vedette — ${event.title?.substring(0, 100)}`,
            description: 'Position 1 sur Whatmarket pendant 7 jours',
          },
          unit_amount: 20000, // 200€
        },
        quantity: 1,
      }],
      metadata: {
        eventId,
        eventTitle: event.title?.substring(0, 100) || '',
        organisateurId,
        type: 'mairie_boost',
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/organisateur?boost=success&event=${encodeURIComponent(event.title || '')}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/organisateur`,
    })

    return NextResponse.json({ url: session.url, sessionId: session.id })

  } catch (err: any) {
    console.error('Mairie boost checkout error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
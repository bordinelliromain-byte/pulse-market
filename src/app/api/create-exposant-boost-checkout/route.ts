import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string, max = 3): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) { rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 }); return true }
  if (entry.count >= max) return false
  entry.count++; return true
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    if (!checkRateLimit(ip)) return NextResponse.json({ error: 'Trop de requêtes.' }, { status: 429 })

    const body = await req.json()
    const { nom, offre, stand, eventId, eventTitle, email, exposantId } = body

    if (!nom || typeof nom !== 'string' || nom.length > 200) return NextResponse.json({ error: 'Nom invalide' }, { status: 400 })
    if (!eventId || typeof eventId !== 'string') return NextResponse.json({ error: 'eventId invalide' }, { status: 400 })
    if (!email || !email.includes('@')) return NextResponse.json({ error: 'Email invalide' }, { status: 400 })

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const { data: event } = await supabase.from('events').select('id, status').eq('id', eventId).single()
    if (!event) return NextResponse.json({ error: 'Événement introuvable' }, { status: 404 })
    if (event.status !== 'published') return NextResponse.json({ error: 'Événement non disponible' }, { status: 403 })

    const { count } = await supabase.from('exposant_boosts').select('*', { count: 'exact', head: true }).eq('event_id', eventId).eq('status', 'active')
    if ((count || 0) >= 1) return NextResponse.json({ error: 'Le slot "À ne pas manquer" est déjà pris.' }, { status: 400 })

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: email,
      line_items: [{ price_data: { currency: 'eur', product_data: { name: `À ne pas manquer — ${eventTitle?.substring(0, 100)}`, description: `${nom.substring(0, 100)} · ${offre?.substring(0, 100) || ''}` }, unit_amount: 1500 }, quantity: 1 }],
      metadata: { nom: nom.substring(0, 100), offre: offre?.substring(0, 100) || '', stand: stand?.substring(0, 100) || '', eventId, eventTitle: eventTitle?.substring(0, 100) || '', email: email.substring(0, 200), exposantId: exposantId || '', type: 'exposant_boost' },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/boost/success?nom=${encodeURIComponent(nom)}&event=${encodeURIComponent(eventTitle || '')}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    })

    return NextResponse.json({ url: session.url, sessionId: session.id })
  } catch (err: any) {
    console.error('Exposant boost error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
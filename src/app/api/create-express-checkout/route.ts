import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string, max = 10): boolean {
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
    const { nom, email, montant, eventTitle, eventId } = body

    if (!nom || typeof nom !== 'string' || nom.length > 200) return NextResponse.json({ error: 'Nom invalide' }, { status: 400 })
    if (!email || !email.includes('@')) return NextResponse.json({ error: 'Email invalide' }, { status: 400 })
    if (!montant || isNaN(parseFloat(montant)) || parseFloat(montant) <= 0 || parseFloat(montant) > 10000) return NextResponse.json({ error: 'Montant invalide' }, { status: 400 })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: email,
      line_items: [{ price_data: { currency: 'eur', product_data: { name: `Place marché — ${eventTitle?.substring(0, 100) || 'Marché PulseMarket'}`, description: `Forain : ${nom.substring(0, 100)} · Paiement express placier` }, unit_amount: Math.round(parseFloat(montant) * 100) }, quantity: 1 }],
      success_url: `${appUrl}/paiement-express/success?session_id={CHECKOUT_SESSION_ID}&email=${encodeURIComponent(email)}&nom=${encodeURIComponent(nom)}&event=${encodeURIComponent(eventTitle || '')}&montant=${montant}`,
      cancel_url: `${appUrl}/dashboard/placier`,
      metadata: { type: 'express', nom: nom.substring(0, 100), email: email.substring(0, 200), eventId: eventId?.substring(0, 100) || '', eventTitle: eventTitle?.substring(0, 100) || '' },
    })

    return NextResponse.json({ url: session.url, sessionId: session.id })
  } catch (err: any) {
    console.error('Express checkout error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { securityLog } from '@/lib/securityLog'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 5
const WINDOW_MS = 60_000

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) { rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS }); return true }
  if (entry.count >= RATE_LIMIT) return false
  entry.count++; return true
}

setInterval(() => {
  const now = Date.now()
  rateLimitMap.forEach((val, key) => { if (now > val.resetAt) rateLimitMap.delete(key) })
}, 5 * 60_000)

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown'

    // ✅ Rate limiting
    if (!checkRateLimit(ip)) {
      await securityLog({ action: 'rate_limit_atteint', ip, details: { route: 'checkout' } })
      return NextResponse.json({ error: 'Trop de requêtes. Réessayez dans une minute.' }, { status: 429 })
    }

    // ✅ Validation inputs
    const body = await req.json()
    const { candidatureId, eventTitle, amount, exposantEmail, exposantNom } = body

    if (!candidatureId || typeof candidatureId !== 'string' || candidatureId.length > 100) return NextResponse.json({ error: 'candidatureId invalide' }, { status: 400 })
    if (!amount || typeof amount !== 'number' || amount <= 0 || amount > 10000) return NextResponse.json({ error: 'Montant invalide' }, { status: 400 })
    if (!exposantEmail || !exposantEmail.includes('@')) return NextResponse.json({ error: 'Email invalide' }, { status: 400 })

    // ✅ Vérification DB
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const { data: candidature, error: dbError } = await supabase.from('applications').select('id, status, event_id, exposant_id').eq('id', candidatureId).single()

    if (dbError || !candidature) return NextResponse.json({ error: 'Candidature introuvable' }, { status: 404 })
    if (candidature.status !== 'validated') {
      await securityLog({ action: 'acces_non_autorise', ip, userId: candidature.exposant_id, details: { reason: 'candidature_non_validee', candidatureId } })
      return NextResponse.json({ error: 'Candidature non validée' }, { status: 403 })
    }

    // ✅ Création session Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: exposantEmail,
      line_items: [
        { price_data: { currency: 'eur', product_data: { name: `Redevance AOT — ${eventTitle}`, description: `Emplacement marché · ${exposantNom}`, images: [] }, unit_amount: Math.round(amount * 100) }, quantity: 1 },
        { price_data: { currency: 'eur', product_data: { name: 'Frais de service PulseMarket', description: 'Gestion candidature + vérification dossier' }, unit_amount: 200 }, quantity: 1 },
      ],
      metadata: {
        candidatureId,
        exposantNom: exposantNom?.substring(0, 100) || '',
        eventTitle: eventTitle?.substring(0, 100) || '',
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/paiement-success?session_id={CHECKOUT_SESSION_ID}&candidature_id=${candidatureId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    })

    // ✅ Log paiement initié
    await securityLog({
      action: 'paiement_initie',
      ip,
      userId: candidature.exposant_id,
      details: { candidatureId, eventTitle, amount, sessionId: session.id }
    })

    return NextResponse.json({ url: session.url, sessionId: session.id })

  } catch (err: any) {
    console.error('Stripe error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
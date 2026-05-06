import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { securityLog } from '@/lib/securityLog'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'stripe'

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err: any) {
    console.error('Webhook signature error:', err.message)
    // ✅ Log tentative webhook invalide
    await securityLog({ action: 'acces_non_autorise', ip, details: { reason: 'webhook_signature_invalide', error: err.message } })
    return NextResponse.json({ error: 'Signature invalide' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const meta = session.metadata || {}
    const email = meta.email || session.customer_email || ''
    const amount = (session.amount_total || 0) / 100

    // ── Boost commerçant ──────────────────────────────────────────────────
    if (meta.type === 'boost') {
      try {
        const supabase = getSupabase()
        await supabase.from('boost_ads').insert({
          event_id: meta.eventId, nom: meta.nom, offre: meta.offre,
          detail: meta.detail || '', adresse: meta.adresse || '',
          photo_url: meta.photoUrl || '', email,
          stripe_session_id: session.id, amount, status: 'active',
        })
        // ✅ Log
        await securityLog({ action: 'paiement_confirme', ip, details: { type: 'boost', sessionId: session.id, amount, eventId: meta.eventId } })
      } catch (err) { console.error('DB boost insert error:', err) }

      try {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send-email`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'boost_confirmation', to: email, data: { nom: meta.nom, offre: meta.offre, eventTitle: meta.eventTitle, eventId: meta.eventId, amount, stripeSessionId: session.id } })
        })
      } catch (err) { console.error('Email boost error:', err) }
    }

    // ── Boost exposant ────────────────────────────────────────────────────
    if (meta.type === 'exposant_boost') {
      try {
        const supabase = getSupabase()
        await supabase.from('exposant_boosts').insert({
          event_id: meta.eventId, exposant_id: meta.exposantId || null,
          nom: meta.nom, offre: meta.offre, stand: meta.stand || '', email,
          stripe_session_id: session.id, amount, status: 'active',
        })
        // ✅ Log
        await securityLog({ action: 'paiement_confirme', ip, userId: meta.exposantId || undefined, details: { type: 'exposant_boost', sessionId: session.id, amount, eventId: meta.eventId } })
      } catch (err) { console.error('DB exposant boost error:', err) }

      try {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send-email`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'boost_confirmation', to: email, data: { nom: meta.nom, offre: meta.offre, eventTitle: meta.eventTitle, eventId: meta.eventId, amount, stripeSessionId: session.id } })
        })
      } catch (err) { console.error('Email exposant boost error:', err) }
    }

    // ── Boost mairie ──────────────────────────────────────────────────────
    if (meta.type === 'mairie_boost') {
      try {
        const supabase = getSupabase()
        await supabase.from('mairie_boosts').insert({
          event_id: meta.eventId, organisateur_id: meta.organisateurId || null,
          email, stripe_session_id: session.id, amount, status: 'active',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        })
        // ✅ Log
        await securityLog({ action: 'paiement_confirme', ip, userId: meta.organisateurId || undefined, details: { type: 'mairie_boost', sessionId: session.id, amount, eventId: meta.eventId } })
      } catch (err) { console.error('DB mairie boost error:', err) }
    }

    // ── Paiement AOT exposant ─────────────────────────────────────────────
    if (meta.candidatureId) {
      try {
        const supabase = getSupabase()
        await supabase.from('applications')
          .update({ status: 'paid', stripe_session_id: session.id })
          .eq('id', meta.candidatureId)

        // ✅ Log paiement AOT confirmé
        await securityLog({
          action: 'paiement_confirme',
          ip,
          details: { type: 'aot', candidatureId: meta.candidatureId, sessionId: session.id, amount, exposantNom: meta.exposantNom }
        })
      } catch (err) { console.error('DB AOT update error:', err) }
    }
  }

  return NextResponse.json({ received: true })
}

export const config = { api: { bodyParser: false } }
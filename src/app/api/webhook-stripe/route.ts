import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err: any) {
    console.error('Webhook signature error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const meta = session.metadata || {}
    const email = meta.email || session.customer_email || ''

    // ── Boost commerçant "Expérience prolongée" ───────────────────────────
    if (meta.type === 'boost') {
      try {
        const supabase = getSupabase()
        await supabase.from('boost_ads').insert({
          event_id: meta.eventId,
          nom: meta.nom,
          offre: meta.offre,
          detail: meta.detail || '',
          adresse: meta.adresse || '',
          photo_url: meta.photoUrl || '',
          email,
          stripe_session_id: session.id,
          amount: (session.amount_total || 0) / 100,
          status: 'active',
        })
      } catch (err) {
        console.error('DB boost insert error:', err)
      }

      try {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'boost_confirmation',
            to: email,
            data: {
              nom: meta.nom,
              offre: meta.offre,
              eventTitle: meta.eventTitle,
              eventId: meta.eventId,
              amount: (session.amount_total || 0) / 100,
              stripeSessionId: session.id,
            }
          })
        })
      } catch (err) {
        console.error('Email boost error:', err)
      }
    }

    // ── Boost exposant "À ne pas manquer" ─────────────────────────────────
    if (meta.type === 'exposant_boost') {
      try {
        const supabase = getSupabase()
        await supabase.from('exposant_boosts').insert({
          event_id: meta.eventId,
          exposant_id: meta.exposantId || null,
          nom: meta.nom,
          offre: meta.offre,
          stand: meta.stand || '',
          email,
          stripe_session_id: session.id,
          amount: (session.amount_total || 0) / 100,
          status: 'active',
        })
      } catch (err) {
        console.error('DB exposant boost error:', err)
      }

      try {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'boost_confirmation',
            to: email,
            data: {
              nom: meta.nom,
              offre: meta.offre,
              eventTitle: meta.eventTitle,
              eventId: meta.eventId,
              amount: (session.amount_total || 0) / 100,
              stripeSessionId: session.id,
            }
          })
        })
      } catch (err) {
        console.error('Email exposant boost error:', err)
      }
    }

    // ── Paiement exposant classique (AOT) ─────────────────────────────────
    if (meta.candidatureId) {
      try {
        const supabase = getSupabase()
        await supabase.from('applications')
          .update({ status: 'paid', stripe_session_id: session.id })
          .eq('id', meta.candidatureId)
      } catch (err) {
        console.error('DB AOT update error:', err)
      }
    }
  }

  return NextResponse.json({ received: true })
}

export const config = { api: { bodyParser: false } }
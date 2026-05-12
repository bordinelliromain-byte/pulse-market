import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

async function sendEmail(to: string, type: string, data: any) {
  try {
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, to, data })
    })
  } catch (e) { console.error('Email error:', e) }
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    console.error('Webhook signature error:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    switch (event.type) {

      // ✅ Checkout complété
      case 'checkout.session.completed': {
        const session = event.data.object as any

        // ── Abonnement Pro
        if (session.metadata?.type === 'pro_subscription') {
          const userId = session.metadata.userId
          const subscriptionId = session.subscription as string
          const subscription = await stripe.subscriptions.retrieve(subscriptionId) as any
          const expiresAt = new Date((subscription.current_period_end as number) * 1000).toISOString()

          await supabase.from('profiles').update({
            plan: 'pro',
            stripe_subscription_id: subscriptionId,
            pro_expires_at: expiresAt,
          }).eq('id', userId)

          // Email bienvenue Pro
          const { data: profile } = await supabase.from('profiles').select('email, full_name').eq('id', userId).single()
          if (profile?.email) {
            await sendEmail(profile.email, 'bienvenue_pro', {
              nom: profile.full_name || '',
              montant: '20',
              prochainePeriode: new Date(expiresAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
            })
          }
        }

        // ── Paiement de place (candidature)
        if (session.metadata?.candidatureId) {
          const candidatureId = session.metadata.candidatureId

          await supabase.from('applications').update({ status: 'paid' }).eq('id', candidatureId)

          const { data: app } = await supabase.from('applications')
            .select('*, profiles:exposant_id(full_name, email), events:event_id(title, start_date, location_name, price_per_spot)')
            .eq('id', candidatureId).single()

          if (app && (app.profiles as any)?.email) {
            await sendEmail((app.profiles as any).email, 'paiement_confirme', {
              exposantNom: (app.profiles as any).full_name || '',
              eventTitle: (app.events as any)?.title || '',
              eventDate: (app.events as any)?.start_date
                ? new Date((app.events as any).start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
                : '',
              eventLocation: (app.events as any)?.location_name || '',
              redevanceAOT: (app.events as any)?.price_per_spot || 0,
              fraisPlateforme: 2,
            })
          }
        }

        break
      }

      // ✅ Renouvellement abonnement Pro → email facture mensuelle
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any
        const subscriptionId = invoice.subscription as string
        if (!subscriptionId) break

        const subscription = await stripe.subscriptions.retrieve(subscriptionId) as any
        const userId = subscription.metadata?.userId
        if (!userId) break

        const expiresAt = new Date((subscription.current_period_end as number) * 1000).toISOString()
        await supabase.from('profiles').update({ plan: 'pro', pro_expires_at: expiresAt }).eq('id', userId)

        // ✅ Email facture mensuelle Pro
        const { data: profile } = await supabase.from('profiles').select('email, full_name').eq('id', userId).single()
        if (profile?.email) {
          await sendEmail(profile.email, 'facture_pro_mensuelle', {
            nom: profile.full_name || '',
            montant: '20',
            periode: new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
            prochainePeriode: new Date(expiresAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
            invoiceUrl: invoice.hosted_invoice_url || '',
          })
        }

        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any
        const subscriptionId = invoice.subscription as string
        if (!subscriptionId) break

        const subscription = await stripe.subscriptions.retrieve(subscriptionId) as any
        const userId = subscription.metadata?.userId
        if (!userId) break

        await supabase.from('profiles').update({
          plan: 'free',
          stripe_subscription_id: null,
          pro_expires_at: null,
        }).eq('id', userId)

        // Email échec paiement
        const { data: profile } = await supabase.from('profiles').select('email, full_name').eq('id', userId).single()
        if (profile?.email) {
          await sendEmail(profile.email, 'paiement_echec', {
            nom: profile.full_name || '',
          })
        }

        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any
        const userId = subscription.metadata?.userId
        if (!userId) break

        await supabase.from('profiles').update({
          plan: 'free',
          stripe_subscription_id: null,
          pro_expires_at: null,
        }).eq('id', userId)

        break
      }
    }
  } catch (err) {
    console.error('Webhook handler error:', err)
    return NextResponse.json({ error: 'Handler error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
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

      case 'checkout.session.completed': {
        const session = event.data.object as any
        if (session.metadata?.type !== 'pro_subscription') break

        const userId = session.metadata.userId
        const subscriptionId = session.subscription as string

        const subscription = await stripe.subscriptions.retrieve(subscriptionId) as any
        const expiresAt = new Date((subscription.current_period_end as number) * 1000).toISOString()

        await supabase.from('profiles').update({
          plan: 'pro',
          stripe_subscription_id: subscriptionId,
          pro_expires_at: expiresAt,
        }).eq('id', userId)

        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any
        const subscriptionId = invoice.subscription as string
        if (!subscriptionId) break

        const subscription = await stripe.subscriptions.retrieve(subscriptionId) as any
        const userId = subscription.metadata?.userId
        if (!userId) break

        const expiresAt = new Date((subscription.current_period_end as number) * 1000).toISOString()

        await supabase.from('profiles').update({
          plan: 'pro',
          pro_expires_at: expiresAt,
        }).eq('id', userId)

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
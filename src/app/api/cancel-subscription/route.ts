import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId manquant' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_subscription_id, plan')
      .eq('id', userId)
      .single()

    if (!profile?.stripe_subscription_id) {
      return NextResponse.json({ error: 'Aucun abonnement actif' }, { status: 400 })
    }

    // Annule à la fin de la période (pas immédiatement)
    await stripe.subscriptions.update(profile.stripe_subscription_id, {
      cancel_at_period_end: true,
    })

    // On met à jour le statut mais il garde l'accès Pro jusqu'à la fin
    await supabase.from('profiles').update({
      plan: 'canceling',
    }).eq('id', userId)

    return NextResponse.json({ success: true })

  } catch (err: any) {
    console.error('Cancel subscription error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
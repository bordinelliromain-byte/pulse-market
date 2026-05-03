import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
  try {
    const { eventId, eventTitle, email, organisateurId } = await req.json()

    if (!eventId || !email) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
    }

    // Vérifier qu'il n'y a pas déjà un boost actif pour ce marché
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { count } = await supabase
      .from('mairie_boosts')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())

    if ((count || 0) >= 1) {
      return NextResponse.json({ error: 'Ce marché est déjà mis en avant cette semaine.' }, { status: 400 })
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: email,
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: `Marché en vedette — ${eventTitle}`,
            description: 'Votre marché en position 1 sur Whatmarket pendant 7 jours',
          },
          unit_amount: 20000, // 200€
        },
        quantity: 1,
      }],
      metadata: {
        eventId,
        eventTitle,
        email,
        organisateurId: organisateurId || '',
        type: 'mairie_boost',
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/organisateur?boost=success&event=${encodeURIComponent(eventTitle)}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/organisateur`,
    })

    return NextResponse.json({ url: session.url, sessionId: session.id })
  } catch (err: any) {
    console.error('Mairie boost checkout error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
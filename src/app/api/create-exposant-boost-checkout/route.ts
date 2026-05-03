import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
  try {
    const { nom, offre, stand, eventId, eventTitle, email, exposantId } = await req.json()

    if (!nom || !eventId || !email) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
    }

    // Vérifier qu'il n'y a pas déjà un boost actif pour ce marché
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { count } = await supabase
      .from('exposant_boosts')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .eq('status', 'active')

    if ((count || 0) >= 1) {
      return NextResponse.json({ error: 'Le slot "À ne pas manquer" est déjà pris pour ce marché.' }, { status: 400 })
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `À ne pas manquer — ${eventTitle}`,
              description: `${nom} · ${offre}`,
            },
            unit_amount: 1500, // 15€
          },
          quantity: 1,
        },
      ],
      metadata: {
        nom,
        offre,
        stand: stand || '',
        eventId,
        eventTitle,
        email,
        exposantId: exposantId || '',
        type: 'exposant_boost',
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/boost/success?nom=${encodeURIComponent(nom)}&event=${encodeURIComponent(eventTitle)}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    })

    return NextResponse.json({ url: session.url, sessionId: session.id })
  } catch (err: any) {
    console.error('Exposant boost checkout error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
  try {
    const { nom, offre, detail, eventId, eventTitle, email } = await req.json()

    if (!nom || !eventId || !email) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
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
              name: `Boost My Business — ${eventTitle}`,
              description: `${nom} · ${offre}`,
            },
            unit_amount: 2000, // 20€ en centimes
          },
          quantity: 1,
        },
      ],
      metadata: {
        nom,
        offre,
        detail: detail || '',
        eventId,
        eventTitle,
        email,
        type: 'boost',
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/pro/ads/success?session_id={CHECKOUT_SESSION_ID}&nom=${encodeURIComponent(nom)}&event=${encodeURIComponent(eventTitle)}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pro/ads/new`,
    })

    return NextResponse.json({ url: session.url, sessionId: session.id })
  } catch (err: any) {
    console.error('Stripe boost error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
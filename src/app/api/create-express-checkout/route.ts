import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
  try {
    const { nom, email, montant, eventTitle, eventId } = await req.json()

    if (!nom || !email || !montant) {
      return NextResponse.json({ error: 'Champs manquants' }, { status: 400 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Place marché — ${eventTitle || 'Marché PlaceMarket'}`,
              description: `Forain : ${nom} · Paiement express placier`,
            },
            unit_amount: Math.round(parseFloat(montant) * 100),
          },
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/paiement-express/success?session_id={CHECKOUT_SESSION_ID}&email=${encodeURIComponent(email)}&nom=${encodeURIComponent(nom)}&event=${encodeURIComponent(eventTitle || '')}&montant=${montant}`,
      cancel_url: `${appUrl}/dashboard/placier`,
      metadata: {
        type: 'express',
        nom,
        email,
        eventId: eventId || '',
        eventTitle: eventTitle || '',
      },
    })

    return NextResponse.json({ url: session.url, sessionId: session.id })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
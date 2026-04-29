import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
  try {
    const { candidatureId, eventTitle, amount, exposantEmail, exposantNom } = await req.json()

    if (!candidatureId || !amount) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: exposantEmail,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Redevance AOT — ${eventTitle}`,
              description: `Emplacement marché · ${exposantNom}`,
              images: [],
            },
            unit_amount: Math.round(amount * 100), // en centimes
          },
          quantity: 1,
        },
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Frais de service PlaceMarket',
              description: 'Gestion candidature + vérification dossier',
            },
            unit_amount: 200, // 2€ en centimes
          },
          quantity: 1,
        },
      ],
      metadata: {
        candidatureId,
        exposantNom,
        eventTitle,
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/paiement-success?session_id={CHECKOUT_SESSION_ID}&candidature_id=${candidatureId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    })

    return NextResponse.json({ url: session.url, sessionId: session.id })
  } catch (err: any) {
    console.error('Stripe error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
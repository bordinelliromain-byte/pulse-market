// src/lib/stripe.ts
import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2026-05-27.dahlia',
  typescript: true,
  appInfo: {
    name: 'PulseMarket',
    version: '1.0.0',
    url: 'https://pulse-market.fr',
  },
})

// ═══════════════════════════════════════════════════════════
// PRODUITS PULSEMARKET
// ═══════════════════════════════════════════════════════════

export const STRIPE_PRODUCTS = {
  EXPOSANT_PRO: {
    name: 'PulseMarket Exposant Pro',
    description: 'Candidatures illimitées, badge Dossier Vérifié, alertes géolocalisées',
    price: 2000, // 20€ en centimes
    interval: 'month' as const,
    currency: 'eur',
  },
} as const

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════

export function formatPrice(amount: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
  }).format(amount / 100)
}

// Vérifier signature webhook
export async function verifyStripeWebhook(body: string, signature: string) {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not defined')
  }
  return stripe.webhooks.constructEvent(
    body,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET
  )
}
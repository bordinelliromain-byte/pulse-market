// src/app/api/delete-account/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20' as any,
})

// ⚠️ Service role key (server-side only, jamais expose côté client)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json()
    if (!userId) {
      return NextResponse.json({ error: 'userId requis' }, { status: 400 })
    }

    // 1. Récupérer le profil pour avoir le stripe_customer_id
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('stripe_customer_id, stripe_subscription_id')
      .eq('id', userId)
      .single()

    // 2. Annuler abonnement Stripe s'il existe
    if (profile?.stripe_subscription_id) {
      try {
        await stripe.subscriptions.cancel(profile.stripe_subscription_id)
      } catch (e) {
        console.error('Erreur annulation subscription:', e)
      }
    }

    // 3. Supprimer le client Stripe
    if (profile?.stripe_customer_id) {
      try {
        await stripe.customers.del(profile.stripe_customer_id)
      } catch (e) {
        console.error('Erreur suppression customer:', e)
      }
    }

    // 4. Supprimer les données dans Supabase (CASCADE)
    // Ordre important pour respecter les foreign keys
    await supabaseAdmin.from('applications').delete().eq('exposant_id', userId)
    await supabaseAdmin.from('exposant_boosts').delete().eq('exposant_id', userId)
    await supabaseAdmin.from('exposant_data').delete().eq('user_id', userId)
    await supabaseAdmin.from('stripe_invoices').delete().eq('user_id', userId)
    await supabaseAdmin.from('profiles').delete().eq('id', userId)

    // 5. Supprimer les fichiers du storage
    try {
      const { data: files } = await supabaseAdmin.storage.from('documents').list(userId)
      if (files && files.length > 0) {
        const paths = files.map(f => `${userId}/${f.name}`)
        await supabaseAdmin.storage.from('documents').remove(paths)
      }
    } catch (e) {
      console.error('Erreur suppression storage:', e)
    }

    // 6. Supprimer le user Auth (DOIT être en dernier)
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Erreur delete-account:', err)
    return NextResponse.json({ error: err.message || 'Erreur serveur' }, { status: 500 })
  }
}
// src/app/api/stripe-webhook/route.ts
// ═════════════════════════════════════════════════════════════
// PULSEMARKET — Stripe Webhook UNIFIÉ
// Gère TOUS les events Stripe : Pro, AOT, Boosts (3 types)
// CRITIQUE : signature validation obligatoire
// ═════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { securityLog } from '@/lib/securityLog'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

// ─── Idempotency : éviter de traiter 2x le même event ───
const processedEvents = new Set<string>()
const MAX_PROCESSED = 1000

setInterval(() => {
  if (processedEvents.size > MAX_PROCESSED) {
    processedEvents.clear()
  }
}, 60 * 60_000)

// ─── Helper : client Supabase admin ───
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// ─── Helper : envoi email safe ───
async function sendEmailSafe(to: string, type: string, data: any) {
  try {
    const url = process.env.NEXT_PUBLIC_APP_URL || 'https://pulse-market.fr'
    const res = await fetch(`${url}/api/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, to, data })
    })
    if (!res.ok) {
      console.error(`[stripe-webhook] Email ${type} failed:`, await res.text())
    }
  } catch (e) {
    console.error(`[stripe-webhook] Email ${type} error:`, e)
  }
}

// ═════════════════════════════════════════════════════════════
// POST /api/stripe-webhook — Endpoint UNIFIÉ
// ═════════════════════════════════════════════════════════════
export async function POST(req: NextRequest) {
  try {
    // ─── 1. Vérifier env vars critiques ───
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('[stripe-webhook] STRIPE_WEBHOOK_SECRET manquant')
      return NextResponse.json({ error: 'Configuration invalide' }, { status: 500 })
    }
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('[stripe-webhook] STRIPE_SECRET_KEY manquant')
      return NextResponse.json({ error: 'Configuration invalide' }, { status: 500 })
    }
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('[stripe-webhook] SUPABASE_SERVICE_ROLE_KEY manquant')
      return NextResponse.json({ error: 'Configuration invalide' }, { status: 500 })
    }

    // ─── 2. Récupérer body raw + signature ───
    const body = await req.text()
    const sig = req.headers.get('stripe-signature')
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'stripe'

    if (!sig) {
      await securityLog({
        action: 'acces_non_autorise',
        ip,
        details: { reason: 'webhook_signature_manquante' }
      })
      return NextResponse.json({ error: 'Signature manquante' }, { status: 400 })
    }

    // ─── 3. Valider signature (CRITIQUE) ───
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(
        body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      )
    } catch (err: any) {
      console.error('[stripe-webhook] ⚠️ SIGNATURE INVALIDE:', err.message)
      await securityLog({
        action: 'acces_non_autorise',
        ip,
        details: {
          reason: 'webhook_signature_invalide',
          error: err.message
        }
      })
      return NextResponse.json({ error: 'Signature invalide' }, { status: 400 })
    }

    // ─── 4. Idempotency check ───
    if (processedEvents.has(event.id)) {
      console.log('[stripe-webhook] Event déjà traité:', event.id)
      return NextResponse.json({ received: true, duplicate: true })
    }
    processedEvents.add(event.id)

    const supabase = getSupabase()

    // ─── 5. ROUTEUR PAR EVENT TYPE ───
    try {
      switch (event.type) {

        // ═══════════════════════════════════════
        // CHECKOUT COMPLÉTÉ
        // → Pro subscription, AOT, Boosts (3 types)
        // ═══════════════════════════════════════
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session
          const meta = session.metadata || {}
          const email = meta.email || session.customer_email || ''
          const amount = (session.amount_total || 0) / 100

          // ════════════════════════════════════
          // 🅰️ ABONNEMENT PRO
          // ════════════════════════════════════
          if (meta.type === 'pro_subscription') {
            const userId = meta.userId
            if (!userId) {
              console.error('[stripe-webhook] userId manquant pour pro_subscription')
              break
            }

            const subscriptionId = session.subscription as string
            const subscription = await stripe.subscriptions.retrieve(subscriptionId) as any
            const expiresAt = new Date((subscription.current_period_end as number) * 1000).toISOString()

            const { error: updateErr } = await supabase.from('profiles').update({
              plan: 'pro',
              stripe_subscription_id: subscriptionId,
              pro_expires_at: expiresAt,
            }).eq('id', userId)

            if (updateErr) {
              console.error('[stripe-webhook] Update profile error:', updateErr)
              throw new Error('DB update failed')
            }

            // Email bienvenue Pro
            const { data: profile } = await supabase
              .from('profiles')
              .select('email, full_name')
              .eq('id', userId)
              .single()

            if (profile?.email) {
              await sendEmailSafe(profile.email, 'bienvenue_pro', {
                nom: profile.full_name || '',
                montant: '20',
                prochainePeriode: new Date(expiresAt).toLocaleDateString('fr-FR', {
                  day: 'numeric', month: 'long', year: 'numeric'
                }),
              })
            }

            await securityLog({
              action: 'paiement_confirme',
              ip,
              userId,
              details: { type: 'pro_subscription', sessionId: session.id, amount }
            })

            console.log('[stripe-webhook] ✅ Pro subscription:', userId)
            break
          }

          // ════════════════════════════════════
          // 🅱️ PAIEMENT AOT (candidature)
          // ════════════════════════════════════
          if (meta.candidatureId) {
            const candidatureId = meta.candidatureId

            const { error: updateErr } = await supabase
              .from('applications')
              .update({
                status: 'paid',
                stripe_session_id: session.id,
              })
              .eq('id', candidatureId)

            if (updateErr) {
              console.error('[stripe-webhook] Update application error:', updateErr)
              throw new Error('DB update failed')
            }

            // Récupère candidature + event + mairie pour les emails
            const { data: app } = await supabase
              .from('applications')
              .select(`
                *,
                profiles:exposant_id(full_name, email),
                events:event_id(
                  title, start_date, location_name, price_per_spot, organisateur_id,
                  organisateur:organisateur_id(email, organisation_name, full_name, logo_url)
                )
              `)
              .eq('id', candidatureId)
              .single()

            if (app && (app.profiles as any)?.email) {
              const mairie = (app.events as any)?.organisateur || null
              const formattedDate = (app.events as any)?.start_date
                ? new Date((app.events as any).start_date).toLocaleDateString('fr-FR', {
                    day: 'numeric', month: 'long', year: 'numeric'
                  })
                : ''

              // Email à l'exposant
              await sendEmailSafe((app.profiles as any).email, 'paiement_confirme', {
                exposantNom: (app.profiles as any).full_name || '',
                eventTitle: (app.events as any)?.title || '',
                eventDate: formattedDate,
                eventLocation: (app.events as any)?.location_name || '',
                redevanceAOT: (app.events as any)?.price_per_spot || 0,
                fraisPlateforme: 2,
                mairieNom: mairie?.organisation_name || mairie?.full_name,
                mairieLogoUrl: mairie?.logo_url,
              })

              // Email à la mairie
              if (mairie?.email) {
                await sendEmailSafe(mairie.email, 'paiement_recu_mairie', {
                  exposantNom: (app.profiles as any).full_name || '',
                  exposantEmail: (app.profiles as any).email || '',
                  eventTitle: (app.events as any)?.title || '',
                  eventDate: formattedDate,
                  montant: (app.events as any)?.price_per_spot || 0,
                })
              }
            }

            await securityLog({
              action: 'paiement_confirme',
              ip,
              details: {
                type: 'aot',
                candidatureId,
                sessionId: session.id,
                amount,
                exposantNom: meta.exposantNom
              }
            })

            console.log('[stripe-webhook] ✅ AOT payée:', candidatureId)
            break
          }

          // ════════════════════════════════════
          // 🆎 BOOST COMMERÇANT
          // ════════════════════════════════════
          if (meta.type === 'boost') {
            if (!meta.eventId || !meta.nom || !meta.offre) {
              console.error('[stripe-webhook] Metadata invalide pour boost')
              break
            }

            const { error: insertErr } = await supabase.from('boost_ads').insert({
              event_id: meta.eventId,
              nom: meta.nom,
              offre: meta.offre,
              detail: meta.detail || '',
              adresse: meta.adresse || '',
              photo_url: meta.photoUrl || '',
              email,
              stripe_session_id: session.id,
              amount,
              status: 'active',
            })

            if (insertErr) {
              console.error('[stripe-webhook] DB boost insert error:', insertErr)
              throw insertErr
            }

            await sendEmailSafe(email, 'boost_confirmation', {
              nom: meta.nom,
              offre: meta.offre,
              eventTitle: meta.eventTitle,
              eventId: meta.eventId,
              amount,
              stripeSessionId: session.id,
            })

            await securityLog({
              action: 'paiement_confirme',
              ip,
              details: { type: 'boost', sessionId: session.id, amount, eventId: meta.eventId }
            })

            console.log('[stripe-webhook] ✅ Boost commerçant:', meta.nom)
            break
          }

          // ════════════════════════════════════
          // 🆑 BOOST EXPOSANT
          // ════════════════════════════════════
          if (meta.type === 'exposant_boost') {
            if (!meta.eventId || !meta.nom || !meta.offre) {
              console.error('[stripe-webhook] Metadata invalide pour exposant_boost')
              break
            }

            const { error: insertErr } = await supabase.from('exposant_boosts').insert({
              event_id: meta.eventId,
              exposant_id: meta.exposantId || null,
              nom: meta.nom,
              offre: meta.offre,
              stand: meta.stand || '',
              email,
              stripe_session_id: session.id,
              amount,
              status: 'active',
            })

            if (insertErr) {
              console.error('[stripe-webhook] DB exposant boost error:', insertErr)
              throw insertErr
            }

            await sendEmailSafe(email, 'boost_confirmation', {
              nom: meta.nom,
              offre: meta.offre,
              eventTitle: meta.eventTitle,
              eventId: meta.eventId,
              amount,
              stripeSessionId: session.id,
            })

            await securityLog({
              action: 'paiement_confirme',
              ip,
              userId: meta.exposantId || undefined,
              details: { type: 'exposant_boost', sessionId: session.id, amount, eventId: meta.eventId }
            })

            console.log('[stripe-webhook] ✅ Boost exposant:', meta.nom)
            break
          }

          // ════════════════════════════════════
          // 🆖 BOOST MAIRIE
          // ════════════════════════════════════
          if (meta.type === 'mairie_boost') {
            if (!meta.eventId) {
              console.error('[stripe-webhook] Metadata invalide pour mairie_boost')
              break
            }

            const { error: insertErr } = await supabase.from('mairie_boosts').insert({
              event_id: meta.eventId,
              organisateur_id: meta.organisateurId || null,
              email,
              stripe_session_id: session.id,
              amount,
              status: 'active',
              expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            })

            if (insertErr) {
              console.error('[stripe-webhook] DB mairie boost error:', insertErr)
              throw insertErr
            }

            await securityLog({
              action: 'paiement_confirme',
              ip,
              userId: meta.organisateurId || undefined,
              details: { type: 'mairie_boost', sessionId: session.id, amount, eventId: meta.eventId }
            })

            console.log('[stripe-webhook] ✅ Boost mairie:', meta.eventId)
            break
          }

          // ════════════════════════════════════
          // FALLBACK : checkout non géré
          // ════════════════════════════════════
          console.log('[stripe-webhook] Checkout sans handler:', { type: meta.type, candidatureId: meta.candidatureId })
          break
        }

        // ═══════════════════════════════════════
        // RENOUVELLEMENT PRO (mensuel)
        // ═══════════════════════════════════════
        case 'invoice.payment_succeeded': {
          const invoice = event.data.object as any
          const subscriptionId = invoice.subscription as string
          if (!subscriptionId) break

          // ✅ Skip la première facture (déjà gérée par checkout.session.completed)
          if (invoice.billing_reason === 'subscription_create') break

          const subscription = await stripe.subscriptions.retrieve(subscriptionId) as any
          const userId = subscription.metadata?.userId
          if (!userId) break

          const expiresAt = new Date((subscription.current_period_end as number) * 1000).toISOString()
          await supabase.from('profiles').update({
            plan: 'pro',
            pro_expires_at: expiresAt
          }).eq('id', userId)

          const { data: profile } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', userId)
            .single()

          if (profile?.email) {
            await sendEmailSafe(profile.email, 'facture_pro_mensuelle', {
              nom: profile.full_name || '',
              montant: '20',
              periode: new Date().toLocaleDateString('fr-FR', {
                month: 'long', year: 'numeric'
              }),
              prochainePeriode: new Date(expiresAt).toLocaleDateString('fr-FR', {
                day: 'numeric', month: 'long', year: 'numeric'
              }),
              invoiceUrl: invoice.hosted_invoice_url || '',
            })
          }

          console.log('[stripe-webhook] ✅ Pro renewal:', userId)
          break
        }

        // ═══════════════════════════════════════
        // ÉCHEC PAIEMENT PRO → downgrade
        // ═══════════════════════════════════════
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

          const { data: profile } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', userId)
            .single()

          if (profile?.email) {
            await sendEmailSafe(profile.email, 'paiement_echec', {
              nom: profile.full_name || '',
            })
          }

          console.log('[stripe-webhook] ⚠️ Pro payment failed:', userId)
          break
        }

        // ═══════════════════════════════════════
        // ANNULATION PRO → downgrade
        // ═══════════════════════════════════════
        case 'customer.subscription.deleted': {
          const subscription = event.data.object as any
          const userId = subscription.metadata?.userId
          if (!userId) break

          await supabase.from('profiles').update({
            plan: 'free',
            stripe_subscription_id: null,
            pro_expires_at: null,
          }).eq('id', userId)

          console.log('[stripe-webhook] ✅ Pro cancelled:', userId)
          break
        }

        // ═══════════════════════════════════════
        // EVENTS NON GÉRÉS (loggés mais ignorés)
        // ═══════════════════════════════════════
        default:
          console.log('[stripe-webhook] Event non géré:', event.type)
      }

    } catch (handlerErr: any) {
      console.error('[stripe-webhook] Handler error:', handlerErr)
      // ✅ Retirer pour permettre retry Stripe
      processedEvents.delete(event.id)
      return NextResponse.json({ error: 'Handler error' }, { status: 500 })
    }

    return NextResponse.json({ received: true })

  } catch (err: any) {
    console.error('[stripe-webhook] Fatal error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
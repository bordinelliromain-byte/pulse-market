// src/app/api/delete-account/route.ts
// ═════════════════════════════════════════════════════════════
// PULSEMARKET — API Delete Account
// Suppression complète d'un compte (RGPD Article 17 - Droit à l'oubli)
// CRITIQUE : seul le user lui-même peut supprimer son compte
// ═════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
import { z } from 'zod'
import { validateBody, checkRateLimit } from '@/lib/validation'
import { logAudit } from '@/lib/auditLogger'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20' as any,
})

// ─── Schéma Zod strict ───
const deleteSchema = z.object({
  // ✅ Confirmation obligatoire (anti-erreur)
  confirmation: z.literal('SUPPRIMER MON COMPTE', {
    message: 'Confirmation requise : tapez "SUPPRIMER MON COMPTE"'
  }),
  // ✅ Raison optionnelle (RGPD compliance + UX feedback)
  reason: z.string().trim().max(500).optional(),
})

// ═════════════════════════════════════════════════════════════
// POST /api/delete-account
// ═════════════════════════════════════════════════════════════
export async function POST(req: NextRequest) {
  try {
    // ─── 1. Rate limit ULTRA STRICT (1 tentative / heure / IP) ───
    const limited = checkRateLimit(req, {
      max: 1,
      windowMs: 60 * 60_000, // 1 heure
      keyPrefix: 'delete-account',
    })
    if (limited) return limited

    // ─── 2. Validation Zod ───
    const result = await validateBody(req, deleteSchema)
    if (result instanceof NextResponse) return result
    const { reason } = result

    // ─── 3. Vérifier que le user est authentifié ───
    const res = NextResponse.json({ success: true }) // placeholder
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => req.cookies.getAll(),
          setAll: () => {},
        },
      }
    )

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // ✅ IMPORTANT : on prend l'ID du user authentifié, PAS du body
    // → Impossible de supprimer le compte de quelqu'un d'autre
    const userId = user.id

    // ─── 4. Vérifier env vars critiques ───
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('[delete-account] SUPABASE_SERVICE_ROLE_KEY manquant')
      return NextResponse.json({ error: 'Configuration serveur invalide' }, { status: 500 })
    }

    // ─── 5. Client Supabase admin (service role) ───
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // ─── 6. Récupérer le profil (avec toutes les infos nécessaires) ───
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, role, mairie_id, stripe_customer_id, stripe_subscription_id, organisation_name, full_name')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })
    }

    // ─── 7. AUDIT LOG AVANT suppression (traçabilité légale) ───
    // ✅ Capturé AVANT de supprimer pour avoir la trace
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('x-real-ip')
      || 'unknown'
    const userAgent = (req.headers.get('user-agent') || 'unknown').substring(0, 500)

    try {
      await logAudit({
        mairie_id: profile.mairie_id || userId,
        actor_id: userId,
        actor_email: profile.email || user.email,
        action: 'account_deleted' as any,
        resource_type: 'profile' as any,
        resource_id: userId,
        details: {
          role: profile.role,
          organisation_name: profile.organisation_name,
          full_name: profile.full_name,
          reason: reason || null,
          had_subscription: !!profile.stripe_subscription_id,
          had_customer: !!profile.stripe_customer_id,
          rgpd_article: 'Article 17 - Droit à l\'effacement',
        },
        ip_address: ip,
        user_agent: userAgent,
      })
    } catch (auditErr) {
      // ✅ L'audit log ne doit pas bloquer la suppression (sinon impossible de supprimer si DB problème)
      console.error('[delete-account] Audit log failed:', auditErr)
    }

    // ─── 8. Annuler abonnement Stripe s'il existe ───
    if (profile.stripe_subscription_id) {
      try {
        await stripe.subscriptions.cancel(profile.stripe_subscription_id)
      } catch (e) {
        console.error('[delete-account] Stripe subscription cancel error:', e)
        // ✅ On continue quand même (le user veut supprimer son compte)
      }
    }

    // ─── 9. Supprimer le client Stripe ───
    if (profile.stripe_customer_id) {
      try {
        await stripe.customers.del(profile.stripe_customer_id)
      } catch (e) {
        console.error('[delete-account] Stripe customer delete error:', e)
      }
    }

    // ─── 10. Supprimer les données Supabase (CASCADE) ───
    // Ordre important pour respecter les foreign keys
    const tablesToDelete = [
      // Données EXPOSANT
      { table: 'applications', col: 'exposant_id' },
      { table: 'exposant_boosts', col: 'exposant_id' },
      { table: 'exposant_data', col: 'user_id' },
      { table: 'stripe_invoices', col: 'user_id' },

      // Données PLACIER (si applicable)
      { table: 'scan_history', col: 'placier_id' },
      { table: 'placier_planning', col: 'placier_id' },

      // Données MAIRIE (si applicable)
      { table: 'events', col: 'organisateur_id' },
      { table: 'placier_invitations', col: 'mairie_id' },
      { table: 'team_invitations', col: 'mairie_id' },
      { table: 'team_members', col: 'mairie_id' },
      { table: 'team_members', col: 'user_id' },
      { table: 'organisation_settings', col: 'mairie_id' },
      { table: 'organisation_legal', col: 'mairie_id' },
      { table: 'rgpd_exports', col: 'mairie_id' },

      // Profile en dernier
      { table: 'profiles', col: 'id' },
    ]

    for (const { table, col } of tablesToDelete) {
      try {
        await supabaseAdmin.from(table).delete().eq(col, userId)
      } catch (e) {
        // ✅ Continue même si une table n'existe pas (ex: si pas mairie, certaines tables vides)
        console.error(`[delete-account] Delete ${table} error:`, e)
      }
    }

    // ─── 11. Supprimer les fichiers du Storage ───
    try {
      const { data: files } = await supabaseAdmin.storage
        .from('documents')
        .list(userId)

      if (files && files.length > 0) {
        const paths = files.map(f => `${userId}/${f.name}`)
        await supabaseAdmin.storage.from('documents').remove(paths)
      }
    } catch (e) {
      console.error('[delete-account] Storage delete error:', e)
    }

    // Storage justificatifs (mairie)
    try {
      const { data: justifs } = await supabaseAdmin.storage
        .from('documents')
        .list(`justificatifs/${userId}`)

      if (justifs && justifs.length > 0) {
        const paths = justifs.map(f => `justificatifs/${userId}/${f.name}`)
        await supabaseAdmin.storage.from('documents').remove(paths)
      }
    } catch (e) {
      console.error('[delete-account] Storage justificatifs delete error:', e)
    }

    // ─── 12. Supprimer le user Auth (EN DERNIER) ───
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (authError) {
      console.error('[delete-account] Auth delete error:', authError)
      return NextResponse.json({
        error: 'Erreur lors de la suppression du compte auth',
        ...(process.env.NODE_ENV === 'development' && { details: authError.message }),
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Votre compte a été supprimé conformément au RGPD Article 17',
    })

  } catch (err: any) {
    console.error('[delete-account] Error:', err)
    return NextResponse.json({
      error: 'Erreur serveur',
      ...(process.env.NODE_ENV === 'development' && { details: err.message }),
    }, { status: 500 })
  }
}
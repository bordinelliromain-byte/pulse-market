// src/app/api/invite-placier/route.ts
// ═════════════════════════════════════════════════════════════
// PULSEMARKET — API Invite Placier
// Crée une invitation pour rejoindre l'équipe placier d'une mairie
// ═════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { sanitize } from '@/lib/sanitize'
import {
  validateBody,
  checkRateLimit,
  emailSchema,
  uuidSchema,
  RATE_LIMIT_STRICT,
} from '@/lib/validation'

// ─── Schéma Zod local ───
const inviteSchema = z.object({
  email: emailSchema,
  mairieId: uuidSchema,
  token: z.string().min(20, 'Token trop court').max(200, 'Token trop long'),
  full_name: z.string().trim().min(1).max(100).optional(),
})

// ═════════════════════════════════════════════════════════════
// POST /api/invite-placier
// ═════════════════════════════════════════════════════════════
export async function POST(req: NextRequest) {
  try {
    // ─── 1. Rate limit (5 invitations / min) ───
    const limited = checkRateLimit(req, { ...RATE_LIMIT_STRICT, keyPrefix: 'invite-placier' })
    if (limited) return limited

    // ─── 2. Validation Zod ───
    const result = await validateBody(req, inviteSchema)
    if (result instanceof NextResponse) return result
    const { email, mairieId, token, full_name } = result

    // ─── 3. Vérifier env vars ───
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('[invite-placier] SUPABASE_SERVICE_ROLE_KEY manquant')
      return NextResponse.json({ error: 'Configuration serveur invalide' }, { status: 500 })
    }

    // ─── 4. Client Supabase avec service role (server only) ───
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // ─── 5. Vérifier que la mairie existe ET est valide ───
    const { data: mairie, error: mairieErr } = await supabase
      .from('profiles')
      .select('id, role, organisateur_status')
      .eq('id', mairieId)
      .single()

    if (mairieErr || !mairie) {
      return NextResponse.json({ error: 'Organisateur introuvable' }, { status: 404 })
    }

    if (mairie.role !== 'organisateur') {
      return NextResponse.json({ error: 'Compte non autorisé' }, { status: 403 })
    }

    // ─── 6. Vérifier que la mairie a été validée par Anthropic ───
    if (mairie.organisateur_status && mairie.organisateur_status !== 'approved') {
      return NextResponse.json({
        error: 'Votre compte mairie doit être validé avant de pouvoir inviter des placiers'
      }, { status: 403 })
    }

    // ─── 7. Sanitize email ───
    const safeEmail = sanitize(email.toLowerCase().trim())
    const safeFullName = full_name ? sanitize(full_name.trim()) : null

    // ─── 8. Vérifier si invitation déjà existante (non utilisée) ───
    const { data: existing } = await supabase
      .from('placier_invitations')
      .select('id, used, created_at')
      .eq('email', safeEmail)
      .eq('mairie_id', mairieId)
      .eq('used', false)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({
        error: 'Une invitation est déjà en cours pour cet email'
      }, { status: 409 })
    }

    // ─── 9. Vérifier que l'email n'est pas déjà un placier de cette mairie ───
    const { data: existingPlacier } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', safeEmail)
      .eq('mairie_id', mairieId)
      .eq('role', 'placier')
      .maybeSingle()

    if (existingPlacier) {
      return NextResponse.json({
        error: 'Cet email est déjà un placier de votre mairie'
      }, { status: 409 })
    }

    // ─── 10. Créer l'invitation ───
    const { error: insertErr } = await supabase
      .from('placier_invitations')
      .insert({
        email: safeEmail,
        full_name: safeFullName,
        mairie_id: mairieId,
        token,
        used: false,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 jours
      })

    if (insertErr) {
      console.error('[invite-placier] Insert error:', insertErr)
      return NextResponse.json({ error: 'Erreur lors de la création de l\'invitation' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (err: any) {
    console.error('[invite-placier] Error:', err)
    // ✅ Pas de leak de détails en prod
    return NextResponse.json({
      error: 'Erreur serveur',
      ...(process.env.NODE_ENV === 'development' && { details: err.message }),
    }, { status: 500 })
  }
}
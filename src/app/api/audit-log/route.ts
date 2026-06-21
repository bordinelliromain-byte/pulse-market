// src/app/api/audit-log/route.ts
// ═════════════════════════════════════════════════════════════
// PULSEMARKET — API Audit Log
// Enregistre toutes les actions sensibles (RGPD, sécurité, conformité)
// Endpoint critique : traçabilité légale obligatoire
// ═════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { logAudit, type AuditAction, type ResourceType } from '@/lib/auditLogger'
import { validateBody, checkRateLimit } from '@/lib/validation'

// ─── Schéma Zod strict ───
const auditSchema = z.object({
  action: z.string().min(1).max(100),
  resource_type: z.string().max(50).optional(),
  resource_id: z.string().max(200).optional(),
  details: z.record(z.string(), z.any()).optional(),
})

// ═════════════════════════════════════════════════════════════
// POST /api/audit-log
// ═════════════════════════════════════════════════════════════
export async function POST(request: NextRequest) {
  try {
    // ─── 1. Rate limit large (100 logs/min/user pour pas bloquer les actions normales) ───
    const limited = checkRateLimit(request, {
      max: 100,
      windowMs: 60_000,
      keyPrefix: 'audit-log',
    })
    if (limited) return limited

    // ─── 2. Validation Zod ───
    const result = await validateBody(request, auditSchema)
    if (result instanceof NextResponse) return result
    const { action, resource_type, resource_id, details } = result

    // ─── 3. Récupérer client Supabase avec auth header ───
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const authHeader = request.headers.get('authorization')

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader || '' } },
      auth: { persistSession: false },
    })

    // ─── 4. Récupérer user (auth required) ───
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      // ✅ Pas authentifié → on rejette (sécurité)
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // ─── 5. Récupérer le profil pour le mairie_id + email ───
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, role, mairie_id')
      .eq('id', user.id)
      .single()

    // ─── 6. Déterminer le mairie_id de rattachement ───
    // - Organisateur (mairie principale) → c'est lui
    // - Placier → c'est le mairie_id de son profil
    // - Membre d'équipe mairie → c'est le mairie_id du team_member
    // - Sinon → on log avec son propre id
    let mairie_id = user.id

    if (profile?.mairie_id) {
      mairie_id = profile.mairie_id
    } else if (profile?.role === 'organisateur') {
      mairie_id = user.id
    } else {
      // Check si membre d'équipe
      const { data: teamMember } = await supabase
        .from('team_members')
        .select('mairie_id')
        .eq('user_id', user.id)
        .maybeSingle()
      if (teamMember) mairie_id = teamMember.mairie_id
    }

    // ─── 7. Capturer IP + User-Agent (RGPD compliant pour audit) ───
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown'
    const userAgent = (request.headers.get('user-agent') || 'unknown').substring(0, 500)

    // ─── 8. Log via le service role (côté serveur, RLS bypass) ───
    await logAudit({
      mairie_id,
      actor_id: user.id,
      actor_email: profile?.email || user.email,
      action: action as AuditAction,
      resource_type: resource_type as ResourceType | undefined,
      resource_id,
      details,
      ip_address: ip,
      user_agent: userAgent,
    })

    return NextResponse.json({ ok: true })

  } catch (err: any) {
    console.error('[audit-log] Error:', err)
    // ✅ Pas de leak des détails en prod
    return NextResponse.json({
      error: 'Erreur serveur',
      ...(process.env.NODE_ENV === 'development' && { details: err.message }),
    }, { status: 500 })
  }
}
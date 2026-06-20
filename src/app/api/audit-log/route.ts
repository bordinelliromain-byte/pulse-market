// src/app/api/audit-log/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logAudit, parseUserAgent, type AuditAction, type ResourceType } from '@/lib/auditLogger'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, resource_type, resource_id, details } = body as {
      action: AuditAction
      resource_type?: ResourceType
      resource_id?: string
      details?: Record<string, any>
    }

    if (!action) {
      return NextResponse.json({ error: 'Action required' }, { status: 400 })
    }

    // Récupérer le token d'auth depuis cookies
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    const authHeader = request.headers.get('authorization')
    const cookie = request.headers.get('cookie') || ''

    // Récupérer user
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader || '' } },
      auth: { persistSession: false },
    })

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      // Si pas authentifié, on log quand même les tentatives d'accès non autorisées
      return NextResponse.json({ ok: false }, { status: 401 })
    }

    // Récupérer le profil pour avoir le mairie_id et l'email
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, role, mairie_id')
      .eq('id', user.id)
      .single()

    // Déterminer le mairie_id :
    // - Si user est organisateur → c'est lui
    // - Si user est membre d'équipe → c'est mairie_id de son team_member
    // - Sinon → on log avec son propre id
    let mairie_id = user.id
    if (profile?.mairie_id) {
      mairie_id = profile.mairie_id
    } else {
      // Check si membre d'équipe
      const { data: teamMember } = await supabase
        .from('team_members')
        .select('mairie_id')
        .eq('user_id', user.id)
        .maybeSingle()
      if (teamMember) mairie_id = teamMember.mairie_id
    }

    // Capturer IP + UA
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]
      || request.headers.get('x-real-ip')
      || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Log via le service role
    await logAudit({
      mairie_id,
      actor_id: user.id,
      actor_email: profile?.email || user.email,
      action,
      resource_type,
      resource_id,
      details,
      ip_address: ip,
      user_agent: userAgent,
    })

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[Audit Log API] Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
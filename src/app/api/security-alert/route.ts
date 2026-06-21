// src/app/api/security-alert/route.ts
// ═════════════════════════════════════════════════════════════
// PULSEMARKET — API Security Alert
// Reçoit les alertes de sécurité depuis Supabase Edge Functions
// Envoie un email d'alerte à l'équipe
// ═════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { z } from 'zod'
import { validateBody, checkRateLimit } from '@/lib/validation'

const resend = new Resend(process.env.RESEND_API_KEY)

// ✅ Clé secrète pour que seul Supabase puisse appeler cette route
const ALERT_SECRET = process.env.SECURITY_ALERT_SECRET

// ─── Schéma Zod strict ───
const alertSchema = z.object({
  action: z.string().min(1).max(100),
  ip: z.string().max(100).optional(),
  details: z.record(z.string(), z.any()).optional(),
  created_at: z.string().datetime().optional().or(z.string().max(100).optional()),
  user_id: z.string().max(200).optional(),
  user_email: z.string().email().max(254).optional(),
})

// ─── Anti spam : actions connues ───
const ACTION_LABELS: Record<string, { label: string; severity: 'low' | 'medium' | 'high' | 'critical' }> = {
  acces_non_autorise: { label: 'Accès non autorisé', severity: 'high' },
  rate_limit_atteint: { label: 'Rate limit atteint', severity: 'medium' },
  brute_force_detecte: { label: 'Brute force détecté', severity: 'critical' },
  changement_mdp: { label: 'Changement de mot de passe', severity: 'low' },
  connexion_suspecte: { label: 'Connexion suspecte', severity: 'high' },
  multiple_failed_login: { label: 'Tentatives de connexion échouées', severity: 'high' },
  account_locked: { label: 'Compte verrouillé', severity: 'medium' },
  sql_injection_attempt: { label: 'Tentative SQL injection', severity: 'critical' },
  xss_attempt: { label: 'Tentative XSS', severity: 'critical' },
}

// ═════════════════════════════════════════════════════════════
// POST /api/security-alert
// ═════════════════════════════════════════════════════════════
export async function POST(req: NextRequest) {
  try {
    // ─── 1. Rate limit (50 alertes / 5 min — anti-spam mais permet pics) ───
    const limited = checkRateLimit(req, {
      max: 50,
      windowMs: 5 * 60_000,
      keyPrefix: 'security-alert',
    })
    if (limited) return limited

    // ─── 2. Vérifier la clé secrète AVANT TOUT (anti-attaque) ───
    const secret = req.headers.get('x-alert-secret')
    if (!ALERT_SECRET) {
      console.error('[security-alert] SECURITY_ALERT_SECRET manquant')
      return NextResponse.json({ error: 'Configuration serveur invalide' }, { status: 500 })
    }
    if (!secret || secret !== ALERT_SECRET) {
      // ✅ Timing-safe comparison serait mieux mais pour usage interne c'est OK
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // ─── 3. Validation Zod ───
    const result = await validateBody(req, alertSchema)
    if (result instanceof NextResponse) return result
    const { action, ip, details, created_at, user_id, user_email } = result

    // ─── 4. Vérifier RESEND_API_KEY ───
    if (!process.env.RESEND_API_KEY) {
      console.error('[security-alert] RESEND_API_KEY manquant')
      return NextResponse.json({ error: 'Configuration email invalide' }, { status: 500 })
    }

    // ─── 5. Déterminer le label + sévérité ───
    const actionInfo = ACTION_LABELS[action] || { label: action, severity: 'medium' as const }

    // ─── 6. Couleurs selon sévérité ───
    const SEVERITY_COLORS = {
      low: { bg: '#3B82F6', label: 'Info' },
      medium: { bg: '#F59E0B', label: 'Attention' },
      high: { bg: '#EF4444', label: 'Élevé' },
      critical: { bg: '#991B1B', label: 'CRITIQUE' },
    }
    const severityConfig = SEVERITY_COLORS[actionInfo.severity]

    const date = created_at
      ? new Date(created_at).toLocaleString('fr-FR')
      : new Date().toLocaleString('fr-FR')

    // ─── 7. Construire l'email ───
    const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0F172A;font-family:'Inter',system-ui,sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:#1E293B;border-radius:16px;overflow:hidden;border:1px solid ${severityConfig.bg}40;">
    <div style="background:${severityConfig.bg};padding:20px 28px;">
      <div style="display:inline-block;background:rgba(255,255,255,0.2);padding:4px 10px;border-radius:100px;margin-bottom:10px;">
        <span style="color:white;font-size:10px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;">${severityConfig.label}</span>
      </div>
      <p style="color:white;font-size:18px;font-weight:800;margin:0 0 4px;">${actionInfo.label}</p>
      <p style="color:rgba(255,255,255,0.85);font-size:12px;margin:0;">PulseMarket Security Alert</p>
    </div>
    <div style="padding:24px 28px;">
      <div style="background:#0F172A;border-radius:10px;padding:16px;margin-bottom:16px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
          <span style="font-size:11px;color:#64748B;text-transform:uppercase;letter-spacing:0.06em;">Action</span>
          <span style="font-size:12px;color:#F87171;font-weight:600;font-family:monospace;">${action}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
          <span style="font-size:11px;color:#64748B;text-transform:uppercase;letter-spacing:0.06em;">IP</span>
          <span style="font-size:12px;color:white;font-weight:600;font-family:monospace;">${ip || 'inconnue'}</span>
        </div>
        ${user_email ? `
        <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
          <span style="font-size:11px;color:#64748B;text-transform:uppercase;letter-spacing:0.06em;">User</span>
          <span style="font-size:12px;color:white;font-weight:600;">${user_email}</span>
        </div>` : ''}
        ${user_id ? `
        <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
          <span style="font-size:11px;color:#64748B;text-transform:uppercase;letter-spacing:0.06em;">User ID</span>
          <span style="font-size:11px;color:#94A3B8;font-family:monospace;">${user_id.substring(0, 16)}...</span>
        </div>` : ''}
        <div style="display:flex;justify-content:space-between;">
          <span style="font-size:11px;color:#64748B;text-transform:uppercase;letter-spacing:0.06em;">Date</span>
          <span style="font-size:12px;color:#94A3B8;">${date}</span>
        </div>
      </div>
      ${details ? `
      <div style="background:#0F172A;border-radius:10px;padding:14px;">
        <p style="font-size:11px;color:#64748B;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px;">Détails</p>
        <pre style="font-size:11px;color:#94A3B8;margin:0;white-space:pre-wrap;font-family:monospace;overflow-x:auto;">${escapeHtml(JSON.stringify(details, null, 2))}</pre>
      </div>` : ''}
    </div>
    <div style="padding:16px 28px;border-top:1px solid #0F172A;text-align:center;">
      <a href="https://supabase.com/dashboard/project/_/editor" style="font-size:12px;color:#4F46E5;text-decoration:none;">Voir les logs Supabase →</a>
    </div>
  </div>
</body></html>`

    // ─── 8. Envoi via Resend ───
    const { error } = await resend.emails.send({
      from: 'PulseMarket Sécurité <noreply@pulse-market.fr>',
      to: process.env.SECURITY_ALERT_EMAIL || 'romain@pulse-market.fr',
      subject: `[${severityConfig.label}] ${actionInfo.label} — PulseMarket`,
      html,
    })

    if (error) {
      console.error('[security-alert] Resend error:', error)
      return NextResponse.json({ error: 'Erreur d\'envoi' }, { status: 500 })
    }

    return NextResponse.json({ received: true })

  } catch (err: any) {
    console.error('[security-alert] Error:', err)
    return NextResponse.json({
      error: 'Erreur serveur',
      ...(process.env.NODE_ENV === 'development' && { details: err.message }),
    }, { status: 500 })
  }
}

// ─── Helper: escape HTML pour éviter XSS dans l'email ───
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
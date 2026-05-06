import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// ✅ Clé secrète pour que seul Supabase puisse appeler cette route
const ALERT_SECRET = process.env.SECURITY_ALERT_SECRET

export async function POST(req: NextRequest) {
  try {
    // Vérification de la clé secrète
    const secret = req.headers.get('x-alert-secret')
    if (!secret || secret !== ALERT_SECRET) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { action, ip, details, created_at } = await req.json()

    const actionLabels: Record<string, string> = {
      acces_non_autorise: '🚨 Accès non autorisé',
      rate_limit_atteint: '⚠️ Rate limit atteint',
    }

    const label = actionLabels[action] || `⚠️ ${action}`
    const date = created_at ? new Date(created_at).toLocaleString('fr-FR') : new Date().toLocaleString('fr-FR')

    await resend.emails.send({
      from: 'PulseMarket Sécurité <noreply@pulse-market.fr>',
      to: process.env.SECURITY_ALERT_EMAIL || 'romain@pulse-market.fr',
      subject: `${label} — PulseMarket`,
      html: `
        <!DOCTYPE html>
        <html><head><meta charset="UTF-8"></head>
        <body style="margin:0;padding:0;background:#0F172A;font-family:'Inter',system-ui,sans-serif;">
          <div style="max-width:520px;margin:40px auto;background:#1E293B;border-radius:16px;overflow:hidden;border:1px solid #DC262620;">
            <div style="background:#DC2626;padding:20px 28px;display:flex;align-items:center;gap:12px;">
              <span style="font-size:24px;">🚨</span>
              <div>
                <p style="color:white;font-size:16px;font-weight:800;margin:0;">${label}</p>
                <p style="color:rgba(255,255,255,0.7);font-size:12px;margin:0;">PulseMarket Security Alert</p>
              </div>
            </div>
            <div style="padding:24px 28px;">
              <div style="background:#0F172A;border-radius:10px;padding:16px;margin-bottom:16px;">
                <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
                  <span style="font-size:11px;color:#64748B;text-transform:uppercase;letter-spacing:0.06em;">Action</span>
                  <span style="font-size:12px;color:#F87171;font-weight:600;">${action}</span>
                </div>
                <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
                  <span style="font-size:11px;color:#64748B;text-transform:uppercase;letter-spacing:0.06em;">IP</span>
                  <span style="font-size:12px;color:white;font-weight:600;font-family:monospace;">${ip || 'inconnue'}</span>
                </div>
                <div style="display:flex;justify-content:space-between;">
                  <span style="font-size:11px;color:#64748B;text-transform:uppercase;letter-spacing:0.06em;">Date</span>
                  <span style="font-size:12px;color:#94A3B8;">${date}</span>
                </div>
              </div>
              ${details ? `
              <div style="background:#0F172A;border-radius:10px;padding:14px;">
                <p style="font-size:11px;color:#64748B;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px;">Détails</p>
                <pre style="font-size:11px;color:#94A3B8;margin:0;white-space:pre-wrap;font-family:monospace;">${JSON.stringify(details, null, 2)}</pre>
              </div>` : ''}
            </div>
            <div style="padding:16px 28px;border-top:1px solid #1E293B;text-align:center;">
              <a href="https://supabase.com/dashboard/project/_/editor" style="font-size:12px;color:#4F46E5;">Voir les logs Supabase →</a>
            </div>
          </div>
        </body></html>
      `,
    })

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error('Security alert error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
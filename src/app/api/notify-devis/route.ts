// src/app/api/notify-devis/route.ts
// ═════════════════════════════════════════════════════════════
// PULSEMARKET — API Notify Devis
// Reçoit les demandes de devis du formulaire /devis
// ═════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { z } from 'zod'
import {
  validateBody,
  checkRateLimit,
  emailSchema,
} from '@/lib/validation'

const resend = new Resend(process.env.RESEND_API_KEY)

// ─── Helper escape HTML léger (anti-XSS) ───
function escapeHtml(str: string): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// ─── Schéma Zod strict ───
const devisSchema = z.object({
  // Contact
  contact_name: z.string().trim().min(2, 'Nom trop court').max(100, 'Nom trop long'),
  contact_role: z.string().trim().max(100).optional(),
  contact_email: emailSchema,
  contact_phone: z.string()
    .trim()
    .regex(/^(\+33|0)[1-9](\s?\d{2}){4}$/, 'Téléphone invalide')
    .max(20),

  // Organisation
  organisation_type: z.enum(['mairie', 'communaute', 'comite', 'association', 'tourisme', 'syndicat']),
  organisation_name: z.string().trim().max(200).optional(),
  population: z.enum(['<5000', '5000-20000', '20000-50000', '50000-100000', '>100000']).optional(),
  markets_per_month: z.enum(['1-2', '3-8', '9-20', '20+']).optional(),
  avg_exhibitors: z.enum(['<20', '20-50', '50-100', '100+']).optional(),

  // Options
  extra_placiers: z.number().int().min(0).max(50).default(0),
  module_festival: z.boolean().default(false),
  formation_presentiel: z.boolean().default(false),
  sla_premium: z.boolean().default(false),

  // Estimations
  estimated_monthly: z.number().int().min(0).max(100000),
  estimated_one_shot: z.number().int().min(0).max(100000).default(0),

  // Message
  message: z.string().trim().max(5000).optional(),

  // Anti-bot (honeypot — laisser vide)
  website: z.string().max(0, 'Spam détecté').optional(),
})

// ═════════════════════════════════════════════════════════════
// POST /api/notify-devis
// ═════════════════════════════════════════════════════════════
export async function POST(req: NextRequest) {
  try {
    // ─── 1. Rate limit (3 demandes / 5 min — anti-spam strict) ───
    const limited = checkRateLimit(req, {
      max: 3,
      windowMs: 5 * 60_000,
      keyPrefix: 'notify-devis',
    })
    if (limited) return limited

    // ─── 2. Validation Zod ───
    const result = await validateBody(req, devisSchema)
    if (result instanceof NextResponse) return result
    const data = result

    // ─── 3. Vérifier env vars ───
    if (!process.env.RESEND_API_KEY) {
      console.error('[notify-devis] RESEND_API_KEY manquant')
      return NextResponse.json({ error: 'Configuration serveur invalide' }, { status: 500 })
    }

    // ─── 4. Escape HTML sur tous les inputs string (anti-XSS dans email) ───
    const safe = {
      ...data,
      contact_name: escapeHtml(data.contact_name),
      contact_role: data.contact_role ? escapeHtml(data.contact_role) : '',
      contact_email: escapeHtml(data.contact_email),
      contact_phone: escapeHtml(data.contact_phone),
      organisation_name: data.organisation_name ? escapeHtml(data.organisation_name) : '',
      message: data.message ? escapeHtml(data.message) : '',
    }

    // ─── 5. Mappings labels ───
    const orgTypeLabels: Record<string, string> = {
      mairie: 'Mairie / Commune',
      communaute: 'Communauté de communes',
      comite: 'Comité des fêtes',
      association: 'Association',
      tourisme: 'Office de tourisme',
      syndicat: 'Syndicat de marchés',
    }

    const populationLabels: Record<string, string> = {
      '<5000': 'Moins de 5 000 habitants',
      '5000-20000': '5 000 à 20 000 habitants',
      '20000-50000': '20 000 à 50 000 habitants',
      '50000-100000': '50 000 à 100 000 habitants',
      '>100000': 'Plus de 100 000 habitants',
    }

    const marketsLabels: Record<string, string> = {
      '1-2': '1 à 2 marchés/mois',
      '3-8': '3 à 8 marchés/mois',
      '9-20': '9 à 20 marchés/mois',
      '20+': '20+ marchés/mois',
    }

    const exhibitorsLabels: Record<string, string> = {
      '<20': 'Moins de 20',
      '20-50': '20 à 50',
      '50-100': '50 à 100',
      '100+': '100+',
    }

    // ─── 6. Construire la liste des options ───
    const options: string[] = []
    if (safe.extra_placiers > 0) options.push(`${safe.extra_placiers} compte(s) placier supplémentaire(s)`)
    if (safe.module_festival) options.push('Module festival/brocante')
    if (safe.formation_presentiel) options.push('Formation présentiel')
    if (safe.sla_premium) options.push('SLA Premium')

    // ─── 7. Calculer priorité ───
    const totalEstimated = safe.estimated_monthly + (safe.estimated_one_shot || 0)
    const priority = totalEstimated >= 800
      ? 'PRIORITÉ HAUTE'
      : totalEstimated >= 400
        ? 'Priorité moyenne'
        : 'Standard'

    // ─── 8. Template HTML ───
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background: #F8FAFC; margin: 0; padding: 20px; color: #0F172A; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(15,23,42,0.08); }
    .header { background: linear-gradient(135deg, #4F46E5, #7C3AED); padding: 24px; color: white; }
    .header h1 { margin: 0 0 4px; font-size: 20px; font-weight: 700; }
    .header p { margin: 0; font-size: 13px; opacity: 0.9; }
    .priority { display: inline-block; background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 100px; font-size: 11px; font-weight: 700; margin-top: 12px; letter-spacing: 0.05em; }
    .content { padding: 24px; }
    .section { margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid #F1F5F9; }
    .section:last-child { border-bottom: none; }
    .section-title { font-size: 11px; font-weight: 700; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 12px; }
    .row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
    .row .label { color: #64748B; }
    .row .value { color: #0F172A; font-weight: 600; }
    .estimation { background: linear-gradient(135deg, #4F46E5, #7C3AED); color: white; padding: 24px; border-radius: 10px; margin: 20px 0; }
    .estimation .total { font-size: 36px; font-weight: 800; margin: 6px 0; }
    .estimation .sub { font-size: 13px; opacity: 0.85; }
    .cta { display: block; background: #4F46E5; color: white; text-align: center; padding: 14px 24px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 14px; margin-top: 16px; }
    .cta-secondary { display: block; background: #F1F5F9; color: #0F172A; text-align: center; padding: 12px 24px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 13px; margin-top: 8px; }
    .message-box { background: #F8FAFC; border-left: 3px solid #4F46E5; padding: 12px 14px; border-radius: 6px; font-size: 13px; color: #475569; line-height: 1.6; font-style: italic; }
    .footer { background: #F8FAFC; padding: 16px 24px; font-size: 11px; color: #94A3B8; text-align: center; border-top: 1px solid #E2E8F0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Nouvelle demande de devis</h1>
      <p>${orgTypeLabels[safe.organisation_type] || safe.organisation_type}</p>
      <span class="priority">${priority}</span>
    </div>

    <div class="content">

      <!-- Estimation -->
      <div class="estimation">
        <div class="sub">Estimation calculée</div>
        <div class="total">${safe.estimated_monthly} €<span style="font-size: 16px; font-weight: 500; opacity: 0.7;"> / mois</span></div>
        ${safe.estimated_one_shot > 0 ? `<div class="sub">+ ${safe.estimated_one_shot} € frais uniques (formation)</div>` : ''}
      </div>

      <!-- Contact -->
      <div class="section">
        <div class="section-title">Contact</div>
        <div class="row"><span class="label">Nom</span><span class="value">${safe.contact_name}</span></div>
        ${safe.contact_role ? `<div class="row"><span class="label">Fonction</span><span class="value">${safe.contact_role}</span></div>` : ''}
        <div class="row"><span class="label">Email</span><span class="value"><a href="mailto:${safe.contact_email}" style="color: #4F46E5; text-decoration: none;">${safe.contact_email}</a></span></div>
        <div class="row"><span class="label">Téléphone</span><span class="value"><a href="tel:${safe.contact_phone}" style="color: #4F46E5; text-decoration: none;">${safe.contact_phone}</a></span></div>
      </div>

      <!-- Organisation -->
      <div class="section">
        <div class="section-title">Organisation</div>
        <div class="row"><span class="label">Type</span><span class="value">${orgTypeLabels[safe.organisation_type] || safe.organisation_type}</span></div>
        ${safe.organisation_name ? `<div class="row"><span class="label">Nom</span><span class="value">${safe.organisation_name}</span></div>` : ''}
        ${safe.population ? `<div class="row"><span class="label">Population</span><span class="value">${populationLabels[safe.population] || safe.population}</span></div>` : ''}
        ${safe.markets_per_month ? `<div class="row"><span class="label">Marchés/mois</span><span class="value">${marketsLabels[safe.markets_per_month] || safe.markets_per_month}</span></div>` : ''}
        ${safe.avg_exhibitors ? `<div class="row"><span class="label">Exposants moyens</span><span class="value">${exhibitorsLabels[safe.avg_exhibitors] || safe.avg_exhibitors}</span></div>` : ''}
      </div>

      <!-- Options -->
      ${options.length > 0 ? `
      <div class="section">
        <div class="section-title">Options sélectionnées</div>
        ${options.map(o => `<div class="row"><span class="label">→ ${o}</span></div>`).join('')}
      </div>
      ` : ''}

      <!-- Message -->
      ${safe.message ? `
      <div class="section">
        <div class="section-title">Message du prospect</div>
        <div class="message-box">${safe.message.replace(/\n/g, '<br>')}</div>
      </div>
      ` : ''}

      <!-- CTAs -->
      <a href="tel:${safe.contact_phone}" class="cta">Rappeler maintenant</a>
      <a href="mailto:${safe.contact_email}?subject=Votre%20devis%20PulseMarket" class="cta-secondary">Répondre par email</a>

    </div>

    <div class="footer">
      Demande reçue le ${new Date().toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })}<br>
      PulseMarket SAS · SIREN 105 506 554
    </div>
  </div>
</body>
</html>
    `.trim()

    // ─── 9. Envoi via Resend ───
    const { error } = await resend.emails.send({
      from: 'PulseMarket <contact@pulse-market.fr>',
      to: 'villeprat.romain@gmail.com',
      replyTo: data.contact_email, // ✅ Email original pour reply
      subject: `Nouveau devis : ${orgTypeLabels[safe.organisation_type] || 'Demande'} — ${safe.estimated_monthly}€/mois`,
      html,
    })

    if (error) {
      console.error('[notify-devis] Resend error:', error)
      return NextResponse.json({ error: 'Erreur d\'envoi' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (err: any) {
    console.error('[notify-devis] Error:', err)
    return NextResponse.json({
      error: 'Erreur serveur',
      ...(process.env.NODE_ENV === 'development' && { details: err.message }),
    }, { status: 500 })
  }
}
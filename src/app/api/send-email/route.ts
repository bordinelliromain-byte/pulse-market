import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { sanitize, sanitizeAll } from '@/lib/sanitize'

const resend = new Resend(process.env.RESEND_API_KEY)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const ALLOWED_TYPES = ['paiement_confirme', 'candidature_validee', 'bienvenue', 'invitation_placier', 'boost_confirmation', 'bienvenue_pro', 'facture_pro_mensuelle', 'paiement_echec']

function checkRateLimit(ip: string, max = 10): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) { rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 }); return true }
  if (entry.count >= max) return false
  entry.count++; return true
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    if (!checkRateLimit(ip)) return NextResponse.json({ error: 'Trop de requêtes.' }, { status: 429 })

    const body = await req.json()
    const { type, to, data } = body

    if (!type || !ALLOWED_TYPES.includes(type)) return NextResponse.json({ error: 'Type email invalide' }, { status: 400 })
    if (!to || typeof to !== 'string' || !to.includes('@') || to.length > 254) return NextResponse.json({ error: 'Destinataire invalide' }, { status: 400 })
    if (!data || typeof data !== 'object') return NextResponse.json({ error: 'Data manquante' }, { status: 400 })

    const safeTo = sanitize(to)
    const safeData = sanitizeAll(data)

    let subject = ''
    let html = ''

    if (type === 'paiement_confirme') {
      const total = (safeData.redevanceAOT || 0) + (safeData.fraisPlateforme || 2)
      subject = `✅ Paiement confirmé — ${safeData.eventTitle}`
      html = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;background:#F8FAFC;font-family:'Inter',system-ui,sans-serif;"><div style="max-width:560px;margin:40px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);"><div style="background:linear-gradient(135deg,#4F46E5,#7C3AED);padding:32px;text-align:center;"><h1 style="color:white;font-size:22px;font-weight:800;margin:0 0 6px;">Paiement confirmé !</h1><p style="color:rgba(255,255,255,0.75);font-size:14px;margin:0;">Votre place est réservée</p></div><div style="padding:32px;"><p style="font-size:15px;color:#0F172A;margin-bottom:20px;">Bonjour <strong>${safeData.exposantNom || ''}</strong>,</p><p style="font-size:14px;color:#64748B;line-height:1.7;margin-bottom:24px;">Votre paiement a bien été reçu pour <strong style="color:#0F172A;">${safeData.eventTitle || ''}</strong>.</p><div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:16px 20px;margin-bottom:24px;"><div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;border-bottom:1px solid #F1F5F9;"><span style="color:#64748B;">Événement</span><span style="font-weight:600;color:#0F172A;">${safeData.eventTitle || ''}</span></div><div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;border-bottom:1px solid #F1F5F9;"><span style="color:#64748B;">Date</span><span style="font-weight:600;color:#0F172A;">${safeData.eventDate || ''}</span></div><div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;border-bottom:1px solid #F1F5F9;"><span style="color:#64748B;">Lieu</span><span style="font-weight:600;color:#0F172A;">${safeData.eventLocation || ''}</span></div><div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;border-bottom:1px solid #F1F5F9;"><span style="color:#64748B;">Redevance AOT</span><span style="font-weight:600;color:#0F172A;">${safeData.redevanceAOT || 0} €</span></div><div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;border-bottom:1px solid #F1F5F9;"><span style="color:#64748B;">Frais de service</span><span style="font-weight:600;color:#0F172A;">${safeData.fraisPlateforme || 2} €</span></div><div style="display:flex;justify-content:space-between;padding:8px 0 0;font-size:15px;"><span style="font-weight:700;color:#0F172A;">Total TTC</span><span style="font-weight:800;color:#4F46E5;">${total.toFixed(2)} €</span></div></div><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/factures" style="display:block;background:#4F46E5;color:white;text-decoration:none;text-align:center;padding:14px;border-radius:10px;font-weight:700;font-size:14px;margin-bottom:12px;">📄 Voir ma facture →</a><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="display:block;background:#F8FAFC;color:#64748B;text-decoration:none;text-align:center;padding:12px;border-radius:10px;font-size:13px;border:1px solid #E2E8F0;">Retour au tableau de bord</a></div><div style="background:#F8FAFC;border-top:1px solid #E2E8F0;padding:20px 32px;text-align:center;"><p style="font-size:11px;color:#94A3B8;margin:0;">PulseMarket · <a href="https://pulse-market.fr" style="color:#4F46E5;">pulse-market.fr</a></p></div></div></body></html>`
    }

    if (type === 'candidature_validee') {
      subject = `🎉 Candidature acceptée — ${safeData.eventTitle}`
      html = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;background:#F8FAFC;font-family:'Inter',system-ui,sans-serif;"><div style="max-width:560px;margin:40px auto;background:white;border-radius:16px;overflow:hidden;"><div style="background:linear-gradient(135deg,#16A34A,#4F46E5);padding:32px;text-align:center;"><h1 style="color:white;font-size:22px;font-weight:800;margin:0;">Candidature acceptée ! 🎉</h1></div><div style="padding:32px;"><p style="font-size:15px;color:#0F172A;">Bonjour <strong>${safeData.exposantNom || ''}</strong>,</p><p style="font-size:14px;color:#64748B;line-height:1.7;">Votre candidature pour <strong>${safeData.eventTitle || ''}</strong> a été acceptée.</p><div style="background:#FFF7ED;border:1px solid #FED7AA;border-radius:10px;padding:16px;margin:16px 0;"><p style="font-size:13px;color:#EA580C;margin:0;font-weight:600;">⚡ Connectez-vous sur PulseMarket pour payer et confirmer votre place.</p></div><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="display:block;background:#4F46E5;color:white;text-decoration:none;text-align:center;padding:14px;border-radius:10px;font-weight:700;">Payer ma place →</a></div></div></body></html>`
    }

    if (type === 'bienvenue') {
      subject = `Bienvenue sur PulseMarket 👋`
      html = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;background:#F8FAFC;font-family:'Inter',system-ui,sans-serif;"><div style="max-width:560px;margin:40px auto;background:white;border-radius:16px;overflow:hidden;"><div style="background:#0F172A;padding:32px;text-align:center;"><h1 style="color:white;font-size:22px;font-weight:800;margin:0;">Bienvenue sur PulseMarket !</h1></div><div style="padding:32px;"><p style="font-size:15px;color:#0F172A;">Bonjour <strong>${safeData.nom || ''}</strong>,</p><p style="font-size:14px;color:#64748B;line-height:1.7;">Votre compte a bien été créé. Complétez votre dossier et postulez aux marchés de votre région.</p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="display:block;background:#4F46E5;color:white;text-decoration:none;text-align:center;padding:14px;border-radius:10px;font-weight:700;">Accéder à mon espace →</a></div></div></body></html>`
    }

    if (type === 'invitation_placier') {
      subject = `Invitation placier — ${safeData.mairieNom}`
      html = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;background:#F8FAFC;font-family:'Inter',system-ui,sans-serif;"><div style="max-width:560px;margin:40px auto;background:white;border-radius:16px;overflow:hidden;"><div style="background:#0F172A;padding:32px;text-align:center;"><h1 style="color:white;font-size:20px;font-weight:800;margin:0;">Vous êtes invité 👋</h1><p style="color:#64748B;font-size:14px;margin:8px 0 0;">${safeData.mairieNom} vous invite comme placier</p></div><div style="padding:32px;"><p style="font-size:15px;color:#0F172A;">Bonjour <strong>${safeData.nom || ''}</strong>,</p><p style="font-size:14px;color:#64748B;line-height:1.7;">Vous avez été invité en tant que placier par ${safeData.mairieNom}.</p><a href="${safeData.inviteUrl}" style="display:block;background:#4F46E5;color:white;text-decoration:none;text-align:center;padding:14px;border-radius:10px;font-weight:700;">Créer mon compte placier →</a><p style="font-size:11px;color:#94A3B8;margin-top:12px;text-align:center;">Lien personnel à usage unique</p></div></div></body></html>`
    }

    if (type === 'boost_confirmation') {
      const { generateBoostEmailHTML } = await import('@/lib/sendBoostEmail')
      const { generateBoostInvoice } = await import('@/lib/generateBoostInvoice')
      subject = `${safeData.nom} — Votre pub est en ligne sur Whatmarket ! 🚀`
      html = generateBoostEmailHTML({ nom: safeData.nom, offre: safeData.offre, eventTitle: safeData.eventTitle, eventId: safeData.eventId })
      const pdfBytes = await generateBoostInvoice({ nom: safeData.nom, offre: safeData.offre, eventTitle: safeData.eventTitle, email: safeTo, amount: safeData.amount || 20, stripeSessionId: safeData.stripeSessionId || '' })
      const pdfBase64 = Buffer.from(pdfBytes).toString('base64')
      const { data: emailData, error } = await resend.emails.send({
        from: 'Whatmarket <noreply@pulse-market.fr>',
        to: safeTo,
        subject,
        html,
        attachments: [{ filename: `facture-whatmarket-${safeData.nom.replace(/\s/g, '-').toLowerCase()}.pdf`, content: pdfBase64 }]
      })
      if (error) throw error
      return NextResponse.json({ success: true, id: emailData?.id })
    }

    if (type === 'bienvenue_pro') {
      subject = `⭐ Bienvenue dans PulseMarket Pro !`
      html = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;background:#F8FAFC;font-family:'Inter',system-ui,sans-serif;"><div style="max-width:560px;margin:40px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);"><div style="background:linear-gradient(135deg,#0F172A,#1E293B);padding:32px;text-align:center;"><div style="width:56px;height:56px;background:rgba(251,191,36,0.15);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;border:2px solid rgba(251,191,36,0.3);"><span style="font-size:28px;">⭐</span></div><h1 style="color:white;font-size:22px;font-weight:800;margin:0 0 6px;">Bienvenue en Pro !</h1><p style="color:rgba(255,255,255,0.6);font-size:14px;margin:0;">Candidatures illimitées débloquées</p></div><div style="padding:32px;"><p style="font-size:15px;color:#0F172A;margin-bottom:20px;">Bonjour <strong>${safeData.nom || ''}</strong>,</p><p style="font-size:14px;color:#64748B;line-height:1.7;margin-bottom:24px;">Votre abonnement PulseMarket Pro est actif.</p><div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:16px 20px;margin-bottom:24px;"><div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;border-bottom:1px solid #F1F5F9;"><span style="color:#64748B;">Plan</span><span style="font-weight:700;color:#4F46E5;">Pro ⭐</span></div><div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;border-bottom:1px solid #F1F5F9;"><span style="color:#64748B;">Montant mensuel</span><span style="font-weight:700;color:#0F172A;">${safeData.montant || '20'} €/mois</span></div><div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;"><span style="color:#64748B;">Prochain renouvellement</span><span style="font-weight:600;color:#0F172A;">${safeData.prochainePeriode || ''}</span></div></div><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="display:block;background:#4F46E5;color:white;text-decoration:none;text-align:center;padding:14px;border-radius:10px;font-weight:700;font-size:14px;">Accéder à mon espace Pro →</a></div><div style="background:#F8FAFC;border-top:1px solid #E2E8F0;padding:20px 32px;text-align:center;"><p style="font-size:11px;color:#94A3B8;margin:0;">PulseMarket · <a href="https://pulse-market.fr" style="color:#4F46E5;">pulse-market.fr</a></p></div></div></body></html>`
    }

    if (type === 'facture_pro_mensuelle') {
      subject = `🧾 Facture PulseMarket Pro — ${safeData.periode}`
      html = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;background:#F8FAFC;font-family:'Inter',system-ui,sans-serif;"><div style="max-width:560px;margin:40px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);"><div style="background:#0F172A;padding:32px;text-align:center;"><h1 style="color:white;font-size:20px;font-weight:800;margin:0 0 6px;">Facture mensuelle</h1><p style="color:rgba(255,255,255,0.5);font-size:13px;margin:0;">PulseMarket Pro — ${safeData.periode || ''}</p></div><div style="padding:32px;"><p style="font-size:15px;color:#0F172A;margin-bottom:20px;">Bonjour <strong>${safeData.nom || ''}</strong>,</p><p style="font-size:14px;color:#64748B;line-height:1.7;margin-bottom:24px;">Votre abonnement Pro a été renouvelé automatiquement.</p><div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:16px 20px;margin-bottom:24px;"><div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;border-bottom:1px solid #F1F5F9;"><span style="color:#64748B;">Abonnement</span><span style="font-weight:600;color:#0F172A;">PulseMarket Pro</span></div><div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;border-bottom:1px solid #F1F5F9;"><span style="color:#64748B;">Période</span><span style="font-weight:600;color:#0F172A;">${safeData.periode || ''}</span></div><div style="display:flex;justify-content:space-between;padding:8px 0 0;font-size:15px;"><span style="font-weight:700;color:#0F172A;">Total TTC</span><span style="font-weight:800;color:#4F46E5;">${safeData.montant || '20'} €</span></div></div>${safeData.invoiceUrl ? `<a href="${safeData.invoiceUrl}" style="display:block;background:#F8FAFC;color:#4F46E5;text-decoration:none;text-align:center;padding:12px;border-radius:10px;font-size:13px;border:1px solid #C7D2FE;margin-bottom:12px;font-weight:600;">📄 Voir la facture Stripe →</a>` : ''}<a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/factures" style="display:block;background:#4F46E5;color:white;text-decoration:none;text-align:center;padding:14px;border-radius:10px;font-weight:700;font-size:14px;">Voir mes factures</a><p style="font-size:12px;color:#94A3B8;margin-top:16px;text-align:center;">Prochain renouvellement : ${safeData.prochainePeriode || ''}</p></div><div style="background:#F8FAFC;border-top:1px solid #E2E8F0;padding:20px 32px;text-align:center;"><p style="font-size:11px;color:#94A3B8;margin:0;">PulseMarket · <a href="https://pulse-market.fr" style="color:#4F46E5;">pulse-market.fr</a></p></div></div></body></html>`
    }

    if (type === 'paiement_echec') {
      subject = `⚠️ Échec de paiement — PulseMarket Pro`
      html = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;background:#F8FAFC;font-family:'Inter',system-ui,sans-serif;"><div style="max-width:560px;margin:40px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);"><div style="background:#FEF2F2;border-bottom:1px solid #FECACA;padding:32px;text-align:center;"><span style="font-size:40px;">⚠️</span><h1 style="color:#DC2626;font-size:20px;font-weight:800;margin:12px 0 4px;">Échec de paiement</h1><p style="color:#EF4444;font-size:13px;margin:0;">Votre abonnement Pro a été suspendu</p></div><div style="padding:32px;"><p style="font-size:15px;color:#0F172A;margin-bottom:16px;">Bonjour <strong>${safeData.nom || ''}</strong>,</p><p style="font-size:14px;color:#64748B;line-height:1.7;margin-bottom:24px;">Le renouvellement de votre abonnement Pro a échoué. Votre compte est repassé en version gratuite.</p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/parametres" style="display:block;background:#4F46E5;color:white;text-decoration:none;text-align:center;padding:14px;border-radius:10px;font-weight:700;font-size:14px;">Mettre à jour mon paiement →</a></div><div style="background:#F8FAFC;border-top:1px solid #E2E8F0;padding:20px 32px;text-align:center;"><p style="font-size:11px;color:#94A3B8;margin:0;">PulseMarket · <a href="https://pulse-market.fr" style="color:#4F46E5;">pulse-market.fr</a></p></div></div></body></html>`
    }

    if (!subject || !html) return NextResponse.json({ error: 'Type email non géré' }, { status: 400 })

    const { data: emailData, error } = await resend.emails.send({
      from: 'PulseMarket <noreply@pulse-market.fr>',
      to: safeTo,
      subject,
      html,
    })

    if (error) throw error
    return NextResponse.json({ success: true, id: emailData?.id })

  } catch (err: any) {
    console.error('Email error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
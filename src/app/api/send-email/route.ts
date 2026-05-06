import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

const ALLOWED_TYPES = ['paiement_confirme', 'candidature_validee', 'bienvenue', 'invitation_placier', 'boost_confirmation']

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

    let subject = ''
    let html = ''

    if (type === 'paiement_confirme') {
      subject = `✅ Paiement confirmé — ${data.eventTitle}`
      html = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;background:#F8FAFC;font-family:'Inter',system-ui,sans-serif;"><div style="max-width:560px;margin:40px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);"><div style="background:linear-gradient(135deg,#4F46E5,#7C3AED);padding:32px;text-align:center;"><h1 style="color:white;font-size:22px;font-weight:800;margin:0 0 6px;">Paiement confirmé !</h1><p style="color:rgba(255,255,255,0.75);font-size:14px;margin:0;">Votre place est réservée</p></div><div style="padding:32px;"><p style="font-size:15px;color:#0F172A;">Bonjour <strong>${data.exposantNom || ''}</strong>,</p><p style="font-size:14px;color:#64748B;line-height:1.7;">Votre paiement a bien été reçu pour <strong>${data.eventTitle || ''}</strong>.</p><p style="font-size:13px;color:#64748B;">À bientôt sur le marché !<br><strong>L'équipe PulseMarket</strong></p></div><div style="background:#F8FAFC;border-top:1px solid #E2E8F0;padding:20px 32px;text-align:center;"><p style="font-size:11px;color:#94A3B8;margin:0;">PulseMarket · <a href="https://pulse-market.fr" style="color:#4F46E5;">pulse-market.fr</a></p></div></div></body></html>`
    }

    if (type === 'candidature_validee') {
      subject = `🎉 Candidature acceptée — ${data.eventTitle}`
      html = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;background:#F8FAFC;font-family:'Inter',system-ui,sans-serif;"><div style="max-width:560px;margin:40px auto;background:white;border-radius:16px;overflow:hidden;"><div style="background:linear-gradient(135deg,#16A34A,#4F46E5);padding:32px;text-align:center;"><h1 style="color:white;font-size:22px;font-weight:800;margin:0;">Candidature acceptée ! 🎉</h1></div><div style="padding:32px;"><p style="font-size:15px;color:#0F172A;">Bonjour <strong>${data.exposantNom || ''}</strong>,</p><p style="font-size:14px;color:#64748B;line-height:1.7;">Votre candidature pour <strong>${data.eventTitle || ''}</strong> a été acceptée.</p><div style="background:#FFF7ED;border:1px solid #FED7AA;border-radius:10px;padding:16px;margin:16px 0;"><p style="font-size:13px;color:#EA580C;margin:0;font-weight:600;">⚡ Connectez-vous sur PulseMarket pour payer et confirmer votre place.</p></div><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="display:block;background:#4F46E5;color:white;text-decoration:none;text-align:center;padding:14px;border-radius:10px;font-weight:700;">Payer ma place →</a></div></div></body></html>`
    }

    if (type === 'bienvenue') {
      subject = `Bienvenue sur PulseMarket 👋`
      html = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;background:#F8FAFC;font-family:'Inter',system-ui,sans-serif;"><div style="max-width:560px;margin:40px auto;background:white;border-radius:16px;overflow:hidden;"><div style="background:#0F172A;padding:32px;text-align:center;"><h1 style="color:white;font-size:22px;font-weight:800;margin:0;">Bienvenue sur PulseMarket !</h1></div><div style="padding:32px;"><p style="font-size:15px;color:#0F172A;">Bonjour <strong>${data.nom || ''}</strong>,</p><p style="font-size:14px;color:#64748B;line-height:1.7;">Votre compte a bien été créé. Complétez votre dossier et postulez aux marchés de votre région.</p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="display:block;background:#4F46E5;color:white;text-decoration:none;text-align:center;padding:14px;border-radius:10px;font-weight:700;">Accéder à mon espace →</a></div></div></body></html>`
    }

    if (type === 'invitation_placier') {
      subject = `Invitation placier — ${data.mairieNom}`
      html = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;background:#F8FAFC;font-family:'Inter',system-ui,sans-serif;"><div style="max-width:560px;margin:40px auto;background:white;border-radius:16px;overflow:hidden;"><div style="background:#0F172A;padding:32px;text-align:center;"><h1 style="color:white;font-size:20px;font-weight:800;margin:0;">Vous êtes invité 👋</h1><p style="color:#64748B;font-size:14px;margin:8px 0 0;">${data.mairieNom} vous invite comme placier</p></div><div style="padding:32px;"><p style="font-size:15px;color:#0F172A;">Bonjour <strong>${data.nom || ''}</strong>,</p><p style="font-size:14px;color:#64748B;line-height:1.7;">Vous avez été invité en tant que placier par ${data.mairieNom}.</p><a href="${data.inviteUrl}" style="display:block;background:#4F46E5;color:white;text-decoration:none;text-align:center;padding:14px;border-radius:10px;font-weight:700;">Créer mon compte placier →</a><p style="font-size:11px;color:#94A3B8;margin-top:12px;text-align:center;">Lien personnel à usage unique</p></div></div></body></html>`
    }

    if (type === 'boost_confirmation') {
      const { generateBoostEmailHTML } = await import('@/lib/sendBoostEmail')
      const { generateBoostInvoice } = await import('@/lib/generateBoostInvoice')
      subject = `${data.nom} — Votre pub est en ligne sur Whatmarket ! 🚀`
      html = generateBoostEmailHTML({ nom: data.nom, offre: data.offre, eventTitle: data.eventTitle, eventId: data.eventId })
      const pdfBytes = await generateBoostInvoice({ nom: data.nom, offre: data.offre, eventTitle: data.eventTitle, email: to, amount: data.amount || 20, stripeSessionId: data.stripeSessionId || '' })
      const pdfBase64 = Buffer.from(pdfBytes).toString('base64')
      const { data: emailData, error } = await resend.emails.send({
        from: 'Whatmarket <onboarding@resend.dev>', to, subject, html,
        attachments: [{ filename: `facture-whatmarket-${data.nom.replace(/\s/g, '-').toLowerCase()}.pdf`, content: pdfBase64 }]
      })
      if (error) throw error
      return NextResponse.json({ success: true, id: emailData?.id })
    }

    if (!subject || !html) return NextResponse.json({ error: 'Type email non géré' }, { status: 400 })

    const { data: emailData, error } = await resend.emails.send({
      from: 'PulseMarket <onboarding@resend.dev>', to, subject, html,
    })

    if (error) throw error
    return NextResponse.json({ success: true, id: emailData?.id })
  } catch (err: any) {
    console.error('Email error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
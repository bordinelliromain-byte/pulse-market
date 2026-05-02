import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const { type, to, data } = await req.json()

    let subject = ''
    let html = ''

    if (type === 'paiement_confirme') {
      subject = `✅ Paiement confirmé — ${data.eventTitle}`
      html = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"></head>
        <body style="margin:0;padding:0;background:#F8FAFC;font-family:'Inter',system-ui,sans-serif;">
          <div style="max-width:560px;margin:40px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
            
            <!-- Header -->
            <div style="background:linear-gradient(135deg,#4F46E5,#7C3AED);padding:32px;text-align:center;">
              <div style="width:48px;height:48px;background:rgba(255,255,255,0.15);border-radius:12px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
                <span style="color:white;font-size:18px;font-weight:800;">PM</span>
              </div>
              <h1 style="color:white;font-size:22px;font-weight:800;margin:0 0 6px;">Paiement confirmé !</h1>
              <p style="color:rgba(255,255,255,0.75);font-size:14px;margin:0;">Votre place est réservée</p>
            </div>

            <!-- Body -->
            <div style="padding:32px;">
              <p style="font-size:15px;color:#0F172A;margin:0 0 24px;">Bonjour <strong>${data.exposantNom}</strong>,</p>
              <p style="font-size:14px;color:#64748B;line-height:1.7;margin:0 0 24px;">
                Votre paiement a bien été reçu et votre place est confirmée pour <strong style="color:#0F172A;">${data.eventTitle}</strong>.
              </p>

              <!-- Récap -->
              <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:20px;margin-bottom:24px;">
                <p style="font-size:11px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:0.06em;margin:0 0 16px;">Récapitulatif</p>
                ${[
                  ['Événement', data.eventTitle],
                  ['Date', data.eventDate || '—'],
                  ['Lieu', data.eventLocation || '—'],
                  ['Redevance AOT', `${data.redevanceAOT} €`],
                  ['Frais de service', `${data.fraisPlateforme} €`],
                  ['Total payé', `${data.redevanceAOT + data.fraisPlateforme} €`],
                ].map(([label, value], i, arr) => `
                  <div style="display:flex;justify-content:space-between;font-size:13px;padding-bottom:${i < arr.length - 1 ? '10px' : '0'};margin-bottom:${i < arr.length - 1 ? '10px' : '0'};border-bottom:${i < arr.length - 1 ? '1px solid #F1F5F9' : 'none'};">
                    <span style="color:#64748B;">${label}</span>
                    <span style="font-weight:${i === arr.length - 1 ? '700' : '500'};color:${i === arr.length - 1 ? '#4F46E5' : '#0F172A'};">${value}</span>
                  </div>
                `).join('')}
              </div>

              <!-- Info QR -->
              <div style="background:#EEF2FF;border:1px solid #C7D2FE;border-radius:10px;padding:16px;margin-bottom:24px;">
                <p style="font-size:13px;color:#4338CA;margin:0;line-height:1.6;">
                  📱 <strong>N'oubliez pas votre facture PDF</strong> — elle contient votre QR Code d'entrée que le placier va scanner le jour du marché.
                </p>
              </div>

              <p style="font-size:13px;color:#64748B;line-height:1.7;margin:0;">
                À très bientôt sur le marché !<br>
                <strong style="color:#0F172A;">L'équipe PlaceMarket</strong>
              </p>
            </div>

            <!-- Footer -->
            <div style="background:#F8FAFC;border-top:1px solid #E2E8F0;padding:20px 32px;text-align:center;">
              <p style="font-size:11px;color:#94A3B8;margin:0;">
                PlaceMarket · Plateforme de gestion des marchés municipaux<br>
                <a href="https://placemarket-rose.vercel.app" style="color:#4F46E5;text-decoration:none;">placemarket.fr</a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    }

    if (type === 'candidature_validee') {
      subject = `🎉 Candidature acceptée — ${data.eventTitle}`
      html = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"></head>
        <body style="margin:0;padding:0;background:#F8FAFC;font-family:'Inter',system-ui,sans-serif;">
          <div style="max-width:560px;margin:40px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
            <div style="background:linear-gradient(135deg,#16A34A,#4F46E5);padding:32px;text-align:center;">
              <h1 style="color:white;font-size:22px;font-weight:800;margin:0 0 6px;">Candidature acceptée ! 🎉</h1>
              <p style="color:rgba(255,255,255,0.75);font-size:14px;margin:0;">La mairie a validé votre dossier</p>
            </div>
            <div style="padding:32px;">
              <p style="font-size:15px;color:#0F172A;margin:0 0 16px;">Bonjour <strong>${data.exposantNom}</strong>,</p>
              <p style="font-size:14px;color:#64748B;line-height:1.7;margin:0 0 24px;">
                Bonne nouvelle ! Votre candidature pour <strong style="color:#0F172A;">${data.eventTitle}</strong> a été acceptée par la mairie organisatrice.
              </p>
              <div style="background:#FFF7ED;border:1px solid #FED7AA;border-radius:10px;padding:16px;margin-bottom:24px;">
                <p style="font-size:13px;color:#C2410C;margin:0;font-weight:600;">⚡ Action requise</p>
                <p style="font-size:13px;color:#EA580C;margin:8px 0 0;line-height:1.6;">
                  Connectez-vous sur PlaceMarket pour procéder au paiement et confirmer définitivement votre place.
                </p>
              </div>
              <a href="https://placemarket-rose.vercel.app/dashboard" style="display:block;background:#4F46E5;color:white;text-decoration:none;text-align:center;padding:14px;border-radius:10px;font-weight:700;font-size:14px;">
                Payer ma place →
              </a>
            </div>
            <div style="background:#F8FAFC;border-top:1px solid #E2E8F0;padding:20px 32px;text-align:center;">
              <p style="font-size:11px;color:#94A3B8;margin:0;">PlaceMarket · <a href="https://placemarket-rose.vercel.app" style="color:#4F46E5;text-decoration:none;">placemarket.fr</a></p>
            </div>
          </div>
        </body>
        </html>
      `
    }

    if (type === 'bienvenue') {
      subject = `Bienvenue sur PlaceMarket 👋`
      html = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"></head>
        <body style="margin:0;padding:0;background:#F8FAFC;font-family:'Inter',system-ui,sans-serif;">
          <div style="max-width:560px;margin:40px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
            <div style="background:#0F172A;padding:32px;text-align:center;">
              <div style="width:48px;height:48px;background:#4F46E5;border-radius:12px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
                <span style="color:white;font-size:18px;font-weight:800;">PM</span>
              </div>
              <h1 style="color:white;font-size:22px;font-weight:800;margin:0 0 6px;">Bienvenue sur PlaceMarket !</h1>
            </div>
            <div style="padding:32px;">
              <p style="font-size:15px;color:#0F172A;margin:0 0 16px;">Bonjour <strong>${data.nom}</strong>,</p>
              <p style="font-size:14px;color:#64748B;line-height:1.7;margin:0 0 24px;">
                Votre compte exposant a bien été créé. Vous pouvez dès maintenant compléter votre dossier et postuler aux marchés de votre région.
              </p>
              <a href="https://placemarket-rose.vercel.app/dashboard" style="display:block;background:#4F46E5;color:white;text-decoration:none;text-align:center;padding:14px;border-radius:10px;font-weight:700;font-size:14px;">
                Accéder à mon espace →
              </a>
            </div>
            <div style="background:#F8FAFC;border-top:1px solid #E2E8F0;padding:20px 32px;text-align:center;">
              <p style="font-size:11px;color:#94A3B8;margin:0;">PlaceMarket · <a href="https://placemarket-rose.vercel.app" style="color:#4F46E5;text-decoration:none;">placemarket.fr</a></p>
            </div>
          </div>
        </body>
        </html>
      `
    }

    if (type === 'invitation_placier') {
  subject = `Invitation placier — ${data.mairieNom}`
  html = `
    <!DOCTYPE html><html><head><meta charset="UTF-8"></head>
    <body style="margin:0;padding:0;background:#F8FAFC;font-family:'Inter',system-ui,sans-serif;">
      <div style="max-width:560px;margin:40px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <div style="background:#0F172A;padding:32px;text-align:center;">
          <h1 style="color:white;font-size:20px;font-weight:800;margin:0 0 6px;">Vous êtes invité 👋</h1>
          <p style="color:#64748B;font-size:14px;margin:0;">${data.mairieNom} vous invite comme placier</p>
        </div>
        <div style="padding:32px;">
          <p style="font-size:15px;color:#0F172A;margin:0 0 16px;">Bonjour <strong>${data.nom}</strong>,</p>
          <p style="font-size:14px;color:#64748B;line-height:1.7;margin:0 0 24px;">
            Vous avez été invité en tant que <strong>placier</strong> par ${data.mairieNom}. Créez votre compte pour accéder à votre espace mobile et gérer les marchés sur le terrain.
          </p>
          <a href="${data.inviteUrl}" style="display:block;background:#4F46E5;color:white;text-decoration:none;text-align:center;padding:14px;border-radius:10px;font-weight:700;font-size:14px;">
            Créer mon compte placier →
          </a>
          <p style="font-size:11px;color:#94A3B8;margin-top:16px;text-align:center;">Ce lien est personnel et à usage unique</p>
        </div>
      </div>
    </body></html>
  `
}

    const { data: emailData, error } = await resend.emails.send({
      from: 'PlaceMarket <onboarding@resend.dev>',
      to,
      subject,
      html,
    })

    if (error) throw error

    return NextResponse.json({ success: true, id: emailData?.id })
  } catch (err: any) {
    console.error('Email error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
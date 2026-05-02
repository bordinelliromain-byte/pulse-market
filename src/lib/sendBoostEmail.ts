// lib/sendBoostEmail.ts
// Template email "Votre pub est en ligne" — style Whatmarket Luxe

export function generateBoostEmailHTML(data: {
  nom: string
  offre: string
  eventTitle: string
  eventId: string
  prenom?: string
}): string {
  const prenom = data.prenom || data.nom.split(' ')[0]
  const marketUrl = `https://whatmarket.fr/market/${data.eventId}?ref=share_${prenom.toLowerCase().replace(/\s/g, '_')}`
  const shareText = encodeURIComponent(`Je suis en tête d'affiche au ${data.eventTitle} aujourd'hui ! Venez me retrouver 🎉 ${marketUrl}`)
  const whatsappUrl = `https://wa.me/?text=${shareText}`
  const instagramUrl = `https://www.instagram.com/`

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Votre pub est en ligne — Whatmarket</title>
</head>
<body style="margin:0;padding:0;background:#F9F8F6;font-family:'Helvetica Neue',Arial,sans-serif;">

  <div style="max-width:560px;margin:40px auto;padding:0 16px;">

    <!-- Header Whatmarket -->
    <div style="text-align:center;padding:32px 0 24px;">
      <span style="font-family:Georgia,serif;font-size:28px;font-weight:900;color:#111827;letter-spacing:-0.02em;">
        whatmarket
      </span>
    </div>

    <!-- Card principale -->
    <div style="background:white;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">

      <!-- Hero sombre -->
      <div style="background:linear-gradient(135deg,#111827 0%,#1F2937 100%);padding:36px 32px;text-align:center;">
        <div style="display:inline-block;background:rgba(255,255,255,0.1);border-radius:100px;padding:6px 16px;margin-bottom:20px;">
          <span style="color:rgba(255,255,255,0.7);font-size:11px;font-weight:600;letter-spacing:0.1em;">PUBLICATION ACTIVE</span>
        </div>
        <p style="font-family:Georgia,serif;font-size:26px;font-weight:700;color:white;line-height:1.3;margin:0 0 8px;">
          ${prenom}, vous êtes en tête d'affiche ! 🚀
        </p>
        <p style="font-size:14px;color:rgba(255,255,255,0.6);margin:0;">
          ${data.eventTitle}
        </p>
      </div>

      <!-- Aperçu de la pub -->
      <div style="padding:24px 28px;">

        <p style="font-size:13px;font-weight:600;color:#374151;text-transform:uppercase;letter-spacing:0.07em;margin:0 0 14px;">
          Votre pub en direct
        </p>

        <div style="background:#111827;border-radius:16px;padding:16px 18px;display:flex;align-items:center;gap:14px;margin-bottom:24px;">
          <div style="width:44px;height:44px;border-radius:12px;background:rgba(255,255,255,0.1);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <span style="font-size:22px;">🏪</span>
          </div>
          <div>
            <p style="font-size:14px;font-weight:700;color:white;margin:0 0 4px;">${data.nom}</p>
            <p style="font-size:12px;color:rgba(255,255,255,0.65);margin:0;">${data.offre}</p>
          </div>
        </div>

        <!-- Stats -->
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:28px;">
          ${[
            ['👁️', '2 400+', 'visiteurs attendus'],
            ['📍', 'Affiché', 'dans l\'app'],
            ['⏰', 'Toute la', 'journée'],
          ].map(([emoji, val, label]) => `
            <div style="background:#F9F8F6;border-radius:12px;padding:12px 8px;text-align:center;">
              <span style="font-size:18px;display:block;margin-bottom:4px;">${emoji}</span>
              <p style="font-size:13px;font-weight:700;color:#111827;margin:0 0 2px;">${val}</p>
              <p style="font-size:10px;color:#9CA3AF;margin:0;">${label}</p>
            </div>
          `).join('')}
        </div>

        <!-- Magic Link CTA -->
        <a href="${marketUrl}"
          style="display:block;background:linear-gradient(135deg,#4F46E5,#7C3AED);color:white;text-decoration:none;text-align:center;border-radius:16px;padding:18px;font-size:15px;font-weight:700;letter-spacing:-0.01em;margin-bottom:16px;">
          Voir ma pub sur Whatmarket →
        </a>

        <!-- Partage social -->
        <div style="background:#F0F7FF;border:1px solid #BFDBFE;border-radius:16px;padding:18px 20px;margin-bottom:8px;">
          <p style="font-size:13px;font-weight:700;color:#1E40AF;margin:0 0 6px;">📣 Partagez sur vos réseaux !</p>
          <p style="font-size:12px;color:#3B82F6;line-height:1.6;margin:0 0 14px;">
            Montrez à vos clients que vous êtes présents aujourd'hui. Un partage = plus de trafic = plus de ventes 🎯
          </p>
          <div style="display:flex;gap:10px;">
            <a href="${whatsappUrl}" target="_blank"
              style="flex:1;background:#25D366;color:white;text-decoration:none;text-align:center;border-radius:10px;padding:10px;font-size:12px;font-weight:700;">
              WhatsApp
            </a>
            <a href="${instagramUrl}" target="_blank"
              style="flex:1;background:linear-gradient(135deg,#F58529,#DD2A7B,#8134AF);color:white;text-decoration:none;text-align:center;border-radius:10px;padding:10px;font-size:12px;font-weight:700;">
              Instagram
            </a>
          </div>
        </div>

        <!-- Lien de tracking -->
        <p style="font-size:11px;color:#D1D5DB;text-align:center;margin:12px 0 0;">
          Votre lien de partage : <a href="${marketUrl}" style="color:#4F46E5;text-decoration:none;">${marketUrl}</a>
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align:center;padding:24px 0;">
      <p style="font-size:11px;color:#9CA3AF;margin:0;">
        whatmarket — La plateforme des marchés locaux<br>
        <a href="https://whatmarket.fr" style="color:#4F46E5;text-decoration:none;">whatmarket.fr</a>
      </p>
    </div>
  </div>

</body>
</html>`
}

// Fonction prête à être appelée depuis une API route
export async function sendBoostEmail(params: {
  to: string
  nom: string
  offre: string
  eventTitle: string
  eventId: string
}) {
  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)

  const prenom = params.nom.split(' ')[0]

  const { data, error } = await resend.emails.send({
    from: 'Whatmarket <onboarding@resend.dev>',
    to: params.to,
    subject: `${prenom}, votre pub est en ligne sur Whatmarket ! 🚀`,
    html: generateBoostEmailHTML(params),
  })

  if (error) throw error
  return data
}
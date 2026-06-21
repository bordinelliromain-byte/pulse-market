// src/lib/email-templates.ts
// ═════════════════════════════════════════════════════════════
// PULSEMARKET — TEMPLATES EMAILS PRO/CLEAN COMPLET
// Style : Linear/Notion vibe
// Wrapper unifié + logo dynamique
// 18 templates couvrant tous les use cases
// ═════════════════════════════════════════════════════════════

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://pulse-market.fr'

// ═════════════════════════════════════════════════════════════
// COULEURS & STYLES COMMUNS
// ═════════════════════════════════════════════════════════════
export const COLORS = {
  brand: '#4F46E5',
  dark: '#0F172A',
  text: '#0F172A',
  textMuted: '#64748B',
  textLight: '#94A3B8',
  bg: '#F8FAFC',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  success: '#16A34A',
  warning: '#F59E0B',
  danger: '#DC2626',
  white: '#FFFFFF',
}

// ═════════════════════════════════════════════════════════════
// WRAPPER PRINCIPAL — Utilisé par TOUS les emails
// ═════════════════════════════════════════════════════════════

interface WrapperParams {
  preview?: string
  headerType?: 'brand' | 'mairie' | 'dark' | 'success' | 'warning' | 'danger'
  headerTitle: string
  headerSubtitle?: string
  mairieNom?: string
  mairieLogoUrl?: string
  body: string
  footerLinks?: { label: string; url: string }[]
}

export function emailWrapper(params: WrapperParams): string {
  const {
    preview = '',
    headerType = 'brand',
    headerTitle,
    headerSubtitle,
    mairieNom,
    mairieLogoUrl,
    body,
    footerLinks = [],
  } = params

  const headerBg = {
    brand: `linear-gradient(135deg, ${COLORS.brand}, #7C3AED)`,
    mairie: COLORS.dark,
    dark: COLORS.dark,
    success: `linear-gradient(135deg, ${COLORS.success}, #15803D)`,
    warning: `linear-gradient(135deg, ${COLORS.warning}, #D97706)`,
    danger: `linear-gradient(135deg, ${COLORS.danger}, #B91C1C)`,
  }[headerType]

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <title>${headerTitle}</title>
  <style>
    body { margin: 0; padding: 0; background: ${COLORS.bg}; -webkit-font-smoothing: antialiased; }
    table { border-collapse: collapse; }
    img { border: 0; display: block; }
    a { color: ${COLORS.brand}; text-decoration: none; }
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; }
      .card { border-radius: 0 !important; }
      .px-32 { padding-left: 20px !important; padding-right: 20px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:${COLORS.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Inter',Arial,sans-serif;">
  ${preview ? `<div style="display:none;font-size:1px;color:${COLORS.bg};line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${preview}</div>` : ''}
  
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${COLORS.bg};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" class="container" style="max-width:560px;width:100%;">
          
          ${mairieNom || mairieLogoUrl ? `
          <tr>
            <td style="padding:0 4px 12px;text-align:center;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
                <tr>
                  ${mairieLogoUrl ? `
                  <td style="padding-right:8px;vertical-align:middle;">
                    <img src="${mairieLogoUrl}" alt="" width="24" height="24" style="border-radius:5px;object-fit:cover;display:block;">
                  </td>` : ''}
                  ${mairieNom ? `
                  <td style="vertical-align:middle;">
                    <span style="font-size:12px;font-weight:600;color:${COLORS.textMuted};letter-spacing:0.02em;">Via ${mairieNom}</span>
                  </td>` : ''}
                </tr>
              </table>
            </td>
          </tr>
          ` : ''}
          
          <tr>
            <td class="card" style="background:${COLORS.white};border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.04),0 4px 24px rgba(0,0,0,0.04);">
              
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td class="px-32" style="background:${headerBg};padding:36px 32px;text-align:center;">
                    <h1 style="margin:0 0 6px;color:${COLORS.white};font-size:22px;font-weight:800;letter-spacing:-0.01em;line-height:1.3;">${headerTitle}</h1>
                    ${headerSubtitle ? `<p style="margin:0;color:rgba(255,255,255,0.8);font-size:13px;font-weight:500;">${headerSubtitle}</p>` : ''}
                  </td>
                </tr>
              </table>
              
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td class="px-32" style="padding:32px;color:${COLORS.text};font-size:15px;line-height:1.65;">
                    ${body}
                  </td>
                </tr>
              </table>
              
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td class="px-32" style="background:${COLORS.bg};border-top:1px solid ${COLORS.border};padding:24px 32px;text-align:center;">
                    <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:${COLORS.dark};letter-spacing:-0.01em;">PulseMarket</p>
                    <p style="margin:0 0 12px;font-size:11px;color:${COLORS.textLight};line-height:1.6;">
                      La plateforme des marchés municipaux<br>
                      PulseMarket SAS · Plan-d'Aups-Sainte-Baume
                    </p>
                    ${footerLinks.length > 0 ? `
                    <div style="margin-top:12px;">
                      ${footerLinks.map((link, i) => `
                        ${i > 0 ? `<span style="color:${COLORS.borderLight};margin:0 4px;">·</span>` : ''}
                        <a href="${link.url}" style="color:${COLORS.textMuted};font-size:11px;text-decoration:underline;">${link.label}</a>
                      `).join('')}
                    </div>
                    ` : `
                    <div style="margin-top:12px;">
                      <a href="${APP_URL}" style="color:${COLORS.textMuted};font-size:11px;text-decoration:underline;">pulse-market.fr</a>
                    </div>
                    `}
                  </td>
                </tr>
              </table>
              
            </td>
          </tr>
          
        </table>
        
      </td>
    </tr>
  </table>
</body>
</html>`
}

// ═════════════════════════════════════════════════════════════
// COMPOSANTS RÉUTILISABLES
// ═════════════════════════════════════════════════════════════

export function button(label: string, url: string, variant: 'primary' | 'secondary' | 'danger' = 'primary'): string {
  const bg = variant === 'primary' ? COLORS.brand : variant === 'danger' ? COLORS.danger : COLORS.bg
  const color = variant === 'secondary' ? COLORS.textMuted : COLORS.white
  const border = variant === 'secondary' ? `1px solid ${COLORS.border}` : 'none'
  
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:8px 0;">
    <tr>
      <td>
        <a href="${url}" style="display:block;background:${bg};color:${color};text-decoration:none;text-align:center;padding:14px 24px;border-radius:10px;font-weight:700;font-size:14px;border:${border};">${label}</a>
      </td>
    </tr>
  </table>`
}

export function infoBox(items: { label: string; value: string; highlight?: boolean }[]): string {
  const rows = items.map((item, i) => `
    <tr>
      <td style="padding:8px 0;border-bottom:${i < items.length - 1 ? `1px solid ${COLORS.borderLight}` : 'none'};">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td style="font-size:13px;color:${COLORS.textMuted};">${item.label}</td>
            <td style="font-size:${item.highlight ? '15px' : '13px'};font-weight:${item.highlight ? '800' : '600'};color:${item.highlight ? COLORS.brand : COLORS.text};text-align:right;">${item.value}</td>
          </tr>
        </table>
      </td>
    </tr>
  `).join('')

  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${COLORS.bg};border:1px solid ${COLORS.border};border-radius:12px;margin:16px 0;">
    <tr>
      <td style="padding:8px 20px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
          ${rows}
        </table>
      </td>
    </tr>
  </table>`
}

export function notice(text: string, variant: 'info' | 'success' | 'warning' | 'danger' = 'info'): string {
  const config = {
    info:    { bg: '#EEF2FF', border: '#C7D2FE', color: '#4338CA' },
    success: { bg: '#F0FDF4', border: '#BBF7D0', color: '#15803D' },
    warning: { bg: '#FFFBEB', border: '#FDE68A', color: '#92400E' },
    danger:  { bg: '#FEF2F2', border: '#FECACA', color: '#991B1B' },
  }[variant]
  
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${config.bg};border:1px solid ${config.border};border-radius:10px;margin:16px 0;">
    <tr>
      <td style="padding:12px 16px;font-size:13px;color:${config.color};line-height:1.6;">${text}</td>
    </tr>
  </table>`
}

export function divider(): string {
  return `<div style="border-top:1px solid ${COLORS.borderLight};margin:24px 0;"></div>`
}

// ═════════════════════════════════════════════════════════════
// 📦 BLOC 1 — CRÉATION DE COMPTES
// ═════════════════════════════════════════════════════════════

// ─── 1. BIENVENUE EXPOSANT ───
export function tplBienvenue(data: any) {
  const body = `
    <p>Bonjour <strong>${data.nom || ''}</strong>,</p>
    <p style="color:${COLORS.textMuted};">Bienvenue sur PulseMarket ! Votre compte vient d'être créé avec succès.</p>
    
    <p style="margin:20px 0 12px;font-weight:700;color:${COLORS.text};">Prochaines étapes :</p>
    
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:16px 0;">
      ${[
        { num: '1', title: 'Complétez votre profil', desc: 'Ajoutez vos documents et votre activité' },
        { num: '2', title: 'Explorez les marchés', desc: 'Trouvez les événements près de chez vous' },
        { num: '3', title: 'Postulez en 1 clic', desc: 'Envoyez vos candidatures aux mairies' },
      ].map(step => `
        <tr>
          <td style="padding:8px 0;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td width="36" valign="top" style="padding-right:12px;">
                  <div style="width:28px;height:28px;background:${COLORS.brand};color:${COLORS.white};border-radius:50%;text-align:center;line-height:28px;font-weight:800;font-size:12px;">${step.num}</div>
                </td>
                <td>
                  <p style="margin:0;font-size:14px;font-weight:700;color:${COLORS.text};">${step.title}</p>
                  <p style="margin:2px 0 0;font-size:12px;color:${COLORS.textMuted};">${step.desc}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      `).join('')}
    </table>
    
    ${button('Accéder à mon espace', `${APP_URL}/dashboard`)}
  `

  return {
    subject: 'Bienvenue sur PulseMarket',
    html: emailWrapper({
      preview: `Votre compte PulseMarket est prêt`,
      headerType: 'brand',
      headerTitle: 'Bienvenue sur PulseMarket',
      headerSubtitle: 'La plateforme des marchés municipaux',
      body,
    })
  }
}

// ─── 2. BIENVENUE MAIRIE (en attente validation) ───
export function tplBienvenueMairie(data: any) {
  const body = `
    <p>Bonjour <strong>${data.nom || ''}</strong>,</p>
    <p style="color:${COLORS.textMuted};">Bienvenue sur PulseMarket ! Votre compte organisation a bien été créé pour <strong style="color:${COLORS.text};">${data.organisationNom || 'votre mairie'}</strong>.</p>
    
    ${notice('<strong>Validation en cours.</strong> Votre compte doit être vérifié par notre équipe avant activation complète (sous 24-48h). Nous vous enverrons un email dès que c\'est fait.', 'warning')}
    
    <p style="margin:20px 0 12px;font-weight:700;color:${COLORS.text};">En attendant, vous pouvez :</p>
    
    <ul style="margin:0 0 20px;padding-left:20px;color:${COLORS.textMuted};font-size:14px;line-height:1.9;">
      <li>Compléter les informations de votre organisation</li>
      <li>Préparer vos documents officiels</li>
      <li>Définir votre logo et votre identité visuelle</li>
    </ul>
    
    ${button('Accéder à mon espace', `${APP_URL}/dashboard`)}
    
    <p style="font-size:12px;color:${COLORS.textLight};text-align:center;margin-top:16px;">Une question ? Contactez-nous à <a href="mailto:contact@pulse-market.fr" style="color:${COLORS.brand};">contact@pulse-market.fr</a></p>
  `

  return {
    subject: 'Votre compte PulseMarket est en attente de validation',
    html: emailWrapper({
      preview: `Votre compte ${data.organisationNom || 'mairie'} est en attente de validation`,
      headerType: 'dark',
      headerTitle: 'Compte créé avec succès',
      headerSubtitle: 'Validation en cours par notre équipe',
      body,
    })
  }
}

// ─── 3. MAIRIE VALIDÉE ───
export function tplMairieValidee(data: any) {
  const body = `
    <p>Bonjour <strong>${data.nom || ''}</strong>,</p>
    <p style="color:${COLORS.textMuted};">Excellente nouvelle ! Votre compte organisation pour <strong style="color:${COLORS.text};">${data.organisationNom || 'votre mairie'}</strong> a été validé par notre équipe.</p>
    
    ${notice('Vous avez désormais accès à toutes les fonctionnalités de PulseMarket pour gérer vos marchés municipaux.', 'success')}
    
    <p style="margin:20px 0 12px;font-weight:700;color:${COLORS.text};">Vos fonctionnalités débloquées :</p>
    
    <ul style="margin:0 0 20px;padding-left:20px;color:${COLORS.textMuted};font-size:14px;line-height:1.9;">
      <li>Création et publication de marchés</li>
      <li>Validation des candidatures forains</li>
      <li>Attribution des emplacements (carte satellite)</li>
      <li>Trésorerie et exports comptables</li>
      <li>Gestion des placiers et de l'équipe</li>
      <li>Conformité RGPD et audit logs</li>
    </ul>
    
    ${button('Créer mon premier marché', `${APP_URL}/dashboard/creer-evenement`)}
    ${button('Voir le tableau de bord', `${APP_URL}/dashboard`, 'secondary')}
  `

  return {
    subject: 'Votre compte PulseMarket est validé',
    html: emailWrapper({
      preview: `Compte validé — Accès complet à PulseMarket`,
      headerType: 'success',
      headerTitle: 'Compte validé',
      headerSubtitle: 'Accès complet débloqué',
      body,
    })
  }
}

// ─── 4. MAIRIE REFUSÉE ───
export function tplMairieRefusee(data: any) {
  const body = `
    <p>Bonjour <strong>${data.nom || ''}</strong>,</p>
    <p style="color:${COLORS.textMuted};">Nous vous informons que la validation du compte organisation pour <strong style="color:${COLORS.text};">${data.organisationNom || 'votre mairie'}</strong> n'a pas pu aboutir.</p>
    
    ${data.motif ? `
      <div style="background:${COLORS.bg};border:1px solid ${COLORS.border};border-left:3px solid ${COLORS.danger};border-radius:8px;padding:14px 16px;margin:16px 0;">
        <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:${COLORS.textMuted};text-transform:uppercase;letter-spacing:0.05em;">Motif</p>
        <p style="margin:0;font-size:14px;color:${COLORS.text};line-height:1.6;">${data.motif}</p>
      </div>
    ` : ''}
    
    <p style="color:${COLORS.textMuted};margin:16px 0;">Cela peut être dû à des informations incomplètes, des documents manquants, ou un doute sur la légitimité du compte. N'hésitez pas à nous recontacter avec des éléments complémentaires.</p>
    
    ${button('Contacter notre équipe', 'mailto:contact@pulse-market.fr')}
    
    <p style="font-size:12px;color:${COLORS.textLight};text-align:center;margin-top:16px;">Nous restons à votre disposition pour clarifier la situation et vous accompagner.</p>
  `

  return {
    subject: 'Concernant votre compte PulseMarket',
    html: emailWrapper({
      preview: `Votre compte organisation n'a pas pu être validé`,
      headerType: 'dark',
      headerTitle: 'Compte non validé',
      body,
    })
  }
}

// ─── 5. BIENVENUE PLACIER ───
export function tplBienvenuePlacier(data: any) {
  const body = `
    <p>Bonjour <strong>${data.nom || ''}</strong>,</p>
    <p style="color:${COLORS.textMuted};">Votre compte placier a bien été créé. Vous êtes désormais rattaché à <strong style="color:${COLORS.text};">${data.mairieNom || 'votre mairie'}</strong>.</p>
    
    ${notice('Installez l\'application sur votre téléphone pour scanner les QR codes des exposants directement sur le terrain.', 'info')}
    
    <p style="margin:20px 0 12px;font-weight:700;color:${COLORS.text};">En tant que placier, vous pourrez :</p>
    
    <ul style="margin:0 0 20px;padding-left:20px;color:${COLORS.textMuted};font-size:14px;line-height:1.9;">
      <li>Scanner les QR codes des exposants</li>
      <li>Valider la présence sur les marchés</li>
      <li>Ajouter des forains de dernière minute (paiement express)</li>
      <li>Consulter l'historique de vos scans</li>
      <li>Voir votre planning du jour</li>
    </ul>
    
    ${button('Accéder à mon espace placier', `${APP_URL}/dashboard/placier`)}
    
    <p style="font-size:12px;color:${COLORS.textLight};text-align:center;margin-top:16px;">Sur mobile, ajoutez la page à votre écran d'accueil pour un accès rapide.</p>
  `

  return {
    subject: 'Bienvenue sur PulseMarket — Espace placier',
    html: emailWrapper({
      preview: `Votre compte placier ${data.mairieNom || ''} est prêt`,
      headerType: 'brand',
      headerTitle: 'Bienvenue, placier',
      headerSubtitle: data.mairieNom ? `Rattaché à ${data.mairieNom}` : 'Compte créé avec succès',
      body,
    })
  }
}

// ═════════════════════════════════════════════════════════════
// 📦 BLOC 2 — CANDIDATURES
// ═════════════════════════════════════════════════════════════

// ─── 6. CANDIDATURE VALIDÉE ───
export function tplCandidatureValidee(data: any) {
  const body = `
    <p>Bonjour <strong>${data.exposantNom || ''}</strong>,</p>
    <p style="color:${COLORS.textMuted};">Bonne nouvelle ! Votre candidature pour <strong style="color:${COLORS.text};">${data.eventTitle || ''}</strong> a été acceptée par ${data.mairieNom || 'la mairie organisatrice'}.</p>
    
    ${infoBox([
      { label: 'Événement', value: data.eventTitle || '—' },
      { label: 'Date', value: data.eventDate || '—' },
      { label: 'Lieu', value: data.eventLocation || '—' },
      { label: 'Montant à régler', value: `${data.montant || 0} €`, highlight: true },
    ])}
    
    ${notice('<strong>Action requise :</strong> Connectez-vous pour régler votre place et la confirmer. Sans paiement, votre place pourra être réattribuée.', 'warning')}
    
    ${button('Payer ma place', `${APP_URL}/dashboard/mes-marches`)}
  `

  return {
    subject: `Candidature acceptée — ${data.eventTitle || ''}`,
    html: emailWrapper({
      preview: `Votre candidature a été acceptée — Confirmez votre place`,
      headerType: 'brand',
      headerTitle: 'Candidature acceptée',
      headerSubtitle: 'Confirmez votre place pour la sécuriser',
      mairieNom: data.mairieNom,
      mairieLogoUrl: data.mairieLogoUrl,
      body,
    })
  }
}

// ─── 7. CANDIDATURE REFUSÉE ───
export function tplCandidatureRefusee(data: any) {
  const body = `
    <p>Bonjour <strong>${data.exposantNom || ''}</strong>,</p>
    <p style="color:${COLORS.textMuted};">Nous vous informons que votre candidature pour <strong style="color:${COLORS.text};">${data.eventTitle || ''}</strong> n'a pas été retenue par ${data.mairieNom || 'la mairie organisatrice'}.</p>
    
    ${data.motif ? `
      <div style="background:${COLORS.bg};border:1px solid ${COLORS.border};border-left:3px solid ${COLORS.danger};border-radius:8px;padding:14px 16px;margin:16px 0;">
        <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:${COLORS.textMuted};text-transform:uppercase;letter-spacing:0.05em;">Motif</p>
        <p style="margin:0;font-size:14px;color:${COLORS.text};line-height:1.6;">${data.motif}</p>
      </div>
    ` : ''}
    
    <p style="color:${COLORS.textMuted};">Ne soyez pas découragé. D'autres marchés sont disponibles sur la plateforme, et vous pouvez recandidater à de futurs événements.</p>
    
    ${button('Explorer d\'autres marchés', `${APP_URL}/dashboard/evenements`)}
  `

  return {
    subject: `Candidature non retenue — ${data.eventTitle || ''}`,
    html: emailWrapper({
      preview: `Votre candidature n'a pas été retenue cette fois-ci`,
      headerType: 'dark',
      headerTitle: 'Candidature non retenue',
      mairieNom: data.mairieNom,
      mairieLogoUrl: data.mairieLogoUrl,
      body,
    })
  }
}

// ─── 8. CANDIDATURE ENVOYÉE (confirmation à l'exposant) ───
export function tplCandidatureEnvoyee(data: any) {
  const body = `
    <p>Bonjour <strong>${data.exposantNom || ''}</strong>,</p>
    <p style="color:${COLORS.textMuted};">Votre candidature pour <strong style="color:${COLORS.text};">${data.eventTitle || ''}</strong> a bien été envoyée à ${data.mairieNom || 'la mairie organisatrice'}.</p>
    
    ${infoBox([
      { label: 'Événement', value: data.eventTitle || '—' },
      { label: 'Date', value: data.eventDate || '—' },
      { label: 'Lieu', value: data.eventLocation || '—' },
      { label: 'Statut', value: 'En attente de validation' },
    ])}
    
    ${notice('Vous recevrez un email dès que la mairie aura traité votre demande (généralement sous 2 à 5 jours ouvrés).', 'info')}
    
    ${button('Suivre mes candidatures', `${APP_URL}/dashboard/mes-marches`)}
  `

  return {
    subject: `Candidature envoyée — ${data.eventTitle || ''}`,
    html: emailWrapper({
      preview: `Votre candidature est en attente de validation`,
      headerType: 'brand',
      headerTitle: 'Candidature envoyée',
      headerSubtitle: 'En attente de validation',
      mairieNom: data.mairieNom,
      mairieLogoUrl: data.mairieLogoUrl,
      body,
    })
  }
}

// ─── 9. NOUVELLE CANDIDATURE (notif mairie) ───
export function tplNouvelleCandidature(data: any) {
  const body = `
    <p>Bonjour,</p>
    <p style="color:${COLORS.textMuted};">Une nouvelle candidature vient d'être envoyée pour <strong style="color:${COLORS.text};">${data.eventTitle || ''}</strong>.</p>
    
    ${infoBox([
      { label: 'Exposant', value: data.exposantNom || '—' },
      { label: 'Email', value: data.exposantEmail || '—' },
      { label: 'Activité', value: data.exposantActivite || '—' },
      { label: 'Événement', value: data.eventTitle || '—' },
      { label: 'Date', value: data.eventDate || '—' },
    ])}
    
    ${notice('Connectez-vous à votre espace pour examiner le dossier et valider ou refuser la candidature.', 'info')}
    
    ${button('Voir la candidature', `${APP_URL}/dashboard/candidatures`)}
  `

  return {
    subject: `Nouvelle candidature — ${data.eventTitle || ''}`,
    html: emailWrapper({
      preview: `${data.exposantNom || 'Un exposant'} a postulé à ${data.eventTitle || ''}`,
      headerType: 'brand',
      headerTitle: 'Nouvelle candidature',
      headerSubtitle: 'Action requise',
      body,
    })
  }
}

// ═════════════════════════════════════════════════════════════
// 📦 BLOC 3 — PAIEMENTS
// ═════════════════════════════════════════════════════════════

// ─── 10. PAIEMENT CONFIRMÉ (exposant) ───
export function tplPaiementConfirme(data: any) {
  const total = (Number(data.redevanceAOT) || 0) + (Number(data.fraisPlateforme) || 2)

  const body = `
    <p>Bonjour <strong>${data.exposantNom || ''}</strong>,</p>
    <p style="color:${COLORS.textMuted};">Votre paiement a bien été reçu pour <strong style="color:${COLORS.text};">${data.eventTitle || ''}</strong>. Votre place est officiellement réservée.</p>
    
    ${infoBox([
      { label: 'Événement', value: data.eventTitle || '—' },
      { label: 'Date', value: data.eventDate || '—' },
      { label: 'Lieu', value: data.eventLocation || '—' },
      { label: 'Redevance AOT', value: `${data.redevanceAOT || 0} €` },
      { label: 'Frais de service', value: `${data.fraisPlateforme || 2} €` },
      { label: 'Total TTC', value: `${total.toFixed(2)} €`, highlight: true },
    ])}
    
    ${button('Voir ma facture', `${APP_URL}/dashboard/factures`)}
    ${button('Retour au tableau de bord', `${APP_URL}/dashboard`, 'secondary')}
    
    ${notice('Présentez le QR Code de votre AOT le jour du marché pour valider votre entrée.', 'info')}
  `

  return {
    subject: `Paiement confirmé — ${data.eventTitle || 'PulseMarket'}`,
    html: emailWrapper({
      preview: `Votre paiement de ${total.toFixed(2)} € est confirmé`,
      headerType: 'success',
      headerTitle: 'Paiement confirmé',
      headerSubtitle: 'Votre place est réservée',
      mairieNom: data.mairieNom,
      mairieLogoUrl: data.mairieLogoUrl,
      body,
    })
  }
}

// ─── 11. PAIEMENT ÉCHEC ───
export function tplPaiementEchec(data: any) {
  const body = `
    <p>Bonjour <strong>${data.nom || ''}</strong>,</p>
    <p style="color:${COLORS.textMuted};">Le renouvellement de votre abonnement <strong style="color:${COLORS.text};">PulseMarket Pro</strong> a échoué. Votre compte est temporairement repassé en version gratuite.</p>
    
    ${notice('Cela peut être dû à une carte expirée, un solde insuffisant, ou un refus bancaire. Mettez à jour votre moyen de paiement pour réactiver vos avantages Pro.', 'danger')}
    
    ${button('Mettre à jour mon paiement', `${APP_URL}/dashboard/parametres`, 'danger')}
    
    <p style="font-size:12px;color:${COLORS.textLight};text-align:center;margin-top:16px;">Besoin d'aide ? Contactez-nous à <a href="mailto:contact@pulse-market.fr" style="color:${COLORS.brand};">contact@pulse-market.fr</a></p>
  `

  return {
    subject: 'Échec de paiement — PulseMarket Pro',
    html: emailWrapper({
      preview: `Action requise : mettez à jour votre moyen de paiement`,
      headerType: 'danger',
      headerTitle: 'Échec de paiement',
      headerSubtitle: 'Abonnement Pro suspendu',
      body,
    })
  }
}

// ─── 12. PAIEMENT REÇU (notif mairie) ───
export function tplPaiementRecuMairie(data: any) {
  const body = `
    <p>Bonjour,</p>
    <p style="color:${COLORS.textMuted};">Un exposant vient de confirmer sa place pour <strong style="color:${COLORS.text};">${data.eventTitle || ''}</strong>.</p>
    
    ${infoBox([
      { label: 'Exposant', value: data.exposantNom || '—' },
      { label: 'Email', value: data.exposantEmail || '—' },
      { label: 'Événement', value: data.eventTitle || '—' },
      { label: 'Date', value: data.eventDate || '—' },
      { label: 'Redevance perçue', value: `${data.montant || 0} €`, highlight: true },
    ])}
    
    ${notice('La redevance sera reversée sur votre compte bancaire conformément à vos paramètres de facturation.', 'success')}
    
    ${button('Voir la trésorerie', `${APP_URL}/dashboard/tresorerie`)}
  `

  return {
    subject: `Paiement reçu — ${data.eventTitle || ''}`,
    html: emailWrapper({
      preview: `Nouveau paiement de ${data.montant || 0} € reçu`,
      headerType: 'success',
      headerTitle: 'Paiement reçu',
      headerSubtitle: `+${data.montant || 0} € sur votre trésorerie`,
      body,
    })
  }
}

// ─── 13. RAPPEL MARCHÉ J-3 ───
export function tplRappelMarcheJ3(data: any) {
  const body = `
    <p>Bonjour <strong>${data.exposantNom || ''}</strong>,</p>
    <p style="color:${COLORS.textMuted};">Petit rappel : votre prochain marché c'est <strong style="color:${COLORS.text};">dans 3 jours</strong> !</p>
    
    ${infoBox([
      { label: 'Événement', value: data.eventTitle || '—' },
      { label: 'Date', value: data.eventDate || '—' },
      { label: 'Lieu', value: data.eventLocation || '—' },
      { label: 'Case attribuée', value: data.spotLabel || 'À récupérer sur place' },
    ])}
    
    ${notice('<strong>N\'oubliez pas votre QR Code AOT !</strong> Il est dans votre facture ou téléchargeable depuis votre espace.', 'warning')}
    
    <p style="margin:20px 0 12px;font-weight:700;color:${COLORS.text};">Checklist avant le jour J :</p>
    
    <ul style="margin:0 0 20px;padding-left:20px;color:${COLORS.textMuted};font-size:14px;line-height:1.9;">
      <li>QR Code AOT téléchargé sur votre téléphone</li>
      <li>Documents officiels (KBIS, attestation, etc.)</li>
      <li>Matériel d'exposition</li>
      <li>Monnaie pour rendre la monnaie</li>
    </ul>
    
    ${button('Voir mon AOT', `${APP_URL}/dashboard/mes-marches`)}
  `

  return {
    subject: `Rappel — ${data.eventTitle || 'Marché'} dans 3 jours`,
    html: emailWrapper({
      preview: `Votre marché ${data.eventTitle || ''} approche !`,
      headerType: 'warning',
      headerTitle: 'Marché dans 3 jours',
      headerSubtitle: data.eventDate || 'Préparez-vous',
      mairieNom: data.mairieNom,
      mairieLogoUrl: data.mairieLogoUrl,
      body,
    })
  }
}

// ═════════════════════════════════════════════════════════════
// 📦 BLOC 4 — ÉQUIPE & INVITATIONS
// ═════════════════════════════════════════════════════════════

// ─── 14. INVITATION PLACIER ───
export function tplInvitationPlacier(data: any) {
  const body = `
    <p>Bonjour <strong>${data.nom || ''}</strong>,</p>
    <p style="color:${COLORS.textMuted};"><strong style="color:${COLORS.text};">${data.mairieNom || 'Une mairie'}</strong> vous invite à rejoindre PulseMarket en tant que <strong>placier</strong>.</p>
    
    <p style="color:${COLORS.textMuted};margin:16px 0;">En tant que placier, vous pourrez scanner les QR codes des exposants pour valider leur présence sur les marchés, gérer l'émargement, et ajouter des forains de dernière minute.</p>
    
    ${notice('Lien personnel à usage unique. Il expirera dans 7 jours.', 'info')}
    
    ${button('Créer mon compte placier', data.inviteUrl)}
    
    <p style="font-size:11px;color:${COLORS.textLight};text-align:center;margin-top:16px;">Si le bouton ne fonctionne pas, copiez ce lien : <br><span style="color:${COLORS.brand};word-break:break-all;">${data.inviteUrl || ''}</span></p>
  `

  return {
    subject: `Invitation placier — ${data.mairieNom || 'PulseMarket'}`,
    html: emailWrapper({
      preview: `${data.mairieNom || 'Une mairie'} vous invite comme placier`,
      headerType: 'dark',
      headerTitle: 'Vous êtes invité',
      headerSubtitle: `${data.mairieNom || ''} vous fait confiance`,
      body,
    })
  }
}

// ─── 15. INVITATION ÉQUIPE ───
export function tplInvitationTeam(data: any) {
  const isPasswordMethod = data.method === 'password'

  const body = `
    <p>Bonjour <strong>${data.nom || ''}</strong>,</p>
    <p style="color:${COLORS.textMuted};"><strong style="color:${COLORS.text};">${data.mairieNom || ''}</strong> vous invite à rejoindre son équipe sur PulseMarket avec le rôle de <strong>${data.role || ''}</strong>.</p>
    
    ${isPasswordMethod ? `
      <p style="margin:20px 0 8px;font-weight:700;color:${COLORS.text};">Vos identifiants de connexion</p>
      
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${COLORS.dark};border-radius:12px;margin:12px 0;">
        <tr>
          <td style="padding:16px 20px;">
            <p style="margin:0 0 4px;font-size:10px;color:${COLORS.textLight};text-transform:uppercase;letter-spacing:0.06em;">Mot de passe temporaire</p>
            <p style="margin:0;font-size:18px;font-weight:800;color:${COLORS.white};font-family:'SF Mono','Monaco',monospace;letter-spacing:0.05em;">${data.tempPassword || ''}</p>
          </td>
        </tr>
      </table>
      
      ${notice('<strong>Important :</strong> Vous devrez changer ce mot de passe à votre première connexion.', 'warning')}
      
      ${button('Se connecter', data.loginUrl || `${APP_URL}/auth/mairie`)}
    ` : `
      ${notice(`Lien personnel à usage unique. Il expirera dans ${data.expiryDays || 14} jours.`, 'info')}
      
      ${button('Accepter l\'invitation', data.inviteUrl)}
      
      <p style="font-size:11px;color:${COLORS.textLight};text-align:center;margin-top:16px;">Si le bouton ne fonctionne pas, copiez ce lien : <br><span style="color:${COLORS.brand};word-break:break-all;">${data.inviteUrl || ''}</span></p>
    `}
  `

  return {
    subject: `Invitation équipe — ${data.mairieNom || 'PulseMarket'}`,
    html: emailWrapper({
      preview: `Rejoignez l'équipe ${data.mairieNom || ''} sur PulseMarket`,
      headerType: 'dark',
      headerTitle: 'Invitation à rejoindre l\'équipe',
      headerSubtitle: `Rôle : ${data.role || ''}`,
      body,
    })
  }
}

// ─── 16. CHANGEMENT DE RÔLE ÉQUIPE ───
export function tplTeamRoleChange(data: any) {
  const body = `
    <p>Bonjour <strong>${data.nom || ''}</strong>,</p>
    <p style="color:${COLORS.textMuted};">Votre rôle au sein de l'équipe <strong style="color:${COLORS.text};">${data.mairieNom || ''}</strong> a été modifié.</p>
    
    ${infoBox([
      { label: 'Ancien rôle', value: data.oldRole || '—' },
      { label: 'Nouveau rôle', value: data.newRole || '—', highlight: true },
    ])}
    
    ${notice(`Vos nouvelles permissions sont actives dès votre prochaine connexion.`, 'info')}
    
    ${button('Accéder à mon espace', `${APP_URL}/dashboard`)}
  `

  return {
    subject: `Changement de rôle — ${data.mairieNom || ''}`,
    html: emailWrapper({
      preview: `Vous êtes désormais ${data.newRole || ''}`,
      headerType: 'brand',
      headerTitle: 'Rôle modifié',
      headerSubtitle: `Vous êtes désormais ${data.newRole || ''}`,
      body,
    })
  }
}

// ─── 17. RETRAIT D'ÉQUIPE ───
export function tplTeamRemoved(data: any) {
  const body = `
    <p>Bonjour <strong>${data.nom || ''}</strong>,</p>
    <p style="color:${COLORS.textMuted};">Vous avez été retiré de l'équipe <strong style="color:${COLORS.text};">${data.mairieNom || ''}</strong>.</p>
    
    ${notice('Votre accès à l\'espace de cette organisation est désormais désactivé. Votre compte PulseMarket personnel reste actif.', 'warning')}
    
    <p style="color:${COLORS.textMuted};">Si vous pensez qu'il s'agit d'une erreur, contactez directement la mairie concernée.</p>
    
    ${button('Accéder à mon compte', `${APP_URL}/dashboard`)}
  `

  return {
    subject: `Retrait de l'équipe — ${data.mairieNom || ''}`,
    html: emailWrapper({
      preview: `Vous n'avez plus accès à ${data.mairieNom || ''}`,
      headerType: 'dark',
      headerTitle: 'Accès retiré',
      headerSubtitle: data.mairieNom || '',
      body,
    })
  }
}

// ═════════════════════════════════════════════════════════════
// 📦 BLOC 5 — PRO & FACTURATION
// ═════════════════════════════════════════════════════════════

// ─── 18. BIENVENUE PRO ───
export function tplBienvenuePro(data: any) {
  const body = `
    <p>Bonjour <strong>${data.nom || ''}</strong>,</p>
    <p style="color:${COLORS.textMuted};">Votre abonnement <strong style="color:${COLORS.text};">PulseMarket Pro</strong> est désormais actif. Vous bénéficiez de toutes les fonctionnalités premium.</p>
    
    ${infoBox([
      { label: 'Plan', value: 'PulseMarket Pro' },
      { label: 'Montant mensuel', value: `${data.montant || '20'} €` },
      { label: 'Prochain renouvellement', value: data.prochainePeriode || '—' },
    ])}
    
    <p style="margin:20px 0 12px;font-weight:700;color:${COLORS.text};">Vos avantages Pro :</p>
    
    <ul style="margin:0 0 20px;padding-left:20px;color:${COLORS.textMuted};font-size:14px;line-height:1.9;">
      <li>Candidatures illimitées</li>
      <li>Boost prioritaire sur les marchés</li>
      <li>Statistiques détaillées</li>
      <li>Support prioritaire</li>
    </ul>
    
    ${button('Accéder à mon espace Pro', `${APP_URL}/dashboard`)}
  `

  return {
    subject: 'Bienvenue dans PulseMarket Pro',
    html: emailWrapper({
      preview: `Votre abonnement Pro est actif`,
      headerType: 'brand',
      headerTitle: 'Bienvenue en Pro',
      headerSubtitle: 'Candidatures illimitées débloquées',
      body,
    })
  }
}

// ─── 19. FACTURE PRO MENSUELLE ───
export function tplFactureProMensuelle(data: any) {
  const body = `
    <p>Bonjour <strong>${data.nom || ''}</strong>,</p>
    <p style="color:${COLORS.textMuted};">Votre abonnement <strong style="color:${COLORS.text};">PulseMarket Pro</strong> a été renouvelé pour la période <strong>${data.periode || ''}</strong>.</p>
    
    ${infoBox([
      { label: 'Abonnement', value: 'PulseMarket Pro' },
      { label: 'Période', value: data.periode || '—' },
      { label: 'Total TTC', value: `${data.montant || '20'} €`, highlight: true },
    ])}
    
    ${data.invoiceUrl ? button('Télécharger la facture Stripe', data.invoiceUrl, 'secondary') : ''}
    ${button('Voir mes factures', `${APP_URL}/dashboard/factures`)}
    
    <p style="font-size:12px;color:${COLORS.textLight};text-align:center;margin-top:16px;">Prochain renouvellement : ${data.prochainePeriode || '—'}</p>
  `

  return {
    subject: `Facture PulseMarket Pro — ${data.periode || ''}`,
    html: emailWrapper({
      preview: `Facture mensuelle ${data.periode || ''} — ${data.montant || '20'} €`,
      headerType: 'dark',
      headerTitle: 'Facture mensuelle',
      headerSubtitle: `PulseMarket Pro — ${data.periode || ''}`,
      body,
    })
  }
}

// ═════════════════════════════════════════════════════════════
// 📦 BLOC 6 — SÉCURITÉ & RGPD
// ═════════════════════════════════════════════════════════════

// ─── 20. RESET PASSWORD ───
export function tplResetPassword(data: any) {
  const body = `
    <p>Bonjour <strong>${data.nom || ''}</strong>,</p>
    <p style="color:${COLORS.textMuted};">Vous avez demandé la réinitialisation de votre mot de passe PulseMarket. Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe.</p>
    
    ${notice('Ce lien expire dans 60 minutes pour des raisons de sécurité.', 'warning')}
    
    ${button('Réinitialiser mon mot de passe', data.resetUrl || `${APP_URL}/auth/reset`)}
    
    <p style="color:${COLORS.textMuted};margin:20px 0 0;">Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email. Votre mot de passe restera inchangé.</p>
    
    <p style="font-size:11px;color:${COLORS.textLight};text-align:center;margin-top:16px;">Si le bouton ne fonctionne pas, copiez ce lien : <br><span style="color:${COLORS.brand};word-break:break-all;">${data.resetUrl || ''}</span></p>
  `

  return {
    subject: 'Réinitialisation de votre mot de passe',
    html: emailWrapper({
      preview: `Lien de réinitialisation valable 60 minutes`,
      headerType: 'dark',
      headerTitle: 'Réinitialisation du mot de passe',
      headerSubtitle: 'Lien valable 60 minutes',
      body,
    })
  }
}

// ─── 21. RGPD DELETION REQUEST ───
export function tplRgpdDeletionRequest(data: any) {
  const body = `
    <p>Une demande de suppression complète a été reçue.</p>
    
    ${infoBox([
      { label: 'Organisation', value: data.mairieNom || '—' },
      { label: 'Email', value: data.mairieEmail || '—' },
      { label: 'Date de la demande', value: new Date().toLocaleString('fr-FR') },
    ])}
    
    ${notice('Conformément au RGPD (Article 17), nous disposons de 30 jours pour traiter cette demande. Merci de contacter le demandeur dans les 72 heures.', 'warning')}
    
    ${button('Accéder au back-office', `${APP_URL}/admin/rgpd`)}
  `

  return {
    subject: `[RGPD] Demande de suppression — ${data.mairieNom || ''}`,
    html: emailWrapper({
      preview: `Demande de suppression RGPD à traiter`,
      headerType: 'danger',
      headerTitle: 'Demande RGPD',
      headerSubtitle: 'Action requise sous 72 heures',
      body,
    })
  }
}

// ═════════════════════════════════════════════════════════════
// REGISTRY — Tous les templates en un seul endroit
// ═════════════════════════════════════════════════════════════

export const EMAIL_TEMPLATES = {
  // Comptes
  bienvenue: tplBienvenue,
  bienvenue_mairie: tplBienvenueMairie,
  mairie_validee: tplMairieValidee,
  mairie_refusee: tplMairieRefusee,
  bienvenue_placier: tplBienvenuePlacier,
  // Candidatures
  candidature_envoyee: tplCandidatureEnvoyee,
  candidature_validee: tplCandidatureValidee,
  candidature_refusee: tplCandidatureRefusee,
  nouvelle_candidature: tplNouvelleCandidature,
  // Paiements
  paiement_confirme: tplPaiementConfirme,
  paiement_echec: tplPaiementEchec,
  paiement_recu_mairie: tplPaiementRecuMairie,
  rappel_marche_j3: tplRappelMarcheJ3,
  // Équipe
  invitation_placier: tplInvitationPlacier,
  invitation_team: tplInvitationTeam,
  team_role_change: tplTeamRoleChange,
  team_removed: tplTeamRemoved,
  // Pro
  bienvenue_pro: tplBienvenuePro,
  facture_pro_mensuelle: tplFactureProMensuelle,
  // RGPD & Sécurité
  reset_password: tplResetPassword,
  rgpd_deletion_request: tplRgpdDeletionRequest,
} as const

export type EmailType = keyof typeof EMAIL_TEMPLATES
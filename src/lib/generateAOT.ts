// src/lib/generateAOT.ts
import QRCode from 'qrcode'

export type AOTData = {
  candidatureId: string
  exposantNom: string
  exposantSiren?: string
  exposantBusinessName?: string
  exposantProduits?: string
  exposantAdresse?: string
  eventTitle: string
  eventDate: string
  eventLocation: string
  caseNumber?: string | null
  mairieNom: string
  departementNom?: string
  paidAt: string
}

async function generateQRDataUrl(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      width: 300,
      margin: 1,
      color: { dark: '#0F172A', light: '#FFFFFF' }
    })
  } catch {
    return ''
  }
}

export async function generateAOTHTML(data: AOTData): Promise<string> {
  const now = new Date()
  const dateGeneration = now.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  const heureGeneration = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  const numActe = `AOT-${now.getFullYear()}-${data.candidatureId.slice(0, 8).toUpperCase()}`
  const verifUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://pulse-market.fr'}/verif/${data.candidatureId}`
  const qrDataUrl = await generateQRDataUrl(verifUrl)

  const mairieNomClean = data.mairieNom?.replace(/^Mairie d['e]\s*/i, '').replace(/^Mairie\s+/i, '') || 'Aubagne'
  const dept = data.departementNom || 'Bouches-du-Rhône'

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Arrêté municipal AOT ${numActe}</title>
<style>
@page { size: A4; margin: 14mm; }
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif; color: #0F172A; background: #F8FAFC; padding: 0; font-size: 11px; line-height: 1.55; }
.page { max-width: 800px; margin: 0 auto; background: white; padding: 32px 44px 28px; min-height: 100vh; position: relative; }

/* === HEADER === */
.header { display: grid; grid-template-columns: 1fr auto; gap: 24px; align-items: flex-start; padding-bottom: 18px; border-bottom: 1px solid #1E293B; }
.header-left { display: flex; gap: 16px; align-items: flex-start; }
.blason {
  width: 56px; height: 56px; border: 1.5px solid #1E293B; border-radius: 6px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  background: #F8FAFC; position: relative; overflow: hidden;
}
.blason::before {
  content: ''; position: absolute; inset: 4px;
  border: 1px solid #94A3B8; border-radius: 3px;
}
.blason-text { font-size: 8px; font-weight: 700; color: #64748B; letter-spacing: 0.04em; text-align: center; line-height: 1.2; z-index: 1; }
.header-titles { padding-top: 2px; }
.republique { font-size: 13px; font-weight: 700; color: #0F172A; letter-spacing: 0.02em; margin-bottom: 3px; text-transform: uppercase; }
.departement { font-size: 10px; color: #475569; margin-bottom: 2px; font-style: italic; }
.commune { font-size: 15px; font-weight: 700; color: #0F172A; margin-top: 4px; letter-spacing: -0.01em; }

.header-right { text-align: right; }
.qr-wrap { padding: 6px; background: white; border: 1px solid #CBD5E1; border-radius: 6px; display: inline-block; }
.qr-wrap img { display: block; width: 78px; height: 78px; }
.qr-caption { font-size: 8px; color: #64748B; margin-top: 5px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; }
.uuid { font-family: 'SF Mono', Menlo, monospace; font-size: 8px; color: #94A3B8; margin-top: 2px; }

/* === TITRE OFFICIEL === */
.title-block { text-align: center; margin: 22px 0 18px; }
.title-main {
  font-size: 14px; font-weight: 700; color: #0F172A; line-height: 1.4;
  letter-spacing: 0.02em; text-transform: uppercase; padding: 0 20px;
}
.title-sub {
  display: inline-block; margin-top: 10px; padding: 4px 14px;
  border: 1px solid #1E293B; border-radius: 3px;
  font-family: 'SF Mono', Menlo, monospace; font-size: 10px; font-weight: 600;
  color: #0F172A; letter-spacing: 0.04em;
}

/* === VISAS === */
.visas {
  background: #F8FAFC; border-left: 3px solid #1E293B;
  padding: 14px 18px; margin-bottom: 18px;
}
.visas-label {
  font-size: 9px; font-weight: 700; color: #475569;
  text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px;
}
.visa-item {
  font-size: 10.5px; color: #1E293B; margin-bottom: 6px;
  line-height: 1.65; text-align: justify;
}
.visa-item:last-child { margin-bottom: 0; }
.visa-item strong { font-weight: 700; color: #0F172A; }

/* === DÉCRÈTE === */
.decrete-banner {
  text-align: center; padding: 8px 0; margin-bottom: 16px;
  border-top: 1px solid #CBD5E1; border-bottom: 1px solid #CBD5E1;
  font-size: 13px; font-weight: 700; letter-spacing: 0.24em; color: #0F172A;
}

/* === ARTICLES === */
.article { margin-bottom: 14px; }
.article-header {
  display: flex; align-items: baseline; gap: 8px; margin-bottom: 4px;
}
.article-num {
  font-size: 11px; font-weight: 700; color: #0F172A;
  text-transform: uppercase; letter-spacing: 0.06em;
  flex-shrink: 0;
}
.article-title {
  font-size: 11px; font-weight: 600; color: #475569;
  text-transform: uppercase; letter-spacing: 0.04em; font-style: italic;
}
.article-body {
  font-size: 10.5px; color: #1E293B; line-height: 1.7; text-align: justify;
  padding-left: 0;
}
.article-body strong { color: #0F172A; font-weight: 600; }

/* === BÉNÉFICIAIRE BOX === */
.benef-box {
  background: #F8FAFC; border: 1px solid #E2E8F0;
  border-radius: 6px; padding: 12px 16px; margin-top: 8px;
  display: grid; grid-template-columns: 1fr 1fr; gap: 12px 24px;
}
.benef-field { }
.benef-label {
  font-size: 8px; font-weight: 700; color: #64748B;
  text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 3px;
}
.benef-value { font-size: 11px; color: #0F172A; font-weight: 500; }

/* === EMPLACEMENT === */
.location-box {
  background: #0F172A; color: white; border-radius: 6px;
  padding: 14px 18px; margin: 10px 0;
  display: grid; grid-template-columns: 1fr auto; gap: 16px; align-items: center;
}
.loc-label { font-size: 9px; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px; }
.loc-value { font-size: 12px; font-weight: 600; color: white; }
.loc-case { text-align: center; }
.loc-case-num { font-size: 28px; font-weight: 800; color: white; line-height: 1; letter-spacing: -0.02em; }
.loc-case-label { font-size: 8px; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.1em; margin-top: 4px; }

/* === SIGNATURE === */
.signature {
  margin-top: 22px; display: grid; grid-template-columns: 1fr 1fr; gap: 32px;
  padding-top: 16px; border-top: 1px dashed #CBD5E1;
}
.sig-block { }
.sig-label { font-size: 9px; color: #475569; font-style: italic; margin-bottom: 36px; }
.sig-line {
  border-top: 1px solid #1E293B; padding-top: 4px;
  font-size: 10px; font-weight: 600; color: #0F172A;
}
.sig-sub { font-size: 9px; color: #64748B; margin-top: 2px; }

/* === FOOTER === */
.footer {
  margin-top: 22px; padding-top: 12px;
  border-top: 1px solid #1E293B;
}
.footer-legal {
  font-size: 8.5px; color: #475569; font-style: italic;
  line-height: 1.6; text-align: justify; margin-bottom: 8px;
}
.footer-meta {
  display: flex; justify-content: space-between; align-items: center;
  font-size: 8px; color: #94A3B8; font-family: 'SF Mono', Menlo, monospace;
  padding-top: 6px; border-top: 0.5px solid #E2E8F0;
}
.brand {
  display: inline-flex; align-items: center; gap: 4px;
  font-family: 'Inter', sans-serif; font-weight: 600; color: #475569;
}
.brand-dot { width: 5px; height: 5px; background: #4F46E5; border-radius: 50%; }

/* === PRINT === */
@media print {
  body { background: white; padding: 0; }
  .page { box-shadow: none; padding: 0; }
  .no-print { display: none !important; }
}

/* === BOUTONS === */
.actions {
  position: sticky; bottom: 0; background: white;
  border-top: 1px solid #E2E8F0; padding: 14px;
  display: flex; gap: 10px; justify-content: center;
  box-shadow: 0 -4px 12px rgba(0,0,0,0.05);
}
.btn {
  border: none; border-radius: 8px; padding: 10px 22px;
  font-size: 13px; font-weight: 600; cursor: pointer;
  font-family: inherit; transition: all 0.15s;
}
.btn-primary { background: #0F172A; color: white; }
.btn-primary:hover { background: #1E293B; }
.btn-ghost { background: #F1F5F9; color: #475569; border: 1px solid #E2E8F0; }
</style>
</head>
<body>
<div class="page">

  <!-- ======= HEADER ======= -->
  <div class="header">
    <div class="header-left">
      <div class="blason">
        <span class="blason-text">BLASON<br/>COMMUNE</span>
      </div>
      <div class="header-titles">
        <div class="republique">République Française</div>
        <div class="departement">Département des ${dept}</div>
        <div class="commune">Commune ${mairieNomClean.startsWith('d') || mairieNomClean.startsWith('D') ? '' : 'de '}${mairieNomClean}</div>
      </div>
    </div>
    <div class="header-right">
      <div class="qr-wrap">
        ${qrDataUrl ? `<img src="${qrDataUrl}" alt="QR code de vérification" />` : '<div style="width:78px;height:78px;background:#F1F5F9;"></div>'}
      </div>
      <div class="qr-caption">Contrôle placier</div>
      <div class="uuid">${data.candidatureId.slice(0, 13).toUpperCase()}</div>
    </div>
  </div>

  <!-- ======= TITRE ======= -->
  <div class="title-block">
    <div class="title-main">
      Arrêté municipal portant autorisation<br/>
      d'occupation temporaire (AOT) du domaine public
    </div>
    <div class="title-sub">N° ACTE : ${numActe}</div>
  </div>

  <!-- ======= VISAS ======= -->
  <div class="visas">
    <div class="visas-label">Le Maire de la Commune de ${mairieNomClean},</div>
    <div class="visa-item"><strong>VU</strong> le Code Général de la Propriété des Personnes Publiques, notamment ses articles L. 2122-1 et suivants ;</div>
    <div class="visa-item"><strong>VU</strong> le Code Général des Collectivités Territoriales, notamment l'article L. 2212-2 relatif aux pouvoirs de police du Maire ;</div>
    <div class="visa-item"><strong>VU</strong> le Règlement Intérieur des Marchés Municipaux de la Commune en vigueur ;</div>
    <div class="visa-item"><strong>VU</strong> la demande d'emplacement effectuée par le commerçant ambulant et le paiement des droits de place validé le <strong>${data.paidAt || 'date du paiement'}</strong> via la plateforme PulseMarket ;</div>
  </div>

  <!-- ======= DÉCRÈTE ======= -->
  <div class="decrete-banner">A R R Ê T E</div>

  <!-- ======= ARTICLE 1 ======= -->
  <div class="article">
    <div class="article-header">
      <span class="article-num">Article 1<sup>er</sup> —</span>
      <span class="article-title">Objet de l'autorisation</span>
    </div>
    <div class="article-body">
      Le Maire de la Commune de <strong>${mairieNomClean}</strong> autorise la personne physique ou morale désignée ci-après à occuper temporairement un emplacement sur le domaine public communal :
    </div>
    <div class="benef-box">
      <div class="benef-field">
        <div class="benef-label">Bénéficiaire</div>
        <div class="benef-value">${data.exposantBusinessName || data.exposantNom}</div>
      </div>
      <div class="benef-field">
        <div class="benef-label">Représentant légal</div>
        <div class="benef-value">${data.exposantNom}</div>
      </div>
      <div class="benef-field">
        <div class="benef-label">Immatriculation (SIREN)</div>
        <div class="benef-value">${data.exposantSiren || 'Non renseigné'}</div>
      </div>
      <div class="benef-field">
        <div class="benef-label">Activité déclarée</div>
        <div class="benef-value">${data.exposantProduits || 'Commerce ambulant'}</div>
      </div>
    </div>
  </div>

  <!-- ======= ARTICLE 2 ======= -->
  <div class="article">
    <div class="article-header">
      <span class="article-num">Article 2 —</span>
      <span class="article-title">Caractéristiques de l'occupation</span>
    </div>
    <div class="article-body">
      L'autorisation est délivrée selon les conditions suivantes :
    </div>
    <div class="location-box">
      <div>
        <div class="loc-label">Destination</div>
        <div class="loc-value">${data.eventTitle}</div>
        <div class="loc-label" style="margin-top: 10px;">Date de validité</div>
        <div class="loc-value">${data.eventDate}</div>
        <div class="loc-label" style="margin-top: 10px;">Lieu d'implantation</div>
        <div class="loc-value">${data.eventLocation}</div>
      </div>
      ${data.caseNumber ? `
      <div class="loc-case">
        <div class="loc-case-num">${data.caseNumber}</div>
        <div class="loc-case-label">Emplacement</div>
      </div>
      ` : ''}
    </div>
  </div>

  <!-- ======= ARTICLE 3 ======= -->
  <div class="article">
    <div class="article-header">
      <span class="article-num">Article 3 —</span>
      <span class="article-title">Conditions d'exécution</span>
    </div>
    <div class="article-body">
      La présente autorisation est délivrée à titre <strong>personnel, précaire et révocable</strong>. Elle est strictement incessible. Le bénéficiaire s'engage à respecter le règlement intérieur du marché, les règles de salubrité et de sécurité publique, ainsi que les consignes du placier municipal. Tout manquement entraînera la révocation immédiate de la présente autorisation.
    </div>
  </div>

  <!-- ======= ARTICLE 4 ======= -->
  <div class="article">
    <div class="article-header">
      <span class="article-num">Article 4 —</span>
      <span class="article-title">Caractère exécutoire</span>
    </div>
    <div class="article-body">
      Le présent arrêté sera notifié au pétitionnaire et transmis au placier municipal, ainsi qu'à la brigade des marchés, pour exécution lors du contrôle d'accès par scan du QR code figurant en en-tête.
    </div>
  </div>

  <!-- ======= SIGNATURE ======= -->
  <div class="signature">
    <div class="sig-block">
      <div class="sig-label">Fait à ${mairieNomClean}, le ${dateGeneration}</div>
      <div class="sig-line">Pour le Maire et par délégation</div>
      <div class="sig-sub">Le Responsable du Service des Marchés</div>
    </div>
    <div class="sig-block">
      <div class="sig-label">Signature électronique horodatée</div>
      <div class="sig-line">PulseMarket — Plateforme certifiée</div>
      <div class="sig-sub">${dateGeneration} à ${heureGeneration}</div>
    </div>
  </div>

  <!-- ======= FOOTER ======= -->
  <div class="footer">
    <div class="footer-legal">
      Certifié exécutoire compte tenu de sa télétransmission et de sa publication sur la plateforme certifiée PulseMarket. Le présent acte administratif est susceptible de recours pour excès de pouvoir devant le Tribunal Administratif compétent dans un délai de deux mois à compter de sa notification ou publication.
    </div>
    <div class="footer-meta">
      <span>${numActe} · Réf. ${data.candidatureId.slice(0, 13).toUpperCase()}</span>
      <span class="brand"><span class="brand-dot"></span>PulseMarket · pulse-market.fr</span>
    </div>
  </div>

</div>

<!-- BOUTONS (n'apparaissent pas à l'impression) -->
<div class="actions no-print">
  <button class="btn btn-primary" onclick="window.print()">Imprimer / Enregistrer en PDF</button>
  <button class="btn btn-ghost" onclick="window.close()">Fermer</button>
</div>

</body>
</html>`
}

export async function openAOT(data: AOTData) {
  const html = await generateAOTHTML(data)
  const win = window.open('', '_blank')
  if (win) {
    win.document.write(html)
    win.document.close()
  }
}

// Compatibilité avec l'ancien nom de fonction
export const downloadAOT = openAOT
'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, Euro } from 'lucide-react'

const BRAND = '#4F46E5'

export default function CGV() {
  const router = useRouter()

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: 'system-ui, sans-serif', color: '#0F172A' }}>

      <header style={{ background: 'white', borderBottom: '1px solid #E2E8F0', padding: '14px 24px', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ cursor: 'pointer' }} onClick={() => router.push('/')}>
            <img src="/logo-pulsemarket.svg" alt="PulseMarket" style={{ height: 36, width: 'auto' }} />
          </div>
          <button onClick={() => router.push('/')} style={{ background: 'transparent', border: 'none', color: '#64748B', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <ArrowLeft size={13} /> Retour à l'accueil
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 820, margin: '0 auto', padding: '48px 24px 80px' }}>

        <div style={{ marginBottom: 40 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#EEF2FF', color: BRAND, padding: '5px 14px', borderRadius: 100, fontSize: 12, fontWeight: 600, border: '1px solid #C7D2FE', marginBottom: 16 }}>
            <Euro size={11} /> Conditions de vente
          </span>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 12 }}>
            Conditions Générales de Vente
          </h1>
          <p style={{ fontSize: 14, color: '#64748B' }}>
            Dernière mise à jour : 19 juin 2026
          </p>
        </div>

        <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 14, padding: 28 }}>

          <SectionTitle n={1} title="Préambule" />
          <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, marginBottom: 24 }}>
            Les présentes Conditions Générales de Vente (« CGV ») régissent les relations contractuelles entre <strong style={{ color: '#0F172A' }}>PulseMarket SAS</strong>, société par actions simplifiée au capital de 100 €, immatriculée au RCS de Draguignan sous le numéro 105 506 554, dont le siège social est situé 661 Carreirade des Adrets, 83640 Plan-d'Aups-Sainte-Baume (ci-après « PulseMarket »), et toute personne physique ou morale souscrivant à une offre payante de la Plateforme PulseMarket (ci-après le « Client »).
            <br /><br />
            Toute souscription à une offre payante implique l'acceptation pleine et entière des présentes CGV.
          </p>

          <SectionTitle n={2} title="Offres et services" />
          <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, marginBottom: 12 }}>
            PulseMarket propose les offres payantes suivantes :
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>Offre Exposant Pro</p>
              <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6 }}>
                Abonnement mensuel à <strong style={{ color: BRAND }}>20 € TTC/mois</strong>. Sans engagement de durée. Comprend des candidatures illimitées, le badge "Dossier Vérifié", les alertes géolocalisées, l'accès aux marchés exclusifs et une visibilité prioritaire sur WhatMarket.
              </p>
            </div>
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>Offre Administration</p>
              <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6 }}>
                Tarif <strong style={{ color: BRAND }}>sur devis</strong>, adapté à la taille de la commune ou structure et au nombre de marchés gérés. Les conditions financières détaillées (montant, échéancier, options) sont précisées dans le devis et le contrat de prestation signés entre PulseMarket et le Client. Sans engagement de durée minimum.
              </p>
            </div>
          </div>

          <SectionTitle n={3} title="Prix" />
          <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, marginBottom: 24 }}>
            Les prix indiqués sont en euros (€) et sont précisés Toutes Taxes Comprises (TTC) ou Hors Taxes (HT) selon le contexte. La TVA française au taux en vigueur (20 % au 19 juin 2026) s'applique selon la réglementation.
            <br /><br />
            PulseMarket se réserve le droit de modifier ses tarifs à tout moment. Les nouveaux tarifs s'appliqueront aux nouvelles souscriptions et seront notifiés aux Clients existants au moins 30 jours avant leur application, ces derniers ayant la possibilité de résilier leur abonnement sans frais en cas de désaccord.
          </p>

          <SectionTitle n={4} title="Commande et facturation" />
          <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, marginBottom: 24 }}>
            <strong style={{ color: '#0F172A' }}>Pour l'offre Exposant Pro :</strong> la souscription s'effectue en ligne via la Plateforme. L'abonnement est facturé mensuellement et reconduit tacitement chaque mois jusqu'à résiliation.
            <br /><br />
            <strong style={{ color: '#0F172A' }}>Pour l'offre Administration :</strong> un devis personnalisé est établi par PulseMarket après échange avec le Client. La signature du devis vaut commande. Un contrat de prestation détaillé est ensuite signé entre les parties.
            <br /><br />
            Une facture est émise pour chaque paiement et envoyée au Client par email. Les factures sont conservées 10 ans conformément à l'article L. 123-22 du Code de commerce.
          </p>

          <SectionTitle n={5} title="Modalités de paiement" />
          <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, marginBottom: 24 }}>
            Les paiements sont effectués par carte bancaire via notre prestataire <strong style={{ color: '#0F172A' }}>Stripe</strong> (conformité PCI-DSS niveau 1), ou par virement bancaire SEPA pour l'offre Administration.
            <br /><br />
            <strong style={{ color: '#0F172A' }}>Délai de paiement (offre Administration) :</strong> 30 jours à compter de la date de facturation, sauf accord particulier. Conformément à l'article L. 441-10 du Code de commerce, tout retard de paiement entraîne l'application de pénalités de retard égales à 3 fois le taux d'intérêt légal, ainsi qu'une indemnité forfaitaire pour frais de recouvrement de 40 €.
            <br /><br />
            En cas de défaut de paiement, PulseMarket se réserve le droit de suspendre l'accès au service après mise en demeure restée infructueuse.
          </p>

          <SectionTitle n={6} title="Durée et résiliation" />
          <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, marginBottom: 24 }}>
            <strong style={{ color: '#0F172A' }}>Offre Exposant Pro :</strong> abonnement mensuel sans engagement, résiliable à tout moment depuis l'espace personnel du Client. La résiliation prend effet à la fin de la période en cours déjà facturée.
            <br /><br />
            <strong style={{ color: '#0F172A' }}>Offre Administration :</strong> contrat sans engagement de durée minimum. Résiliation par lettre recommandée avec accusé de réception ou par email à <a href="mailto:contact@pulse-market.fr" style={{ color: BRAND, textDecoration: 'none' }}>contact@pulse-market.fr</a>, avec un préavis de 30 jours.
            <br /><br />
            Pendant 90 jours après la résiliation, le Client conserve l'accès à ses données pour les exporter au format CSV. Au-delà, les données seront supprimées, sauf obligation légale de conservation.
          </p>

          <SectionTitle n={7} title="Droit de rétractation" />
          <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, marginBottom: 24 }}>
            Conformément à l'article L. 221-28 du Code de la consommation, le droit de rétractation ne s'applique pas aux services pleinement exécutés avant la fin du délai de rétractation et dont l'exécution a commencé après accord préalable exprès du consommateur.
            <br /><br />
            Pour les Clients ayant la qualité de consommateur, un droit de rétractation de 14 jours s'applique à compter de la souscription, à condition que le service n'ait pas été utilisé pendant cette période.
            <br /><br />
            Pour les Clients professionnels (Exposants, Organisateurs publics), le droit de rétractation ne s'applique pas.
          </p>

          <SectionTitle n={8} title="Niveau de service (SLA)" />
          <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, marginBottom: 12 }}>
            PulseMarket s'engage sur les niveaux de service suivants :
          </p>
          <ul style={{ fontSize: 14, color: '#475569', lineHeight: 1.8, marginBottom: 24, paddingLeft: 20 }}>
            <li><strong style={{ color: '#0F172A' }}>Disponibilité :</strong> 99,5 % par mois (hors maintenance planifiée).</li>
            <li><strong style={{ color: '#0F172A' }}>Support standard :</strong> réponse sous 24h ouvrées par email.</li>
            <li><strong style={{ color: '#0F172A' }}>Sauvegarde des données :</strong> quotidienne avec rétention de 30 jours.</li>
            <li><strong style={{ color: '#0F172A' }}>Notification des incidents :</strong> dans les 4 heures suivant leur détection.</li>
          </ul>
          <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, marginBottom: 24 }}>
            Une offre <strong style={{ color: '#0F172A' }}>SLA Premium</strong> (support prioritaire 7j/7, intervention sous 4h) est disponible en option pour les Clients Administration.
          </p>

          <SectionTitle n={9} title="Responsabilité et garanties" />
          <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, marginBottom: 24 }}>
            PulseMarket fournit le service en l'état et s'engage à mettre en œuvre tous les moyens nécessaires à son bon fonctionnement, dans le cadre d'une obligation de moyens.
            <br /><br />
            La responsabilité de PulseMarket, en cas de manquement avéré, est limitée aux dommages directs et plafonnée au montant total des sommes effectivement versées par le Client au cours des douze (12) mois précédant le fait générateur de la responsabilité.
            <br /><br />
            PulseMarket ne pourra être tenue responsable des dommages indirects, notamment perte d'exploitation, perte de chiffre d'affaires, perte d'image ou perte de données dans le cas où le Client n'a pas effectué les sauvegardes recommandées.
          </p>

          <SectionTitle n={10} title="Force majeure" />
          <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, marginBottom: 24 }}>
            Aucune des parties ne pourra être tenue responsable d'un manquement à ses obligations résultant d'un cas de force majeure tel que défini par l'article 1218 du Code civil, notamment : catastrophes naturelles, pandémies, conflits armés, défaillances majeures d'opérateurs télécoms ou d'hébergeurs, décisions administratives.
          </p>

          <SectionTitle n={11} title="Confidentialité" />
          <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, marginBottom: 24 }}>
            Chaque partie s'engage à préserver la confidentialité des informations communiquées par l'autre partie dans le cadre de l'exécution du contrat, et à ne pas les divulguer à des tiers sans autorisation préalable, sauf obligation légale.
            <br /><br />
            Cette obligation de confidentialité reste applicable pendant toute la durée du contrat et pour une période de 3 ans après sa cessation.
          </p>

          <SectionTitle n={12} title="Protection des données personnelles" />
          <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, marginBottom: 24 }}>
            Les modalités de collecte et de traitement des données personnelles sont détaillées dans notre <a href="/confidentialite" style={{ color: BRAND, textDecoration: 'none' }}>Politique de confidentialité</a>, conforme au RGPD. Un Accord de Traitement des Données (DPA) est fourni en annexe des contrats Administration.
          </p>

          <SectionTitle n={13} title="Droit applicable et juridiction compétente" />
          <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7 }}>
            Les présentes CGV sont régies par le droit français. En cas de litige, les parties s'efforceront de trouver une solution amiable. À défaut, les tribunaux français seront seuls compétents, étant précisé que pour les litiges avec des Organisateurs publics (mairies, collectivités), le tribunal administratif compétent sera saisi conformément aux règles de la juridiction administrative.
          </p>
        </div>

        <p style={{ fontSize: 12, color: '#94A3B8', textAlign: 'center', marginTop: 32 }}>
          En souscrivant à une offre payante, vous acceptez les présentes CGV.
        </p>

      </main>
    </div>
  )
}

function SectionTitle({ n, title }: { n: number; title: string }) {
  return (
    <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 10, marginTop: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ background: '#EEF2FF', color: BRAND, padding: '2px 9px', borderRadius: 6, fontSize: 12, fontWeight: 700 }}>{n}</span>
      {title}
    </h2>
  )
}
import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Conditions Générales de Vente — PulseMarket',
}

export default function CGV() {
  return (
    <div style={{ background: '#F8FAFC', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '80px 24px' }}>

        <div style={{ marginBottom: 48 }}>
          <Link href="/" style={{ fontSize: 13, color: '#4F46E5', textDecoration: 'none', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 32 }}>
            ← Retour à l'accueil
          </Link>
          <h1 style={{ fontSize: 32, fontWeight: 700, color: '#0F172A', letterSpacing: '-0.02em', marginBottom: 8 }}>Conditions Générales de Vente</h1>
          <p style={{ fontSize: 14, color: '#64748B' }}>Dernière mise à jour : janvier 2026</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>

          <Section title="1. Vendeur">
            <p><strong>PulseMarket</strong></p>
            <p>SIRET : [VOTRE NUMÉRO SIRET] — à compléter</p>
            <p>Adresse : [VOTRE ADRESSE] — à compléter</p>
            <p>Email : <a href="mailto:contact@pulse-market.fr" style={{ color: '#4F46E5' }}>contact@pulse-market.fr</a></p>
          </Section>

          <Section title="2. Services proposés">
            <p>PulseMarket propose les services suivants :</p>
            <br />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { service: 'Abonnement Exposant Gratuit', prix: '0€ / mois', desc: 'Accès limité à 1 candidature par mois' },
                { service: 'Abonnement Exposant Pro', prix: '20€ HT / mois', desc: 'Candidatures illimitées, alertes géolocalisées, badge vérifié' },
                { service: 'Abonnement Administration', prix: '150€ HT / mois', desc: 'Gestion complète des marchés, validation dossiers, collecte AOT' },
                { service: 'Frais de service par transaction', prix: '2€ HT', desc: 'Prélevés sur chaque redevance AOT collectée' },
                { service: 'Boost Whatmarket (exposant)', prix: '15€ HT', desc: 'Mise en avant sur le portail Whatmarket' },
                { service: 'Boost Marché (organisateur)', prix: '200€ HT', desc: 'Position 1 sur Whatmarket pendant 7 jours' },
              ].map((item, i) => (
                <div key={i} style={{ padding: '14px 16px', background: '#F8FAFC', borderRadius: 10, border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{item.service}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#4F46E5' }}>{item.prix}</span>
                  </div>
                  <span style={{ fontSize: 12, color: '#64748B' }}>{item.desc}</span>
                </div>
              ))}
            </div>
            <br />
            <p style={{ fontSize: 12, color: '#94A3B8' }}>* Tous les prix sont indiqués hors taxes (HT). TVA applicable selon la réglementation en vigueur.</p>
          </Section>

          <Section title="3. Commande et souscription">
            <p>La souscription à un abonnement payant s'effectue directement sur la plateforme PulseMarket. La commande est confirmée par email après validation du paiement.</p>
            <br />
            <p>L'abonnement prend effet immédiatement après confirmation du paiement et est renouvelé automatiquement chaque mois à la date d'anniversaire de la souscription.</p>
          </Section>

          <Section title="4. Paiement">
            <p>Les paiements sont traités par <strong>Stripe</strong> et acceptent les moyens suivants :</p>
            <br />
            <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <li>Carte bancaire (Visa, Mastercard, American Express)</li>
              <li>Virement bancaire (sur demande pour les abonnements Administration)</li>
            </ul>
            <br />
            <p>PulseMarket ne stocke aucune donnée bancaire. Toutes les transactions sont sécurisées par Stripe (certification PCI-DSS niveau 1).</p>
          </Section>

          <Section title="5. Droit de rétractation">
            <p>Conformément à l'article L221-18 du Code de la consommation, les consommateurs disposent d'un délai de <strong>14 jours</strong> à compter de la souscription pour exercer leur droit de rétractation.</p>
            <br />
            <p>Toutefois, en souscrivant à un abonnement et en commençant à utiliser le service immédiatement, vous reconnaissez que l'exécution du contrat commence avant l'expiration du délai de rétractation et renoncez expressément à votre droit de rétractation, conformément à l'article L221-28 du Code de la consommation.</p>
            <br />
            <p><strong>Exception :</strong> Pour les abonnements Administration n'ayant pas encore fait l'objet d'une utilisation, le droit de rétractation s'applique pleinement dans le délai de 14 jours.</p>
            <br />
            <p>Pour exercer votre droit de rétractation : <a href="mailto:contact@pulse-market.fr" style={{ color: '#4F46E5' }}>contact@pulse-market.fr</a></p>
          </Section>

          <Section title="6. Résiliation">
            <p>Vous pouvez résilier votre abonnement à tout moment depuis votre espace paramètres. La résiliation prend effet à la fin de la période d'abonnement en cours, sans remboursement du mois en cours.</p>
            <br />
            <p>PulseMarket se réserve le droit de résilier un abonnement sans remboursement en cas de violation des CGU.</p>
          </Section>

          <Section title="7. Remboursements">
            <p>Les remboursements sont accordés dans les cas suivants :</p>
            <br />
            <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <li>Double facturation due à une erreur technique</li>
              <li>Interruption du service supérieure à 48h consécutives imputable à PulseMarket</li>
              <li>Exercice du droit de rétractation dans les conditions définies à l'article 5</li>
            </ul>
            <br />
            <p>Les remboursements sont effectués dans un délai de 14 jours par le même moyen de paiement que celui utilisé lors de la transaction.</p>
          </Section>

          <Section title="8. Redevances AOT">
            <p>Les redevances AOT collectées via PulseMarket sont définies par l'organisateur et reversées intégralement à celui-ci, déduction faite des frais de service PulseMarket (2€ HT par transaction) et des frais de traitement Stripe.</p>
            <br />
            <p>PulseMarket agit en tant qu'intermédiaire de paiement et n'est pas responsable du montant des redevances fixées par les organisateurs.</p>
          </Section>

          <Section title="9. Disponibilité du service">
            <p>PulseMarket s'engage à maintenir la plateforme disponible 99% du temps, hors maintenances planifiées. Les maintenances sont annoncées 24h à l'avance par email.</p>
            <br />
            <p>En cas d'indisponibilité prolongée non planifiée, PulseMarket peut accorder un avoir sur l'abonnement du mois suivant.</p>
          </Section>

          <Section title="10. Droit applicable">
            <p>Les présentes CGV sont soumises au droit français. En cas de litige, les parties s'engagent à rechercher une solution amiable. À défaut, les tribunaux de [VOTRE VILLE] seront compétents.</p>
            <br />
            <p>Pour les litiges de consommation, vous pouvez recourir à la médiation via la plateforme européenne de règlement en ligne des litiges : <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" style={{ color: '#4F46E5' }}>ec.europa.eu/consumers/odr</a></p>
          </Section>

          <Section title="11. Contact">
            <p>Email : <a href="mailto:contact@pulse-market.fr" style={{ color: '#4F46E5' }}>contact@pulse-market.fr</a></p>
          </Section>

        </div>

        <div style={{ marginTop: 60, paddingTop: 32, borderTop: '1px solid #E2E8F0', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <Link href="/mentions-legales" style={{ fontSize: 13, color: '#4F46E5', textDecoration: 'none' }}>Mentions légales</Link>
          <Link href="/cgu" style={{ fontSize: 13, color: '#4F46E5', textDecoration: 'none' }}>CGU</Link>
          <Link href="/confidentialite" style={{ fontSize: 13, color: '#4F46E5', textDecoration: 'none' }}>Politique de confidentialité</Link>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #E2E8F0' }}>{title}</h2>
      <div style={{ fontSize: 14, color: '#475569', lineHeight: 1.8 }}>{children}</div>
    </div>
  )
}
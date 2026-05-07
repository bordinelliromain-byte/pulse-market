import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: "Conditions Générales d'Utilisation — PulseMarket",
}

export default function CGU() {
  return (
    <div style={{ background: '#F8FAFC', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '80px 24px' }}>

        <div style={{ marginBottom: 48 }}>
          <Link href="/" style={{ fontSize: 13, color: '#4F46E5', textDecoration: 'none', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 32 }}>
            ← Retour à l'accueil
          </Link>
          <h1 style={{ fontSize: 32, fontWeight: 700, color: '#0F172A', letterSpacing: '-0.02em', marginBottom: 8 }}>Conditions Générales d'Utilisation</h1>
          <p style={{ fontSize: 14, color: '#64748B' }}>Dernière mise à jour : janvier 2026</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>

          <Section title="1. Objet">
            <p>Les présentes Conditions Générales d'Utilisation (CGU) régissent l'utilisation de la plateforme PulseMarket, accessible à l'adresse <strong>pulse-market.fr</strong>.</p>
            <br />
            <p>PulseMarket est une plateforme SaaS permettant :</p>
            <br />
            <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <li>Aux <strong>organisateurs</strong> (mairies, comités des fêtes, associations) de gérer leurs marchés, valider les dossiers exposants et collecter les redevances AOT.</li>
              <li>Aux <strong>exposants</strong> (commerçants non-sédentaires) de candidater aux marchés, déposer leurs documents légaux et payer leurs redevances en ligne.</li>
            </ul>
          </Section>

          <Section title="2. Acceptation des CGU">
            <p>L'utilisation de la plateforme PulseMarket implique l'acceptation pleine et entière des présentes CGU. Si vous n'acceptez pas ces conditions, vous ne devez pas utiliser la plateforme.</p>
          </Section>

          <Section title="3. Inscription et compte utilisateur">
            <p>L'accès aux fonctionnalités de la plateforme nécessite la création d'un compte. L'utilisateur s'engage à :</p>
            <br />
            <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <li>Fournir des informations exactes et complètes lors de l'inscription</li>
              <li>Maintenir la confidentialité de ses identifiants de connexion</li>
              <li>Notifier PulseMarket immédiatement en cas d'utilisation non autorisée de son compte</li>
              <li>Ne pas créer de compte au nom d'une tierce personne sans autorisation</li>
            </ul>
            <br />
            <p>PulseMarket se réserve le droit de suspendre ou supprimer tout compte en cas de violation des présentes CGU.</p>
          </Section>

          <Section title="4. Obligations des organisateurs">
            <p>Les organisateurs s'engagent à :</p>
            <br />
            <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <li>Publier des événements conformes à la réglementation en vigueur</li>
              <li>Traiter les candidatures dans un délai raisonnable</li>
              <li>Respecter les règles relatives aux Autorisations d'Occupation Temporaire (AOT)</li>
              <li>Ne pas discriminer les candidatures sur des critères illégaux</li>
              <li>Assurer la confidentialité des données des exposants conformément au RGPD</li>
            </ul>
          </Section>

          <Section title="5. Obligations des exposants">
            <p>Les exposants s'engagent à :</p>
            <br />
            <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <li>Fournir des documents légaux authentiques et à jour (Kbis, RC Pro)</li>
              <li>Ne pas falsifier ou altérer leurs documents</li>
              <li>Maintenir une assurance RC Pro valide</li>
              <li>Payer les redevances dues dans les délais impartis</li>
              <li>Se présenter aux événements pour lesquels ils ont été acceptés</li>
            </ul>
          </Section>

          <Section title="6. Vérification des documents">
            <p>PulseMarket utilise une technologie OCR (reconnaissance optique de caractères) et l'API SIRENE de l'INSEE pour vérifier automatiquement les documents déposés. Cette vérification est indicative et ne remplace pas le contrôle humain effectué par l'organisateur.</p>
            <br />
            <p>PulseMarket ne peut être tenu responsable en cas de documents frauduleux présentés par un exposant.</p>
          </Section>

          <Section title="7. Paiements">
            <p>Les paiements sont traités par <strong>Stripe</strong>, prestataire de paiement sécurisé. PulseMarket ne stocke aucune donnée bancaire sur ses serveurs.</p>
            <br />
            <p>Les redevances AOT sont définies par l'organisateur. PulseMarket perçoit des frais de service de <strong>2€ HT par transaction</strong>.</p>
            <br />
            <p>En cas de refus de candidature, aucun paiement n'est prélevé. En cas d'annulation après paiement, les conditions de remboursement sont définies par l'organisateur.</p>
          </Section>

          <Section title="8. Données personnelles">
            <p>PulseMarket traite vos données personnelles conformément au Règlement Général sur la Protection des Données (RGPD). Consultez notre <Link href="/confidentialite" style={{ color: '#4F46E5' }}>Politique de confidentialité</Link> pour plus d'informations.</p>
          </Section>

          <Section title="9. Propriété intellectuelle">
            <p>La plateforme PulseMarket, son code source, ses interfaces, ses bases de données et son contenu sont la propriété exclusive de PulseMarket. Toute reproduction ou utilisation non autorisée est interdite.</p>
            <br />
            <p>Les utilisateurs conservent la propriété des contenus qu'ils publient (descriptions, photos) et accordent à PulseMarket une licence d'utilisation limitée à la fourniture du service.</p>
          </Section>

          <Section title="10. Limitation de responsabilité">
            <p>PulseMarket est une plateforme de mise en relation et d'automatisation. PulseMarket ne peut être tenu responsable :</p>
            <br />
            <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <li>Des décisions prises par les organisateurs concernant les candidatures</li>
              <li>Des litiges entre organisateurs et exposants</li>
              <li>Des interruptions de service indépendantes de sa volonté</li>
              <li>Des dommages indirects résultant de l'utilisation de la plateforme</li>
            </ul>
          </Section>

          <Section title="11. Suspension et résiliation">
            <p>PulseMarket se réserve le droit de suspendre ou résilier l'accès à la plateforme en cas de :</p>
            <br />
            <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <li>Violation des présentes CGU</li>
              <li>Fourniture de documents falsifiés</li>
              <li>Comportement frauduleux avéré</li>
              <li>Non-paiement des sommes dues</li>
            </ul>
          </Section>

          <Section title="12. Modification des CGU">
            <p>PulseMarket se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront notifiés par email des modifications substantielles. L'utilisation continue de la plateforme après notification vaut acceptation des nouvelles CGU.</p>
          </Section>

          <Section title="13. Droit applicable et juridiction">
            <p>Les présentes CGU sont soumises au droit français. En cas de litige, les parties s'engagent à rechercher une solution amiable avant tout recours judiciaire. À défaut, les tribunaux de [VOTRE VILLE] seront seuls compétents.</p>
          </Section>

          <Section title="14. Contact">
            <p>Pour toute question relative aux présentes CGU :</p>
            <br />
            <p>Email : <a href="mailto:contact@pulse-market.fr" style={{ color: '#4F46E5' }}>contact@pulse-market.fr</a></p>
          </Section>

        </div>

        <div style={{ marginTop: 60, paddingTop: 32, borderTop: '1px solid #E2E8F0', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <Link href="/mentions-legales" style={{ fontSize: 13, color: '#4F46E5', textDecoration: 'none' }}>Mentions légales</Link>
          <Link href="/confidentialite" style={{ fontSize: 13, color: '#4F46E5', textDecoration: 'none' }}>Politique de confidentialité</Link>
          <Link href="/cgv" style={{ fontSize: 13, color: '#4F46E5', textDecoration: 'none' }}>CGV</Link>
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
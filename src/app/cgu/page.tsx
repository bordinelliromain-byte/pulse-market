'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, FileText, Shield } from 'lucide-react'

const BRAND = '#4F46E5'

export default function CGU() {
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
            <FileText size={11} /> Conditions générales
          </span>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 12 }}>
            Conditions Générales d'Utilisation
          </h1>
          <p style={{ fontSize: 14, color: '#64748B' }}>
            Dernière mise à jour : 19 juin 2026
          </p>
        </div>

        <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 14, padding: 28 }}>

          <SectionTitle n={1} title="Objet" />
          <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, marginBottom: 24 }}>
            Les présentes Conditions Générales d'Utilisation (« CGU ») ont pour objet de définir les conditions dans lesquelles les utilisateurs accèdent et utilisent la plateforme PulseMarket, éditée par <strong style={{ color: '#0F172A' }}>PulseMarket SAS</strong>, société par actions simplifiée au capital de 100 €, immatriculée au RCS de Draguignan sous le numéro 105 506 554, dont le siège social est situé 661 Carreirade des Adrets, 83640 Plan-d'Aups-Sainte-Baume.
            <br /><br />
            L'utilisation de la plateforme implique l'acceptation pleine et entière des présentes CGU.
          </p>

          <SectionTitle n={2} title="Définitions" />
          <ul style={{ fontSize: 14, color: '#475569', lineHeight: 1.8, marginBottom: 24, paddingLeft: 20 }}>
            <li><strong style={{ color: '#0F172A' }}>« Plateforme »</strong> désigne le site web et les services PulseMarket accessibles à l'adresse pulse-market.fr.</li>
            <li><strong style={{ color: '#0F172A' }}>« Utilisateur »</strong> désigne toute personne physique ou morale utilisant la Plateforme.</li>
            <li><strong style={{ color: '#0F172A' }}>« Exposant »</strong> désigne un commerçant non-sédentaire utilisant la Plateforme pour candidater à des marchés.</li>
            <li><strong style={{ color: '#0F172A' }}>« Organisateur »</strong> désigne une mairie, association, comité ou structure organisant des marchés et utilisant la Plateforme.</li>
            <li><strong style={{ color: '#0F172A' }}>« AOT »</strong> désigne l'Autorisation d'Occupation Temporaire du domaine public.</li>
            <li><strong style={{ color: '#0F172A' }}>« Compte »</strong> désigne l'espace personnel créé par l'Utilisateur sur la Plateforme.</li>
          </ul>

          <SectionTitle n={3} title="Accès au service" />
          <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, marginBottom: 24 }}>
            La Plateforme est accessible 24h/24 et 7j/7, sauf en cas de force majeure ou d'intervention de maintenance. PulseMarket s'engage à mettre en œuvre les moyens nécessaires pour assurer un accès continu, sans pour autant garantir un fonctionnement sans interruption.
            <br /><br />
            L'accès à certaines fonctionnalités nécessite la création préalable d'un Compte utilisateur.
          </p>

          <SectionTitle n={4} title="Création de compte" />
          <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, marginBottom: 24 }}>
            L'Utilisateur s'engage à fournir des informations exactes, complètes et à jour lors de la création de son Compte. L'Utilisateur est seul responsable de la confidentialité de ses identifiants de connexion et de toute activité réalisée sur son Compte.
            <br /><br />
            En cas d'utilisation frauduleuse de son Compte, l'Utilisateur s'engage à informer PulseMarket sans délai à <a href="mailto:contact@pulse-market.fr" style={{ color: BRAND, textDecoration: 'none' }}>contact@pulse-market.fr</a>.
            <br /><br />
            Pour utiliser la Plateforme en tant qu'Exposant ou Organisateur, l'Utilisateur doit être majeur, disposer de la capacité juridique de contracter et exercer une activité professionnelle dûment déclarée.
          </p>

          <SectionTitle n={5} title="Services proposés" />
          <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, marginBottom: 12 }}>
            PulseMarket propose une plateforme SaaS permettant :
          </p>
          <ul style={{ fontSize: 14, color: '#475569', lineHeight: 1.8, marginBottom: 24, paddingLeft: 20 }}>
            <li>Aux Exposants : de candidater en ligne à des marchés, déposer leurs documents (Kbis, RC Pro), suivre leurs candidatures et payer les redevances.</li>
            <li>Aux Organisateurs : de gérer numériquement leurs marchés, valider les candidatures, générer les AOT au format arrêté municipal, encaisser les redevances et contrôler l'accès via QR code.</li>
          </ul>

          <SectionTitle n={6} title="Tarification" />
          <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, marginBottom: 24 }}>
            L'utilisation de la Plateforme est gratuite pour les Exposants dans la limite d'une candidature par mois. Une offre Exposant Pro est proposée à 20 € TTC par mois pour des candidatures illimitées et des fonctionnalités étendues.
            <br /><br />
            Les Organisateurs bénéficient d'un tarif sur devis adapté à la taille de leur structure et au nombre de marchés gérés. Les conditions financières détaillées sont précisées dans le contrat de prestation signé entre PulseMarket et chaque Organisateur.
            <br /><br />
            Les paiements sont sécurisés par notre prestataire Stripe (conformité PCI-DSS).
          </p>

          <SectionTitle n={7} title="Obligations de l'utilisateur" />
          <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, marginBottom: 12 }}>
            L'Utilisateur s'engage à :
          </p>
          <ul style={{ fontSize: 14, color: '#475569', lineHeight: 1.8, marginBottom: 24, paddingLeft: 20 }}>
            <li>Utiliser la Plateforme conformément à sa destination et aux présentes CGU</li>
            <li>Fournir des informations exactes et à jour</li>
            <li>Respecter les droits des autres utilisateurs et de PulseMarket</li>
            <li>Ne pas tenter d'accéder frauduleusement à la Plateforme</li>
            <li>Ne pas utiliser la Plateforme à des fins illégales ou frauduleuses</li>
            <li>Ne pas reproduire, copier ou exploiter commercialement la Plateforme</li>
            <li>Respecter la confidentialité des données des autres utilisateurs</li>
          </ul>

          <SectionTitle n={8} title="Responsabilité" />
          <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, marginBottom: 24 }}>
            PulseMarket fournit une obligation de moyens pour assurer le bon fonctionnement de la Plateforme. PulseMarket ne pourra être tenue responsable :
            <br /><br />
            • Des dysfonctionnements liés à l'environnement de l'Utilisateur (matériel, connexion internet, etc.)<br />
            • Des conséquences directes ou indirectes d'une utilisation non conforme aux CGU<br />
            • Des décisions prises par les Organisateurs concernant les candidatures des Exposants<br />
            • De la véracité des informations fournies par les Utilisateurs
            <br /><br />
            La responsabilité de PulseMarket, si elle devait être engagée, ne pourra excéder le montant des sommes versées par l'Utilisateur au cours des douze (12) mois précédant le fait générateur.
          </p>

          <SectionTitle n={9} title="Propriété intellectuelle" />
          <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, marginBottom: 24 }}>
            La Plateforme, ses composants (code source, design, interface, base de données) ainsi que les marques PulseMarket, WhatMarket et Rupture Agency sont la propriété exclusive de PulseMarket SAS et sont protégés par les lois relatives à la propriété intellectuelle.
            <br /><br />
            L'Utilisateur dispose d'un droit d'usage personnel, non exclusif et non transférable, limité à la durée d'utilisation du service. Toute reproduction, modification, diffusion ou exploitation, totale ou partielle, est strictement interdite sans autorisation préalable écrite.
            <br /><br />
            Les données saisies par l'Utilisateur (documents, candidatures, informations) demeurent sa propriété exclusive.
          </p>

          <SectionTitle n={10} title="Protection des données personnelles" />
          <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, marginBottom: 24 }}>
            Les modalités de collecte et de traitement des données personnelles sont détaillées dans notre <a href="/confidentialite" style={{ color: BRAND, textDecoration: 'none' }}>Politique de confidentialité</a>, conforme au RGPD et à la loi Informatique et Libertés.
          </p>

          <SectionTitle n={11} title="Suspension et résiliation" />
          <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, marginBottom: 24 }}>
            PulseMarket se réserve le droit de suspendre ou résilier un Compte, sans préavis ni indemnité, en cas de manquement grave aux présentes CGU, notamment en cas de fraude, d'usage non conforme ou de non-paiement.
            <br /><br />
            L'Utilisateur peut résilier son Compte à tout moment depuis son espace personnel ou en envoyant un email à <a href="mailto:contact@pulse-market.fr" style={{ color: BRAND, textDecoration: 'none' }}>contact@pulse-market.fr</a>. La résiliation entraîne la suppression du Compte après un délai de conservation des données de 90 jours pour permettre l'export.
          </p>

          <SectionTitle n={12} title="Modifications des CGU" />
          <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, marginBottom: 24 }}>
            PulseMarket se réserve le droit de modifier à tout moment les présentes CGU. Les modifications entreront en vigueur dès leur publication sur la Plateforme. En cas de modification substantielle, les Utilisateurs seront informés par email au moins 30 jours avant l'application.
          </p>

          <SectionTitle n={13} title="Droit applicable et juridiction compétente" />
          <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7 }}>
            Les présentes CGU sont régies par le droit français. En cas de litige, et après tentative de résolution amiable, les tribunaux français seront seuls compétents, étant précisé que pour les litiges avec des Organisateurs publics (mairies, collectivités), le tribunal administratif compétent sera saisi.
          </p>
        </div>

        <p style={{ fontSize: 12, color: '#94A3B8', textAlign: 'center', marginTop: 32 }}>
          En créant un compte ou en utilisant nos services, vous acceptez les présentes CGU.
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
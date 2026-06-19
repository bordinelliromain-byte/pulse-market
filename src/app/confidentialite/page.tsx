'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, Lock, Shield, Database, UserCheck, Cookie, FileText } from 'lucide-react'

const BRAND = '#4F46E5'

export default function Confidentialite() {
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
            <Lock size={11} /> Conformité RGPD
          </span>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 12 }}>
            Politique de confidentialité
          </h1>
          <p style={{ fontSize: 14, color: '#64748B' }}>
            Dernière mise à jour : 19 juin 2026
          </p>
        </div>

        {/* Bloc engagement */}
        <div style={{ background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', borderRadius: 14, padding: 28, marginBottom: 24, color: 'white' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <Shield size={20} />
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>Notre engagement</h2>
          </div>
          <p style={{ fontSize: 14, lineHeight: 1.7, opacity: 0.95 }}>
            PulseMarket SAS s'engage à protéger la vie privée et les données personnelles de ses utilisateurs. La présente politique décrit la manière dont nous collectons, utilisons et protégeons vos informations, conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi française "Informatique et Libertés".
          </p>
        </div>

        <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 14, padding: 28, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <UserCheck size={18} style={{ color: BRAND }} />
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A' }}>1. Responsable du traitement</h2>
          </div>
          <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7 }}>
            Le responsable du traitement des données collectées est :<br /><br />
            <strong style={{ color: '#0F172A' }}>PulseMarket SAS</strong><br />
            661 Carreirade des Adrets, 83640 Plan-d'Aups-Sainte-Baume<br />
            SIREN 105 506 554 — RCS Draguignan<br />
            Email : <a href="mailto:contact@pulse-market.fr" style={{ color: BRAND, textDecoration: 'none' }}>contact@pulse-market.fr</a>
          </p>
        </div>

        <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 14, padding: 28 }}>

          <SectionTitle n={2} title="Données collectées" />
          <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, marginBottom: 12 }}>
            Nous collectons les catégories de données suivantes :
          </p>
          <ul style={{ fontSize: 14, color: '#475569', lineHeight: 1.8, marginBottom: 24, paddingLeft: 20 }}>
            <li><strong style={{ color: '#0F172A' }}>Données d'identification :</strong> nom, prénom, adresse email, numéro de téléphone, fonction.</li>
            <li><strong style={{ color: '#0F172A' }}>Données professionnelles :</strong> raison sociale, SIREN, adresse, RC Pro, Kbis.</li>
            <li><strong style={{ color: '#0F172A' }}>Données de connexion :</strong> adresse IP, identifiants de session, navigateur.</li>
            <li><strong style={{ color: '#0F172A' }}>Données de paiement :</strong> traitées exclusivement par notre prestataire Stripe (PCI-DSS).</li>
            <li><strong style={{ color: '#0F172A' }}>Données d'utilisation :</strong> candidatures, validations, historique des marchés.</li>
          </ul>

          <SectionTitle n={3} title="Finalités du traitement" />
          <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, marginBottom: 12 }}>
            Vos données personnelles sont collectées et traitées pour les finalités suivantes :
          </p>
          <ul style={{ fontSize: 14, color: '#475569', lineHeight: 1.8, marginBottom: 24, paddingLeft: 20 }}>
            <li>Création et gestion de votre compte utilisateur</li>
            <li>Fourniture des services de la plateforme PulseMarket</li>
            <li>Vérification automatique des dossiers exposants (SIREN, documents)</li>
            <li>Génération des autorisations d'occupation temporaire (AOT)</li>
            <li>Traitement des paiements et facturation</li>
            <li>Communication relative à votre utilisation du service</li>
            <li>Respect de nos obligations légales et comptables</li>
            <li>Amélioration de nos services et statistiques anonymisées</li>
          </ul>

          <SectionTitle n={4} title="Bases légales" />
          <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, marginBottom: 24 }}>
            Le traitement de vos données repose sur les bases légales suivantes : <strong style={{ color: '#0F172A' }}>l'exécution du contrat</strong> qui nous lie pour la fourniture du service, <strong style={{ color: '#0F172A' }}>le consentement</strong> pour les communications optionnelles, <strong style={{ color: '#0F172A' }}>l'obligation légale</strong> pour la conservation des factures, et <strong style={{ color: '#0F172A' }}>l'intérêt légitime</strong> pour la sécurité et l'amélioration du service.
          </p>

          <SectionTitle n={5} title="Durée de conservation" />
          <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, marginBottom: 12 }}>
            Nous conservons vos données uniquement pendant la durée nécessaire aux finalités définies :
          </p>
          <ul style={{ fontSize: 14, color: '#475569', lineHeight: 1.8, marginBottom: 24, paddingLeft: 20 }}>
            <li><strong style={{ color: '#0F172A' }}>Compte utilisateur :</strong> pendant toute la durée d'utilisation du service.</li>
            <li><strong style={{ color: '#0F172A' }}>Après suppression du compte :</strong> 3 ans pour les données de prospection commerciale.</li>
            <li><strong style={{ color: '#0F172A' }}>Factures et données comptables :</strong> 10 ans (obligation légale art. L. 123-22 Code de commerce).</li>
            <li><strong style={{ color: '#0F172A' }}>Logs de connexion :</strong> 12 mois.</li>
            <li><strong style={{ color: '#0F172A' }}>Documents AOT :</strong> conservés selon les obligations propres à chaque organisateur.</li>
          </ul>

          <SectionTitle n={6} title="Hébergement et sous-traitants" />
          <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, marginBottom: 12 }}>
            Vos données sont hébergées au sein de l'Union européenne. Nous avons recours aux sous-traitants suivants, tous conformes au RGPD :
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 24 }}>
            {[
              { name: 'Vercel', purpose: 'Hébergement web', location: 'UE / USA (DPA signé)' },
              { name: 'Supabase', purpose: 'Base de données + fichiers', location: 'France / Irlande (UE)' },
              { name: 'Stripe', purpose: 'Paiements sécurisés', location: 'UE / USA (PCI-DSS)' },
              { name: 'Resend', purpose: 'Envoi d\'emails', location: 'UE' },
              { name: 'Google Cloud', purpose: 'OCR documents', location: 'UE (DPA signé)' },
              { name: 'INSEE Sirene', purpose: 'Vérification SIREN', location: 'France' },
            ].map((s, i) => (
              <div key={i} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 12 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 3 }}>{s.name}</p>
                <p style={{ fontSize: 11, color: '#64748B' }}>{s.purpose}</p>
                <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>{s.location}</p>
              </div>
            ))}
          </div>

          <SectionTitle n={7} title="Vos droits" />
          <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, marginBottom: 12 }}>
            Conformément au RGPD et à la loi "Informatique et Libertés", vous disposez des droits suivants sur vos données :
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, marginBottom: 18 }}>
            {[
              { title: 'Droit d\'accès', desc: 'Obtenir une copie de vos données' },
              { title: 'Droit de rectification', desc: 'Corriger les données inexactes' },
              { title: 'Droit à l\'effacement', desc: 'Demander la suppression de vos données' },
              { title: 'Droit d\'opposition', desc: 'Vous opposer au traitement' },
              { title: 'Droit à la portabilité', desc: 'Récupérer vos données au format CSV' },
              { title: 'Droit à la limitation', desc: 'Restreindre l\'usage de vos données' },
            ].map((r, i) => (
              <div key={i} style={{ background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 8, padding: 12 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: BRAND, marginBottom: 3 }}>{r.title}</p>
                <p style={{ fontSize: 11, color: '#4338CA' }}>{r.desc}</p>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, marginBottom: 24 }}>
            Pour exercer ces droits, contactez-nous à <a href="mailto:contact@pulse-market.fr" style={{ color: BRAND, textDecoration: 'none' }}>contact@pulse-market.fr</a>. Nous répondons sous 30 jours maximum. En cas de réponse insatisfaisante, vous pouvez introduire une réclamation auprès de la <strong style={{ color: '#0F172A' }}>CNIL</strong> (<a href="https://www.cnil.fr" style={{ color: BRAND, textDecoration: 'none' }}>cnil.fr</a>).
          </p>

          <SectionTitle n={8} title="Sécurité des données" />
          <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, marginBottom: 24 }}>
            Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données contre tout accès non autorisé, perte, altération ou divulgation : chiffrement TLS 1.3 en transit, chiffrement AES-256 au repos, authentification à deux facteurs (2FA), sauvegardes quotidiennes, contrôle d'accès strict, journalisation des accès, et audits de sécurité réguliers.
          </p>

          <SectionTitle n={9} title="Cookies" />
          <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, marginBottom: 12 }}>
            Le site utilise uniquement des cookies strictement nécessaires à son fonctionnement :
          </p>
          <ul style={{ fontSize: 14, color: '#475569', lineHeight: 1.8, marginBottom: 24, paddingLeft: 20 }}>
            <li><strong style={{ color: '#0F172A' }}>Cookies de session :</strong> authentification et maintien de votre connexion.</li>
            <li><strong style={{ color: '#0F172A' }}>Cookies de sécurité :</strong> protection contre les attaques CSRF.</li>
          </ul>
          <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, marginBottom: 24 }}>
            Nous n'utilisons <strong style={{ color: '#0F172A' }}>aucun cookie de traçage publicitaire</strong>, ni Google Analytics, ni Meta Pixel. Aucun consentement spécifique n'est requis pour les cookies strictement nécessaires (article 82 de la loi Informatique et Libertés).
          </p>

          <SectionTitle n={10} title="Transferts hors UE" />
          <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, marginBottom: 24 }}>
            Vos données sont stockées au sein de l'Union européenne. Certains de nos sous-traitants (Vercel, Stripe) peuvent procéder à des transferts vers les États-Unis, encadrés par des Clauses Contractuelles Types validées par la Commission européenne ou par le Data Privacy Framework.
          </p>

          <SectionTitle n={11} title="Mineurs" />
          <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, marginBottom: 24 }}>
            Le service PulseMarket est destiné à des professionnels et n'est pas accessible aux personnes de moins de 16 ans. Nous ne collectons pas sciemment de données personnelles concernant des mineurs.
          </p>

          <SectionTitle n={12} title="Modifications de la politique" />
          <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7 }}>
            Nous nous réservons le droit de modifier la présente politique à tout moment. En cas de modification substantielle, vous serez informé par email ou via une notification sur la plateforme.
          </p>
        </div>

        <p style={{ fontSize: 12, color: '#94A3B8', textAlign: 'center', marginTop: 32 }}>
          Pour toute question relative à la protection de vos données, contactez-nous à contact@pulse-market.fr
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
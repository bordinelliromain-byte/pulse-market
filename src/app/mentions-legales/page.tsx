'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, Mail, MapPin, Building2, Shield } from 'lucide-react'

const BRAND = '#4F46E5'

export default function MentionsLegales() {
  const router = useRouter()

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: 'system-ui, sans-serif', color: '#0F172A' }}>

      {/* Header */}
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

        {/* Titre */}
        <div style={{ marginBottom: 40 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#EEF2FF', color: BRAND, padding: '5px 14px', borderRadius: 100, fontSize: 12, fontWeight: 600, border: '1px solid #C7D2FE', marginBottom: 16 }}>
            <Shield size={11} /> Page légale
          </span>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 12 }}>
            Mentions légales
          </h1>
          <p style={{ fontSize: 14, color: '#64748B' }}>
            Dernière mise à jour : 19 juin 2026
          </p>
        </div>

        {/* Bloc identité */}
        <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 14, padding: 28, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <Building2 size={18} style={{ color: BRAND }} />
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A' }}>1. Éditeur du site</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            {[
              { label: 'Raison sociale', value: 'PulseMarket SAS' },
              { label: 'Nom commercial', value: 'Rupture Agency' },
              { label: 'Forme juridique', value: 'Société par actions simplifiée à associé unique (SASU)' },
              { label: 'Capital social', value: '100,00 €' },
              { label: 'SIREN', value: '105 506 554' },
              { label: 'RCS', value: 'Draguignan' },
              { label: 'EUID', value: 'FR8302.105506554' },
              { label: 'Date d\'immatriculation', value: '19 juin 2026' },
              { label: 'Code APE / NAF', value: '6201Z (Programmation informatique)' },
              { label: 'TVA intracommunautaire', value: 'FR83 105 506 554' },
            ].map((item, i) => (
              <div key={i}>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{item.label}</p>
                <p style={{ fontSize: 14, color: '#0F172A', fontWeight: 500 }}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bloc siège */}
        <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 14, padding: 28, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <MapPin size={18} style={{ color: BRAND }} />
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A' }}>2. Siège social</h2>
          </div>
          <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7 }}>
            661 Carreirade des Adrets<br />
            83640 Plan-d'Aups-Sainte-Baume<br />
            France
          </p>
        </div>

        {/* Bloc contact */}
        <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 14, padding: 28, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <Mail size={18} style={{ color: BRAND }} />
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A' }}>3. Contact</h2>
          </div>
          <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.8 }}>
            <strong style={{ color: '#0F172A' }}>Email :</strong> <a href="mailto:contact@pulse-market.fr" style={{ color: BRAND, textDecoration: 'none' }}>contact@pulse-market.fr</a><br />
            <strong style={{ color: '#0F172A' }}>Site web :</strong> <a href="https://pulse-market.fr" style={{ color: BRAND, textDecoration: 'none' }}>pulse-market.fr</a>
          </p>
        </div>

        {/* Sections juridiques */}
        <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 14, padding: 28 }}>
          <SectionTitle n={4} title="Direction de la publication" />
          <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, marginBottom: 24 }}>
            Le directeur de la publication est Monsieur Romain Villeprat, Président de PulseMarket SAS.
          </p>

          <SectionTitle n={5} title="Hébergement" />
          <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, marginBottom: 8 }}>
            Le site pulse-market.fr est hébergé par :
          </p>
          <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, marginBottom: 24, paddingLeft: 16, borderLeft: `2px solid ${BRAND}` }}>
            <strong style={{ color: '#0F172A' }}>Vercel Inc.</strong><br />
            440 N Barranca Ave #4133<br />
            Covina, CA 91723, États-Unis<br />
            <a href="https://vercel.com" style={{ color: BRAND, textDecoration: 'none' }}>vercel.com</a>
          </p>
          <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, marginBottom: 24 }}>
            Les bases de données et fichiers utilisateurs sont hébergés par <strong style={{ color: '#0F172A' }}>Supabase Inc.</strong>, avec des serveurs situés en Union européenne (France et Irlande), garantissant la conformité au Règlement Général sur la Protection des Données (RGPD).
          </p>

          <SectionTitle n={6} title="Propriété intellectuelle" />
          <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, marginBottom: 24 }}>
            L'ensemble du contenu du site pulse-market.fr (textes, graphismes, logos, icônes, images, vidéos, code source, design, etc.) est la propriété exclusive de PulseMarket SAS ou de ses partenaires, et est protégé par les lois françaises et internationales relatives à la propriété intellectuelle.
            <br /><br />
            Toute reproduction, représentation, modification, publication, transmission, dénaturation, totale ou partielle, du site ou de son contenu, par quelque procédé que ce soit, sans autorisation expresse et préalable de PulseMarket SAS, est strictement interdite et constituerait une contrefaçon sanctionnée par les articles L. 335-2 et suivants du Code de la propriété intellectuelle.
            <br /><br />
            Les marques <strong style={{ color: '#0F172A' }}>PulseMarket</strong>, <strong style={{ color: '#0F172A' }}>WhatMarket</strong> et <strong style={{ color: '#0F172A' }}>Rupture Agency</strong> sont des marques en cours de dépôt auprès de l'INPI.
          </p>

          <SectionTitle n={7} title="Liens hypertextes" />
          <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, marginBottom: 24 }}>
            Le site pulse-market.fr peut contenir des liens hypertextes vers d'autres sites Internet. PulseMarket SAS n'exerce aucun contrôle sur ces sites et n'assume aucune responsabilité quant à leur contenu.
          </p>

          <SectionTitle n={8} title="Cookies et traceurs" />
          <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, marginBottom: 24 }}>
            Le site utilise des cookies strictement nécessaires à son fonctionnement (authentification, session, sécurité). Pour plus d'informations sur l'utilisation des cookies et la gestion de vos données personnelles, veuillez consulter notre <a href="/confidentialite" style={{ color: BRAND, textDecoration: 'none' }}>Politique de confidentialité</a>.
          </p>

          <SectionTitle n={9} title="Limitation de responsabilité" />
          <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, marginBottom: 24 }}>
            PulseMarket SAS s'efforce d'assurer au mieux de ses possibilités l'exactitude et la mise à jour des informations diffusées sur ce site. Toutefois, PulseMarket SAS ne peut garantir l'exactitude, la précision ou l'exhaustivité des informations mises à disposition sur ce site.
            <br /><br />
            En conséquence, PulseMarket SAS décline toute responsabilité pour toute imprécision, inexactitude ou omission portant sur des informations disponibles sur le site, et pour tous dommages résultant d'intrusions frauduleuses d'un tiers ayant entraîné une modification des informations mises à disposition.
          </p>

          <SectionTitle n={10} title="Droit applicable et juridiction compétente" />
          <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, marginBottom: 24 }}>
            Les présentes mentions légales sont régies par le droit français. En cas de litige et après tentative de recherche d'une solution amiable, les tribunaux français seront seuls compétents pour connaître de ce litige. Pour toute question relative à l'application des présentes, vous pouvez nous contacter à <a href="mailto:contact@pulse-market.fr" style={{ color: BRAND, textDecoration: 'none' }}>contact@pulse-market.fr</a>.
          </p>

          <SectionTitle n={11} title="Médiation" />
          <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7 }}>
            Conformément aux dispositions du Code de la consommation concernant le règlement amiable des litiges, PulseMarket SAS adhère au service de médiation proposé par la plateforme européenne de règlement en ligne des litiges, accessible à l'adresse : <a href="https://ec.europa.eu/consumers/odr" style={{ color: BRAND, textDecoration: 'none' }}>ec.europa.eu/consumers/odr</a>.
          </p>
        </div>

        {/* Footer note */}
        <p style={{ fontSize: 12, color: '#94A3B8', textAlign: 'center', marginTop: 32 }}>
          Ces mentions légales peuvent être mises à jour à tout moment. La date de dernière mise à jour figure en haut de cette page.
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
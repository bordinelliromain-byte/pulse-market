import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Mentions légales — PulseMarket',
  description: 'Mentions légales de PulseMarket',
}

export default function MentionsLegales() {
  return (
    <div style={{ background: '#F8FAFC', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '80px 24px' }}>

        {/* Header */}
        <div style={{ marginBottom: 48 }}>
          <Link href="/" style={{ fontSize: 13, color: '#4F46E5', textDecoration: 'none', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 32 }}>
            ← Retour à l'accueil
          </Link>
          <h1 style={{ fontSize: 32, fontWeight: 700, color: '#0F172A', letterSpacing: '-0.02em', marginBottom: 8 }}>Mentions légales</h1>
          <p style={{ fontSize: 14, color: '#64748B' }}>Dernière mise à jour : janvier 2026</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>

          <Section title="1. Éditeur du site">
            <p>Le site <strong>pulse-market.fr</strong> est édité par :</p>
            <br />
            <p><strong>PulseMarket</strong></p>
            <p>Forme juridique : [AUTO-ENTREPRENEUR / SASU] — à compléter</p>
            <p>SIRET : [VOTRE NUMÉRO SIRET] — à compléter</p>
            <p>Adresse : [VOTRE ADRESSE] — à compléter</p>
            <p>Email : <a href="mailto:contact@pulse-market.fr" style={{ color: '#4F46E5' }}>contact@pulse-market.fr</a></p>
            <p>Directeur de la publication : [VOTRE NOM COMPLET] — à compléter</p>
          </Section>

          <Section title="2. Hébergement">
            <p>Le site est hébergé par :</p>
            <br />
            <p><strong>Vercel Inc.</strong></p>
            <p>340 Pine Street, Suite 701</p>
            <p>San Francisco, CA 94104, États-Unis</p>
            <p>Site : <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" style={{ color: '#4F46E5' }}>vercel.com</a></p>
            <br />
            <p>Les données sont hébergées sur des serveurs situés dans l'Union Européenne (région eu-west).</p>
          </Section>

          <Section title="3. Base de données">
            <p>Les données sont stockées par :</p>
            <br />
            <p><strong>Supabase Inc.</strong></p>
            <p>970 Toa Payoh North, Singapore 318992</p>
            <p>Données hébergées en région EU (Frankfurt, Allemagne)</p>
            <p>Site : <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" style={{ color: '#4F46E5' }}>supabase.com</a></p>
          </Section>

          <Section title="4. Propriété intellectuelle">
            <p>L'ensemble du contenu du site PulseMarket (textes, graphiques, logos, icônes, images, clips audio, téléchargements numériques et compilations de données) est la propriété exclusive de PulseMarket ou de ses fournisseurs de contenu et est protégé par les lois françaises et internationales relatives à la propriété intellectuelle.</p>
            <br />
            <p>Toute reproduction, représentation, modification, publication, adaptation de tout ou partie des éléments du site, quel que soit le moyen ou le procédé utilisé, est interdite sans l'autorisation écrite préalable de PulseMarket.</p>
          </Section>

          <Section title="5. Responsabilité">
            <p>PulseMarket s'efforce d'assurer l'exactitude et la mise à jour des informations diffusées sur ce site. Cependant, PulseMarket ne peut garantir l'exactitude, la précision ou l'exhaustivité des informations mises à la disposition sur ce site.</p>
            <br />
            <p>En conséquence, l'utilisateur reconnaît utiliser ces informations sous sa responsabilité exclusive.</p>
          </Section>

          <Section title="6. Cookies">
            <p>Le site PulseMarket utilise des cookies strictement nécessaires au fonctionnement de la plateforme (authentification, préférences de session). Aucun cookie publicitaire ou de tracking tiers n'est utilisé.</p>
            <br />
            <p>Conformément à la réglementation RGPD, vous pouvez configurer votre navigateur pour refuser les cookies. Cela peut affecter certaines fonctionnalités du site.</p>
          </Section>

          <Section title="7. Droit applicable">
            <p>Les présentes mentions légales sont soumises au droit français. En cas de litige, les tribunaux français seront seuls compétents.</p>
          </Section>

          <Section title="8. Contact">
            <p>Pour toute question relative aux présentes mentions légales, vous pouvez nous contacter à :</p>
            <br />
            <p>Email : <a href="mailto:contact@pulse-market.fr" style={{ color: '#4F46E5' }}>contact@pulse-market.fr</a></p>
          </Section>

        </div>

        {/* Footer nav */}
        <div style={{ marginTop: 60, paddingTop: 32, borderTop: '1px solid #E2E8F0', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <Link href="/cgu" style={{ fontSize: 13, color: '#4F46E5', textDecoration: 'none' }}>CGU</Link>
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
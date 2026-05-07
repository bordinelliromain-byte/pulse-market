import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Politique de confidentialité — PulseMarket',
}

export default function Confidentialite() {
  return (
    <div style={{ background: '#F8FAFC', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '80px 24px' }}>

        <div style={{ marginBottom: 48 }}>
          <Link href="/" style={{ fontSize: 13, color: '#4F46E5', textDecoration: 'none', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 32 }}>
            ← Retour à l'accueil
          </Link>
          <h1 style={{ fontSize: 32, fontWeight: 700, color: '#0F172A', letterSpacing: '-0.02em', marginBottom: 8 }}>Politique de confidentialité</h1>
          <p style={{ fontSize: 14, color: '#64748B' }}>Dernière mise à jour : janvier 2026</p>
        </div>

        <div style={{ background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 10, padding: '16px 20px', marginBottom: 40 }}>
          <p style={{ fontSize: 13, color: '#4338CA', lineHeight: 1.7 }}>
            <strong>Résumé :</strong> PulseMarket collecte uniquement les données nécessaires au fonctionnement de la plateforme. Vos données ne sont jamais vendues à des tiers. Elles sont hébergées en Europe et protégées conformément au RGPD.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>

          <Section title="1. Responsable du traitement">
            <p><strong>PulseMarket</strong></p>
            <p>SIRET : [VOTRE NUMÉRO SIRET] — à compléter</p>
            <p>Adresse : [VOTRE ADRESSE] — à compléter</p>
            <p>Email : <a href="mailto:contact@pulse-market.fr" style={{ color: '#4F46E5' }}>contact@pulse-market.fr</a></p>
          </Section>

          <Section title="2. Données collectées">
            <p><strong>Lors de la création de compte :</strong></p>
            <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8, marginBottom: 16 }}>
              <li>Nom et prénom</li>
              <li>Adresse email</li>
              <li>Numéro de téléphone (optionnel)</li>
              <li>Mot de passe (chiffré, non accessible)</li>
            </ul>
            <p><strong>Pour les exposants :</strong></p>
            <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8, marginBottom: 16 }}>
              <li>Numéro SIREN / SIRET</li>
              <li>Raison sociale</li>
              <li>Extrait Kbis (document)</li>
              <li>Attestation RC Pro (document)</li>
              <li>Dimensions du stand</li>
            </ul>
            <p><strong>Pour les organisateurs :</strong></p>
            <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8, marginBottom: 16 }}>
              <li>Nom de l'organisation</li>
              <li>Type d'organisation (mairie, association, etc.)</li>
              <li>Informations sur les événements publiés</li>
            </ul>
            <p><strong>Automatiquement :</strong></p>
            <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
              <li>Adresse IP (pour la sécurité)</li>
              <li>Logs de connexion</li>
              <li>Données de navigation (cookies fonctionnels uniquement)</li>
            </ul>
          </Section>

          <Section title="3. Finalités du traitement">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { finalite: 'Gestion des comptes utilisateurs', base: 'Exécution du contrat' },
                { finalite: 'Vérification des documents légaux', base: 'Exécution du contrat' },
                { finalite: 'Traitement des paiements', base: 'Exécution du contrat' },
                { finalite: 'Envoi de notifications et emails', base: 'Intérêt légitime / Consentement' },
                { finalite: 'Sécurité de la plateforme', base: 'Intérêt légitime' },
                { finalite: 'Amélioration du service', base: 'Intérêt légitime' },
                { finalite: 'Obligations légales et fiscales', base: 'Obligation légale' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#F8FAFC', borderRadius: 8, fontSize: 13 }}>
                  <span style={{ color: '#0F172A' }}>{item.finalite}</span>
                  <span style={{ color: '#4F46E5', fontWeight: 500 }}>{item.base}</span>
                </div>
              ))}
            </div>
          </Section>

          <Section title="4. Conservation des données">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { type: 'Données de compte', duree: '3 ans après la dernière connexion' },
                { type: 'Documents légaux (Kbis, RC Pro)', duree: '5 ans après la fin du contrat' },
                { type: 'Données de paiement', duree: '10 ans (obligation fiscale)' },
                { type: 'Logs de sécurité', duree: '12 mois' },
                { type: 'Données de candidatures', duree: '3 ans' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#F8FAFC', borderRadius: 8, fontSize: 13 }}>
                  <span style={{ color: '#0F172A' }}>{item.type}</span>
                  <span style={{ color: '#64748B' }}>{item.duree}</span>
                </div>
              ))}
            </div>
          </Section>

          <Section title="5. Partage des données">
            <p>PulseMarket ne vend jamais vos données. Vos données peuvent être partagées avec :</p>
            <br />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { tiers: 'Stripe', usage: 'Traitement des paiements', localisation: 'USA (clauses contractuelles)' },
                { tiers: 'Supabase', usage: 'Hébergement base de données', localisation: 'EU (Frankfurt)' },
                { tiers: 'Vercel', usage: 'Hébergement application', localisation: 'EU (Ireland)' },
                { tiers: 'Resend', usage: 'Envoi des emails transactionnels', localisation: 'EU' },
                { tiers: 'Google Vision', usage: 'Analyse OCR des documents', localisation: 'USA (clauses contractuelles)' },
              ].map((item, i) => (
                <div key={i} style={{ padding: '12px 14px', background: '#F8FAFC', borderRadius: 8, fontSize: 13 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, color: '#0F172A' }}>{item.tiers}</span>
                    <span style={{ color: '#64748B', fontSize: 11 }}>{item.localisation}</span>
                  </div>
                  <span style={{ color: '#64748B' }}>{item.usage}</span>
                </div>
              ))}
            </div>
          </Section>

          <Section title="6. Vos droits">
            <p>Conformément au RGPD, vous disposez des droits suivants :</p>
            <br />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { droit: 'Droit d\'accès', desc: 'Obtenir une copie de vos données personnelles' },
                { droit: 'Droit de rectification', desc: 'Corriger des données inexactes ou incomplètes' },
                { droit: 'Droit à l\'effacement', desc: 'Demander la suppression de vos données' },
                { droit: 'Droit à la portabilité', desc: 'Recevoir vos données dans un format structuré' },
                { droit: 'Droit d\'opposition', desc: 'Vous opposer au traitement de vos données' },
                { droit: 'Droit à la limitation', desc: 'Limiter le traitement de vos données' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 14px', background: '#F8FAFC', borderRadius: 8 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4F46E5', flexShrink: 0, marginTop: 6 }} />
                  <div style={{ fontSize: 13 }}>
                    <span style={{ fontWeight: 600, color: '#0F172A' }}>{item.droit}</span>
                    <span style={{ color: '#64748B' }}> — {item.desc}</span>
                  </div>
                </div>
              ))}
            </div>
            <br />
            <p>Pour exercer vos droits, contactez-nous à : <a href="mailto:contact@pulse-market.fr" style={{ color: '#4F46E5' }}>contact@pulse-market.fr</a></p>
            <br />
            <p>Vous disposez également du droit d'introduire une réclamation auprès de la <strong>CNIL</strong> (Commission Nationale de l'Informatique et des Libertés) : <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" style={{ color: '#4F46E5' }}>www.cnil.fr</a></p>
          </Section>

          <Section title="7. Sécurité">
            <p>PulseMarket met en œuvre des mesures techniques et organisationnelles pour protéger vos données :</p>
            <br />
            <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <li>Chiffrement AES-256 des données au repos</li>
              <li>Transport chiffré HTTPS (TLS 1.3)</li>
              <li>Authentification à deux facteurs disponible</li>
              <li>Accès aux données restreint par rôle (RLS Supabase)</li>
              <li>Journalisation des accès sensibles</li>
              <li>Mots de passe hashés (bcrypt)</li>
            </ul>
          </Section>

          <Section title="8. Cookies">
            <p>PulseMarket utilise uniquement des cookies strictement nécessaires au fonctionnement de la plateforme :</p>
            <br />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { cookie: 'Session d\'authentification', duree: 'Session / 24h', type: 'Nécessaire' },
                { cookie: 'Préférences utilisateur', duree: '30 jours', type: 'Nécessaire' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#F8FAFC', borderRadius: 8, fontSize: 13 }}>
                  <span style={{ color: '#0F172A' }}>{item.cookie}</span>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <span style={{ color: '#64748B' }}>{item.duree}</span>
                    <span style={{ color: '#16A34A', fontWeight: 500 }}>{item.type}</span>
                  </div>
                </div>
              ))}
            </div>
            <br />
            <p>Aucun cookie publicitaire ou de tracking tiers n'est utilisé sur PulseMarket.</p>
          </Section>

          <Section title="9. Contact DPO">
            <p>Pour toute question relative à la protection de vos données personnelles :</p>
            <br />
            <p>Email : <a href="mailto:contact@pulse-market.fr" style={{ color: '#4F46E5' }}>contact@pulse-market.fr</a></p>
            <p>Objet : [RGPD] + votre demande</p>
            <br />
            <p>Délai de réponse : 30 jours maximum conformément au RGPD.</p>
          </Section>

        </div>

        <div style={{ marginTop: 60, paddingTop: 32, borderTop: '1px solid #E2E8F0', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <Link href="/mentions-legales" style={{ fontSize: 13, color: '#4F46E5', textDecoration: 'none' }}>Mentions légales</Link>
          <Link href="/cgu" style={{ fontSize: 13, color: '#4F46E5', textDecoration: 'none' }}>CGU</Link>
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
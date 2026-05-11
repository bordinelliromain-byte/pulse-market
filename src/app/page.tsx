'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import type { Variants } from 'framer-motion'
import {
  ArrowRight, FileCheck, Building2, Store, ShieldCheck,
  Zap, MapPin, Bell, CheckCircle, ChevronRight,
  BarChart3, Clock, Lock, Users, Euro, Map
} from 'lucide-react'

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}
const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}

function AnimatedSection({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <motion.div ref={ref} variants={stagger} initial="hidden" animate={inView ? 'visible' : 'hidden'} className={className}>
      {children}
    </motion.div>
  )
}

function LogoIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#4F46E5"/>
      <path d="M6 20L12 20L14 11L17 29L20 14L22 20L34 20" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function LogoWordmark({ size = 15 }: { size?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 0 }}>
      <span style={{ fontWeight: 700, fontSize: size, letterSpacing: '-0.02em', color: '#0F172A' }}>Pulse</span>
      <span style={{ fontWeight: 400, fontSize: size, letterSpacing: '-0.02em', color: '#4F46E5' }}>Market</span>
    </div>
  )
}

export default function Landing() {
  const router = useRouter()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div style={{ background: '#F8FAFC', color: '#0F172A', fontFamily: 'system-ui, sans-serif' }} className="min-h-screen">

      {/* NAV */}
      <motion.header initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.4 }}
        style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, background: scrolled ? 'rgba(255,255,255,0.92)' : 'transparent', backdropFilter: scrolled ? 'blur(12px)' : 'none', borderBottom: scrolled ? '1px solid #E2E8F0' : 'none', transition: 'all 0.2s ease' }}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          {/* ✅ Logo SVG nav */}
          <div className="flex items-center gap-2">
            <LogoIcon size={28} />
            <LogoWordmark size={15} />
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm" style={{ color: '#64748B' }}>
            <a href="#fonctionnement" className="hover:text-slate-900 transition-colors">Fonctionnement</a>
            <a href="#administration" className="hover:text-slate-900 transition-colors">Administration</a>
            <a href="#exposants" className="hover:text-slate-900 transition-colors">Exposants</a>
            <a href="#tarifs" className="hover:text-slate-900 transition-colors">Tarifs</a>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/auth/mairie')}
              style={{ fontSize: 13, color: '#4F46E5', fontWeight: 600, background: '#EEF2FF', padding: '6px 14px', borderRadius: 8, border: '1px solid #C7D2FE' }}
              className="hidden md:flex items-center gap-1.5 hover:opacity-90 transition-opacity">
              <Building2 size={13} /> Espace mairie
            </button>
            <button onClick={() => router.push('/auth')}
              style={{ background: '#4F46E5', color: 'white', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500 }}
              className="hover:opacity-90 transition-opacity flex items-center gap-1.5">
              Connexion <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </motion.header>

      {/* HERO */}
      <section className="pt-36 pb-24 px-6" style={{ borderBottom: '1px solid #E2E8F0', background: 'white' }}>
        <div className="max-w-5xl mx-auto">
          <AnimatedSection>
            <motion.div variants={fadeUp} className="mb-6">
              <span style={{ background: '#EEF2FF', color: '#4F46E5', padding: '4px 14px', borderRadius: 100, fontSize: 12, fontWeight: 600, border: '1px solid #C7D2FE' }}>
                Conforme RGPD — Données hébergées en France
              </span>
            </motion.div>
            <motion.h1 variants={fadeUp} style={{ fontSize: 'clamp(36px, 5vw, 62px)', fontWeight: 700, lineHeight: 1.08, letterSpacing: '-0.03em', maxWidth: 720 }} className="mb-6">
              Gérez vos marchés municipaux sans effort
            </motion.h1>
            <motion.p variants={fadeUp} style={{ fontSize: 18, color: '#64748B', maxWidth: 560, lineHeight: 1.7 }} className="mb-10">
              PulseMarket numérise la gestion des AOT, automatise la vérification des dossiers exposants et collecte les redevances en ligne. Zéro papier, zéro relance, zéro prise de tête.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3">
              <button onClick={() => router.push('/auth/mairie')}
                style={{ background: '#4F46E5', color: 'white', padding: '13px 28px', borderRadius: 10, fontWeight: 600, fontSize: 15 }}
                className="hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                <Building2 size={16} /> Créer mon espace mairie
              </button>
              <button onClick={() => router.push('/auth')}
                style={{ background: 'white', color: '#0F172A', padding: '13px 28px', borderRadius: 10, fontWeight: 600, fontSize: 15, border: '1px solid #E2E8F0' }}
                className="hover:border-slate-400 transition-colors flex items-center justify-center gap-2">
                <Store size={16} /> Je suis exposant
              </button>
            </motion.div>
          </AnimatedSection>

          <AnimatedSection className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16">
            {[
              { n: '36 000', l: 'communes françaises avec marchés' },
              { n: '600 k', l: 'commerçants non-sédentaires' },
              { n: '80%', l: 'de temps administratif économisé' },
              { n: '0 €', l: "pour démarrer en tant qu'organisateur" },
            ].map((s, i) => (
              <motion.div key={i} variants={fadeUp} style={{ borderLeft: '2px solid #E2E8F0', paddingLeft: 16 }}>
                <p style={{ fontSize: 28, fontWeight: 700, color: '#0F172A' }}>{s.n}</p>
                <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 4, lineHeight: 1.5 }}>{s.l}</p>
              </motion.div>
            ))}
          </AnimatedSection>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section className="py-10 px-6" style={{ borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
        <div className="max-w-5xl mx-auto">
          <p style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 20 }}>
            Conçu pour les communes, comités des fêtes et associations
          </p>
          <div className="flex flex-wrap justify-center gap-8">
            {['Mairies', 'Comités des fêtes', 'Associations', 'Offices de tourisme', 'Syndicats de marchés'].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748B', fontSize: 13, fontWeight: 500 }}>
                <CheckCircle size={14} style={{ color: '#4F46E5' }} /> {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FONCTIONNEMENT */}
      <section id="fonctionnement" className="py-20 px-6" style={{ borderBottom: '1px solid #E2E8F0', background: 'white' }}>
        <div className="max-w-6xl mx-auto">
          <AnimatedSection>
            <motion.p variants={fadeUp} style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: '#94A3B8', textTransform: 'uppercase' }} className="mb-3">Comment ça marche</motion.p>
            <motion.h2 variants={fadeUp} style={{ fontSize: 34, fontWeight: 700, letterSpacing: '-0.02em' }} className="mb-4">Du dossier papier à la validation numérique</motion.h2>
            <motion.p variants={fadeUp} style={{ color: '#64748B', maxWidth: 520, marginBottom: 48, lineHeight: 1.7 }}>
              En quelques clics, vos exposants candidatent, vous validez, et la redevance est encaissée automatiquement.
            </motion.p>
          </AnimatedSection>
          <AnimatedSection className="grid md:grid-cols-4 gap-4">
            {[
              { step: '01', icon: <FileCheck size={18} style={{ color: '#4F46E5' }} />, title: 'Dépôt du dossier', desc: "L'exposant dépose son Kbis et son attestation RC Pro directement en ligne. Les documents sont chiffrés et stockés de manière sécurisée." },
              { step: '02', icon: <ShieldCheck size={18} style={{ color: '#4F46E5' }} />, title: 'Vérification automatique', desc: "Notre IA analyse les documents et vérifie le SIREN via l'API INSEE en temps réel. Faux dossiers et entreprises radiées détectés automatiquement." },
              { step: '03', icon: <CheckCircle size={18} style={{ color: '#4F46E5' }} />, title: 'Validation en 1 clic', desc: "Vous consultez le dossier certifié et validez ou refusez. La décision est notifiée instantanément à l'exposant par email." },
              { step: '04', icon: <Euro size={18} style={{ color: '#4F46E5' }} />, title: 'Paiement & AOT', desc: "La redevance AOT est collectée via Stripe. La facture et l'autorisation d'occupation sont générées et envoyées automatiquement." },
            ].map((item, i) => (
              <motion.div key={i} variants={fadeUp} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: 24, position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div style={{ background: '#EEF2FF', borderRadius: 8, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{item.icon}</div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#CBD5E1', letterSpacing: '0.05em' }}>{item.step}</span>
                </div>
                <h3 style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>{item.title}</h3>
                <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.65 }}>{item.desc}</p>
                {i < 3 && <div className="hidden md:block" style={{ position: 'absolute', right: -12, top: '50%', transform: 'translateY(-50%)', zIndex: 1 }}><ChevronRight size={14} style={{ color: '#CBD5E1' }} /></div>}
              </motion.div>
            ))}
          </AnimatedSection>
        </div>
      </section>

      {/* ADMINISTRATION */}
      <section id="administration" className="py-20 px-6" style={{ borderBottom: '1px solid #E2E8F0' }}>
        <div className="max-w-6xl mx-auto">
          <AnimatedSection>
            <motion.div variants={fadeUp} className="mb-3">
              <span style={{ background: '#F0FDF4', color: '#16A34A', padding: '4px 12px', borderRadius: 100, fontSize: 12, fontWeight: 600, border: '1px solid #BBF7D0' }}>Pour les administrations</span>
            </motion.div>
            <motion.h2 variants={fadeUp} style={{ fontSize: 34, fontWeight: 700, letterSpacing: '-0.02em', maxWidth: 600 }} className="mb-4">
              Tout ce dont votre agent placier a besoin
            </motion.h2>
            <motion.p variants={fadeUp} style={{ color: '#64748B', maxWidth: 520, marginBottom: 48, lineHeight: 1.7 }}>
              Un tableau de bord complet pour gérer vos événements, valider les dossiers, attribuer les emplacements et suivre la trésorerie — depuis n'importe où.
            </motion.p>
          </AnimatedSection>

          <AnimatedSection className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <motion.div variants={fadeUp} className="md:col-span-2" style={{ background: '#0F172A', borderRadius: 12, padding: 32, minHeight: 280 }}>
              <div style={{ background: 'rgba(79,70,229,0.2)', borderRadius: 8, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                <BarChart3 size={20} style={{ color: '#818CF8' }} />
              </div>
              <h3 style={{ color: 'white', fontWeight: 600, fontSize: 18, marginBottom: 12 }}>Attribution des emplacements en drag & drop</h3>
              <p style={{ color: '#94A3B8', fontSize: 14, lineHeight: 1.7, maxWidth: 420 }}>Visualisez votre terrain en temps réel. Glissez-déposez les exposants validés sur leur emplacement. Le plan est partagé instantanément avec votre équipe de placiers.</p>
              <div style={{ marginTop: 24, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['Plan interactif', 'QR Code placier', 'Paiement express terrain', 'Export PDF'].map(tag => (
                  <span key={tag} style={{ background: 'rgba(255,255,255,0.08)', color: '#CBD5E1', padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 500 }}>{tag}</span>
                ))}
              </div>
            </motion.div>
            <motion.div variants={fadeUp} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: 24 }}>
              <Clock size={18} style={{ color: '#4F46E5', marginBottom: 16 }} />
              <h3 style={{ fontWeight: 600, fontSize: 15, marginBottom: 8 }}>Gain de temps estimé</h3>
              <p style={{ fontSize: 36, fontWeight: 700, color: '#4F46E5', marginBottom: 4 }}>-80%</p>
              <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6 }}>de temps administratif par événement. Plus d'appels, de relances email ni de dossiers papier manquants.</p>
            </motion.div>
            <motion.div variants={fadeUp} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: 24 }}>
              <ShieldCheck size={18} style={{ color: '#16A34A', marginBottom: 16 }} />
              <h3 style={{ fontWeight: 600, fontSize: 15, marginBottom: 8 }}>Sécurité juridique totale</h3>
              <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6 }}>Chaque dossier est archivé avec horodatage légal. RC Pro vérifiées à date de validité. Votre responsabilité est couverte.</p>
            </motion.div>
            <motion.div variants={fadeUp} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: 24 }}>
              <Euro size={18} style={{ color: '#F59E0B', marginBottom: 16 }} />
              <h3 style={{ fontWeight: 600, fontSize: 15, marginBottom: 8 }}>Trésorerie automatisée</h3>
              <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6 }}>Les redevances AOT sont collectées en ligne via Stripe. Exports comptables CSV/PDF générés en un clic pour votre service financier.</p>
            </motion.div>
            <motion.div variants={fadeUp} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: 24 }}>
              <Bell size={18} style={{ color: '#8B5CF6', marginBottom: 16 }} />
              <h3 style={{ fontWeight: 600, fontSize: 15, marginBottom: 8 }}>Communication groupée</h3>
              <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6 }}>Envoyez un message à tous vos exposants en un clic. Alertes météo, changement de placement, report de date — tout le monde est notifié.</p>
            </motion.div>
          </AnimatedSection>

          <AnimatedSection className="mt-8">
            <motion.div variants={fadeUp} style={{ background: 'linear-gradient(135deg, #0F172A, #1E293B)', borderRadius: 14, padding: '28px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 16 }}>
              <Building2 size={24} style={{ color: '#818CF8' }} />
              <div>
                <p style={{ fontSize: 20, fontWeight: 700, color: 'white', marginBottom: 6 }}>Vous êtes une mairie, un comité des fêtes ou une association ?</p>
                <p style={{ fontSize: 14, color: '#64748B' }}>Créez votre espace en 2 minutes — gratuit pour démarrer, aucune carte bancaire requise</p>
              </div>
              <button onClick={() => router.push('/auth/mairie')}
                style={{ background: '#4F46E5', color: 'white', padding: '13px 28px', borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                className="hover:opacity-90 transition-opacity">
                <Building2 size={15} /> Créer mon espace organisateur <ArrowRight size={14} />
              </button>
            </motion.div>
          </AnimatedSection>
        </div>
      </section>

      {/* EXPOSANTS */}
      <section id="exposants" className="py-20 px-6" style={{ borderBottom: '1px solid #E2E8F0', background: 'white' }}>
        <div className="max-w-6xl mx-auto">
          <AnimatedSection>
            <motion.div variants={fadeUp} className="mb-3">
              <span style={{ background: '#EFF6FF', color: '#2563EB', padding: '4px 12px', borderRadius: 100, fontSize: 12, fontWeight: 600, border: '1px solid #BFDBFE' }}>Pour les exposants</span>
            </motion.div>
            <motion.h2 variants={fadeUp} style={{ fontSize: 34, fontWeight: 700, letterSpacing: '-0.02em', maxWidth: 560 }} className="mb-4">
              Trouvez et postulez aux marchés près de chez vous
            </motion.h2>
            <motion.p variants={fadeUp} style={{ color: '#64748B', maxWidth: 520, marginBottom: 48, lineHeight: 1.7 }}>
              Un dossier, des dizaines de marchés. Déposez vos documents une seule fois et candidatez partout en un clic.
            </motion.p>
          </AnimatedSection>
          <AnimatedSection className="grid md:grid-cols-2 gap-4">
            {[
              { icon: <FileCheck size={16} style={{ color: '#4F46E5' }} />, title: 'Un dossier, partout', desc: "Déposez votre Kbis et RC Pro une seule fois. Notre système les réutilise automatiquement pour chaque candidature. Fini les copies papier." },
              { icon: <Zap size={16} style={{ color: '#4F46E5' }} />, title: 'Candidature en 1 clic', desc: "Lorsqu'un marché vous correspond, postulez instantanément. Votre dossier certifié est transmis automatiquement à l'organisateur." },
              { icon: <MapPin size={16} style={{ color: '#4F46E5' }} />, title: 'Alertes dans votre zone', desc: "Définissez votre zone et recevez une notification dès qu'un marché est publié près de chez vous. Ne ratez plus aucune opportunité." },
              { icon: <ShieldCheck size={16} style={{ color: '#4F46E5' }} />, title: 'Badge Dossier Vérifié', desc: "Après vérification de votre SIREN et de vos documents, un badge officiel est affiché sur votre profil. Les organisateurs vous font confiance." },
              { icon: <Map size={16} style={{ color: '#4F46E5' }} />, title: 'Visible sur Whatmarket', desc: "Votre profil et vos produits sont visibles par des milliers de visiteurs sur Whatmarket, notre portail B2C dédié aux marchés locaux." },
              { icon: <Users size={16} style={{ color: '#4F46E5' }} />, title: 'Suivi de vos candidatures', desc: "Un tableau de bord clair pour suivre l'état de chaque candidature en temps réel — en attente, validé, payé. Zéro incertitude." },
            ].map((item, i) => (
              <motion.div key={i} variants={fadeUp} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20, display: 'flex', gap: 16 }}>
                <div style={{ background: '#EEF2FF', borderRadius: 8, width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{item.icon}</div>
                <div>
                  <h3 style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>{item.title}</h3>
                  <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.65 }}>{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </AnimatedSection>
        </div>
      </section>

      {/* TARIFS */}
      <section id="tarifs" className="py-20 px-6" style={{ borderBottom: '1px solid #E2E8F0' }}>
        <div className="max-w-4xl mx-auto">
          <AnimatedSection>
            <motion.p variants={fadeUp} style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: '#94A3B8', textTransform: 'uppercase', textAlign: 'center', marginBottom: 12 }}>Tarification</motion.p>
            <motion.h2 variants={fadeUp} style={{ fontSize: 34, fontWeight: 700, textAlign: 'center', letterSpacing: '-0.02em', marginBottom: 8 }}>Simple et transparent</motion.h2>
            <motion.p variants={fadeUp} style={{ color: '#64748B', textAlign: 'center', marginBottom: 48, fontSize: 15 }}>
              Les mairies démarrent gratuitement. Les exposants choisissent leur formule.
            </motion.p>
          </AnimatedSection>
          <AnimatedSection className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Exposant Gratuit', price: '0€', period: 'pour toujours', features: ['Consultation de la carte des événements', 'Création de votre profil exposant', 'Upload Kbis & RC Pro', '1 candidature par mois', 'Vérification SIREN incluse'], cta: 'Créer mon compte', accent: false, path: '/auth?tab=signup' },
              { name: 'Exposant Pro', price: '20€', period: 'par mois', features: ['Candidatures illimitées', 'Badge Dossier Vérifié', 'Alertes géolocalisées', 'Accès aux marchés exclusifs', 'Visibilité prioritaire sur Whatmarket'], cta: 'Passer en Pro', accent: true, path: '/auth?tab=signup' },
              { name: 'Administration', price: '150€', period: 'par mois', features: ['Événements illimités', 'Vérification automatique des dossiers', 'Attribution terrain drag & drop', 'Collecte des redevances AOT', 'Export comptable CSV / PDF', 'Support dédié'], cta: 'Créer mon espace', accent: false, path: '/auth/mairie' },
            ].map((plan, i) => (
              <motion.div key={i} variants={fadeUp}
                style={{ background: plan.accent ? '#0F172A' : 'white', border: `1px solid ${plan.accent ? '#0F172A' : '#E2E8F0'}`, borderRadius: 12, padding: 28, position: 'relative' }}>
                {plan.accent && (
                  <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: '#4F46E5', color: 'white', fontSize: 11, fontWeight: 700, padding: '3px 12px', borderRadius: 100 }}>POPULAIRE</div>
                )}
                <p style={{ fontSize: 13, fontWeight: 600, color: plan.accent ? '#94A3B8' : '#64748B', marginBottom: 8 }}>{plan.name}</p>
                <p style={{ fontSize: 36, fontWeight: 700, color: plan.accent ? 'white' : '#0F172A' }}>{plan.price}</p>
                <p style={{ fontSize: 13, color: plan.accent ? '#64748B' : '#94A3B8', marginBottom: 24 }}>{plan.period}</p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f, j) => (
                    <li key={j} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <CheckCircle size={14} style={{ color: plan.accent ? '#818CF8' : '#4F46E5', flexShrink: 0, marginTop: 2 }} />
                      <span style={{ fontSize: 13, color: plan.accent ? '#94A3B8' : '#475569', lineHeight: 1.5 }}>{f}</span>
                    </li>
                  ))}
                </ul>
                <button onClick={() => router.push(plan.path)}
                  style={{ width: '100%', background: plan.accent ? '#4F46E5' : 'transparent', color: plan.accent ? 'white' : '#0F172A', border: plan.accent ? 'none' : '1px solid #E2E8F0', padding: '11px 0', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                  className="hover:opacity-90 transition-opacity">
                  {plan.cta}
                </button>
              </motion.div>
            ))}
          </AnimatedSection>
          <AnimatedSection className="mt-8">
            <motion.div variants={fadeUp} style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 12, padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <CheckCircle size={18} style={{ color: '#16A34A', flexShrink: 0 }} />
              <p style={{ fontSize: 13, color: '#15803D', lineHeight: 1.6 }}>
                <strong>Les administrations démarrent gratuitement.</strong> Aucune carte bancaire requise. Passez à l'offre payante quand vous êtes prêt.
              </p>
            </motion.div>
          </AnimatedSection>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <AnimatedSection>
            <motion.h2 variants={fadeUp} style={{ fontSize: 38, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 16 }}>
              Prêt à simplifier vos marchés ?
            </motion.h2>
            <motion.p variants={fadeUp} style={{ color: '#64748B', fontSize: 16, marginBottom: 32, lineHeight: 1.7 }}>
              Rejoignez les premiers organisateurs et exposants qui font confiance à PulseMarket. Gratuit pour démarrer, sans engagement.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={() => router.push('/auth/mairie')}
                style={{ background: '#4F46E5', color: 'white', padding: '14px 32px', borderRadius: 10, fontWeight: 600, fontSize: 15, cursor: 'pointer' }}
                className="hover:opacity-90 transition-opacity inline-flex items-center justify-center gap-2">
                <Building2 size={16} /> Créer mon espace mairie <ArrowRight size={16} />
              </button>
              <button onClick={() => router.push('/auth')}
                style={{ background: 'white', color: '#0F172A', padding: '14px 32px', borderRadius: 10, fontWeight: 600, fontSize: 15, cursor: 'pointer', border: '1px solid #E2E8F0' }}
                className="hover:border-slate-400 transition-colors inline-flex items-center justify-center gap-2">
                <Store size={16} /> Je suis exposant
              </button>
            </motion.div>
          </AnimatedSection>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid #E2E8F0', background: 'white', padding: '24px' }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          {/* ✅ Logo SVG footer */}
          <div className="flex items-center gap-2">
            <LogoIcon size={24} />
            <LogoWordmark size={14} />
          </div>
          <p style={{ fontSize: 13, color: '#94A3B8' }}>© 2026 PulseMarket SAS — Tous droits réservés</p>
          <div className="flex gap-6" style={{ fontSize: 13, color: '#94A3B8' }}>
            <a href="/mentions-legales" className="hover:text-slate-900 transition-colors">Mentions légales</a>
            <a href="/cgu" className="hover:text-slate-900 transition-colors">CGU</a>
            <a href="/confidentialite" className="hover:text-slate-900 transition-colors">Confidentialité</a>
            <a href="/cgv" className="hover:text-slate-900 transition-colors">CGV</a>
            <a href="mailto:contact@pulse-market.fr" className="hover:text-slate-900 transition-colors">Contact</a>
          </div>
        </div>
      </footer>

    </div>
  )
}
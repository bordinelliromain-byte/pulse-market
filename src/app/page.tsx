'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import type { Variants } from 'framer-motion'
import {
  ArrowRight,
  FileCheck,
  Building2,
  Store,
  ShieldCheck,
  Zap,
  MapPin,
  Bell,
  CheckCircle,
  ChevronRight,
  BarChart3,
  Clock,
  Lock,
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
    <motion.div
      ref={ref}
      variants={stagger}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      className={className}
    >
      {children}
    </motion.div>
  )
}

function Calculator() {
  const [width, setWidth] = useState(3)
  const [length, setLength] = useState(4)
  const [electric, setElectric] = useState<'none' | 'mono' | 'tri'>('none')

  const BASE_RATE = 4.5 // €/m²/jour
  const ELECTRIC_RATES = { none: 0, mono: 18, tri: 42 }
  const area = width * length
  const locationCost = area * BASE_RATE
  const electricCost = ELECTRIC_RATES[electric]
  const aotFee = area * 1.2
  const total = locationCost + electricCost + aotFee

  return (
    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12 }} className="p-6">
      <p className="text-xs font-semibold uppercase tracking-widest mb-5" style={{ color: '#64748B' }}>
        Simulateur de coût d'emplacement
      </p>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="text-xs text-slate-500 mb-1 block">Largeur stand (m)</label>
          <input
            type="range" min={1} max={10} value={width}
            onChange={e => setWidth(+e.target.value)}
            className="w-full accent-indigo-600"
          />
          <span className="text-sm font-semibold text-slate-900">{width} m</span>
        </div>
        <div>
          <label className="text-xs text-slate-500 mb-1 block">Longueur stand (m)</label>
          <input
            type="range" min={1} max={12} value={length}
            onChange={e => setLength(+e.target.value)}
            className="w-full accent-indigo-600"
          />
          <span className="text-sm font-semibold text-slate-900">{length} m</span>
        </div>
      </div>
      <div className="mb-5">
        <label className="text-xs text-slate-500 mb-2 block">Branchement électrique</label>
        <div className="flex gap-2">
          {[
            { val: 'none', label: 'Aucun' },
            { val: 'mono', label: 'Monophasé' },
            { val: 'tri', label: 'Triphasé' },
          ].map(opt => (
            <button
              key={opt.val}
              onClick={() => setElectric(opt.val as any)}
              style={{
                border: electric === opt.val ? '1.5px solid #4F46E5' : '1px solid #E2E8F0',
                background: electric === opt.val ? '#EEF2FF' : 'white',
                color: electric === opt.val ? '#4F46E5' : '#64748B',
                borderRadius: 8,
              }}
              className="flex-1 py-2 text-xs font-medium transition-all"
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 10 }} className="p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Surface ({area} m² × {BASE_RATE}€/m²)</span>
          <span className="font-medium text-slate-900">{locationCost.toFixed(2)} €</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Redevance AOT (1.20€/m²)</span>
          <span className="font-medium text-slate-900">{aotFee.toFixed(2)} €</span>
        </div>
        {electricCost > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Branchement électrique</span>
            <span className="font-medium text-slate-900">{electricCost.toFixed(2)} €</span>
          </div>
        )}
        <div style={{ borderTop: '1px solid #E2E8F0' }} className="pt-2 flex justify-between">
          <span className="text-sm font-semibold text-slate-900">Total estimé / jour</span>
          <span className="text-lg font-bold" style={{ color: '#4F46E5' }}>{total.toFixed(2)} €</span>
        </div>
      </div>
      <p className="text-xs text-slate-400 mt-3">* Simulation indicative. Le tarif final est fixé par l'organisateur et inclus dans l'AOT signée.</p>
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
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
          background: scrolled ? 'rgba(255,255,255,0.92)' : 'transparent',
          backdropFilter: scrolled ? 'blur(12px)' : 'none',
          borderBottom: scrolled ? '1px solid #E2E8F0' : 'none',
          transition: 'all 0.2s ease',
        }}
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div style={{ width: 28, height: 28, background: '#0F172A', borderRadius: 7 }} className="flex items-center justify-center">
              <span style={{ color: 'white', fontSize: 12, fontWeight: 700 }}>PM</span>
            </div>
            <span style={{ fontWeight: 600, fontSize: 15 }}>PlaceMarket</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm" style={{ color: '#64748B' }}>
            <a href="#workflow" className="hover:text-slate-900 transition-colors">Fonctionnement</a>
            <a href="#admin" className="hover:text-slate-900 transition-colors">Administration</a>
            <a href="#exposant" className="hover:text-slate-900 transition-colors">Exposants</a>
            <a href="#tarifs" className="hover:text-slate-900 transition-colors">Tarifs</a>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/auth?tab=signin')} style={{ fontSize: 13, color: '#64748B', fontWeight: 500 }} className="hover:text-slate-900 transition-colors">
              Connexion
            </button>
            <button
              onClick={() => router.push('/auth?tab=signup')}
              style={{ background: '#4F46E5', color: 'white', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500 }}
              className="hover:opacity-90 transition-opacity flex items-center gap-1.5"
            >
              Démarrer <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </motion.header>

      {/* HERO */}
      <section className="pt-36 pb-24 px-6" style={{ borderBottom: '1px solid #E2E8F0' }}>
        <div className="max-w-5xl mx-auto">
          <AnimatedSection>
            <motion.div variants={fadeUp} className="mb-6">
              <span style={{ background: '#EEF2FF', color: '#4F46E5', padding: '4px 12px', borderRadius: 100, fontSize: 12, fontWeight: 600 }}>
                Conformité RGPD — Données hébergées en France
              </span>
            </motion.div>
            <motion.h1 variants={fadeUp} style={{ fontSize: 'clamp(36px, 5vw, 60px)', fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.03em', maxWidth: 700 }} className="mb-6">
              La numérisation des marchés du terroir français
            </motion.h1>
            <motion.p variants={fadeUp} style={{ fontSize: 18, color: '#64748B', maxWidth: 560, lineHeight: 1.7 }} className="mb-10">
              PlaceMarket automatise la gestion des Autorisations d'Occupation Temporaire (AOT), la certification des dossiers exposants via OCR, et l'interfaçage avec l'API SIRENE de l'INSEE.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => router.push('/auth')}
                style={{ background: '#4F46E5', color: 'white', padding: '12px 24px', borderRadius: 10, fontWeight: 600, fontSize: 14 }}
                className="hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                <Store size={16} /> Espace Exposant
              </button>
              <button
                onClick={() => router.push('/auth')}
                style={{ background: 'white', color: '#0F172A', padding: '12px 24px', borderRadius: 10, fontWeight: 600, fontSize: 14, border: '1px solid #E2E8F0' }}
                className="hover:border-slate-400 transition-colors flex items-center justify-center gap-2"
              >
                <Building2 size={16} /> Espace Administration
              </button>
            </motion.div>
          </AnimatedSection>

          {/* STATS */}
          <AnimatedSection className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16">
            {[
              { n: '36 000', l: 'communes avec marchés en France' },
              { n: '600 k', l: 'commerçants non-sédentaires' },
              { n: '10 s', l: 'pour vérifier un SIREN via INSEE' },
              { n: '0 €', l: "pour démarrer en tant qu'organisateur" },
            ].map((s, i) => (
              <motion.div key={i} variants={fadeUp} style={{ borderLeft: '2px solid #E2E8F0', paddingLeft: 16 }}>
                <p style={{ fontSize: 28, fontWeight: 700, color: '#0F172A' }}>{s.n}</p>
                <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>{s.l}</p>
              </motion.div>
            ))}
          </AnimatedSection>
        </div>
      </section>

      {/* WORKFLOW TECHNIQUE */}
      <section id="workflow" className="py-20 px-6" style={{ borderBottom: '1px solid #E2E8F0', background: 'white' }}>
        <div className="max-w-6xl mx-auto">
          <AnimatedSection>
            <motion.p variants={fadeUp} style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: '#94A3B8', textTransform: 'uppercase' }} className="mb-3">
              Architecture du processus
            </motion.p>
            <motion.h2 variants={fadeUp} style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em' }} className="mb-4">
              Du dossier papier à la validation numérique
            </motion.h2>
            <motion.p variants={fadeUp} style={{ color: '#64748B', maxWidth: 520, marginBottom: 48, lineHeight: 1.7 }}>
              Chaque candidature suit un workflow certifié : vérification OCR des documents légaux, interfaçage API SIRENE, puis génération automatique des arrêtés municipaux.
            </motion.p>
          </AnimatedSection>

          <AnimatedSection className="grid md:grid-cols-4 gap-4">
            {[
              {
                step: '01',
                icon: <FileCheck size={18} style={{ color: '#4F46E5' }} />,
                title: 'Inscription & Upload',
                desc: "L'exposant dépose son extrait Kbis certifié et son certificat d'assurance RC Pro. Les fichiers sont chiffrés AES-256 et stockés dans un bucket privé.",
              },
              {
                step: '02',
                icon: <ShieldCheck size={18} style={{ color: '#4F46E5' }} />,
                title: 'Certification OCR',
                desc: "Notre moteur IA extrait le numéro SIREN, la raison sociale et la date de création. Une requête temps réel vers l'API SIRENE de l'INSEE confirme le statut actif.",
              },
              {
                step: '03',
                icon: <CheckCircle size={18} style={{ color: '#4F46E5' }} />,
                title: 'Validation Placier',
                desc: "L'agent placier consulte le dossier certifié sur son dashboard. Il accepte ou refuse en 1 clic. La décision génère automatiquement un courrier de notification.",
              },
              {
                step: '04',
                icon: <Lock size={18} style={{ color: '#4F46E5' }} />,
                title: 'AOT & Paiement',
                desc: "L'Autorisation d'Occupation du Domaine Public (AOT) est générée avec les coordonnées GPS de l'emplacement. Le paiement sécurisé est traité via Stripe.",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: 24, position: 'relative' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div style={{ background: '#EEF2FF', borderRadius: 8, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {item.icon}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#CBD5E1', letterSpacing: '0.05em' }}>{item.step}</span>
                </div>
                <h3 style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>{item.title}</h3>
                <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.65 }}>{item.desc}</p>
                {i < 3 && (
                  <div className="hidden md:block" style={{ position: 'absolute', right: -12, top: '50%', transform: 'translateY(-50%)', zIndex: 1 }}>
                    <ChevronRight size={14} style={{ color: '#CBD5E1' }} />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatedSection>
        </div>
      </section>

      {/* FOCUS ADMINISTRATION */}
      <section id="admin" className="py-20 px-6" style={{ borderBottom: '1px solid #E2E8F0' }}>
        <div className="max-w-6xl mx-auto">
          <AnimatedSection>
            <motion.div variants={fadeUp} className="mb-3">
              <span style={{ background: '#F0FDF4', color: '#16A34A', padding: '4px 12px', borderRadius: 100, fontSize: 12, fontWeight: 600, border: '1px solid #BBF7D0' }}>
                Pour les administrations
              </span>
            </motion.div>
            <motion.h2 variants={fadeUp} style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em', maxWidth: 560 }} className="mb-12">
              Sécurité juridique et gain de temps pour l'agent placier
            </motion.h2>
          </AnimatedSection>

          {/* BENTO GRID */}
          <AnimatedSection className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Grande carte */}
            <motion.div
              variants={fadeUp}
              className="md:col-span-2"
              style={{ background: '#0F172A', borderRadius: 12, padding: 32, minHeight: 280 }}
            >
              <div style={{ background: 'rgba(79,70,229,0.2)', borderRadius: 8, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                <BarChart3 size={20} style={{ color: '#818CF8' }} />
              </div>
              <h3 style={{ color: 'white', fontWeight: 600, fontSize: 18, marginBottom: 12 }}>
                Génération automatique des arrêtés municipaux
              </h3>
              <p style={{ color: '#94A3B8', fontSize: 14, lineHeight: 1.7, maxWidth: 420 }}>
                À chaque validation de candidature, PlaceMarket génère un projet d'arrêté municipal pré-rempli avec : coordonnées de l'exposant, numéro SIREN vérifié, surface d'occupation, coordonnées GPS de l'emplacement et montant de la redevance AOT calculée automatiquement.
              </p>
              <div style={{ marginTop: 24, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['PDF signable', 'Coordonnées GPS', 'Redevance AOT auto', 'Archivage 10 ans'].map((tag) => (
                  <span key={tag} style={{ background: 'rgba(255,255,255,0.08)', color: '#CBD5E1', padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 500 }}>
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>

            <motion.div variants={fadeUp} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: 24 }}>
              <Clock size={18} style={{ color: '#4F46E5', marginBottom: 16 }} />
              <h3 style={{ fontWeight: 600, fontSize: 15, marginBottom: 8 }}>Gain de temps estimé</h3>
              <p style={{ fontSize: 36, fontWeight: 700, color: '#4F46E5', marginBottom: 4 }}>-80%</p>
              <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6 }}>
                de temps administratif par événement. Plus d'appels téléphoniques, de relances email ni de dossiers papier manquants.
              </p>
            </motion.div>

            <motion.div variants={fadeUp} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: 24 }}>
              <ShieldCheck size={18} style={{ color: '#16A34A', marginBottom: 16 }} />
              <h3 style={{ fontWeight: 600, fontSize: 15, marginBottom: 8 }}>Conformité juridique</h3>
              <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6 }}>
                Chaque dossier est archivé avec horodatage légal. Les certificats d'assurance RC Pro sont vérifiés à date de validité. Votre responsabilité est couverte.
              </p>
            </motion.div>

            <motion.div
              variants={fadeUp}
              className="md:col-span-2"
              style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: 24 }}
            >
              <Bell size={18} style={{ color: '#F59E0B', marginBottom: 16 }} />
              <h3 style={{ fontWeight: 600, fontSize: 15, marginBottom: 8 }}>Messagerie groupée exposants</h3>
              <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6, maxWidth: 480 }}>
                Envoyez en un clic un message à l'ensemble des exposants validés pour un événement donné. Alertes météo, changement de placement, report de date — tous notifiés instantanément par email et SMS.
              </p>
            </motion.div>
          </AnimatedSection>
        </div>
      </section>

      {/* FOCUS EXPOSANT */}
      <section id="exposant" className="py-20 px-6" style={{ borderBottom: '1px solid #E2E8F0', background: 'white' }}>
        <div className="max-w-6xl mx-auto">
          <AnimatedSection>
            <motion.div variants={fadeUp} className="mb-3">
              <span style={{ background: '#EFF6FF', color: '#2563EB', padding: '4px 12px', borderRadius: 100, fontSize: 12, fontWeight: 600, border: '1px solid #BFDBFE' }}>
                Pour les exposants
              </span>
            </motion.div>
            <motion.h2 variants={fadeUp} style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em', maxWidth: 560 }} className="mb-12">
              Votre portefeuille numérique d'exposant
            </motion.h2>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 gap-8 items-start">
            <AnimatedSection className="space-y-4">
              {[
                {
                  icon: <FileCheck size={16} style={{ color: '#4F46E5' }} />,
                  title: 'Extraits Kbis et RC Pro centralisés',
                  desc: "Déposez vos documents légaux une seule fois. Notre système OCR extrait automatiquement les informations clés et les associe à chaque candidature. Fini de rescanner vos documents à chaque marché.",
                },
                {
                  icon: <Zap size={16} style={{ color: '#4F46E5' }} />,
                  title: 'Candidature en 1 clic avec dossier complet',
                  desc: "Lorsqu'un événement vous correspond, postulez instantanément. Votre dossier certifié — Kbis, assurance RC Pro, SIREN vérifié, caractéristiques du stand — est transmis automatiquement à l'organisateur.",
                },
                {
                  icon: <MapPin size={16} style={{ color: '#4F46E5' }} />,
                  title: 'Alertes géolocalisées sur les opportunités',
                  desc: "Définissez votre zone de chalandise et recevez une notification dès qu'un organisateur publie un événement dans votre secteur. Les événements exclusifs (réservés aux abonnés Pro) partent en moins d'une heure.",
                },
                {
                  icon: <Lock size={16} style={{ color: '#4F46E5' }} />,
                  title: "Badge 'Dossier Vérifié' — gage de confiance",
                  desc: "Après vérification de votre SIREN via l'API SIRENE et validation de vos documents, un badge officiel est apposé sur votre profil. Les organisateurs identifient immédiatement les exposants sérieux.",
                },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20, display: 'flex', gap: 16 }}
                >
                  <div style={{ background: '#EEF2FF', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {item.icon}
                  </div>
                  <div>
                    <h3 style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>{item.title}</h3>
                    <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.65 }}>{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatedSection>

            <AnimatedSection>
              <motion.div variants={fadeUp}>
                <Calculator />
              </motion.div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* TARIFS */}
      <section id="tarifs" className="py-20 px-6" style={{ borderBottom: '1px solid #E2E8F0' }}>
        <div className="max-w-4xl mx-auto">
          <AnimatedSection>
            <motion.p variants={fadeUp} style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: '#94A3B8', textTransform: 'uppercase', textAlign: 'center', marginBottom: 12 }}>
              Tarification
            </motion.p>
            <motion.h2 variants={fadeUp} style={{ fontSize: 32, fontWeight: 700, textAlign: 'center', letterSpacing: '-0.02em', marginBottom: 8 }}>
              Modèle SaaS transparent
            </motion.h2>
            <motion.p variants={fadeUp} style={{ color: '#64748B', textAlign: 'center', marginBottom: 48, fontSize: 15 }}>
              Les administrations démarrent gratuitement. La valeur créée justifie l'abonnement exposant.
            </motion.p>
          </AnimatedSection>

          <AnimatedSection className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: 'Exposant Gratuit',
                price: '0€',
                period: 'pour toujours',
                features: [
                  'Consultation carte des événements',
                  'Création profil exposant',
                  'Upload Kbis & RC Pro',
                  '1 candidature / mois',
                  'Vérification SIREN basique',
                ],
                cta: 'Commencer',
                accent: false,
              },
              {
                name: 'Exposant Pro',
                price: '20€',
                period: 'par mois',
                features: [
                  'Candidatures illimitées',
                  "Badge Dossier Vérifié (API SIRENE)",
                  'Alertes SMS & Push géolocalisées',
                  'Accès événements exclusifs',
                  'Archivage dossier 3 ans',
                ],
                cta: 'Passer en Pro',
                accent: true,
              },
              {
                name: 'Administration',
                price: '150€',
                period: 'par mois',
                features: [
                  'Événements illimités',
                  'Génération arrêtés municipaux',
                  'Messagerie groupée exposants',
                  'Export comptable CSV/PDF',
                  'Support dédié agent placier',
                ],
                cta: 'Contacter',
                accent: false,
              },
            ].map((plan, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                style={{
                  background: plan.accent ? '#0F172A' : 'white',
                  border: `1px solid ${plan.accent ? '#0F172A' : '#E2E8F0'}`,
                  borderRadius: 12,
                  padding: 28,
                  position: 'relative',
                }}
              >
                {plan.accent && (
                  <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: '#4F46E5', color: 'white', fontSize: 11, fontWeight: 700, padding: '3px 12px', borderRadius: 100 }}>
                    RECOMMANDÉ
                  </div>
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
                <button
                  onClick={() => router.push('/auth')}
                  style={{
                    width: '100%',
                    background: plan.accent ? '#4F46E5' : 'transparent',
                    color: plan.accent ? 'white' : '#0F172A',
                    border: plan.accent ? 'none' : '1px solid #E2E8F0',
                    padding: '10px 0',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                  className="hover:opacity-90 transition-opacity"
                >
                  {plan.cta}
                </button>
              </motion.div>
            ))}
          </AnimatedSection>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <AnimatedSection>
            <motion.h2 variants={fadeUp} style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 16 }}>
              Prêt à numériser vos marchés ?
            </motion.h2>
            <motion.p variants={fadeUp} style={{ color: '#64748B', fontSize: 16, marginBottom: 32, lineHeight: 1.7 }}>
              Rejoignez les premiers organisateurs et exposants qui font confiance à PlaceMarket pour gérer leurs AOT, certifier leurs dossiers et simplifier leur quotidien.
            </motion.p>
            <motion.button
              variants={fadeUp}
              onClick={() => router.push('/auth')}
              style={{ background: '#4F46E5', color: 'white', padding: '14px 32px', borderRadius: 10, fontWeight: 600, fontSize: 15, cursor: 'pointer' }}
              className="hover:opacity-90 transition-opacity inline-flex items-center gap-2"
            >
              Créer mon compte gratuitement <ArrowRight size={16} />
            </motion.button>
          </AnimatedSection>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid #E2E8F0', background: 'white', padding: '24px 24px' }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div style={{ width: 24, height: 24, background: '#0F172A', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'white', fontSize: 10, fontWeight: 700 }}>PM</span>
            </div>
            <span style={{ fontWeight: 600, fontSize: 14 }}>PlaceMarket</span>
          </div>
          <p style={{ fontSize: 13, color: '#94A3B8' }}>© 2026 PlaceMarket SAS — Tous droits réservés</p>
          <div className="flex gap-6" style={{ fontSize: 13, color: '#94A3B8' }}>
            <a href="#" className="hover:text-slate-900 transition-colors">Mentions légales</a>
            <a href="#" className="hover:text-slate-900 transition-colors">CGU</a>
            <a href="#" className="hover:text-slate-900 transition-colors">contact@placemarket.fr</a>
          </div>
        </div>
      </footer>

    </div>
  )
}
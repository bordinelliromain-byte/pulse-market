'use client'

import { Suspense, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import Sidebar from '@/components/Sidebar'
import {
  ChevronRight, CheckCircle, Clock, Star,
  Bell, MapPin, ArrowUpRight,
  Shield, Zap, Camera, Send, Eye, CreditCard,
  Loader, Rocket
} from 'lucide-react'

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
}
const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])
  return isMobile
}

// ── SKELETON ──────────────────────────────────────────────────────────────
function Skeleton({ w = '100%', h = 14, radius = 6, style = {} }: { w?: string | number; h?: number; radius?: number; style?: React.CSSProperties }) {
  return (
    <div style={{ width: w, height: h, borderRadius: radius, background: 'linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite', flexShrink: 0, ...style }} />
  )
}

function DashboardSkeleton({ isMobile }: { isMobile: boolean }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#EEF2F7', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Header skeleton */}
      <div style={{ position: 'fixed', top: 0, left: isMobile ? 0 : 220, right: 0, height: 52, background: 'white', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', padding: isMobile ? '0 16px 0 60px' : '0 28px', gap: 10, zIndex: 10 }}>
        <div style={{ flex: 1 }}>
          <Skeleton w={140} h={13} style={{ marginBottom: 6 }} />
          <Skeleton w={100} h={10} />
        </div>
        <Skeleton w={32} h={32} radius={8} />
      </div>

      <div style={{ marginLeft: isMobile ? 0 : 220, flex: 1, padding: isMobile ? '80px 14px 20px' : '76px 28px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* KPIs skeleton */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: 10 }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: '14px 16px' }}>
              <Skeleton w={80} h={10} style={{ marginBottom: 12 }} />
              <Skeleton w={50} h={26} style={{ marginBottom: 10 }} />
              <Skeleton w="100%" h={28} radius={4} />
            </div>
          ))}
        </div>

        {/* Main grid skeleton */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 300px', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Marchés skeleton */}
            <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Skeleton w={140} h={13} />
                <Skeleton w={60} h={12} />
              </div>
              <div style={{ padding: '14px 18px', display: 'flex', gap: 12, overflow: 'hidden' }}>
                {[...Array(3)].map((_, i) => (
                  <div key={i} style={{ flexShrink: 0, width: 175 }}>
                    <Skeleton w={175} h={100} radius={10} style={{ marginBottom: 10 }} />
                    <Skeleton w="85%" h={12} style={{ marginBottom: 6 }} />
                    <Skeleton w="60%" h={10} style={{ marginBottom: 8 }} />
                    <Skeleton w="40%" h={14} />
                  </div>
                ))}
              </div>
            </div>

            {/* Dossiers skeleton */}
            <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: '16px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                <Skeleton w={150} h={13} />
                <Skeleton w={70} h={11} />
              </div>
              {[...Array(2)].map((_, i) => (
                <div key={i} style={{ marginBottom: i < 1 ? 20 : 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <Skeleton w="55%" h={12} />
                    <Skeleton w={70} h={22} radius={100} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {[...Array(4)].map((_, j) => (
                      <div key={j} style={{ display: 'flex', alignItems: 'center', flex: j < 3 ? 1 : 'none' }}>
                        <Skeleton w={28} h={28} radius={50} />
                        {j < 3 && <div style={{ flex: 1, height: 2, background: '#F1F5F9', margin: '0 4px' }} />}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar droite skeleton */}
          {!isMobile && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Skeleton w="100%" h={110} radius={12} />
              <Skeleton w="100%" h={100} radius={12} />
              <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: '14px 16px' }}>
                <Skeleton w={60} h={10} style={{ marginBottom: 10 }} />
                <Skeleton w={80} h={22} style={{ marginBottom: 6 }} />
                <Skeleton w="70%" h={12} />
              </div>
              <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: '14px 16px' }}>
                <Skeleton w={100} h={10} style={{ marginBottom: 12 }} />
                {[...Array(3)].map((_, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: i < 2 ? 10 : 0 }}>
                    <Skeleton w="50%" h={12} />
                    <Skeleton w="25%" h={12} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Sparkline({ values, color = '#4F46E5' }: { values: number[]; color?: string }) {
  const max = Math.max(...values, 1)
  const w = 80, h = 28
  const points = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - (v / max) * h}`).join(' ')
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none">
      <polyline points={points} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.7" />
      <polyline points={`0,${h} ${points} ${w},${h}`} stroke="none" fill={color} opacity="0.08" />
    </svg>
  )
}

function CandidatureTimeline({ status }: { status: string }) {
  const steps = [
    { key: 'pending', label: 'Envoyé', icon: <Send size={12} /> },
    { key: 'read', label: 'Lu', icon: <Eye size={12} /> },
    { key: 'validating', label: 'Validation', icon: <Clock size={12} /> },
    { key: 'validated', label: 'Payé', icon: <CreditCard size={12} /> },
  ]
  const activeIndex = status === 'validated' || status === 'paid' ? 3 : status === 'pending' ? 1 : 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, minWidth: 280 }}>
      {steps.map((step, i) => (
        <div key={step.key} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 'none' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: i <= activeIndex ? '#4F46E5' : '#F1F5F9', color: i <= activeIndex ? 'white' : '#94A3B8', border: i === activeIndex ? '2px solid #818CF8' : '2px solid transparent', boxShadow: i === activeIndex ? '0 0 0 3px rgba(79,70,229,0.15)' : 'none', transition: 'all 0.3s', flexShrink: 0 }}>
              {i < activeIndex ? <CheckCircle size={12} /> : step.icon}
            </div>
            <span style={{ fontSize: 10, color: i <= activeIndex ? '#4F46E5' : '#94A3B8', fontWeight: i === activeIndex ? 600 : 400, whiteSpace: 'nowrap' }}>{step.label}</span>
          </div>
          {i < steps.length - 1 && <div style={{ flex: 1, height: 2, background: i < activeIndex ? '#4F46E5' : '#E2E8F0', margin: '0 4px', marginBottom: 18, borderRadius: 2 }} />}
        </div>
      ))}
    </div>
  )
}

function MiniCalendar() {
  const today = new Date()
  const year = today.getFullYear(); const month = today.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay = new Date(year, month, 1).getDay()
  const adjustedFirst = firstDay === 0 ? 6 : firstDay - 1
  const DAYS = ['L','M','M','J','V','S','D']
  const MONTHS = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Aoû','Sep','Oct','Nov','Déc']
  const highlightedDays = [10, 17, 24]
  const cells: (number | null)[] = []
  for (let i = 0; i < adjustedFirst; i++) cells.push(null)
  for (let i = 1; i <= daysInMonth; i++) cells.push(i)
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: '#0F172A' }}>{MONTHS[month]} {year}</p>
        <span style={{ fontSize: 10, color: '#94A3B8' }}>Semaine en cours</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 6 }}>
        {DAYS.map((d, i) => <div key={i} style={{ textAlign: 'center', fontSize: 10, color: '#94A3B8', fontWeight: 600, padding: '2px 0' }}>{d}</div>)}
        {cells.map((day, i) => (
          <div key={i} style={{ textAlign: 'center', fontSize: 11, padding: '4px 2px', borderRadius: 5, background: day === today.getDate() ? '#4F46E5' : highlightedDays.includes(day!) ? '#EEF2FF' : 'transparent', color: day === today.getDate() ? 'white' : highlightedDays.includes(day!) ? '#4F46E5' : day ? '#475569' : 'transparent', fontWeight: day === today.getDate() || highlightedDays.includes(day!) ? 700 : 400 }}>
            {day || ''}
          </div>
        ))}
      </div>
      <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '8px 10px', marginTop: 8 }}>
        <p style={{ fontSize: 11, color: '#475569', lineHeight: 1.5 }}>
          <span style={{ fontWeight: 600, color: '#0F172A' }}>Prochain déballage :</span> Samedi à Roquevaire (4.2 km)
        </p>
      </div>
    </div>
  )
}

function EmptyState({ onAction }: { onAction: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ textAlign: 'center', padding: '36px 24px' }}>
      <div style={{ width: 64, height: 64, background: 'linear-gradient(135deg, #EEF2FF, #E0E7FF)', borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
        <Rocket size={28} style={{ color: '#4F46E5' }} />
      </div>
      <p style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>Lancez-vous !</p>
      <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6, marginBottom: 20, maxWidth: 280, margin: '0 auto 20px' }}>
        Vous n'avez encore envoyé aucune candidature. Des dizaines de marchés vous attendent en PACA.
      </p>
      <button onClick={onAction}
        style={{ background: '#4F46E5', color: 'white', border: 'none', borderRadius: 10, padding: '11px 24px', fontSize: 13, fontWeight: 700, cursor: 'pointer', width: '100%', marginBottom: 6 }}>
        🗺️ Voir les marchés disponibles
      </button>
      <p style={{ fontSize: 11, color: '#94A3B8' }}>Gratuit · Réponse sous 48h · Sans engagement</p>
    </motion.div>
  )
}

function DashboardContent() {
  const [profile, setProfile] = useState<any>(null)
  const [nearbyEvents, setNearbyEvents] = useState<any[]>([])
  const [candidatures, setCandidatures] = useState<any[]>([])
  const [stats, setStats] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [payingId, setPayingId] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const isMobile = useIsMobile()

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth'); return }
    const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    setProfile(profileData)
    if (profileData?.role === 'organisateur') { router.push('/dashboard/organisateur'); return }
    const { data: eventsData } = await supabase.from('events').select('*').eq('status', 'published').order('start_date', { ascending: true }).limit(5)
    setNearbyEvents(eventsData || [])
    const { data: apps } = await supabase.from('applications').select(`*, events:event_id(title, start_date, location_name, price_per_spot)`).eq('exposant_id', user.id).order('created_at', { ascending: false })
    setCandidatures(apps || [])
    const { data: expData } = await supabase.from('exposant_data').select('plan, is_verified').eq('user_id', user.id).single()
    setStats({ total: apps?.length || 0, validated: apps?.filter((a: any) => a.status === 'validated').length || 0, paid: apps?.filter((a: any) => a.status === 'paid').length || 0, pending: apps?.filter((a: any) => a.status === 'pending').length || 0, plan: expData?.plan || 'gratuit', isVerified: expData?.is_verified || false })
    setLoading(false)
  }

  useEffect(() => { loadData() }, [searchParams])

  // ✅ Skeleton au lieu du spinner
  if (loading) return <DashboardSkeleton isMobile={isMobile} />

  const candidaturesAPayer = candidatures.filter(c => c.status === 'validated')

  const handlePayer = async (candidature: any) => {
    setPayingId(candidature.id)
    try {
      const res = await fetch('/api/create-checkout-session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ candidatureId: candidature.id, eventTitle: candidature.events?.title || '', amount: candidature.events?.price_per_spot || 0, exposantEmail: profile?.email || '', exposantNom: profile?.full_name || '' }) })
      const { url, error } = await res.json()
      if (error) throw new Error(error)
      if (url) window.location.href = url
    } catch (err: any) { alert('Erreur paiement : ' + err.message) }
    setPayingId(null)
  }

  const isNewUser = candidatures.length === 0 && nearbyEvents.length === 0 && !stats.isVerified

  if (isNewUser) return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#EEF2F7', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <Sidebar profile={profile} />
      <div style={{ marginLeft: isMobile ? 0 : 220, flex: 1, minWidth: 0 }}>
        <header style={{ background: 'white', borderBottom: '1px solid #E2E8F0', padding: isMobile ? '0 16px 0 60px' : '0 28px', height: 52, display: 'flex', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>Salut {profile?.full_name?.split(' ')[0]} 👋</p>
        </header>
        <style>{`@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <main style={{ padding: isMobile ? '20px 16px' : '40px 28px', maxWidth: 600, margin: '0 auto' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div style={{ background: 'linear-gradient(135deg, #0F172A, #1E293B)', borderRadius: 16, padding: isMobile ? '24px' : '32px', marginBottom: 20, textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 14 }}>🎪</div>
              <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 800, color: 'white', marginBottom: 10 }}>Bienvenue sur PulseMarket !</h1>
              <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.7 }}>Votre plateforme pour trouver et gérer vos participations aux marchés en PACA.</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'Complétez votre profil exposant', sub: 'Ajoutez votre SIREN, Kbis et RC Pro', done: stats.isVerified, path: '/dashboard/profil', cta: 'Compléter mon profil', emoji: '📋' },
                { label: 'Explorez les marchés disponibles', sub: 'Des dizaines d\'événements en PACA', done: false, path: '/dashboard/evenements', cta: 'Voir les marchés', emoji: '🗺️' },
                { label: 'Envoyez votre première candidature', sub: 'Gratuit · Réponse sous 48h', done: false, path: '/dashboard/evenements', cta: 'Postuler maintenant', emoji: '🚀' },
              ].map((step, i) => (
                <div key={i} style={{ background: 'white', border: `1px solid ${step.done ? '#BBF7D0' : '#E2E8F0'}`, borderRadius: 12, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: step.done ? '#F0FDF4' : '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18 }}>
                    {step.done ? '✅' : step.emoji}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 2 }}>{step.label}</p>
                    <p style={{ fontSize: 11, color: '#94A3B8' }}>{step.sub}</p>
                  </div>
                  {!step.done && (
                    <button onClick={() => router.push(step.path)}
                      style={{ background: '#4F46E5', color: 'white', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {step.cta}
                    </button>
                  )}
                </div>
              ))}
            </div>
            <p style={{ textAlign: 'center', fontSize: 12, color: '#94A3B8' }}>
              Besoin d'aide ? <span style={{ color: '#4F46E5' }}>contact@pulse-market.fr</span>
            </p>
          </motion.div>
        </main>
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#EEF2F7', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <Sidebar profile={profile} />
      <div className="dash-wrap" style={{ marginLeft: isMobile ? 0 : 220, flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header className="dash-header" style={{ background: 'white', borderBottom: '1px solid #E2E8F0', padding: isMobile ? '0 16px 0 60px' : '0 28px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>Salut {profile?.full_name?.split(' ')[0]} 👋</p>
            <p style={{ fontSize: 11, color: '#94A3B8' }}>Tableau de bord — Exposant</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 16 }}>
            {!isMobile && <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#64748B' }}><MapPin size={12} style={{ color: '#4F46E5' }} /> Bouches-du-Rhône</div>}
            <div style={{ position: 'relative' }}>
              <button style={{ background: 'none', border: '1px solid #E2E8F0', borderRadius: 8, padding: '5px 8px', cursor: 'pointer' }}>
                <Bell size={14} style={{ color: '#64748B' }} />
              </button>
              {candidaturesAPayer.length > 0 && <span style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, background: '#DC2626', borderRadius: '50%', fontSize: 9, fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{candidaturesAPayer.length}</span>}
            </div>
          </div>
        </header>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } } .hide-scrollbar::-webkit-scrollbar { display: none; }`}</style>

        <main className="dash-main" style={{ padding: isMobile ? '16px 14px' : '24px 28px', flex: 1 }}>
          <motion.div variants={stagger} initial="hidden" animate="visible" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {candidaturesAPayer.length > 0 && (
              <motion.div variants={fadeUp}>
                {candidaturesAPayer.map(c => (
                  <div key={c.id} style={{ background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', borderRadius: 14, padding: isMobile ? '14px' : '18px 22px', display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12, boxShadow: '0 4px 24px rgba(79,70,229,0.25)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 38, height: 38, background: 'rgba(255,255,255,0.15)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <CheckCircle size={20} style={{ color: 'white' }} />
                      </div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: 'white', marginBottom: 2 }}>Candidature acceptée !</p>
                        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)' }}><strong style={{ color: 'white' }}>{c.events?.title}</strong> — payez pour confirmer.</p>
                      </div>
                    </div>
                    <button onClick={() => handlePayer(c)} disabled={payingId === c.id}
                      style={{ background: 'white', color: '#4F46E5', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, width: isMobile ? '100%' : 'auto', justifyContent: 'center' }}>
                      {payingId === c.id ? <><Loader size={13} style={{ animation: 'spin 0.8s linear infinite' }} /> Chargement...</> : <><CreditCard size={14} /> Payer {(c.events?.price_per_spot || 0) + 2} €</>}
                    </button>
                  </div>
                ))}
              </motion.div>
            )}

            <motion.div variants={fadeUp} style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 10 }}>
              {[
                { label: 'Candidatures', value: stats.total||0, spark: [0,1,1,2,1,2,stats.total||0], color: '#4F46E5' },
                { label: 'Validées', value: stats.validated||0, spark: [0,0,1,1,1,1,stats.validated||0], color: '#16A34A' },
                { label: 'En attente', value: stats.pending||0, spark: [0,1,0,1,1,0,stats.pending||0], color: '#F59E0B' },
                { label: 'Places payées', value: stats.paid||0, spark: [0,0,0,1,1,1,stats.paid||0], color: '#0EA5E9' },
              ].map((s, i) => (
                <div key={i} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: '14px 16px' }}>
                  <p style={{ fontSize: 10, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{s.label}</p>
                  <p style={{ fontSize: 26, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>{s.value}</p>
                  <Sparkline values={s.spark} color={s.color} />
                </div>
              ))}
            </motion.div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 300px', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
                <motion.div variants={fadeUp} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
                  <div style={{ padding: '14px 18px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>Marchés à proximité</p>
                    <button onClick={() => router.push('/dashboard/evenements')} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#4F46E5', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
                      Voir tout <ArrowUpRight size={13} />
                    </button>
                  </div>
                  {nearbyEvents.length === 0 ? (
                    <div style={{ padding: '32px', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>Aucun événement disponible</div>
                  ) : (
                    <div className="hide-scrollbar" style={{ overflowX: 'auto', display: 'flex', gap: 12, padding: '14px 18px', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
                      {nearbyEvents.filter(event => !candidatures.find(c => c.event_id === event.id && c.status === 'paid')).slice(0, 5).map((event: any, i: number) => {
                        const gradients = ['linear-gradient(135deg, #4F46E5, #7C3AED)', 'linear-gradient(135deg, #0EA5E9, #4F46E5)', 'linear-gradient(135deg, #16A34A, #0EA5E9)', 'linear-gradient(135deg, #EA580C, #DC2626)', 'linear-gradient(135deg, #7C3AED, #EC4899)']
                        return (
                          <div key={event.id} onClick={() => router.push(`/dashboard/candidature?eventId=${event.id}&eventName=${encodeURIComponent(event.title)}&eventDate=${encodeURIComponent(new Date(event.start_date).toLocaleDateString('fr-FR'))}&eventLocation=${encodeURIComponent(event.location_name || '')}`)}
                            style={{ flexShrink: 0, width: 175, borderRadius: 12, overflow: 'hidden', border: '1px solid #E2E8F0', cursor: 'pointer', background: 'white' }}>
                            <div style={{ height: 100, position: 'relative', overflow: 'hidden', background: gradients[i % gradients.length] }}>
                              {event.image_url && <img src={event.image_url} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 60%)' }} />
                              <div style={{ position: 'absolute', bottom: 6, left: 8, display: 'flex', alignItems: 'center', gap: 3 }}>
                                <MapPin size={9} style={{ color: 'white' }} /><span style={{ fontSize: 9, color: 'white', fontWeight: 500 }}>{event.location_name?.split(',')[0]}</span>
                              </div>
                            </div>
                            <div style={{ padding: '10px 12px' }}>
                              <p style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{event.title}</p>
                              <p style={{ fontSize: 11, color: '#94A3B8', marginBottom: 6 }}>{new Date(event.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</p>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: 13, fontWeight: 800, color: '#4F46E5' }}>{event.price_per_spot === 0 ? 'Gratuit' : `${event.price_per_spot}€`}</span>
                                <span style={{ fontSize: 10, color: '#94A3B8' }}>{event.available_spots} places</span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </motion.div>

                <motion.div variants={fadeUp} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
                  <div style={{ padding: '14px 18px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>Suivi de mes dossiers</p>
                    <span style={{ fontSize: 11, color: '#94A3B8' }}>{candidatures.length} dossier(s)</span>
                  </div>
                  {candidatures.length === 0 ? (
                    <EmptyState onAction={() => router.push('/dashboard/evenements')} />
                  ) : (
                    <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 18 }}>
                      {candidatures.slice(0, 4).map((c) => (
                        <div key={c.id}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <p style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>{c.events?.title || 'Événement'}</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                              {c.status === 'validated' && (
                                <button onClick={() => handlePayer(c)} disabled={payingId === c.id}
                                  style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#4F46E5', color: 'white', border: 'none', borderRadius: 7, padding: '4px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                                  <CreditCard size={10} /> Payer
                                </button>
                              )}
                              <span style={{ fontSize: 10, fontWeight: 600, color: c.status === 'validated' ? '#16A34A' : c.status === 'paid' ? '#4F46E5' : '#F59E0B', background: c.status === 'validated' ? '#F0FDF4' : c.status === 'paid' ? '#EEF2FF' : '#FFFBEB', padding: '2px 8px', borderRadius: 100 }}>
                                {c.status === 'validated' ? 'Accepté' : c.status === 'paid' ? 'Confirmé' : 'En attente'}
                              </span>
                            </div>
                          </div>
                          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                            <CandidatureTimeline status={c.status} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              </div>

              <motion.div variants={fadeUp} style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
                <div style={{ background: 'linear-gradient(135deg, #F59E0B, #EF4444)', borderRadius: 12, padding: '14px 16px', cursor: 'pointer' }} onClick={() => router.push('/dashboard/boost')}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 10 }}>
                    <span style={{ fontSize: 22, flexShrink: 0 }}>🚀</span>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 700, color: 'white', marginBottom: 2 }}>Booster ma visibilité</p>
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5 }}>Apparaissez en tête sur Whatmarket — 20€</p>
                    </div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 8, padding: '8px 12px', textAlign: 'center' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'white' }}>Mettre ma pub en ligne →</span>
                  </div>
                </div>

                {stats.plan !== 'pro' && (
                  <div style={{ background: '#0F172A', borderRadius: 12, padding: '14px 16px' }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 10 }}>
                      <Zap size={14} style={{ color: '#FBBF24', flexShrink: 0, marginTop: 1 }} />
                      <div>
                        <p style={{ fontSize: 12, fontWeight: 600, color: 'white', marginBottom: 2 }}>Passez en Pro — 20€/mois</p>
                        <p style={{ fontSize: 11, color: '#64748B', lineHeight: 1.5 }}>Candidatures illimitées, alertes, événements exclusifs</p>
                      </div>
                    </div>
                    <button style={{ width: '100%', background: '#4F46E5', color: 'white', border: 'none', borderRadius: 8, padding: '8px 0', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Upgrader →</button>
                  </div>
                )}

                <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: '14px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Mon plan</p>
                    <Star size={14} style={{ color: stats.plan === 'pro' ? '#FBBF24' : '#CBD5E1' }} />
                  </div>
                  <p style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', marginBottom: 3 }}>{stats.plan === 'pro' ? 'Pro' : 'Gratuit'}</p>
                  <p style={{ fontSize: 12, color: '#94A3B8' }}>{stats.plan === 'pro' ? 'Candidatures illimitées' : '1 candidature / mois'}</p>
                </div>

                {!isMobile && (
                  <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: '14px 16px' }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Calendrier</p>
                    <MiniCalendar />
                  </div>
                )}

                <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: '14px 16px' }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Mon dossier exposant</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                    {[{ label: 'Extrait Kbis', status: true }, { label: 'Attestation RC Pro', status: true }, { label: 'Vérification SIREN', status: stats.isVerified }].map((doc, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 12, color: '#475569' }}>{doc.label}</span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: doc.status ? '#16A34A' : '#F59E0B' }}>{doc.status ? '✓ Fourni' : '⏳ Manquant'}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => router.push('/dashboard/profil')} style={{ width: '100%', background: '#4F46E5', color: 'white', border: 'none', borderRadius: 9, padding: '10px 0', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, marginBottom: 8 }}>
                    <Camera size={14} /> Numériser un document
                  </button>
                  <button onClick={() => router.push('/dashboard/profil')} style={{ width: '100%', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '8px 0', fontSize: 12, fontWeight: 500, color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    Gérer mon dossier <ChevronRight size={13} />
                  </button>
                </div>

                {stats.isVerified && (
                  <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 12, padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <Shield size={15} style={{ color: '#16A34A', flexShrink: 0, marginTop: 1 }} />
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 600, color: '#15803D', marginBottom: 2 }}>Dossier certifié INSEE</p>
                      <p style={{ fontSize: 11, color: '#16A34A', lineHeight: 1.5 }}>SIREN vérifié — badge visible par tous les organisateurs.</p>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  )
}

export default function Dashboard() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#EEF2F7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 28, height: 28, border: '2px solid #4F46E5', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}
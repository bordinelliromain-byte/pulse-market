'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import {
  LayoutDashboard, Map, FileText, Receipt, Settings,
  LogOut, ChevronRight, CheckCircle, Clock, Star,
  TrendingUp, Users, Plus, Bell, MapPin, ArrowUpRight,
  Shield, Zap, Camera, Send, Eye, CreditCard
} from 'lucide-react'

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
}

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
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
    { key: 'read', label: 'Lu par la mairie', icon: <Eye size={12} /> },
    { key: 'validating', label: 'En validation', icon: <Clock size={12} /> },
    { key: 'validated', label: 'Paiement reçu', icon: <CreditCard size={12} /> },
  ]
  const activeIndex = status === 'validated' ? 3 : status === 'pending' ? 1 : 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
      {steps.map((step, i) => (
        <div key={step.key} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 'none' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: i <= activeIndex ? '#4F46E5' : '#F1F5F9', color: i <= activeIndex ? 'white' : '#94A3B8', border: i === activeIndex ? '2px solid #818CF8' : '2px solid transparent', boxShadow: i === activeIndex ? '0 0 0 3px rgba(79,70,229,0.15)' : 'none', transition: 'all 0.3s', flexShrink: 0 }}>
              {i < activeIndex ? <CheckCircle size={12} /> : step.icon}
            </div>
            <span style={{ fontSize: 10, color: i <= activeIndex ? '#4F46E5' : '#94A3B8', fontWeight: i === activeIndex ? 600 : 400, whiteSpace: 'nowrap' }}>{step.label}</span>
          </div>
          {i < steps.length - 1 && (
            <div style={{ flex: 1, height: 2, background: i < activeIndex ? '#4F46E5' : '#E2E8F0', margin: '0 4px', marginBottom: 18, borderRadius: 2, transition: 'background 0.3s' }} />
          )}
        </div>
      ))}
    </div>
  )
}

function MiniCalendar() {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay = new Date(year, month, 1).getDay()
  const adjustedFirst = firstDay === 0 ? 6 : firstDay - 1
  const DAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
  const MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
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
        {DAYS.map((d, i) => (
          <div key={i} style={{ textAlign: 'center', fontSize: 10, color: '#94A3B8', fontWeight: 600, padding: '2px 0' }}>{d}</div>
        ))}
        {cells.map((day, i) => (
          <div key={i} style={{ textAlign: 'center', fontSize: 11, padding: '4px 2px', borderRadius: 5, background: day === today.getDate() ? '#4F46E5' : highlightedDays.includes(day!) ? '#EEF2FF' : 'transparent', color: day === today.getDate() ? 'white' : highlightedDays.includes(day!) ? '#4F46E5' : day ? '#475569' : 'transparent', fontWeight: day === today.getDate() || highlightedDays.includes(day!) ? 700 : 400, position: 'relative' }}>
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

const NAV_ITEMS = [
  { icon: <LayoutDashboard size={15} />, label: 'Dashboard', path: '/dashboard' },
  { icon: <Map size={15} />, label: 'Marchés', path: '/dashboard/evenements' },
  { icon: <FileText size={15} />, label: 'Documents', path: '/dashboard/profil' },
  { icon: <Receipt size={15} />, label: 'Factures', path: '/dashboard/factures' },
  { icon: <Settings size={15} />, label: 'Paramètres', path: '/dashboard/parametres' },
]

const MOCK_CANDIDATURES = [
  { name: 'Fête de la Lavande — Apt', status: 'validated' },
  { name: 'Marché de Noël — Aix', status: 'pending' },
]

export default function Dashboard() {
  const [profile, setProfile] = useState<any>(null)
  const [nearbyEvents, setNearbyEvents] = useState<any[]>([])
  const [stats, setStats] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [activeNav, setActiveNav] = useState('Dashboard')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }

      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(profileData)

      // Redirect organisateur
      if (profileData?.role === 'organisateur') {
        router.push('/dashboard/organisateur')
        return
      }

      // Fetch nearby events pour exposant
      const { data: eventsData } = await supabase
        .from('events')
        .select('*')
        .eq('status', 'published')
        .order('start_date', { ascending: true })
        .limit(5)
      setNearbyEvents(eventsData || [])

      // Stats exposant
      if (profileData?.role === 'exposant') {
        const { data: apps } = await supabase.from('applications').select('status').eq('exposant_id', user.id)
        const { data: expData } = await supabase.from('exposant_data').select('plan, is_verified').eq('user_id', user.id).single()
        setStats({
          total: apps?.length || 0,
          validated: apps?.filter(a => a.status === 'validated').length || 0,
          pending: apps?.filter(a => a.status === 'pending').length || 0,
          plan: expData?.plan || 'gratuit',
          isVerified: expData?.is_verified || false,
        })
      }

      setLoading(false)
    }
    getData()
  }, [])

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 28, height: 28, border: '2px solid #4F46E5', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#EEF2F7', fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* SIDEBAR */}
      <aside style={{ width: 220, background: '#020617', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 20 }}>
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, background: '#4F46E5', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'white', fontSize: 11, fontWeight: 700 }}>PM</span>
            </div>
            <span style={{ color: 'white', fontWeight: 600, fontSize: 14 }}>PlaceMarket</span>
          </div>
        </div>
        <nav style={{ flex: 1, padding: '12px 10px' }}>
          <p style={{ fontSize: 10, fontWeight: 600, color: '#475569', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '8px 10px', marginBottom: 4 }}>Navigation</p>
          {NAV_ITEMS.map((item) => (
            <button key={item.label} onClick={() => { setActiveNav(item.label); router.push(item.path) }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', background: activeNav === item.label ? 'rgba(79,70,229,0.15)' : 'transparent', color: activeNav === item.label ? '#818CF8' : '#64748B', fontSize: 13, fontWeight: activeNav === item.label ? 600 : 400, marginBottom: 2, textAlign: 'left', transition: 'all 0.15s' }}>
              {item.icon}{item.label}
            </button>
          ))}
        </nav>
        <div style={{ padding: '12px 10px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ padding: '8px 10px', marginBottom: 4 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#CBD5E1' }}>{profile?.full_name}</p>
            <p style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>{profile?.email}</p>
          </div>
          <button onClick={async () => { await supabase.auth.signOut(); router.push('/') }}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'transparent', color: '#64748B', fontSize: 12 }}>
            <LogOut size={13} /> Déconnexion
          </button>
        </div>
      </aside>

      <div style={{ marginLeft: 220, flex: 1, display: 'flex', flexDirection: 'column' }}>

        {/* TOP BAR */}
        <header style={{ background: 'white', borderBottom: '1px solid #E2E8F0', padding: '0 28px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>
            Tableau de bord — <span style={{ color: '#64748B', fontWeight: 400 }}>Exposant</span>
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22C55E', display: 'inline-block', animation: 'pulse-live 2s infinite' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#22C55E', letterSpacing: '0.05em' }}>LIVE</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#64748B' }}>
              <MapPin size={12} style={{ color: '#4F46E5' }} />
              Bouches-du-Rhône, PACA
            </div>
            <button style={{ background: 'none', border: '1px solid #E2E8F0', borderRadius: 8, padding: '5px 8px', cursor: 'pointer' }}>
              <Bell size={14} style={{ color: '#64748B' }} />
            </button>
          </div>
        </header>

        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes pulse-live {
            0% { box-shadow: 0 0 0 0 rgba(34,197,94,0.4); }
            70% { box-shadow: 0 0 0 6px rgba(34,197,94,0); }
            100% { box-shadow: 0 0 0 0 rgba(34,197,94,0); }
          }
          .hide-scrollbar::-webkit-scrollbar { display: none; }
        `}</style>

        <main style={{ padding: '24px 28px', flex: 1 }}>
          <motion.div variants={stagger} initial="hidden" animate="visible" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* STATS */}
            <motion.div variants={fadeUp} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
              {[
                { label: 'Candidatures envoyées', value: stats.total || 0, spark: [0, 1, 1, 2, 1, 2, stats.total || 0], color: '#4F46E5' },
                { label: 'Candidatures validées', value: stats.validated || 0, spark: [0, 0, 1, 1, 1, 1, stats.validated || 0], color: '#16A34A' },
                { label: 'En attente', value: stats.pending || 0, spark: [0, 1, 0, 1, 1, 0, stats.pending || 0], color: '#F59E0B' },
                { label: 'Taux de validation', value: stats.total > 0 ? `${Math.round((stats.validated / stats.total) * 100)}%` : '—', spark: [0, 20, 40, 50, 60, 75, stats.total > 0 ? Math.round((stats.validated / stats.total) * 100) : 0], color: '#0EA5E9' },
              ].map((s, i) => (
                <div key={i} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: '16px 18px' }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>{s.label}</p>
                  <p style={{ fontSize: 28, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>{s.value}</p>
                  <Sparkline values={s.spark} color={s.color} />
                </div>
              ))}
            </motion.div>

            {/* SPLIT */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16 }}>

              {/* LEFT */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* CAROUSEL MARCHÉS SUGGÉRÉS */}
                <motion.div variants={fadeUp} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>Marchés suggérés à proximité</p>
                      <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>Basé sur votre zone PACA</p>
                    </div>
                    <button onClick={() => router.push('/dashboard/evenements')}
                      style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#4F46E5', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
                      Voir tout <ArrowUpRight size={13} />
                    </button>
                  </div>

                  {nearbyEvents.length === 0 ? (
                    <div style={{ padding: '32px', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>
                      Aucun événement disponible pour le moment
                    </div>
                  ) : (
                    <div
                      className="hide-scrollbar"
                      style={{ overflowX: 'auto', display: 'flex', gap: 14, padding: '16px 20px', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                      {nearbyEvents.slice(0, 5).map((event: any, i: number) => {
                        const gradients = [
                          'linear-gradient(135deg, #4F46E5, #7C3AED)',
                          'linear-gradient(135deg, #0EA5E9, #4F46E5)',
                          'linear-gradient(135deg, #16A34A, #0EA5E9)',
                          'linear-gradient(135deg, #EA580C, #DC2626)',
                          'linear-gradient(135deg, #7C3AED, #EC4899)',
                        ]
                        return (
                          <div key={event.id}
                            onClick={() => router.push(`/dashboard/candidature?eventId=${event.id}&eventName=${encodeURIComponent(event.title)}&eventDate=${encodeURIComponent(new Date(event.start_date).toLocaleDateString('fr-FR'))}&eventLocation=${encodeURIComponent(event.location_name || '')}`)}
                            style={{ flexShrink: 0, width: 190, borderRadius: 12, overflow: 'hidden', border: '1px solid #E2E8F0', cursor: 'pointer', transition: 'all 0.2s', background: 'white' }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(79,70,229,0.15)'; e.currentTarget.style.borderColor = '#C7D2FE' }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#E2E8F0' }}>
                            <div style={{ height: 110, position: 'relative', overflow: 'hidden', background: gradients[i % gradients.length] }}>
                              {event.image_url && (
                                <img src={event.image_url} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              )}
                              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 60%)' }} />
                              {event.is_exclusive && (
                                <span style={{ position: 'absolute', top: 7, left: 7, background: '#FBBF24', color: '#92400E', fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 100 }}>PRO</span>
                              )}
                              <div style={{ position: 'absolute', bottom: 6, left: 8, display: 'flex', alignItems: 'center', gap: 3 }}>
                                <MapPin size={9} style={{ color: 'white' }} />
                                <span style={{ fontSize: 9, color: 'white', fontWeight: 500 }}>{event.location_name?.split(',')[0]}</span>
                              </div>
                            </div>
                            <div style={{ padding: '10px 12px' }}>
                              <p style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', marginBottom: 4, lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{event.title}</p>
                              <p style={{ fontSize: 11, color: '#94A3B8', marginBottom: 8 }}>
                                {new Date(event.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                              </p>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: 13, fontWeight: 800, color: '#4F46E5' }}>
                                  {event.price_per_spot === 0 ? 'Gratuit' : `${event.price_per_spot}€`}
                                </span>
                                <span style={{ fontSize: 10, color: '#94A3B8' }}>{event.available_spots} places</span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </motion.div>

                {/* TIMELINE CANDIDATURES */}
                <motion.div variants={fadeUp} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: '18px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>Suivi de mes dossiers en cours</p>
                    <span style={{ fontSize: 11, color: '#94A3B8' }}>{stats.total || 0} dossier(s)</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {MOCK_CANDIDATURES.map((c, i) => (
                      <div key={i}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                          <p style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>{c.name}</p>
                          <span style={{ fontSize: 10, fontWeight: 600, color: c.status === 'validated' ? '#16A34A' : '#F59E0B', background: c.status === 'validated' ? '#F0FDF4' : '#FFFBEB', padding: '2px 8px', borderRadius: 100 }}>
                            {c.status === 'validated' ? 'Validé' : 'En attente'}
                          </span>
                        </div>
                        <CandidatureTimeline status={c.status} />
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>

              {/* RIGHT */}
              <motion.div variants={fadeUp} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                {stats.plan !== 'pro' && (
                  <div style={{ background: '#0F172A', borderRadius: 12, padding: '14px 16px' }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 10 }}>
                      <Zap size={14} style={{ color: '#FBBF24', flexShrink: 0, marginTop: 1 }} />
                      <div>
                        <p style={{ fontSize: 12, fontWeight: 600, color: 'white', marginBottom: 2 }}>Passez en Pro — 20€/mois</p>
                        <p style={{ fontSize: 11, color: '#64748B', lineHeight: 1.5 }}>Candidatures illimitées, alertes instantanées, événements exclusifs</p>
                      </div>
                    </div>
                    <button style={{ width: '100%', background: '#4F46E5', color: 'white', border: 'none', borderRadius: 8, padding: '8px 0', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      Upgrader maintenant →
                    </button>
                  </div>
                )}

                <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Mon plan</p>
                    <Star size={14} style={{ color: stats.plan === 'pro' ? '#FBBF24' : '#CBD5E1' }} />
                  </div>
                  <p style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', marginBottom: 3 }}>{stats.plan === 'pro' ? 'Pro' : 'Gratuit'}</p>
                  <p style={{ fontSize: 12, color: '#94A3B8' }}>{stats.plan === 'pro' ? 'Candidatures illimitées' : '1 candidature / mois'}</p>
                </div>

                <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: '16px' }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Calendrier</p>
                  <MiniCalendar />
                </div>

                <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: '16px' }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Mon dossier exposant</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                    {[
                      { label: 'Extrait Kbis', status: true },
                      { label: 'Attestation RC Pro', status: true },
                      { label: 'Vérification SIREN', status: stats.isVerified },
                    ].map((doc, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 12, color: '#475569' }}>{doc.label}</span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: doc.status ? '#16A34A' : '#F59E0B' }}>
                          {doc.status ? '✓ Fourni' : '⏳ Manquant'}
                        </span>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => router.push('/dashboard/profil')}
                    style={{ width: '100%', background: '#4F46E5', color: 'white', border: 'none', borderRadius: 9, padding: '10px 0', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, marginBottom: 8 }}>
                    <Camera size={14} /> Numériser un document
                  </button>
                  <button onClick={() => router.push('/dashboard/profil')}
                    style={{ width: '100%', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '8px 0', fontSize: 12, fontWeight: 500, color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    Gérer mon dossier <ChevronRight size={13} />
                  </button>
                </div>

                {stats.isVerified && (
                  <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 12, padding: '14px 16px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
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
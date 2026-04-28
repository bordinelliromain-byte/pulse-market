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

// STEPPER TIMELINE
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
            <div style={{
              width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: i <= activeIndex ? '#4F46E5' : '#F1F5F9',
              color: i <= activeIndex ? 'white' : '#94A3B8',
              border: i === activeIndex ? '2px solid #818CF8' : '2px solid transparent',
              boxShadow: i === activeIndex ? '0 0 0 3px rgba(79,70,229,0.15)' : 'none',
              transition: 'all 0.3s',
              flexShrink: 0,
            }}>
              {i < activeIndex ? <CheckCircle size={12} /> : step.icon}
            </div>
            <span style={{ fontSize: 10, color: i <= activeIndex ? '#4F46E5' : '#94A3B8', fontWeight: i === activeIndex ? 600 : 400, whiteSpace: 'nowrap' }}>
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div style={{ flex: 1, height: 2, background: i < activeIndex ? '#4F46E5' : '#E2E8F0', margin: '0 4px', marginBottom: 18, borderRadius: 2, transition: 'background 0.3s' }} />
          )}
        </div>
      ))}
    </div>
  )
}

// MINI CALENDAR
function MiniCalendar() {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay = new Date(year, month, 1).getDay()
  const adjustedFirst = firstDay === 0 ? 6 : firstDay - 1
  const DAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
  const MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
  const highlightedDays = [10, 17, 24] // jours avec marchés validés

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
          <div key={i} style={{
            textAlign: 'center', fontSize: 11, padding: '4px 2px', borderRadius: 5,
            background: day === today.getDate() ? '#4F46E5' : highlightedDays.includes(day!) ? '#EEF2FF' : 'transparent',
            color: day === today.getDate() ? 'white' : highlightedDays.includes(day!) ? '#4F46E5' : day ? '#475569' : 'transparent',
            fontWeight: day === today.getDate() || highlightedDays.includes(day!) ? 700 : 400,
            position: 'relative',
          }}>
            {day || ''}
            {highlightedDays.includes(day!) && day !== today.getDate() && (
              <div style={{ position: 'absolute', bottom: 1, left: '50%', transform: 'translateX(-50%)', width: 3, height: 3, borderRadius: '50%', background: '#4F46E5' }} />
            )}
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
  { icon: <Receipt size={15} />, label: 'Factures', path: '/dashboard' },
  { icon: <Settings size={15} />, label: 'Paramètres', path: '/dashboard' },
]

const MOCK_MARCHES = [
  { name: 'Marché Paysan de Roquevaire', date: '12 mai 2026', distance: '4.2 km', price: '35€', spots: 8, tag: 'Alimentaire' },
  { name: 'Foire Artisanale de Gémenos', date: '18 mai 2026', distance: '7.1 km', price: '50€', spots: 3, tag: 'Artisanat' },
  { name: 'Festival du Terroir — Aubagne', date: '24 mai 2026', distance: '2.8 km', price: '60€', spots: 12, tag: 'Exclusif Pro' },
  { name: 'Marché Nocturne Cassis', date: '31 mai 2026', distance: '15 km', price: '45€', spots: 5, tag: 'Alimentaire' },
]

const MOCK_CANDIDATURES = [
  { name: 'Fête de la Lavande — Apt', status: 'validated' },
  { name: 'Marché de Noël — Aix', status: 'pending' },
]

export default function Dashboard() {
  const [profile, setProfile] = useState<any>(null)
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
      if (profileData?.role === 'exposant') {
        const { data: apps } = await supabase.from('applications').select('status').eq('exposant_id', user.id)
        const { data: expData } = await supabase.from('exposant_data').select('plan, is_verified').eq('user_id', user.id).single()
        setStats({
          total: apps?.length || 0,
          validated: apps?.filter(a => a.status === 'validated').length || 0,
          pending: apps?.filter(a => a.status === 'pending').length || 0,
          plan: expData?.plan || 'gratuit',
          isVerified: expData?.is_verified || false
        })
      }
      if (profileData?.role === 'organisateur') {
        const { data: events } = await supabase.from('events').select('id').eq('organisateur_id', user.id)
        const eventIds = events?.map(e => e.id) || []
        let totalApps = 0, validatedApps = 0, pendingApps = 0
        if (eventIds.length > 0) {
          const { data: apps } = await supabase.from('applications').select('status').in('event_id', eventIds)
          totalApps = apps?.length || 0
          validatedApps = apps?.filter(a => a.status === 'validated').length || 0
          pendingApps = apps?.filter(a => a.status === 'pending').length || 0
        }
        setStats({ events: events?.length || 0, totalApps, validatedApps, pendingApps })
      }
      setLoading(false)
    }
    getData()
  }, [])

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 28, height: 28, border: '2px solid #4F46E5', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
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
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: activeNav === item.label ? 'rgba(79,70,229,0.15)' : 'transparent',
                color: activeNav === item.label ? '#818CF8' : '#64748B',
                fontSize: 13, fontWeight: activeNav === item.label ? 600 : 400,
                marginBottom: 2, textAlign: 'left', transition: 'all 0.15s',
              }}>
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

      {/* MAIN */}
      <div style={{ marginLeft: 220, flex: 1, display: 'flex', flexDirection: 'column' }}>

        {/* TOP BAR */}
        <header style={{ background: 'white', borderBottom: '1px solid #E2E8F0', padding: '0 28px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>
            Tableau de bord — <span style={{ color: '#64748B', fontWeight: 400 }}>{profile?.role === 'exposant' ? 'Exposant' : 'Organisateur'}</span>
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Badge LIVE */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                width: 7, height: 7, borderRadius: '50%', background: '#22C55E', display: 'inline-block',
                boxShadow: '0 0 0 0 rgba(34,197,94,0.4)',
                animation: 'pulse-live 2s infinite',
              }} />
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
          @keyframes pulse-live {
            0% { box-shadow: 0 0 0 0 rgba(34,197,94,0.4); }
            70% { box-shadow: 0 0 0 6px rgba(34,197,94,0); }
            100% { box-shadow: 0 0 0 0 rgba(34,197,94,0); }
          }
          .postuler-btn:hover {
            box-shadow: 0 0 16px rgba(79,70,229,0.5) !important;
            transform: translateY(-1px);
          }
        `}</style>

        <main style={{ padding: '24px 28px', flex: 1 }}>
          <motion.div variants={stagger} initial="hidden" animate="visible" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* ===== EXPOSANT ===== */}
            {profile?.role === 'exposant' && (
              <>
                {/* STATS */}
                <motion.div variants={fadeUp} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
                  {[
                    { label: 'Candidatures envoyées', value: stats.total, spark: [0, 1, 1, 2, 1, 2, stats.total], color: '#4F46E5' },
                    { label: 'Candidatures validées', value: stats.validated, spark: [0, 0, 1, 1, 1, 1, stats.validated], color: '#16A34A' },
                    { label: 'En attente', value: stats.pending, spark: [0, 1, 0, 1, 1, 0, stats.pending], color: '#F59E0B' },
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

                    {/* Marchés suggérés */}
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
                      {MOCK_MARCHES.map((m, i) => (
                        <div key={i}
                          style={{ padding: '13px 20px', borderBottom: i < MOCK_MARCHES.length - 1 ? '1px solid #F8FAFC' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'background 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <div style={{ display: 'flex', gap: 14, alignItems: 'center', flex: 1 }}>
                            <div style={{ width: 34, height: 34, background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <Map size={14} style={{ color: '#64748B' }} />
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                                <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{m.name}</p>
                                <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 100, background: m.tag === 'Exclusif Pro' ? '#FEF3C7' : '#F1F5F9', color: m.tag === 'Exclusif Pro' ? '#92400E' : '#64748B' }}>{m.tag}</span>
                              </div>
                              <div style={{ display: 'flex', gap: 10 }}>
                                <span style={{ fontSize: 11, color: '#94A3B8' }}>{m.date}</span>
                                <span style={{ fontSize: 11, color: '#94A3B8' }}>· {m.distance}</span>
                                <span style={{ fontSize: 11, color: '#94A3B8' }}>· {m.spots} places</span>
                              </div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{m.price}</span>
                            <button className="postuler-btn" style={{ background: '#4F46E5', color: 'white', border: 'none', borderRadius: 7, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
                              Postuler
                            </button>
                          </div>
                        </div>
                      ))}
                    </motion.div>

                    {/* TIMELINE CANDIDATURES */}
                    <motion.div variants={fadeUp} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: '18px 20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <p style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>Suivi de mes dossiers en cours</p>
                        <span style={{ fontSize: 11, color: '#94A3B8' }}>{stats.total} dossier(s)</span>
                      </div>
                      {MOCK_CANDIDATURES.length > 0 ? (
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
                      ) : (
                        <div style={{ textAlign: 'center', padding: '20px 0', color: '#94A3B8', fontSize: 13 }}>
                          Aucune candidature en cours — postulez à un marché ci-dessus
                        </div>
                      )}
                    </motion.div>

                  </div>

                  {/* RIGHT WIDGETS */}
                  <motion.div variants={fadeUp} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                    {/* Upgrade */}
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

                    {/* Mon Plan */}
                    <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <p style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Mon plan</p>
                        <Star size={14} style={{ color: stats.plan === 'pro' ? '#FBBF24' : '#CBD5E1' }} />
                      </div>
                      <p style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', marginBottom: 3 }}>{stats.plan === 'pro' ? 'Pro' : 'Gratuit'}</p>
                      <p style={{ fontSize: 12, color: '#94A3B8' }}>{stats.plan === 'pro' ? 'Candidatures illimitées' : '1 candidature / mois'}</p>
                    </div>

                    {/* MINI CALENDRIER */}
                    <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: '16px' }}>
                      <p style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Calendrier de la semaine</p>
                      <MiniCalendar />
                    </div>

                    {/* Mon Dossier */}
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

                      {/* BOUTON SCAN */}
                      <button
                        onClick={() => router.push('/dashboard/profil')}
                        style={{ width: '100%', background: '#4F46E5', color: 'white', border: 'none', borderRadius: 9, padding: '10px 0', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, marginBottom: 8, transition: 'opacity 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                      >
                        <Camera size={14} /> Numériser un document
                      </button>

                      <button onClick={() => router.push('/dashboard/profil')}
                        style={{ width: '100%', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '8px 0', fontSize: 12, fontWeight: 500, color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                        Gérer mon dossier <ChevronRight size={13} />
                      </button>
                    </div>

                    {/* Badge vérifié */}
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
              </>
            )}

            {/* ===== ORGANISATEUR ===== */}
            {profile?.role === 'organisateur' && (
              <>
                <motion.div variants={fadeUp} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
                  {[
                    { label: 'Événements publiés', value: stats.events, spark: [0, 1, 1, 2, 2, 3, stats.events], color: '#4F46E5' },
                    { label: 'Dossiers reçus', value: stats.totalApps, spark: [0, 1, 2, 2, 3, 4, stats.totalApps], color: '#0EA5E9' },
                    { label: 'Exposants validés', value: stats.validatedApps, spark: [0, 0, 1, 1, 2, 2, stats.validatedApps], color: '#16A34A' },
                    { label: 'En attente', value: stats.pendingApps, spark: [0, 1, 1, 2, 1, 1, stats.pendingApps], color: '#F59E0B' },
                  ].map((s, i) => (
                    <div key={i} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: '16px 18px' }}>
                      <p style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>{s.label}</p>
                      <p style={{ fontSize: 28, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>{s.value}</p>
                      <Sparkline values={s.spark} color={s.color} />
                    </div>
                  ))}
                </motion.div>
                <motion.div variants={fadeUp} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  {[
                    { icon: <Plus size={18} style={{ color: 'white' }} />, iconBg: '#0F172A', title: 'Créer un événement', desc: 'Publier un marché, une foire ou un festival', path: '/dashboard/creer-evenement' },
                    { icon: <Users size={18} style={{ color: '#4F46E5' }} />, iconBg: '#EEF2FF', title: 'Gérer les candidatures', desc: 'Consulter et valider les dossiers reçus', path: '/dashboard/candidatures' },
                  ].map((item, i) => (
                    <button key={i} onClick={() => router.push(item.path)}
                      style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'border-color 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = '#4F46E5'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = '#E2E8F0'}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ width: 38, height: 38, background: item.iconBg, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {item.icon}
                        </div>
                        <div>
                          <p style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', marginBottom: 3 }}>{item.title}</p>
                          <p style={{ fontSize: 12, color: '#94A3B8' }}>{item.desc}</p>
                        </div>
                      </div>
                      <ChevronRight size={16} style={{ color: '#CBD5E1' }} />
                    </button>
                  ))}
                </motion.div>
              </>
            )}

          </motion.div>
        </main>
      </div>
    </div>
  )
}
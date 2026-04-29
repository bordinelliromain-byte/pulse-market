'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import {
  LayoutDashboard, Map, FileText, Receipt, Settings,
  LogOut, Bell, MapPin, Plus, Users, CheckCircle,
  Clock, TrendingUp, Euro, Megaphone, ShieldCheck,
  BarChart3, Download, ChevronRight, ArrowUpRight,
  Zap, Activity
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

// Barre de progression circulaire
function CircularProgress({ value, size = 56, color = '#4F46E5' }: { value: number; size?: number; color?: string }) {
  const r = (size - 8) / 2
  const circ = 2 * Math.PI * r
  const dash = (value / 100) * circ
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E2E8F0" strokeWidth={5} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={5}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" style={{ transition: 'stroke-dasharray 0.6s ease' }} />
    </svg>
  )
}

const NAV_ITEMS = [
  { icon: <LayoutDashboard size={15} />, label: 'Dashboard', path: '/dashboard' },
  { icon: <Map size={15} />, label: 'Marchés', path: '/dashboard/creer-evenement' },
  { icon: <FileText size={15} />, label: 'Candidatures', path: '/dashboard/candidatures' },
  { icon: <Receipt size={15} />, label: 'Trésorerie', path: '/dashboard/tresorerie' },
  { icon: <Settings size={15} />, label: 'Paramètres', path: '/dashboard/parametres' },
]

const MOCK_ACTIVITIES = [
  { avatar: 'MM', name: 'Mme Martin', action: 'a payé sa place pour le Marché de Printemps', time: 'il y a 3 min', tag: 'Paiement', color: '#16A34A' },
  { avatar: 'JD', name: 'Jean Dupont', action: 'a mis à jour son attestation RC Pro', time: 'il y a 12 min', tag: 'Document', color: '#4F46E5' },
  { avatar: 'SB', name: 'Sophie Blanc', action: 'a soumis une candidature pour la Foire Artisanale', time: 'il y a 28 min', tag: 'Candidature', color: '#F59E0B' },
  { avatar: 'PL', name: 'Pierre Laurent', action: 'SIREN vérifié — dossier certifié automatiquement', time: 'il y a 1h', tag: 'Certification', color: '#0EA5E9' },
  { avatar: 'AM', name: 'Atelier Moreau', action: 'a été validé pour le Festival du Terroir', time: 'il y a 2h', tag: 'Validation', color: '#16A34A' },
]

export default function DashboardOrganisateur() {
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
      if (profileData?.role !== 'organisateur') { router.push('/dashboard'); return }
      setProfile(profileData)
      const { data: events } = await supabase.from('events').select('id, total_spots, available_spots, price_per_spot').eq('organisateur_id', user.id)
      const eventIds = events?.map(e => e.id) || []
      let totalApps = 0, validatedApps = 0, pendingApps = 0
      if (eventIds.length > 0) {
        const { data: apps } = await supabase.from('applications').select('status').in('event_id', eventIds)
        totalApps = apps?.length || 0
        validatedApps = apps?.filter(a => a.status === 'validated').length || 0
        pendingApps = apps?.filter(a => a.status === 'pending').length || 0
      }
      const totalSpots = events?.reduce((acc, e) => acc + (e.total_spots || 0), 0) || 0
      const occupiedSpots = events?.reduce((acc, e) => acc + ((e.total_spots || 0) - (e.available_spots || 0)), 0) || 0
      const occupancyRate = totalSpots > 0 ? Math.round((occupiedSpots / totalSpots) * 100) : 0
      const monthlyRevenue = validatedApps * 45
      setStats({ events: events?.length || 0, totalApps, validatedApps, pendingApps, occupancyRate, monthlyRevenue })
      setLoading(false)
    }
    getData()
  }, [])

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#EEF2F7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#CBD5E1' }}>{profile?.full_name}</p>
              <span style={{ fontSize: 9, fontWeight: 700, background: '#4F46E5', color: 'white', padding: '1px 6px', borderRadius: 100, letterSpacing: '0.05em' }}>VÉRIFIÉ</span>
            </div>
            <p style={{ fontSize: 11, color: '#475569' }}>Administration municipale</p>
          </div>
          <button onClick={async () => { await supabase.auth.signOut(); router.push('/') }}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'transparent', color: '#64748B', fontSize: 12 }}>
            <LogOut size={13} /> Déconnexion
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div style={{ marginLeft: 220, flex: 1 }}>

        {/* TOP BAR */}
        <header style={{ background: 'white', borderBottom: '1px solid #E2E8F0', padding: '0 28px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>
            Tableau de bord — <span style={{ color: '#64748B', fontWeight: 400 }}>Organisateur</span>
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
        `}</style>

        <main style={{ padding: '24px 28px' }}>
          <motion.div variants={stagger} initial="hidden" animate="visible" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* STATS ROW */}
            <motion.div variants={fadeUp} style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14 }}>
              {[
                { label: 'Événements publiés', value: stats.events, spark: [0, 1, 1, 2, 2, 3, stats.events], color: '#4F46E5' },
                { label: 'Dossiers reçus', value: stats.totalApps, spark: [0, 1, 2, 3, 3, 4, stats.totalApps], color: '#0EA5E9' },
                { label: 'Exposants validés', value: stats.validatedApps, spark: [0, 0, 1, 1, 2, 2, stats.validatedApps], color: '#16A34A' },
                { label: 'En attente', value: stats.pendingApps, spark: [0, 1, 1, 2, 1, 1, stats.pendingApps], color: '#F59E0B' },
                { label: 'Recettes du mois', value: `${stats.monthlyRevenue} €`, spark: [0, 200, 400, 350, 600, 750, stats.monthlyRevenue], color: '#4F46E5', highlight: true },
              ].map((s, i) => (
                <div key={i} style={{ background: s.highlight ? '#0F172A' : 'white', border: `1px solid ${s.highlight ? '#0F172A' : '#E2E8F0'}`, borderRadius: 12, padding: '16px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                    {s.highlight && <Euro size={12} style={{ color: '#818CF8' }} />}
                    <p style={{ fontSize: 11, fontWeight: 600, color: s.highlight ? '#64748B' : '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</p>
                  </div>
                  <p style={{ fontSize: s.highlight ? 22 : 28, fontWeight: 700, color: s.highlight ? 'white' : '#0F172A', marginBottom: 8 }}>{s.value}</p>
                  <Sparkline values={s.spark} color={s.color} />
                </div>
              ))}
            </motion.div>

            {/* SPLIT LAYOUT */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16 }}>

              {/* LEFT */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* BENTO GRID ACTIONS */}
                <motion.div variants={fadeUp}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Actions rapides</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>

                    {/* Publier un flash */}
                    <button onClick={() => router.push('/dashboard/candidatures')}
                      style={{ background: '#4F46E5', borderRadius: 12, padding: '18px', border: 'none', cursor: 'pointer', textAlign: 'left', position: 'relative', overflow: 'hidden' }}
                      onMouseEnter={e => e.currentTarget.style.opacity = '0.92'}
                      onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                      <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, background: 'rgba(255,255,255,0.06)', borderRadius: '50%' }} />
                      <div style={{ width: 34, height: 34, background: 'rgba(255,255,255,0.15)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                        <Megaphone size={16} style={{ color: 'white' }} />
                      </div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: 'white', marginBottom: 4 }}>Publier un flash</p>
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>SMS & email à tous les exposants d'un événement</p>
                    </button>

                    {/* Vérification en masse */}
                    <button onClick={() => router.push('/dashboard/candidatures')}
                      style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: '18px', cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = '#4F46E5'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = '#E2E8F0'}>
                      <div style={{ width: 34, height: 34, background: '#F0FDF4', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                        <ShieldCheck size={16} style={{ color: '#16A34A' }} />
                      </div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>Vérification en masse</p>
                      <p style={{ fontSize: 11, color: '#94A3B8', lineHeight: 1.5 }}>Valider tous les dossiers complets en 1 clic</p>
                      {stats.pendingApps > 0 && (
                        <span style={{ display: 'inline-block', marginTop: 8, background: '#FEF3C7', color: '#92400E', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100 }}>
                          {stats.pendingApps} dossier(s) en attente
                        </span>
                      )}
                    </button>

                    {/* Plan du marché */}
                    <button onClick={() => router.push('/dashboard/creer-evenement')}
                      style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: '18px', cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = '#4F46E5'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = '#E2E8F0'}>
                      <div style={{ width: 34, height: 34, background: '#EFF6FF', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                        <Map size={16} style={{ color: '#2563EB' }} />
                      </div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>Plan du marché</p>
                      <p style={{ fontSize: 11, color: '#94A3B8', lineHeight: 1.5 }}>Carte interactive des emplacements géolocalisés</p>
                    </button>

                    {/* Rapport Trésorerie */}
                    <button style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: '18px', cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = '#4F46E5'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = '#E2E8F0'}>
                      <div style={{ width: 34, height: 34, background: '#FFF7ED', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                        <Download size={16} style={{ color: '#EA580C' }} />
                      </div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>Rapport Trésorerie</p>
                      <p style={{ fontSize: 11, color: '#94A3B8', lineHeight: 1.5 }}>Export Excel pour la comptabilité municipale</p>
                    </button>

                  </div>
                </motion.div>

                {/* FLUX D'ACTIVITÉ */}
                <motion.div variants={fadeUp} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
                  <div style={{ padding: '14px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Activity size={15} style={{ color: '#4F46E5' }} />
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>Dernières activités</p>
                    </div>
                    <button style={{ fontSize: 12, color: '#4F46E5', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 500 }}>
                      Tout voir <ArrowUpRight size={12} />
                    </button>
                  </div>
                  <div>
                    {MOCK_ACTIVITIES.map((act, i) => (
                      <div key={i} style={{ padding: '12px 20px', borderBottom: i < MOCK_ACTIVITIES.length - 1 ? '1px solid #F8FAFC' : 'none', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#4F46E5' }}>{act.avatar}</span>
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: 12, color: '#0F172A', lineHeight: 1.5 }}>
                            <strong>{act.name}</strong> {act.action}
                          </p>
                          <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{act.time}</p>
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 100, background: `${act.color}15`, color: act.color, flexShrink: 0, marginTop: 2 }}>
                          {act.tag}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>

              </div>

              {/* RIGHT WIDGETS */}
              <motion.div variants={fadeUp} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                {/* Taux d'occupation */}
                <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: '18px' }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>Taux d'occupation</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ position: 'relative', width: 56, height: 56, flexShrink: 0 }}>
                      <CircularProgress value={stats.occupancyRate || 0} />
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#4F46E5' }}>{stats.occupancyRate || 0}%</span>
                      </div>
                    </div>
                    <div>
                      <p style={{ fontSize: 20, fontWeight: 700, color: '#0F172A' }}>{stats.occupancyRate || 0}%</p>
                      <p style={{ fontSize: 11, color: '#94A3B8', lineHeight: 1.5 }}>des emplacements sont occupés sur vos événements</p>
                    </div>
                  </div>
                </div>

                {/* Créer un événement */}
                <button onClick={() => router.push('/dashboard/creer-evenement')}
                  style={{ background: '#0F172A', border: '1px solid #0F172A', borderRadius: 12, padding: '16px', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 34, height: 34, background: '#4F46E5', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Plus size={16} style={{ color: 'white' }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'white', marginBottom: 2 }}>Créer un événement</p>
                      <p style={{ fontSize: 11, color: '#475569' }}>Publier un marché ou festival</p>
                    </div>
                  </div>
                  <ChevronRight size={15} style={{ color: '#475569' }} />
                </button>

                {/* Gérer candidatures */}
                <button onClick={() => router.push('/dashboard/candidatures')}
                  style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: '16px', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'border-color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#4F46E5'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#E2E8F0'}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 34, height: 34, background: '#EEF2FF', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Users size={16} style={{ color: '#4F46E5' }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', marginBottom: 2 }}>Gérer les candidatures</p>
                      <p style={{ fontSize: 11, color: '#94A3B8' }}>Valider ou refuser les dossiers</p>
                    </div>
                  </div>
                  <ChevronRight size={15} style={{ color: '#CBD5E1' }} />
                </button>

                {/* Résumé financier */}
                <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: '16px' }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Résumé financier</p>
                  {[
                    { label: 'Redevances encaissées', value: `${stats.monthlyRevenue} €`, color: '#16A34A' },
                    { label: 'Redevances en attente', value: `${(stats.pendingApps || 0) * 45} €`, color: '#F59E0B' },
                    { label: 'Total estimé', value: `${((stats.validatedApps || 0) + (stats.pendingApps || 0)) * 45} €`, color: '#4F46E5' },
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: i < 2 ? 10 : 0, marginBottom: i < 2 ? 10 : 0, borderBottom: i < 2 ? '1px solid #F1F5F9' : 'none' }}>
                      <span style={{ fontSize: 12, color: '#64748B' }}>{item.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: item.color }}>{item.value}</span>
                    </div>
                  ))}
                </div>

              </motion.div>
            </div>

          </motion.div>
        </main>
      </div>
    </div>
  )
}
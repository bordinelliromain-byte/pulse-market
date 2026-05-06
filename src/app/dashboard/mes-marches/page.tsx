'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import Sidebar from '@/components/Sidebar'
import {
  CalendarCheck, MapPin, Clock, CheckCircle,
  ChevronRight, Calendar, Trophy, ArrowRight
} from 'lucide-react'

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
}

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
}

export default function MesMarches() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [candidatures, setCandidatures] = useState<any[]>([])
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(profileData)

      const { data: apps } = await supabase
        .from('applications')
        .select(`*, events:event_id(id, title, start_date, end_date, location_name, image_url, price_per_spot, organisateur_id)`)
        .eq('exposant_id', user.id)
        .eq('status', 'paid')
        .order('created_at', { ascending: false })

      setCandidatures(apps || [])
      setLoading(false)
    }
    getData()
  }, [])

  const now = new Date()
  const upcoming = candidatures.filter(c => c.events?.start_date && new Date(c.events.start_date) >= now)
  const past = candidatures.filter(c => c.events?.start_date && new Date(c.events.start_date) < now)

  const formatDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  const formatShort = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })

  const daysUntil = (d: string) => {
    const diff = new Date(d).getTime() - now.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 28, height: 28, border: '2px solid #4F46E5', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <Sidebar profile={profile} />

      <div className="dash-wrap" style={{ marginLeft: 220, flex: 1 }}>
        <header style={{ background: 'white', borderBottom: '1px solid #E2E8F0', padding: '0 28px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 30, height: 30, background: '#EEF2FF', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CalendarCheck size={15} style={{ color: '#4F46E5' }} />
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>Mes marchés</p>
              <p style={{ fontSize: 11, color: '#94A3B8' }}>{upcoming.length} à venir · {past.length} passé{past.length > 1 ? 's' : ''}</p>
            </div>
          </div>
          <button onClick={() => router.push('/dashboard/evenements')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#4F46E5', color: 'white', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            Trouver un marché <ArrowRight size={13} />
          </button>
        </header>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

        <main style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 32 }}>
          <motion.div variants={stagger} initial="hidden" animate="visible">

            {/* ── PROCHAINS MARCHÉS ────────────────────────────────────────── */}
            <motion.section variants={fadeUp} style={{ marginBottom: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <CalendarCheck size={16} style={{ color: '#4F46E5' }} />
                <p style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Prochains marchés</p>
                <span style={{ background: '#EEF2FF', color: '#4F46E5', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 100 }}>{upcoming.length}</span>
              </div>

              {upcoming.length === 0 ? (
                <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 14, padding: '48px 24px', textAlign: 'center' }}>
                  <CalendarCheck size={36} style={{ margin: '0 auto 14px', color: '#CBD5E1' }} />
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#64748B', marginBottom: 6 }}>Aucun marché à venir</p>
                  <p style={{ fontSize: 12, color: '#94A3B8', marginBottom: 20 }}>Postulez à des marchés pour les voir apparaître ici</p>
                  <button onClick={() => router.push('/dashboard/evenements')}
                    style={{ background: '#4F46E5', color: 'white', border: 'none', borderRadius: 9, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    Voir les marchés disponibles
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {upcoming.map((c) => {
                    const days = daysUntil(c.events.start_date)
                    const isToday = days === 0
                    const isSoon = days <= 7
                    return (
                      <motion.div key={c.id} variants={fadeUp}
                        style={{ background: 'white', border: `1px solid ${isToday ? '#4F46E5' : isSoon ? '#C7D2FE' : '#E2E8F0'}`, borderRadius: 14, overflow: 'hidden', display: 'flex', transition: 'all 0.2s' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(79,70,229,0.1)'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = 'none'}>

                        {/* Image */}
                        <div style={{ width: 120, flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
                          {c.events.image_url ? (
                            <img src={c.events.image_url} alt={c.events.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', minHeight: 120 }} />
                          )}
                          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.2)' }} />
                        </div>

                        {/* Contenu */}
                        <div style={{ flex: 1, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                              <p style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>{c.events.title}</p>
                              {isToday && <span style={{ background: '#DC2626', color: 'white', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100 }}>AUJOURD'HUI</span>}
                              {isSoon && !isToday && <span style={{ background: '#EEF2FF', color: '#4F46E5', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100 }}>BIENTÔT</span>}
                            </div>
                            <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#64748B' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Calendar size={11} style={{ color: '#4F46E5' }} />
                                {formatDate(c.events.start_date)}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <MapPin size={11} style={{ color: '#4F46E5' }} />
                                {c.events.location_name?.split(',')[0]}
                              </div>
                            </div>
                            <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                              <span style={{ fontSize: 11, fontWeight: 600, background: '#F0FDF4', color: '#16A34A', padding: '3px 10px', borderRadius: 100, border: '1px solid #BBF7D0', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <CheckCircle size={10} /> Place confirmée
                              </span>
                              <span style={{ fontSize: 11, fontWeight: 600, background: '#F8FAFC', color: '#475569', padding: '3px 10px', borderRadius: 100, border: '1px solid #E2E8F0' }}>
                                {c.events.price_per_spot} € payé
                              </span>
                            </div>
                          </div>

                          {/* Countdown */}
                          <div style={{ textAlign: 'center', flexShrink: 0 }}>
                            <div style={{ width: 64, height: 64, borderRadius: 14, background: isToday ? '#DC2626' : isSoon ? '#4F46E5' : '#F8FAFC', border: `1px solid ${isToday ? '#DC2626' : isSoon ? '#4F46E5' : '#E2E8F0'}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                              <p style={{ fontSize: 22, fontWeight: 800, color: isToday || isSoon ? 'white' : '#0F172A', lineHeight: 1 }}>{isToday ? '!' : days}</p>
                              <p style={{ fontSize: 9, fontWeight: 600, color: isToday || isSoon ? 'rgba(255,255,255,0.8)' : '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{isToday ? 'Auj.' : 'jours'}</p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </motion.section>

            {/* ── MARCHÉS PASSÉS ───────────────────────────────────────────── */}
            <motion.section variants={fadeUp}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <Trophy size={16} style={{ color: '#F59E0B' }} />
                <p style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Marchés participés</p>
                <span style={{ background: '#FFFBEB', color: '#F59E0B', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 100, border: '1px solid #FDE68A' }}>{past.length}</span>
              </div>

              {past.length === 0 ? (
                <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 14, padding: '32px 24px', textAlign: 'center' }}>
                  <Trophy size={28} style={{ margin: '0 auto 10px', color: '#CBD5E1' }} />
                  <p style={{ fontSize: 13, color: '#94A3B8' }}>Votre historique apparaîtra ici après vos premiers marchés</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                  {past.map((c) => (
                    <motion.div key={c.id} variants={fadeUp}
                      style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden', opacity: 0.8 }}>
                      <div style={{ height: 80, position: 'relative', overflow: 'hidden' }}>
                        {c.events.image_url ? (
                          <img src={c.events.image_url} alt={c.events.title} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(30%)' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #94A3B8, #CBD5E1)' }} />
                        )}
                        <div style={{ position: 'absolute', top: 8, right: 8 }}>
                          <span style={{ background: 'rgba(0,0,0,0.5)', color: 'white', fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 100 }}>TERMINÉ</span>
                        </div>
                      </div>
                      <div style={{ padding: '12px 14px' }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>{c.events.title}</p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: '#94A3B8' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Calendar size={10} /> {formatShort(c.events.start_date)}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <MapPin size={10} /> {c.events.location_name?.split(',')[0]}
                          </div>
                          <span style={{ fontWeight: 600, color: '#475569' }}>{c.events.price_per_spot} €</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.section>

          </motion.div>
        </main>
      </div>
    </div>
  )
}
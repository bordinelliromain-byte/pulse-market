'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle, Search, Calendar, MapPin, Users,
  ChevronRight, Clock, AlertCircle, RefreshCw, Loader
} from 'lucide-react'

const BRAND = '#4F46E5'

function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t) }, [onClose])
  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', bottom: 100, left: 20, right: 20, zIndex: 200, background: '#1E293B', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, borderLeft: `3px solid ${type === 'success' ? '#22C55E' : '#DC2626'}` }}>
      {type === 'success' ? <CheckCircle size={15} style={{ color: '#22C55E' }} /> : <AlertCircle size={15} style={{ color: '#DC2626' }} />}
      <span style={{ fontSize: 13, fontWeight: 500, color: 'white' }}>{message}</span>
    </motion.div>
  )
}

export default function PlacierPlanning() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState<any[]>([])
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [candidatures, setCandidatures] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'present' | 'pending'>('all')
  const [refreshing, setRefreshing] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/placier'); return }
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (profileData?.role !== 'placier' && profileData?.role !== 'organisateur') {
        router.push('/dashboard'); return
      }
      setProfile(profileData)

      // ✅ Récupérer le planning du placier
      const today = new Date().toISOString().split('T')[0]
      let eventsData: any[] = []

      // 1. D'abord : événements via placier_planning
      const { data: planningData } = await supabase
        .from('placier_planning')
        .select(`event:event_id(*)`)
        .eq('placier_id', user.id)

      if (planningData && planningData.length > 0) {
        eventsData = planningData
          .map((p: any) => p.event)
          .filter(Boolean)
          .filter((e: any) => new Date(e.start_date) >= new Date(today + 'T00:00:00'))
          .sort((a: any, b: any) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
      } else {
        // Fallback : tous les événements de la mairie du placier
        if (profileData.mairie_id) {
          const { data: fallback } = await supabase
            .from('events').select('*')
            .eq('organisateur_id', profileData.mairie_id)
            .gte('start_date', today).order('start_date', { ascending: true }).limit(10)
          eventsData = fallback || []
        }
      }

      setEvents(eventsData)
      if (eventsData.length > 0) {
        setSelectedEvent(eventsData[0])
        await loadCandidatures(eventsData[0].id)
      }
      setLoading(false)
    }
    getData()
  }, [])

  const loadCandidatures = async (eventId: string) => {
    const { data: apps } = await supabase
      .from('applications')
      .select(`*, profiles:exposant_id(full_name, email, phone), events:event_id(title, price_per_spot)`)
      .eq('event_id', eventId)
      .in('status', ['paid', 'present', 'validated'])
      .order('created_at', { ascending: true })
    setCandidatures(apps || [])
  }

  const refresh = async () => {
    if (!selectedEvent) return
    setRefreshing(true)
    await loadCandidatures(selectedEvent.id)
    setRefreshing(false)
    setToast({ message: 'Liste actualisée', type: 'success' })
  }

  const handleSelectEvent = async (event: any) => {
    setSelectedEvent(event)
    await loadCandidatures(event.id)
  }

  const filteredCandidatures = candidatures
    .filter(c => filter === 'all' ? true : filter === 'present' ? c.status === 'present' : c.status !== 'present')
    .filter(c =>
      !search ||
      c.profiles?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.profiles?.email?.toLowerCase().includes(search.toLowerCase())
    )

  const presents = candidatures.filter(c => c.status === 'present').length
  const total = candidatures.length
  const isToday = selectedEvent && new Date(selectedEvent.start_date).toDateString() === new Date().toDateString()

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 28, height: 28, border: `2px solid ${BRAND}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#0F172A', fontFamily: "'Inter', system-ui, sans-serif", maxWidth: 480, margin: '0 auto', color: 'white' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>

      <AnimatePresence>{toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}</AnimatePresence>

      {/* HEADER */}
      <div style={{ background: '#0F172A', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '16px 20px', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22C55E', display: 'inline-block', animation: 'pulse 2s infinite' }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: '#22C55E', letterSpacing: '0.08em' }}>
                {isToday ? 'AUJOURD\'HUI' : 'PLACIER ACTIF'}
              </span>
            </div>
            <p style={{ fontSize: 17, fontWeight: 800, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {selectedEvent?.title || 'Aucun marché'}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
              <Calendar size={10} style={{ color: '#64748B' }} />
              <p style={{ fontSize: 11, color: '#64748B' }}>
                {selectedEvent?.start_date
                  ? new Date(selectedEvent.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
                  : '—'
                }
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: 12 }}>
            <button onClick={refresh} disabled={refreshing}
              style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 8, padding: '8px', cursor: 'pointer', color: '#64748B' }}>
              {refreshing ? <Loader size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : <RefreshCw size={14} />}
            </button>
          </div>
        </div>

        {/* Stats bar */}
        <div style={{ background: '#1E293B', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={14} style={{ color: '#22C55E' }} />
            </div>
            <div>
              <p style={{ fontSize: 16, fontWeight: 800, color: 'white', lineHeight: 1 }}>{presents}<span style={{ fontSize: 12, color: '#64748B' }}> / {total}</span></p>
              <p style={{ fontSize: 9, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>Présents</p>
            </div>
          </div>
          <div style={{ width: 80, height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 100, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${total > 0 ? (presents / total) * 100 : 0}%`,
              background: 'linear-gradient(90deg, #4F46E5, #22C55E)',
              borderRadius: 100,
              transition: 'width 0.5s'
            }} />
          </div>
        </div>

        {/* Selector événements */}
        {events.length > 1 && (
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingTop: 10, paddingBottom: 2, scrollbarWidth: 'none' }}>
            {events.map(event => (
              <button key={event.id} onClick={() => handleSelectEvent(event)}
                style={{
                  flexShrink: 0,
                  padding: '6px 12px',
                  borderRadius: 100,
                  border: 'none',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: selectedEvent?.id === event.id ? BRAND : 'rgba(255,255,255,0.06)',
                  color: selectedEvent?.id === event.id ? 'white' : '#64748B',
                }}>
                {event.title.split(' ').slice(0, 3).join(' ')}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* SEARCH + FILTRES */}
      <div style={{ padding: '14px 16px 10px' }}>
        <div style={{ position: 'relative', marginBottom: 10 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un forain..."
            style={{ width: '100%', padding: '10px 12px 10px 36px', background: '#1E293B', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, fontSize: 13, color: 'white', outline: 'none', boxSizing: 'border-box' }} />
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { key: 'all', label: `Tous (${total})` },
            { key: 'pending', label: `À pointer (${total - presents})` },
            { key: 'present', label: `Présents (${presents})` },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key as any)}
              style={{
                flex: 1,
                padding: '7px 0',
                borderRadius: 8,
                border: filter === f.key ? `1.5px solid ${BRAND}` : '1px solid rgba(255,255,255,0.08)',
                background: filter === f.key ? `${BRAND}22` : 'transparent',
                color: filter === f.key ? BRAND : '#64748B',
                fontSize: 11,
                fontWeight: filter === f.key ? 700 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* LISTE */}
      <div style={{ padding: '4px 16px 100px' }}>
        {filteredCandidatures.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ width: 56, height: 56, background: '#1E293B', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <Users size={24} style={{ color: '#475569' }} />
            </div>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#94A3B8', marginBottom: 4 }}>
              {search ? 'Aucun résultat' : filter === 'present' ? 'Aucun présent' : filter === 'pending' ? 'Tous pointés !' : 'Aucun exposant'}
            </p>
            <p style={{ fontSize: 12, color: '#475569' }}>
              {search ? 'Essayez un autre mot-clé' : filter === 'pending' ? 'Tous les exposants sont arrivés' : 'Pas de candidature payée'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filteredCandidatures.map(c => {
              const isPresent = c.status === 'present'
              return (
                <motion.div key={c.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                  style={{
                    background: '#1E293B',
                    border: `1px solid ${isPresent ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.06)'}`,
                    borderRadius: 12,
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}>
                  <div style={{
                    width: 38,
                    height: 38,
                    borderRadius: '50%',
                    background: isPresent ? 'rgba(34,197,94,0.15)' : 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {isPresent
                      ? <CheckCircle size={18} style={{ color: '#22C55E' }} />
                      : <span style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>{(c.profiles?.full_name || '?').charAt(0).toUpperCase()}</span>
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {c.profiles?.full_name || 'Forain express'}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                      <p style={{ fontSize: 11, color: '#64748B' }}>{c.events?.price_per_spot || 0} €</p>
                      {c.spot_label && (
                        <>
                          <span style={{ color: '#475569' }}>·</span>
                          <p style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>Case {c.spot_label}</p>
                        </>
                      )}
                    </div>
                  </div>
                  <div style={{ flexShrink: 0 }}>
                    {isPresent ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 100, background: 'rgba(34,197,94,0.15)', color: '#22C55E' }}>
                          <CheckCircle size={9} /> Présent
                        </span>
                        {c.scanned_at && (
                          <span style={{ fontSize: 9, color: '#475569' }}>
                            {new Date(c.scanned_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 100, background: 'rgba(255,255,255,0.05)', color: '#64748B' }}>
                        <Clock size={9} /> Attendu
                      </span>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
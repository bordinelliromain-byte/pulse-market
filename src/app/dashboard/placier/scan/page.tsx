'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  History, CheckCircle, XCircle, AlertTriangle, Ban,
  Search, Calendar, Clock, MapPin, Loader,
  ChevronRight, RefreshCw, Filter, TrendingUp
} from 'lucide-react'

const BRAND = '#4F46E5'

type FilterPeriod = 'today' | 'week' | 'month' | 'all'
type FilterResult = 'all' | 'valid' | 'invalid' | 'duplicate' | 'wrong_event'

const RESULT_CONFIG = {
  valid:       { color: '#22C55E', bg: 'rgba(34,197,94,0.1)',  icon: CheckCircle,  label: 'Validé' },
  invalid:     { color: '#DC2626', bg: 'rgba(220,38,38,0.1)',  icon: XCircle,      label: 'Invalide' },
  duplicate:   { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', icon: AlertTriangle, label: 'Déjà scanné' },
  wrong_event: { color: '#DC2626', bg: 'rgba(220,38,38,0.1)',  icon: Ban,          label: 'Mauvais marché' },
  expired:     { color: '#94A3B8', bg: 'rgba(148,163,184,0.1)', icon: Clock,        label: 'Expiré' },
}

function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t) }, [onClose])
  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', bottom: 100, left: 20, right: 20, zIndex: 200, background: '#1E293B', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, borderLeft: `3px solid ${type === 'success' ? '#22C55E' : '#DC2626'}` }}>
      {type === 'success' ? <CheckCircle size={15} style={{ color: '#22C55E' }} /> : <XCircle size={15} style={{ color: '#DC2626' }} />}
      <span style={{ fontSize: 13, fontWeight: 500, color: 'white' }}>{message}</span>
    </motion.div>
  )
}

function isInPeriod(date: string, period: FilterPeriod): boolean {
  const d = new Date(date)
  const now = new Date()
  if (period === 'all') return true
  if (period === 'today') return d.toDateString() === now.toDateString()
  if (period === 'week') {
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    return d >= weekAgo
  }
  if (period === 'month') return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  return true
}

export default function PlacierScans() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [scans, setScans] = useState<any[]>([])
  const [period, setPeriod] = useState<FilterPeriod>('today')
  const [resultFilter, setResultFilter] = useState<FilterResult>('all')
  const [search, setSearch] = useState('')
  const [selectedScan, setSelectedScan] = useState<any>(null)
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
      await loadScans(user.id)
      setLoading(false)
    }
    getData()
  }, [])

  const loadScans = async (userId: string) => {
    const { data } = await supabase
      .from('scan_history')
      .select(`*, 
        application:application_id(
          id, status,
          profiles:exposant_id(full_name, email),
          events:event_id(title, start_date)
        ),
        event:event_id(title, start_date, location_name)
      `)
      .eq('placier_id', userId)
      .order('created_at', { ascending: false })
      .limit(500)
    setScans(data || [])
  }

  const refresh = async () => {
    setRefreshing(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) await loadScans(user.id)
    setRefreshing(false)
    setToast({ message: 'Historique actualisé', type: 'success' })
  }

  // Filtres
  const filteredScans = useMemo(() => {
    return scans
      .filter(s => isInPeriod(s.created_at, period))
      .filter(s => resultFilter === 'all' ? true : s.scan_result === resultFilter)
      .filter(s => !search ||
        s.application?.profiles?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        s.application?.profiles?.email?.toLowerCase().includes(search.toLowerCase()) ||
        s.event?.title?.toLowerCase().includes(search.toLowerCase())
      )
  }, [scans, period, resultFilter, search])

  // Stats
  const stats = useMemo(() => ({
    total: filteredScans.length,
    valid: filteredScans.filter(s => s.scan_result === 'valid').length,
    invalid: filteredScans.filter(s => s.scan_result === 'invalid' || s.scan_result === 'wrong_event').length,
    duplicate: filteredScans.filter(s => s.scan_result === 'duplicate').length,
  }), [filteredScans])

  // Group by date
  const scansByDate = useMemo(() => {
    const groups: Record<string, any[]> = {}
    filteredScans.forEach(s => {
      const d = new Date(s.created_at)
      const key = d.toDateString() === new Date().toDateString()
        ? "Aujourd'hui"
        : d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
      if (!groups[key]) groups[key] = []
      groups[key].push(s)
    })
    return groups
  }, [filteredScans])

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 28, height: 28, border: `2px solid ${BRAND}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#0F172A', fontFamily: "'Inter', system-ui, sans-serif", maxWidth: 480, margin: '0 auto', color: 'white' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <AnimatePresence>{toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}</AnimatePresence>

      {/* HEADER */}
      <div style={{ background: '#0F172A', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '14px 20px', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <History size={16} style={{ color: BRAND }} />
              <p style={{ fontSize: 14, fontWeight: 800, color: 'white' }}>Historique</p>
            </div>
            <p style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
              {stats.total} scan{stats.total !== 1 ? 's' : ''}
            </p>
          </div>
          <button onClick={refresh} disabled={refreshing}
            style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 8, padding: '8px', cursor: 'pointer', color: '#64748B' }}>
            {refreshing ? <Loader size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : <RefreshCw size={14} />}
          </button>
        </div>

        {/* Stats KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
          <div style={{ background: 'rgba(34,197,94,0.1)', borderRadius: 10, padding: '10px 12px' }}>
            <p style={{ fontSize: 18, fontWeight: 800, color: '#22C55E' }}>{stats.valid}</p>
            <p style={{ fontSize: 9, color: '#86EFAC', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>Validés</p>
          </div>
          <div style={{ background: 'rgba(245,158,11,0.1)', borderRadius: 10, padding: '10px 12px' }}>
            <p style={{ fontSize: 18, fontWeight: 800, color: '#F59E0B' }}>{stats.duplicate}</p>
            <p style={{ fontSize: 9, color: '#FCD34D', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>Doublons</p>
          </div>
          <div style={{ background: 'rgba(220,38,38,0.1)', borderRadius: 10, padding: '10px 12px' }}>
            <p style={{ fontSize: 18, fontWeight: 800, color: '#DC2626' }}>{stats.invalid}</p>
            <p style={{ fontSize: 9, color: '#FCA5A5', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>Refusés</p>
          </div>
        </div>
      </div>

      {/* FILTRES */}
      <div style={{ padding: '14px 16px 10px' }}>
        <div style={{ position: 'relative', marginBottom: 10 }}>
          <Search size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..."
            style={{ width: '100%', padding: '9px 12px 9px 34px', background: '#1E293B', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, fontSize: 13, color: 'white', outline: 'none', boxSizing: 'border-box' }} />
        </div>

        {/* Période */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          {[
            { key: 'today', label: 'Aujourd\'hui' },
            { key: 'week', label: '7 jours' },
            { key: 'month', label: 'Ce mois' },
            { key: 'all', label: 'Tout' },
          ].map(p => (
            <button key={p.key} onClick={() => setPeriod(p.key as FilterPeriod)}
              style={{
                flex: 1,
                padding: '6px 0',
                borderRadius: 8,
                border: period === p.key ? `1.5px solid ${BRAND}` : '1px solid rgba(255,255,255,0.08)',
                background: period === p.key ? `${BRAND}22` : 'transparent',
                color: period === p.key ? BRAND : '#64748B',
                fontSize: 11,
                fontWeight: period === p.key ? 700 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}>
              {p.label}
            </button>
          ))}
        </div>

        {/* Résultat */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {[
            { key: 'all', label: 'Tous', color: '#64748B' },
            { key: 'valid', label: 'Validés', color: '#22C55E' },
            { key: 'duplicate', label: 'Doublons', color: '#F59E0B' },
            { key: 'invalid', label: 'Invalides', color: '#DC2626' },
            { key: 'wrong_event', label: 'Mauvais marché', color: '#DC2626' },
          ].map(r => (
            <button key={r.key} onClick={() => setResultFilter(r.key as FilterResult)}
              style={{
                flexShrink: 0,
                padding: '5px 12px',
                borderRadius: 100,
                border: resultFilter === r.key ? `1px solid ${r.color}` : '1px solid rgba(255,255,255,0.08)',
                background: resultFilter === r.key ? `${r.color}22` : 'transparent',
                color: resultFilter === r.key ? r.color : '#64748B',
                fontSize: 10,
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* LISTE */}
      <div style={{ padding: '4px 16px 110px' }}>
        {filteredScans.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ width: 56, height: 56, background: '#1E293B', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <History size={24} style={{ color: '#475569' }} />
            </div>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#94A3B8', marginBottom: 4 }}>
              Aucun scan
            </p>
            <p style={{ fontSize: 12, color: '#475569' }}>
              {search ? 'Aucun résultat pour votre recherche' : 'Vos scans apparaîtront ici'}
            </p>
          </div>
        ) : (
          Object.entries(scansByDate).map(([date, scansOfDay]) => (
            <div key={date} style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, padding: '0 4px' }}>
                {date} · {scansOfDay.length} scan{scansOfDay.length !== 1 ? 's' : ''}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {scansOfDay.map(scan => {
                  const config = RESULT_CONFIG[scan.scan_result as keyof typeof RESULT_CONFIG] || RESULT_CONFIG.invalid
                  const Icon = config.icon
                  return (
                    <button key={scan.id} onClick={() => setSelectedScan(scan)}
                      style={{
                        background: '#1E293B',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: 10,
                        padding: '10px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        cursor: 'pointer',
                        textAlign: 'left',
                        width: '100%',
                      }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: config.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon size={14} style={{ color: config.color }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {scan.application?.profiles?.full_name || 'Forain inconnu'}
                        </p>
                        <p style={{ fontSize: 11, color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {scan.event?.title || '—'}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <p style={{ fontSize: 10, fontWeight: 700, color: config.color, marginBottom: 2 }}>
                          {config.label}
                        </p>
                        <p style={{ fontSize: 10, color: '#475569' }}>
                          {new Date(scan.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <ChevronRight size={14} style={{ color: '#475569', flexShrink: 0 }} />
                    </button>
                  )
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL DÉTAIL */}
      <AnimatePresence>
        {selectedScan && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedScan(null)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 50 }} />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#0F172A', borderRadius: '20px 20px 0 0', maxHeight: '80vh', zIndex: 60, overflowY: 'auto', maxWidth: 480, margin: '0 auto', border: '1px solid rgba(255,255,255,0.08)' }}>

              <div style={{ width: 36, height: 4, background: 'rgba(255,255,255,0.15)', borderRadius: 100, margin: '12px auto 0' }} />

              <div style={{ padding: '20px' }}>
                {(() => {
                  const config = RESULT_CONFIG[selectedScan.scan_result as keyof typeof RESULT_CONFIG] || RESULT_CONFIG.invalid
                  const Icon = config.icon
                  return (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                        <div style={{ width: 48, height: 48, borderRadius: 12, background: config.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Icon size={22} style={{ color: config.color }} />
                        </div>
                        <div>
                          <p style={{ fontSize: 16, fontWeight: 800, color: 'white' }}>
                            {selectedScan.application?.profiles?.full_name || 'Forain inconnu'}
                          </p>
                          <p style={{ fontSize: 12, fontWeight: 600, color: config.color }}>
                            {config.label}
                          </p>
                        </div>
                      </div>

                      <div style={{ background: '#1E293B', borderRadius: 12, padding: '14px 16px', marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {[
                          { label: 'Date', value: new Date(selectedScan.created_at).toLocaleString('fr-FR') },
                          { label: 'Marché', value: selectedScan.event?.title || '—' },
                          { label: 'Email forain', value: selectedScan.application?.profiles?.email || '—' },
                          { label: 'Statut candidature', value: selectedScan.application?.status || '—' },
                          { label: 'Référence', value: `SCAN-${selectedScan.id?.slice(0, 8).toUpperCase()}` },
                        ].map(item => (
                          <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                            <span style={{ color: '#64748B' }}>{item.label}</span>
                            <span style={{ color: 'white', fontWeight: 600, textAlign: 'right', maxWidth: '60%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.value}</span>
                          </div>
                        ))}
                      </div>

                      {/* Géoloc */}
                      {(selectedScan.lat && selectedScan.lng) && (
                        <div style={{ background: '#1E293B', borderRadius: 12, padding: '12px 14px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                          <MapPin size={14} style={{ color: '#22C55E' }} />
                          <div>
                            <p style={{ fontSize: 11, color: '#64748B' }}>Géolocalisation</p>
                            <p style={{ fontSize: 12, color: 'white', fontFamily: 'monospace', marginTop: 2 }}>
                              {selectedScan.lat.toFixed(5)}, {selectedScan.lng.toFixed(5)}
                            </p>
                          </div>
                        </div>
                      )}

                      <button onClick={() => setSelectedScan(null)}
                        style={{ width: '100%', background: BRAND, color: 'white', border: 'none', borderRadius: 12, padding: '14px', fontSize: 14, fontWeight: 700, cursor: 'pointer', marginTop: 6 }}>
                        Fermer
                      </button>
                    </>
                  )
                })()}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
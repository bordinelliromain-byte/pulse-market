'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import type { Variants } from 'framer-motion'
import Sidebar from '@/components/Sidebar'
import {
  Bell, AlertTriangle, CheckCircle, Clock, Euro,
  Users, Map, TrendingUp, ArrowUpRight, ChevronRight,
  FileText, XCircle, RefreshCw, Zap,
  MapPin, Calendar, Shield, Activity, Lock
} from 'lucide-react'

interface Toast {
  id: string; type: 'success' | 'error' | 'warning' | 'info'; title: string; message?: string
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

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 16, zIndex: 100, display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 340 }}>
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div key={toast.id}
            initial={{ opacity: 0, x: 60, scale: 0.95 }} animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.95 }} transition={{ type: 'spring', damping: 20, stiffness: 200 }}
            style={{ background: 'white', borderRadius: 12, padding: '14px 16px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', display: 'flex', alignItems: 'flex-start', gap: 12, borderLeft: `3px solid ${toast.type === 'success' ? '#16A34A' : toast.type === 'error' ? '#DC2626' : toast.type === 'warning' ? '#F59E0B' : '#4F46E5'}` }}>
            <div style={{ flexShrink: 0, marginTop: 1 }}>
              {toast.type === 'success' && <CheckCircle size={16} style={{ color: '#16A34A' }} />}
              {toast.type === 'error' && <XCircle size={16} style={{ color: '#DC2626' }} />}
              {toast.type === 'warning' && <AlertTriangle size={16} style={{ color: '#F59E0B' }} />}
              {toast.type === 'info' && <Zap size={16} style={{ color: '#4F46E5' }} />}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', marginBottom: toast.message ? 3 : 0 }}>{toast.title}</p>
              {toast.message && <p style={{ fontSize: 12, color: '#64748B', lineHeight: 1.5 }}>{toast.message}</p>}
            </div>
            <button onClick={() => onRemove(toast.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#CBD5E1', padding: 0, flexShrink: 0 }}>
              <XCircle size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

function Sparkline({ values, color = '#4F46E5' }: { values: number[]; color?: string }) {
  const max = Math.max(...values, 1)
  const w = 80, h = 28
  const points = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - (v / max) * h}`).join(' ')
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none">
      <polyline points={points} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
      <polyline points={`0,${h} ${points} ${w},${h}`} fill={color} opacity="0.08" />
    </svg>
  )
}

export default function DashboardOrganisateur() {
  const [profile, setProfile] = useState<any>(null)
  const [events, setEvents] = useState<any[]>([])
  const [candidatures, setCandidatures] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [boostingId, setBoostingId] = useState<string | null>(null)

  const router = useRouter()
  const supabase = createClient()
  const isMobile = useIsMobile()

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev, { ...toast, id }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }, [])

  const removeToast = useCallback((id: string) => setToasts(prev => prev.filter(t => t.id !== id)), [])

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (profileData?.role !== 'organisateur') { router.push('/dashboard'); return }
      setProfile(profileData)

      // ✅ Si pending → on charge quand même le profil mais pas les données
      if (profileData?.organisateur_status === 'pending') {
        setLoading(false)
        return
      }

      const { data: eventsData } = await supabase.from('events').select('*').eq('organisateur_id', user.id).order('start_date', { ascending: true })
      setEvents(eventsData || [])
      const eventIds = eventsData?.map((e: any) => e.id) || []
      if (eventIds.length > 0) {
        const { data: apps } = await supabase.from('applications')
          .select(`*, profiles:exposant_id(full_name, email), events:event_id(title, price_per_spot, start_date, location_name)`)
          .in('event_id', eventIds).order('created_at', { ascending: false })
        const appsWithData = await Promise.all((apps || []).map(async (app: any) => {
          const { data: expData } = await supabase.from('exposant_data').select('*').eq('user_id', app.exposant_id).single()
          return { ...app, exposant_data: expData }
        }))
        setCandidatures(appsWithData)
      }
      setLoading(false)
      const params = new URLSearchParams(window.location.search)
      if (params.get('boost') === 'success') {
        const eventName = params.get('event') || 'votre marché'
        addToast({ type: 'success', title: 'Marché boosté !', message: `${decodeURIComponent(eventName)} est en position 1 sur Whatmarket pendant 7 jours.` })
        window.history.replaceState({}, '', '/dashboard/organisateur')
      }
    }
    getData()
  }, [])

  const handleValidate = async (id: string, name: string) => {
    setUpdatingId(id)
    await supabase.from('applications').update({ status: 'validated' }).eq('id', id)
    setCandidatures(prev => prev.map(c => c.id === id ? { ...c, status: 'validated' } : c))
    addToast({ type: 'success', title: 'Dossier approuvé', message: `${name} a été notifié par email.` })
    setUpdatingId(null)
  }

  const handleReject = async (id: string, name: string) => {
    setUpdatingId(id)
    await supabase.from('applications').update({ status: 'rejected' }).eq('id', id)
    setCandidatures(prev => prev.map(c => c.id === id ? { ...c, status: 'rejected' } : c))
    addToast({ type: 'warning', title: 'Dossier refusé', message: `${name} a été informé du refus.` })
    setUpdatingId(null)
  }

  const handleBoost = async (event: any) => {
    if (profile?.organisateur_status !== 'approved') return
    setBoostingId(event.id)
    try {
      const res = await fetch('/api/create-mairie-boost-checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: event.id, eventTitle: event.title, email: profile?.email || '', organisateurId: profile?.id || '' })
      })
      const { url, error } = await res.json()
      if (error) { addToast({ type: 'error', title: 'Erreur', message: error }); setBoostingId(null); return }
      window.location.href = url
    } catch { addToast({ type: 'error', title: 'Erreur', message: 'Impossible de créer le paiement' }); setBoostingId(null) }
  }

  const isPending = profile?.organisateur_status === 'pending'
  const isRejected = profile?.organisateur_status === 'rejected'

  const pending = candidatures.filter(c => c.status === 'pending')
  const validated = candidatures.filter(c => c.status === 'validated' || c.status === 'paid')
  const docsIncomplete = candidatures.filter(c => c.status === 'pending' && (!c.exposant_data?.kbis_url || !c.exposant_data?.assurance_url))
  const revenueEstimated = validated.reduce((acc, c) => acc + (c.events?.price_per_spot || 0), 0)
  const nextEvent = events.find(e => new Date(e.start_date) > new Date())
  const nextEventApps = nextEvent ? candidatures.filter(c => c.event_id === nextEvent.id && (c.status === 'validated' || c.status === 'paid')) : []
  const nextEventFree = nextEvent ? (nextEvent.total_spots - nextEventApps.length) : 0
  const formatDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 32, height: 32, border: '2px solid #4F46E5', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ fontSize: 13, color: '#64748B' }}>Chargement...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <Sidebar profile={profile} />
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div style={{ marginLeft: isMobile ? 0 : 220, flex: 1, minWidth: 0 }}>

        <header style={{ background: 'white', borderBottom: '1px solid #E2E8F0', padding: isMobile ? '0 14px 0 60px' : '0 32px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
          <div>
            <p style={{ fontSize: isMobile ? 13 : 14, fontWeight: 700, color: '#0F172A' }}>Tableau de bord</p>
            {!isMobile && <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 1 }}>Administration municipale · {profile?.full_name}</p>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {!isMobile && !isPending && !isRejected && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 100, padding: '4px 10px' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', display: 'inline-block' }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#16A34A' }}>Opérationnel</span>
              </div>
            )}
            {isPending && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 100, padding: '4px 10px' }}>
                <Clock size={11} style={{ color: '#F59E0B' }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#F59E0B' }}>En attente de validation</span>
              </div>
            )}
            {isRejected && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 100, padding: '4px 10px' }}>
                <XCircle size={11} style={{ color: '#DC2626' }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#DC2626' }}>Compte refusé</span>
              </div>
            )}
          </div>
        </header>

        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>

        <main style={{ padding: isMobile ? '14px' : '28px 32px', display: 'flex', flexDirection: 'column', gap: isMobile ? 16 : 24 }}>

          {/* ✅ BANNIÈRE PENDING */}
          {isPending && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              style={{ background: 'linear-gradient(135deg, #FFFBEB, #FEF3C7)', border: '1px solid #FDE68A', borderRadius: 14, padding: '20px 24px', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div style={{ width: 40, height: 40, background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Clock size={20} style={{ color: '#F59E0B' }} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#92400E', marginBottom: 6 }}>
                  Votre compte est en cours de validation
                </p>
                <p style={{ fontSize: 13, color: '#B45309', lineHeight: 1.6 }}>
                  Notre équipe vérifie votre dossier. Ce processus prend généralement <strong>24 à 48h ouvrées</strong>. Vous recevrez un email dès que votre compte sera activé.
                </p>
                <div style={{ display: 'flex', gap: 16, marginTop: 14 }}>
                  {[
                    { label: 'Organisation', value: profile?.full_name || '—' },
                    { label: 'SIRET', value: profile?.organisation_siret || '—' },
                    { label: 'Email', value: profile?.email || '—' },
                  ].map((item, i) => (
                    <div key={i} style={{ background: 'rgba(255,255,255,0.6)', borderRadius: 8, padding: '6px 12px' }}>
                      <p style={{ fontSize: 10, color: '#B45309', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{item.label}</p>
                      <p style={{ fontSize: 12, color: '#92400E', fontWeight: 600, marginTop: 2 }}>{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ✅ BANNIÈRE REFUSÉ */}
          {isRejected && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 14, padding: '20px 24px', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div style={{ width: 40, height: 40, background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <XCircle size={20} style={{ color: '#DC2626' }} />
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#991B1B', marginBottom: 6 }}>Votre demande n'a pas été acceptée</p>
                <p style={{ fontSize: 13, color: '#B91C1C', lineHeight: 1.6 }}>
                  Votre dossier n'a pas pu être validé. Contactez-nous à <strong>contact@pulse-market.fr</strong> pour plus d'informations.
                </p>
              </div>
            </motion.div>
          )}

          {/* ✅ CONTENU BLOQUÉ SI PENDING */}
          {(isPending || isRejected) ? (
            <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 14, padding: '60px 32px', textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, background: '#F1F5F9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Lock size={24} style={{ color: '#94A3B8' }} />
              </div>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>
                {isPending ? 'Fonctionnalités disponibles après validation' : 'Compte désactivé'}
              </p>
              <p style={{ fontSize: 13, color: '#64748B', maxWidth: 400, margin: '0 auto' }}>
                {isPending
                  ? 'Une fois votre compte validé par notre équipe, vous pourrez créer des événements, gérer vos candidatures et collecter les redevances AOT.'
                  : 'Contactez-nous à contact@pulse-market.fr pour réouvrir votre compte.'
                }
              </p>
            </div>
          ) : (
            <>
              {/* Command Center */}
              <section>
                {!isMobile && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <Activity size={14} style={{ color: '#4F46E5' }} />
                    <p style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Centre de commandement</p>
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: isMobile ? 10 : 16 }}>

                  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}
                    style={{ background: docsIncomplete.length > 0 ? '#FEF2F2' : 'white', border: `1px solid ${docsIncomplete.length > 0 ? '#FECACA' : '#E2E8F0'}`, borderRadius: 14, padding: isMobile ? '14px' : '20px 22px', position: 'relative', overflow: 'hidden' }}>
                    {!isMobile && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: docsIncomplete.length > 0 ? '#DC2626' : '#E2E8F0' }} />}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: isMobile ? 10 : 14 }}>
                      <div style={{ width: 34, height: 34, background: docsIncomplete.length > 0 ? '#FEE2E2' : '#F1F5F9', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <AlertTriangle size={15} style={{ color: docsIncomplete.length > 0 ? '#DC2626' : '#94A3B8' }} />
                      </div>
                      <div>
                        <p style={{ fontSize: 12, fontWeight: 700, color: docsIncomplete.length > 0 ? '#DC2626' : '#94A3B8' }}>
                          {docsIncomplete.length > 0 ? `${docsIncomplete.length} dossier(s) incomplet(s)` : 'Tout est à jour'}
                        </p>
                        {!isMobile && <p style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>{docsIncomplete.length > 0 ? 'Documents manquants' : 'Tous les dossiers sont complets'}</p>}
                      </div>
                    </div>
                    <button onClick={() => { if (docsIncomplete.length > 0) router.push('/dashboard/candidatures') }}
                      style={{ width: '100%', background: docsIncomplete.length > 0 ? '#DC2626' : '#F8FAFC', color: docsIncomplete.length > 0 ? 'white' : '#94A3B8', border: 'none', borderRadius: 9, padding: '8px 0', fontSize: 12, fontWeight: 600, cursor: docsIncomplete.length > 0 ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <RefreshCw size={11} /> {docsIncomplete.length > 0 ? 'Relancer les exposants' : 'Tout est à jour'}
                    </button>
                  </motion.div>

                  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
                    style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 14, padding: isMobile ? '14px' : '20px 22px', position: 'relative', overflow: 'hidden' }}>
                    {!isMobile && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: nextEvent ? '#4F46E5' : '#E2E8F0' }} />}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: isMobile ? 10 : 14 }}>
                      <div style={{ width: 34, height: 34, background: '#EEF2FF', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <MapPin size={15} style={{ color: '#4F46E5' }} />
                      </div>
                      <div>
                        <p style={{ fontSize: 12, fontWeight: 700, color: '#4F46E5' }}>{nextEvent ? nextEvent.title : 'Aucun événement'}</p>
                        {!isMobile && <p style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>{nextEvent ? `${formatDate(nextEvent.start_date)} — ${nextEventFree} place(s)` : 'Créez un événement'}</p>}
                      </div>
                    </div>
                    <button onClick={() => nextEvent ? router.push('/dashboard/candidatures') : router.push('/dashboard/creer-evenement')}
                      style={{ width: '100%', background: '#4F46E5', color: 'white', border: 'none', borderRadius: 9, padding: '8px 0', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <Map size={11} /> {nextEvent ? 'Voir candidatures' : 'Créer un événement'}
                    </button>
                  </motion.div>

                  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
                    style={{ background: revenueEstimated > 0 ? '#F0FDF4' : 'white', border: `1px solid ${revenueEstimated > 0 ? '#BBF7D0' : '#E2E8F0'}`, borderRadius: 14, padding: isMobile ? '14px' : '20px 22px', position: 'relative', overflow: 'hidden' }}>
                    {!isMobile && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: revenueEstimated > 0 ? '#16A34A' : '#E2E8F0' }} />}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: isMobile ? 10 : 14 }}>
                      <div style={{ width: 34, height: 34, background: revenueEstimated > 0 ? '#DCFCE7' : '#F1F5F9', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Euro size={15} style={{ color: revenueEstimated > 0 ? '#16A34A' : '#94A3B8' }} />
                      </div>
                      <div>
                        <p style={{ fontSize: 12, fontWeight: 700, color: revenueEstimated > 0 ? '#16A34A' : '#94A3B8' }}>
                          {revenueEstimated > 0 ? `${revenueEstimated} € à encaisser` : 'Aucune recette'}
                        </p>
                        {!isMobile && <p style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>{validated.length} exposant(s) validé(s)</p>}
                      </div>
                    </div>
                    <button onClick={() => router.push('/dashboard/tresorerie')}
                      style={{ width: '100%', background: revenueEstimated > 0 ? '#16A34A' : '#F8FAFC', color: revenueEstimated > 0 ? 'white' : '#94A3B8', border: 'none', borderRadius: 9, padding: '8px 0', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <TrendingUp size={11} /> Voir la trésorerie
                    </button>
                  </motion.div>

                </div>
              </section>

              {/* KPIs */}
              <section>
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
                  style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: isMobile ? 10 : 14 }}>
                  {[
                    { label: 'Événements actifs', value: events.filter(e => e.status === 'published').length, spark: [0,1,1,2,2,3,events.length], color: '#4F46E5', icon: <Map size={13} style={{ color: '#4F46E5' }} /> },
                    { label: 'Dossiers reçus', value: candidatures.length, spark: [0,2,4,6,8,10,candidatures.length], color: '#0EA5E9', icon: <FileText size={13} style={{ color: '#0EA5E9' }} /> },
                    { label: 'Validés', value: validated.length, spark: [0,1,2,3,4,5,validated.length], color: '#16A34A', icon: <CheckCircle size={13} style={{ color: '#16A34A' }} /> },
                    { label: 'En attente', value: pending.length, spark: [0,1,2,1,3,2,pending.length], color: '#F59E0B', icon: <Clock size={13} style={{ color: '#F59E0B' }} /> },
                  ].map((s, i) => (
                    <div key={i} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: '14px 16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <span style={{ fontSize: 10, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</span>
                        {s.icon}
                      </div>
                      <p style={{ fontSize: 28, fontWeight: 700, color: '#0F172A', marginBottom: 6, letterSpacing: '-0.02em' }}>{s.value}</p>
                      {!isMobile && <Sparkline values={s.spark} color={s.color} />}
                    </div>
                  ))}
                </motion.div>
              </section>

              {/* Flux */}
              <section>
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}
                  style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 340px', gap: isMobile ? 14 : 20 }}>

                  <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 14, overflow: 'hidden' }}>
                    <div style={{ padding: '14px 18px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>Dossiers en attente</p>
                        <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>{pending.length} à traiter</p>
                      </div>
                      <button onClick={() => router.push('/dashboard/candidatures')}
                        style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#4F46E5', background: '#EEF2FF', border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontWeight: 600 }}>
                        Tout voir <ArrowUpRight size={12} />
                      </button>
                    </div>

                    {pending.length === 0 ? (
                      <div style={{ padding: '40px 0', textAlign: 'center' }}>
                        <CheckCircle size={28} style={{ margin: '0 auto 10px', color: '#BBF7D0' }} />
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#16A34A' }}>Tout est à jour</p>
                      </div>
                    ) : (
                      <div>
                        {pending.slice(0, 5).map((c, i) => {
                          const docsOk = !!(c.exposant_data?.kbis_url && c.exposant_data?.assurance_url)
                          const name = c.exposant_data?.business_name || c.profiles?.full_name || 'Exposant'
                          return (
                            <div key={c.id}
                              style={{ padding: isMobile ? '12px 14px' : '14px 22px', borderBottom: i < Math.min(pending.length, 5) - 1 ? '1px solid #F8FAFC' : 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
                              <div style={{ width: 34, height: 34, borderRadius: '50%', background: ['#EEF2FF','#F0FDF4','#FEF3C7','#FEF2F2','#F0F9FF'][i%5], display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `1.5px solid ${['#C7D2FE','#BBF7D0','#FDE68A','#FECACA','#BAE6FD'][i%5]}` }}>
                                <span style={{ fontSize: 12, fontWeight: 700, color: ['#4F46E5','#16A34A','#F59E0B','#DC2626','#0EA5E9'][i%5] }}>{name.charAt(0).toUpperCase()}</span>
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                                  <p style={{ fontSize: 12, fontWeight: 600, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</p>
                                  <span style={{ fontSize: 9, fontWeight: 700, color: docsOk ? '#16A34A' : '#DC2626', background: docsOk ? '#F0FDF4' : '#FEF2F2', padding: '1px 6px', borderRadius: 100, flexShrink: 0 }}>
                                    {docsOk ? 'Complet' : 'Incomplet'}
                                  </span>
                                </div>
                                <p style={{ fontSize: 11, color: '#94A3B8' }}>{c.events?.title}</p>
                              </div>
                              <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                                <button onClick={() => handleValidate(c.id, name)} disabled={updatingId === c.id}
                                  style={{ background: '#16A34A', color: 'white', border: 'none', borderRadius: 7, padding: isMobile ? '5px 8px' : '6px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer', opacity: updatingId === c.id ? 0.6 : 1 }}>
                                  ✓
                                </button>
                                <button onClick={() => handleReject(c.id, name)} disabled={updatingId === c.id}
                                  style={{ background: '#F8FAFC', color: '#DC2626', border: '1px solid #FECACA', borderRadius: 7, padding: isMobile ? '5px 8px' : '6px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer', opacity: updatingId === c.id ? 0.6 : 1 }}>
                                  ✕
                                </button>
                              </div>
                            </div>
                          )
                        })}
                        {pending.length > 5 && (
                          <div style={{ padding: '12px 18px', borderTop: '1px solid #F1F5F9' }}>
                            <button onClick={() => router.push('/dashboard/candidatures')}
                              style={{ fontSize: 12, color: '#4F46E5', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                              Voir {pending.length - 5} de plus <ChevronRight size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 14, overflow: 'hidden' }}>
                      <div style={{ padding: '12px 16px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>Mes marchés</p>
                        <button onClick={() => router.push('/dashboard/creer-evenement')}
                          style={{ fontSize: 11, color: '#4F46E5', background: '#EEF2FF', border: 'none', borderRadius: 7, padding: '4px 10px', cursor: 'pointer', fontWeight: 600 }}>
                          + Nouveau
                        </button>
                      </div>
                      {events.length === 0 ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#94A3B8', fontSize: 12 }}>Aucun événement créé</div>
                      ) : (
                        events.slice(0, 4).map((event, i) => {
                          const eventApps = candidatures.filter(c => c.event_id === event.id)
                          const eventValidated = eventApps.filter(c => c.status === 'validated' || c.status === 'paid')
                          const pct = event.total_spots > 0 ? Math.round((eventValidated.length / event.total_spots) * 100) : 0
                          return (
                            <div key={event.id} style={{ padding: '12px 16px', borderBottom: i < Math.min(events.length, 4) - 1 ? '1px solid #F8FAFC' : 'none' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                                <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => router.push('/dashboard/candidatures')}>
                                  <p style={{ fontSize: 12, fontWeight: 600, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{event.title}</p>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                                    <Calendar size={9} style={{ color: '#94A3B8' }} />
                                    <p style={{ fontSize: 10, color: '#94A3B8' }}>{formatDate(event.start_date)}</p>
                                  </div>
                                </div>
                                <span style={{ fontSize: 11, fontWeight: 700, color: pct >= 80 ? '#DC2626' : pct >= 50 ? '#F59E0B' : '#16A34A', flexShrink: 0, marginLeft: 8 }}>{pct}%</span>
                              </div>
                              <div style={{ height: 3, background: '#F1F5F9', borderRadius: 100, overflow: 'hidden', marginBottom: 6 }}>
                                <div style={{ height: '100%', width: `${pct}%`, background: pct >= 80 ? '#DC2626' : pct >= 50 ? '#F59E0B' : '#4F46E5', borderRadius: 100, transition: 'width 0.5s' }} />
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <p style={{ fontSize: 10, color: '#94A3B8' }}>{eventValidated.length}/{event.total_spots}</p>
                                <button onClick={e => { e.stopPropagation(); handleBoost(event) }} disabled={boostingId === event.id}
                                  style={{ display: 'flex', alignItems: 'center', gap: 4, background: boostingId === event.id ? '#F3F4F6' : 'linear-gradient(135deg,#F59E0B,#EF4444)', color: boostingId === event.id ? '#9CA3AF' : 'white', border: 'none', borderRadius: 6, padding: '4px 9px', fontSize: 10, fontWeight: 700, cursor: boostingId === event.id ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>
                                  {boostingId === event.id ? '...' : '200€'}
                                </button>
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>

                    <div style={{ background: '#0F172A', borderRadius: 14, padding: '16px' }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Actions rapides</p>
                      {[
                        { icon: <Users size={13} style={{ color: '#818CF8' }} />, label: 'Gérer les candidatures', path: '/dashboard/candidatures' },
                        { icon: <Map size={13} style={{ color: '#34D399' }} />, label: 'Créer un événement', path: '/dashboard/creer-evenement' },
                        { icon: <TrendingUp size={13} style={{ color: '#FBBF24' }} />, label: 'Voir la trésorerie', path: '/dashboard/tresorerie' },
                        { icon: <Shield size={13} style={{ color: '#60A5FA' }} />, label: 'Paramètres', path: '/dashboard/parametres' },
                      ].map((item, i) => (
                        <button key={i} onClick={() => router.push(item.path)}
                          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 9, cursor: 'pointer', marginBottom: i < 3 ? 6 : 0, textAlign: 'left' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}>
                          {item.icon}
                          <span style={{ fontSize: 12, fontWeight: 500, color: '#CBD5E1' }}>{item.label}</span>
                          <ChevronRight size={12} style={{ color: '#475569', marginLeft: 'auto' }} />
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  )
}
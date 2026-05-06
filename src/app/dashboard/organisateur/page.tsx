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
  FileText, XCircle, RefreshCw, Zap, BarChart3,
  MapPin, Calendar, Shield, Activity
} from 'lucide-react'

interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
}

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 100, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div key={toast.id}
            initial={{ opacity: 0, x: 60, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.95 }}
            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
            style={{
              background: 'white', borderRadius: 12, padding: '14px 16px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.05)',
              display: 'flex', alignItems: 'flex-start', gap: 12, minWidth: 300, maxWidth: 380,
              borderLeft: `3px solid ${toast.type === 'success' ? '#16A34A' : toast.type === 'error' ? '#DC2626' : toast.type === 'warning' ? '#F59E0B' : '#4F46E5'}`
            }}>
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
            <button onClick={() => onRemove(toast.id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#CBD5E1', padding: 0, flexShrink: 0 }}>
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

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev, { ...toast, id }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (profileData?.role !== 'organisateur') { router.push('/dashboard'); return }
      setProfile(profileData)

      const { data: eventsData } = await supabase
        .from('events').select('*').eq('organisateur_id', user.id).order('start_date', { ascending: true })
      setEvents(eventsData || [])

      const eventIds = eventsData?.map((e: any) => e.id) || []
      if (eventIds.length > 0) {
        const { data: apps } = await supabase
          .from('applications')
          .select(`*, profiles:exposant_id(full_name, email), events:event_id(title, price_per_spot, start_date, location_name)`)
          .in('event_id', eventIds)
          .order('created_at', { ascending: false })

        const appsWithData = await Promise.all(
          (apps || []).map(async (app: any) => {
            const { data: expData } = await supabase.from('exposant_data').select('*').eq('user_id', app.exposant_id).single()
            return { ...app, exposant_data: expData }
          })
        )
        setCandidatures(appsWithData)
      }
      setLoading(false)

      // Détecter retour après paiement boost mairie
      const params = new URLSearchParams(window.location.search)
      if (params.get('boost') === 'success') {
        const eventName = params.get('event') || 'votre marché'
        addToast({
          type: 'success',
          title: '🚀 Marché boosté !',
          message: `${decodeURIComponent(eventName)} est en position 1 sur Whatmarket pendant 7 jours.`
        })
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
    setBoostingId(event.id)
    try {
      const res = await fetch('/api/create-mairie-boost-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          eventTitle: event.title,
          email: profile?.email || '',
          organisateurId: profile?.id || '',
        })
      })
      const { url, error } = await res.json()
      if (error) {
        addToast({ type: 'error', title: 'Erreur', message: error })
        setBoostingId(null)
        return
      }
      window.location.href = url
    } catch (err) {
      addToast({ type: 'error', title: 'Erreur', message: 'Impossible de créer le paiement' })
      setBoostingId(null)
    }
  }

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
        <p style={{ fontSize: 13, color: '#64748B', fontFamily: 'Inter, system-ui, sans-serif' }}>Chargement de votre tableau de bord...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <Sidebar profile={profile} />
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="dash-wrap" style={{ marginLeft: 220, flex: 1 }}>
        <header style={{ background: 'white', borderBottom: '1px solid #E2E8F0', padding: '0 32px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Tableau de bord</p>
            <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 1 }}>Administration municipale · {profile?.full_name}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 100, padding: '4px 10px' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', display: 'inline-block', animation: 'pulse-live 2s infinite' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#16A34A' }}>Système opérationnel</span>
            </div>
            {pending.length > 0 && (
              <div style={{ position: 'relative' }}>
                <button style={{ background: 'none', border: '1px solid #E2E8F0', borderRadius: 8, padding: '6px 8px', cursor: 'pointer', display: 'flex' }}>
                  <Bell size={15} style={{ color: '#64748B' }} />
                </button>
                <span style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, background: '#DC2626', borderRadius: '50%', fontSize: 9, fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {pending.length}
                </span>
              </div>
            )}
          </div>
        </header>

        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes pulse-live { 0% { box-shadow: 0 0 0 0 rgba(34,197,94,0.4); } 70% { box-shadow: 0 0 0 5px rgba(34,197,94,0); } 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0); } }
        `}</style>

        <main style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* ── COMMAND CENTER ── */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Activity size={14} style={{ color: '#4F46E5' }} />
              <p style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Centre de commandement</p>
              <span style={{ fontSize: 11, color: '#94A3B8' }}>— Actions prioritaires du jour</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>

              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}
                style={{ background: docsIncomplete.length > 0 ? '#FEF2F2' : 'white', border: `1px solid ${docsIncomplete.length > 0 ? '#FECACA' : '#E2E8F0'}`, borderRadius: 14, padding: '20px 22px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: docsIncomplete.length > 0 ? '#DC2626' : '#E2E8F0', borderRadius: '14px 14px 0 0' }} />
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
                  <div style={{ width: 36, height: 36, background: docsIncomplete.length > 0 ? '#FEE2E2' : '#F1F5F9', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <AlertTriangle size={16} style={{ color: docsIncomplete.length > 0 ? '#DC2626' : '#94A3B8' }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: docsIncomplete.length > 0 ? '#DC2626' : '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Urgent</p>
                    <p style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', lineHeight: 1.3 }}>
                      {docsIncomplete.length > 0 ? `${docsIncomplete.length} dossier${docsIncomplete.length > 1 ? 's' : ''} incomplet${docsIncomplete.length > 1 ? 's' : ''}` : 'Aucune action requise'}
                    </p>
                    <p style={{ fontSize: 12, color: '#64748B', marginTop: 4, lineHeight: 1.5 }}>
                      {docsIncomplete.length > 0 ? 'Documents manquants — relance automatique possible' : 'Tous les dossiers sont complets'}
                    </p>
                  </div>
                </div>
                <button onClick={() => { if (docsIncomplete.length > 0) { router.push('/dashboard/candidatures'); addToast({ type: 'info', title: 'Filtrage appliqué', message: 'Affichage des dossiers incomplets uniquement.' }) } }}
                  style={{ width: '100%', background: docsIncomplete.length > 0 ? '#DC2626' : '#F8FAFC', color: docsIncomplete.length > 0 ? 'white' : '#94A3B8', border: 'none', borderRadius: 9, padding: '9px 0', fontSize: 12, fontWeight: 600, cursor: docsIncomplete.length > 0 ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                  <RefreshCw size={12} />
                  {docsIncomplete.length > 0 ? 'Relancer les exposants' : 'Tout est à jour'}
                </button>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
                style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 14, padding: '20px 22px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: nextEvent ? '#4F46E5' : '#E2E8F0', borderRadius: '14px 14px 0 0' }} />
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
                  <div style={{ width: 36, height: 36, background: '#EEF2FF', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <MapPin size={16} style={{ color: '#4F46E5' }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#4F46E5', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Prochain événement</p>
                    <p style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', lineHeight: 1.3 }}>{nextEvent ? nextEvent.title : 'Aucun événement prévu'}</p>
                    <p style={{ fontSize: 12, color: '#64748B', marginTop: 4, lineHeight: 1.5 }}>
                      {nextEvent ? `${formatDate(nextEvent.start_date)} — ${nextEventFree} place${nextEventFree > 1 ? 's' : ''} restante${nextEventFree > 1 ? 's' : ''}` : 'Créez un événement pour commencer'}
                    </p>
                  </div>
                </div>
                <button onClick={() => nextEvent ? router.push('/dashboard/candidatures') : router.push('/dashboard/creer-evenement')}
                  style={{ width: '100%', background: '#4F46E5', color: 'white', border: 'none', borderRadius: 9, padding: '9px 0', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                  <Map size={12} />
                  {nextEvent ? 'Voir les candidatures' : 'Créer un événement'}
                </button>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
                style={{ background: revenueEstimated > 0 ? '#F0FDF4' : 'white', border: `1px solid ${revenueEstimated > 0 ? '#BBF7D0' : '#E2E8F0'}`, borderRadius: 14, padding: '20px 22px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: revenueEstimated > 0 ? '#16A34A' : '#E2E8F0', borderRadius: '14px 14px 0 0' }} />
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
                  <div style={{ width: 36, height: 36, background: revenueEstimated > 0 ? '#DCFCE7' : '#F1F5F9', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Euro size={16} style={{ color: revenueEstimated > 0 ? '#16A34A' : '#94A3B8' }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: revenueEstimated > 0 ? '#16A34A' : '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Finance</p>
                    <p style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', lineHeight: 1.3 }}>{revenueEstimated > 0 ? `${revenueEstimated} € à encaisser` : 'Aucune recette en attente'}</p>
                    <p style={{ fontSize: 12, color: '#64748B', marginTop: 4, lineHeight: 1.5 }}>
                      {validated.length > 0 ? `${validated.length} exposant${validated.length > 1 ? 's' : ''} validé${validated.length > 1 ? 's' : ''} · Paiement Stripe bientôt` : 'Validez des dossiers pour générer des recettes'}
                    </p>
                  </div>
                </div>
                <button onClick={() => router.push('/dashboard/tresorerie')}
                  style={{ width: '100%', background: revenueEstimated > 0 ? '#16A34A' : '#F8FAFC', color: revenueEstimated > 0 ? 'white' : '#94A3B8', border: 'none', borderRadius: 9, padding: '9px 0', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                  <TrendingUp size={12} />
                  Voir la trésorerie
                </button>
              </motion.div>

            </div>
          </section>

          {/* ── KPI STATS ── */}
          <section>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
              style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
              {[
                { label: 'Événements actifs', value: events.filter(e => e.status === 'published').length, spark: [0, 1, 1, 2, 2, 3, events.length], color: '#4F46E5', icon: <Map size={13} style={{ color: '#4F46E5' }} /> },
                { label: 'Dossiers reçus', value: candidatures.length, spark: [0, 2, 4, 6, 8, 10, candidatures.length], color: '#0EA5E9', icon: <FileText size={13} style={{ color: '#0EA5E9' }} /> },
                { label: 'Exposants validés', value: validated.length, spark: [0, 1, 2, 3, 4, 5, validated.length], color: '#16A34A', icon: <CheckCircle size={13} style={{ color: '#16A34A' }} /> },
                { label: 'En attente de traitement', value: pending.length, spark: [0, 1, 2, 1, 3, 2, pending.length], color: '#F59E0B', icon: <Clock size={13} style={{ color: '#F59E0B' }} /> },
              ].map((s, i) => (
                <div key={i} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: '18px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</span>
                    {s.icon}
                  </div>
                  <p style={{ fontSize: 30, fontWeight: 700, color: '#0F172A', marginBottom: 8, letterSpacing: '-0.02em' }}>{s.value}</p>
                  <Sparkline values={s.spark} color={s.color} />
                </div>
              ))}
            </motion.div>
          </section>

          {/* ── FLUX EN TEMPS RÉEL ── */}
          <section>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}
              style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>

              {/* Candidatures récentes */}
              <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ padding: '16px 22px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Dossiers en attente de décision</p>
                    <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>{pending.length} dossier{pending.length !== 1 ? 's' : ''} à traiter</p>
                  </div>
                  <button onClick={() => router.push('/dashboard/candidatures')}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#4F46E5', background: '#EEF2FF', border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontWeight: 600 }}>
                    Tout voir <ArrowUpRight size={12} />
                  </button>
                </div>

                {pending.length === 0 ? (
                  <div style={{ padding: '48px 0', textAlign: 'center' }}>
                    <CheckCircle size={32} style={{ margin: '0 auto 12px', color: '#BBF7D0' }} />
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#16A34A' }}>Tout est à jour</p>
                    <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>Aucun dossier en attente de validation</p>
                  </div>
                ) : (
                  <div>
                    {pending.slice(0, 5).map((c, i) => {
                      const docsOk = !!(c.exposant_data?.kbis_url && c.exposant_data?.assurance_url)
                      const name = c.exposant_data?.business_name || c.profiles?.full_name || 'Exposant'
                      return (
                        <div key={c.id}
                          style={{ padding: '14px 22px', borderBottom: i < Math.min(pending.length, 5) - 1 ? '1px solid #F8FAFC' : 'none', display: 'flex', alignItems: 'center', gap: 14, transition: 'background 0.1s' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${['#EEF2FF', '#F0FDF4', '#FEF3C7', '#FEF2F2', '#F0F9FF'][i % 5]}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `1.5px solid ${['#C7D2FE', '#BBF7D0', '#FDE68A', '#FECACA', '#BAE6FD'][i % 5]}` }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: ['#4F46E5', '#16A34A', '#F59E0B', '#DC2626', '#0EA5E9'][i % 5] }}>{name.charAt(0).toUpperCase()}</span>
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                              <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</p>
                              {docsOk
                                ? <span style={{ fontSize: 10, fontWeight: 700, color: '#16A34A', background: '#F0FDF4', padding: '1px 7px', borderRadius: 100, flexShrink: 0 }}>Complet</span>
                                : <span style={{ fontSize: 10, fontWeight: 700, color: '#DC2626', background: '#FEF2F2', padding: '1px 7px', borderRadius: 100, flexShrink: 0 }}>Incomplet</span>
                              }
                            </div>
                            <p style={{ fontSize: 11, color: '#94A3B8' }}>{c.events?.title} · {c.events?.location_name?.split(',')[0]}</p>
                          </div>
                          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                            <button onClick={() => handleValidate(c.id, name)} disabled={updatingId === c.id}
                              style={{ background: '#16A34A', color: 'white', border: 'none', borderRadius: 7, padding: '6px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer', opacity: updatingId === c.id ? 0.6 : 1, transition: 'all 0.15s' }}>
                              Approuver
                            </button>
                            <button onClick={() => handleReject(c.id, name)} disabled={updatingId === c.id}
                              style={{ background: '#F8FAFC', color: '#DC2626', border: '1px solid #FECACA', borderRadius: 7, padding: '6px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer', opacity: updatingId === c.id ? 0.6 : 1 }}>
                              Refuser
                            </button>
                          </div>
                        </div>
                      )
                    })}
                    {pending.length > 5 && (
                      <div style={{ padding: '12px 22px', borderTop: '1px solid #F1F5F9' }}>
                        <button onClick={() => router.push('/dashboard/candidatures')}
                          style={{ fontSize: 12, color: '#4F46E5', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                          Voir {pending.length - 5} dossier{pending.length - 5 > 1 ? 's' : ''} supplémentaire{pending.length - 5 > 1 ? 's' : ''} <ChevronRight size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Sidebar droite */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Mes marchés avec bouton boost */}
                <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 14, overflow: 'hidden' }}>
                  <div style={{ padding: '14px 18px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>Mes marchés</p>
                    <button onClick={() => router.push('/dashboard/creer-evenement')}
                      style={{ fontSize: 11, color: '#4F46E5', background: '#EEF2FF', border: 'none', borderRadius: 7, padding: '4px 10px', cursor: 'pointer', fontWeight: 600 }}>
                      + Nouveau
                    </button>
                  </div>
                  {events.length === 0 ? (
                    <div style={{ padding: '24px 18px', textAlign: 'center', color: '#94A3B8', fontSize: 12 }}>
                      Aucun événement créé
                    </div>
                  ) : (
                    events.slice(0, 4).map((event, i) => {
                      const eventApps = candidatures.filter(c => c.event_id === event.id)
                      const eventValidated = eventApps.filter(c => c.status === 'validated' || c.status === 'paid')
                      const pct = event.total_spots > 0 ? Math.round((eventValidated.length / event.total_spots) * 100) : 0
                      return (
                        <div key={event.id}
                          style={{ padding: '12px 18px', borderBottom: i < Math.min(events.length, 4) - 1 ? '1px solid #F8FAFC' : 'none', transition: 'background 0.1s' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                            <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => router.push('/dashboard/candidatures')}>
                              <p style={{ fontSize: 12, fontWeight: 600, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{event.title}</p>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                                <Calendar size={9} style={{ color: '#94A3B8' }} />
                                <p style={{ fontSize: 10, color: '#94A3B8' }}>{formatDate(event.start_date)}</p>
                              </div>
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 700, color: pct >= 80 ? '#DC2626' : pct >= 50 ? '#F59E0B' : '#16A34A', flexShrink: 0, marginLeft: 8 }}>{pct}%</span>
                          </div>
                          <div style={{ height: 3, background: '#F1F5F9', borderRadius: 100, overflow: 'hidden', marginBottom: 8 }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: pct >= 80 ? '#DC2626' : pct >= 50 ? '#F59E0B' : '#4F46E5', borderRadius: 100, transition: 'width 0.5s' }} />
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <p style={{ fontSize: 10, color: '#94A3B8' }}>{eventValidated.length}/{event.total_spots} emplacements</p>
                            <button
                              onClick={e => { e.stopPropagation(); handleBoost(event) }}
                              disabled={boostingId === event.id}
                              style={{ display: 'flex', alignItems: 'center', gap: 4, background: boostingId === event.id ? '#F3F4F6' : 'linear-gradient(135deg,#F59E0B,#EF4444)', color: boostingId === event.id ? '#9CA3AF' : 'white', border: 'none', borderRadius: 6, padding: '4px 9px', fontSize: 10, fontWeight: 700, cursor: boostingId === event.id ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s' }}>
                              {boostingId === event.id
                                ? <><div style={{ width: 8, height: 8, border: '1.5px solid rgba(0,0,0,0.15)', borderTopColor: '#9CA3AF', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Chargement</>
                                : <>🚀 Booster — 200€</>
                              }
                            </button>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>

                {/* Actions rapides */}
                <div style={{ background: '#0F172A', borderRadius: 14, padding: '18px' }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Actions rapides</p>
                  {[
                    { icon: <Users size={13} style={{ color: '#818CF8' }} />, label: 'Gérer les candidatures', path: '/dashboard/candidatures' },
                    { icon: <Map size={13} style={{ color: '#34D399' }} />, label: 'Créer un événement', path: '/dashboard/creer-evenement' },
                    { icon: <TrendingUp size={13} style={{ color: '#FBBF24' }} />, label: 'Voir la trésorerie', path: '/dashboard/tresorerie' },
                    { icon: <Shield size={13} style={{ color: '#60A5FA' }} />, label: 'Paramètres du compte', path: '/dashboard/parametres' },
                  ].map((item, i) => (
                    <button key={i} onClick={() => router.push(item.path)}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 9, cursor: 'pointer', marginBottom: i < 3 ? 8 : 0, transition: 'background 0.15s', textAlign: 'left' }}
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

        </main>
      </div>
    </div>
  )
}
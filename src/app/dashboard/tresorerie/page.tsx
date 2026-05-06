'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import type { Variants } from 'framer-motion'
import Sidebar from '@/components/Sidebar'
import {
  Euro, TrendingUp, CheckCircle, Clock,
  Download, Calendar, CreditCard, BarChart3, FileText,
  X, ChevronRight, Phone, Shield, User
} from 'lucide-react'

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
}
const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
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

export default function Tresorerie() {
  const [profile, setProfile] = useState<any>(null)
  const [events, setEvents] = useState<any[]>([])
  const [candidatures, setCandidatures] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()
  const isMobile = useIsMobile()

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (profileData?.role !== 'organisateur') { router.push('/dashboard'); return }
      setProfile(profileData)
      const { data: eventsData } = await supabase.from('events').select('*').eq('organisateur_id', user.id)
      setEvents(eventsData || [])
      const eventIds = eventsData?.map((e: any) => e.id) || []
      if (eventIds.length > 0) {
        const { data: apps } = await supabase.from('applications')
          .select('*, profiles:exposant_id(full_name, email, phone), events:event_id(title, price_per_spot, start_date)')
          .in('event_id', eventIds).order('created_at', { ascending: false })
        const appsWithData = await Promise.all((apps || []).map(async (app: any) => {
          const { data: expData } = await supabase.from('exposant_data').select('*').eq('user_id', app.exposant_id).single()
          return { ...app, exposant_data: expData }
        }))
        setCandidatures(appsWithData)
      }
      setLoading(false)
    }
    getData()
  }, [])

  const validated = candidatures.filter(c => c.status === 'validated' || c.status === 'paid')
  const paid = candidatures.filter(c => c.status === 'paid')
  const pending = candidatures.filter(c => c.status === 'pending')
  const revenueValidated = validated.reduce((acc, c) => acc + (c.events?.price_per_spot || 0), 0)
  const revenuePaid = paid.reduce((acc, c) => acc + (c.events?.price_per_spot || 0), 0)
  const formatDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  const formatShort = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  const selectedEventApps = selectedEvent ? candidatures.filter(c => c.event_id === selectedEvent.id && (c.status === 'validated' || c.status === 'paid')) : []

  const exportCSV = () => {
    const csv = candidatures.map(c => `${c.id};${c.events?.title};${c.status};${c.events?.price_per_spot || 0}€`).join('\n')
    const blob = new Blob([`ID;Événement;Statut;Montant\n${csv}`], { type: 'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'tresorerie-PulseMarket.csv'; a.click()
  }

  const generateRapport = () => {
    const now = new Date()
    const mois = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    const total = validated.reduce((acc, c) => acc + (c.events?.price_per_spot || 0), 0)
    const ref = `RPT-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
    const rows = validated.map(c => `<tr style="border-bottom: 1px solid #F1F5F9;"><td style="padding: 10px 14px; font-size: 13px; color: #0F172A; font-weight: 500;">${c.profiles?.full_name || '—'}</td><td style="padding: 10px 14px; font-size: 13px; color: #475569;">${c.events?.title || '—'}</td><td style="padding: 10px 14px; font-size: 13px; color: #475569;">${new Date(c.created_at).toLocaleDateString('fr-FR')}</td><td style="padding: 10px 14px; font-size: 13px; font-weight: 700; color: #0F172A;">${c.events?.price_per_spot || 0} €</td><td style="padding: 10px 14px; font-size: 11px; color: #64748B; font-family: monospace;">PM-${c.id.slice(0, 8).toUpperCase()}</td></tr>`).join('')
    const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>Rapport ${mois}</title></head><body style="font-family: Helvetica, sans-serif; padding: 40px; color: #0F172A;"><h1 style="font-size: 22px; margin-bottom: 4px;">Rapport financier — ${mois}</h1><p style="color: #64748B; margin-bottom: 32px;">Réf : ${ref}</p><table style="width: 100%; border-collapse: collapse;"><thead><tr style="background: #F8FAFC;"><th style="padding: 10px 14px; text-align: left; font-size: 11px; color: #94A3B8;">FORAIN</th><th style="padding: 10px 14px; text-align: left; font-size: 11px; color: #94A3B8;">ÉVÉNEMENT</th><th style="padding: 10px 14px; text-align: left; font-size: 11px; color: #94A3B8;">DATE</th><th style="padding: 10px 14px; text-align: left; font-size: 11px; color: #94A3B8;">REDEVANCE</th><th style="padding: 10px 14px; text-align: left; font-size: 11px; color: #94A3B8;">RÉF.</th></tr></thead><tbody>${rows}</tbody><tfoot><tr><td colspan="3" style="padding: 12px 14px; font-weight: 700;">TOTAL</td><td style="padding: 12px 14px; font-size: 16px; font-weight: 800; color: #4F46E5;">${total} €</td><td></td></tr></tfoot></table><div style="margin-top: 40px; text-align: center;"><button onclick="window.print()" style="background: #4F46E5; color: white; border: none; border-radius: 8px; padding: 12px 28px; font-size: 14px; cursor: pointer;">Imprimer</button></div></body></html>`
    const win = window.open('', '_blank'); if (win) { win.document.write(html); win.document.close() }
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

      {/* Slide-over exposants */}
      <AnimatePresence>
        {selectedEvent && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedEvent(null)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 40, backdropFilter: 'blur(2px)' }} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: isMobile ? '100%' : 460, background: 'white', zIndex: 50, display: 'flex', flexDirection: 'column', boxShadow: '-4px 0 40px rgba(0,0,0,0.12)' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 3 }}>{selectedEvent.title}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748B', flexWrap: 'wrap' }}>
                    <Calendar size={11} /> {formatShort(selectedEvent.start_date)}
                    <span>·</span>
                    <span style={{ color: '#4F46E5', fontWeight: 600 }}>{selectedEventApps.length} exposant(s)</span>
                    <span>·</span>
                    <span style={{ color: '#16A34A', fontWeight: 600 }}>{selectedEventApps.length * (selectedEvent.price_per_spot || 0)} €</span>
                  </div>
                </div>
                <button onClick={() => setSelectedEvent(null)} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '6px', cursor: 'pointer', display: 'flex', flexShrink: 0 }}>
                  <X size={14} style={{ color: '#64748B' }} />
                </button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px' }}>
                {selectedEventApps.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: '#94A3B8' }}>
                    <User size={28} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
                    <p style={{ fontSize: 13 }}>Aucun exposant validé</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {selectedEventApps.map(c => (
                      <div key={c.id} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: '12px 14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#EEF2FF', border: '1.5px solid #C7D2FE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <span style={{ fontSize: 12, fontWeight: 700, color: '#4F46E5' }}>{(c.exposant_data?.business_name || c.profiles?.full_name || '?').charAt(0).toUpperCase()}</span>
                            </div>
                            <div>
                              <p style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{c.exposant_data?.business_name || c.profiles?.full_name || '—'}</p>
                              <p style={{ fontSize: 11, color: '#94A3B8' }}>{c.profiles?.email}</p>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <p style={{ fontSize: 14, fontWeight: 800, color: '#4F46E5' }}>{selectedEvent.price_per_spot || 0} €</p>
                            <span style={{ fontSize: 10, fontWeight: 600, background: c.status === 'paid' ? '#EEF2FF' : '#F0FDF4', color: c.status === 'paid' ? '#4F46E5' : '#16A34A', padding: '2px 7px', borderRadius: 100 }}>
                              {c.status === 'paid' ? 'Payé' : 'Validé'}
                            </span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                          {[{ icon: <Shield size={10} />, label: 'SIREN', value: c.exposant_data?.siren || '—' }, { icon: <Phone size={10} />, label: 'Tél', value: c.profiles?.phone || '—' }, { icon: <FileText size={10} />, label: 'Réf.', value: `PM-${c.id.slice(0, 8).toUpperCase()}` }].map((item, j) => (
                            <div key={j} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#64748B' }}>{item.icon} {item.label}</div>
                              <span style={{ color: '#0F172A', fontWeight: 500 }}>{item.value}</span>
                            </div>
                          ))}
                        </div>
                        <div style={{ display: 'flex', gap: 5, marginTop: 8, paddingTop: 8, borderTop: '1px solid #F1F5F9' }}>
                          <span style={{ fontSize: 10, fontWeight: 600, background: c.exposant_data?.kbis_url ? '#F0FDF4' : '#FEF2F2', color: c.exposant_data?.kbis_url ? '#16A34A' : '#DC2626', padding: '2px 7px', borderRadius: 100 }}>{c.exposant_data?.kbis_url ? '✓ Kbis' : '✗ Kbis'}</span>
                          <span style={{ fontSize: 10, fontWeight: 600, background: c.exposant_data?.assurance_url ? '#F0FDF4' : '#FEF2F2', color: c.exposant_data?.assurance_url ? '#16A34A' : '#DC2626', padding: '2px 7px', borderRadius: 100 }}>{c.exposant_data?.assurance_url ? '✓ RC Pro' : '✗ RC Pro'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ padding: '12px 18px', borderTop: '1px solid #E2E8F0', background: '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ fontSize: 12, color: '#64748B' }}>{selectedEventApps.length} exposant(s)</p>
                <p style={{ fontSize: 15, fontWeight: 800, color: '#4F46E5' }}>Total : {selectedEventApps.length * (selectedEvent.price_per_spot || 0)} €</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div style={{ marginLeft: isMobile ? 0 : 220, flex: 1, minWidth: 0 }}>
        <header style={{ background: 'white', borderBottom: '1px solid #E2E8F0', padding: isMobile ? '0 14px 0 60px' : '0 28px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>Trésorerie</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={exportCSV} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F8FAFC', color: '#475569', border: '1px solid #E2E8F0', borderRadius: 8, padding: '7px 10px', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
              <Download size={13} /> {!isMobile && 'Exporter'} CSV
            </button>
            <button onClick={generateRapport} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#4F46E5', color: 'white', border: 'none', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              <FileText size={13} /> {!isMobile ? 'Rapport fin de mois' : 'Rapport'}
            </button>
          </div>
        </header>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

        <main style={{ padding: isMobile ? '14px' : '24px 28px' }}>
          <motion.div variants={stagger} initial="hidden" animate="visible" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* KPIs */}
            <motion.div variants={fadeUp} style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 10 }}>
              {[
                { label: 'Encaissé', value: `${revenuePaid} €`, icon: <CheckCircle size={14} style={{ color: '#16A34A' }} />, color: '#16A34A' },
                { label: 'Validé', value: `${revenueValidated} €`, icon: <TrendingUp size={14} style={{ color: '#4F46E5' }} />, color: '#4F46E5' },
                { label: 'En attente', value: pending.length, icon: <Clock size={14} style={{ color: '#F59E0B' }} />, color: '#F59E0B' },
                { label: 'Événements', value: events.length, icon: <BarChart3 size={14} style={{ color: '#0EA5E9' }} />, color: '#0EA5E9' },
              ].map((s, i) => (
                <div key={i} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: '14px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontSize: 10, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</span>
                    {s.icon}
                  </div>
                  <p style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</p>
                </div>
              ))}
            </motion.div>

            {/* Stripe banner */}
            <motion.div variants={fadeUp} style={{ background: '#0F172A', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, background: 'rgba(79,70,229,0.2)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <CreditCard size={16} style={{ color: '#818CF8' }} />
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'white', marginBottom: 2 }}>Paiements Stripe — Bientôt disponible</p>
                  <p style={{ fontSize: 11, color: '#64748B' }}>Redevances AOT collectées automatiquement et virées sur votre compte municipal</p>
                </div>
              </div>
              <span style={{ fontSize: 11, background: '#1E293B', color: '#64748B', padding: '4px 10px', borderRadius: 100, whiteSpace: 'nowrap', flexShrink: 0 }}>Q3 2026</span>
            </motion.div>

            {/* Tableau événements */}
            <motion.div variants={fadeUp} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid #F1F5F9' }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>Détail par événement</p>
                <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>Cliquez pour voir le détail des exposants</p>
              </div>

              {events.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>Aucun événement créé</div>
              ) : isMobile ? (
                // Mobile : cards
                <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {events.map((event, i) => {
                    const eventApps = candidatures.filter(c => c.event_id === event.id && (c.status === 'validated' || c.status === 'paid'))
                    const total = eventApps.length * (event.price_per_spot || 0)
                    const isSelected = selectedEvent?.id === event.id
                    return (
                      <div key={event.id} onClick={() => setSelectedEvent(isSelected ? null : event)}
                        style={{ padding: '14px 16px', background: isSelected ? '#EEF2FF' : 'white', borderBottom: i < events.length - 1 ? '1px solid #F8FAFC' : 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{event.title}</p>
                          <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{formatShort(event.start_date)} · {eventApps.length} exposant(s)</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                          <p style={{ fontSize: 14, fontWeight: 800, color: '#4F46E5' }}>{total} €</p>
                          <ChevronRight size={14} style={{ color: isSelected ? '#4F46E5' : '#CBD5E1', transform: isSelected ? 'rotate(90deg)' : 'none', transition: 'all 0.2s' }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                // Desktop : table
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #F1F5F9', background: '#FAFAFA' }}>
                      {['Événement', 'Date', 'Exposants', 'Prix/emplacement', 'Total estimé', 'Statut', ''].map((h, i) => (
                        <th key={i} style={{ padding: '11px 18px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((event, i) => {
                      const eventApps = candidatures.filter(c => c.event_id === event.id && (c.status === 'validated' || c.status === 'paid'))
                      const total = eventApps.length * (event.price_per_spot || 0)
                      const isSelected = selectedEvent?.id === event.id
                      return (
                        <tr key={event.id} onClick={() => setSelectedEvent(isSelected ? null : event)}
                          style={{ borderBottom: i < events.length - 1 ? '1px solid #F8FAFC' : 'none', cursor: 'pointer', background: isSelected ? '#EEF2FF' : 'transparent', transition: 'background 0.1s' }}
                          onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#F8FAFC' }}
                          onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}>
                          <td style={{ padding: '14px 18px' }}><p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{event.title}</p></td>
                          <td style={{ padding: '14px 18px' }}><div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#64748B' }}><Calendar size={11} />{formatDate(event.start_date)}</div></td>
                          <td style={{ padding: '14px 18px' }}><p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{eventApps.length}</p></td>
                          <td style={{ padding: '14px 18px' }}><p style={{ fontSize: 13, color: '#475569' }}>{event.price_per_spot || 0} €</p></td>
                          <td style={{ padding: '14px 18px' }}><p style={{ fontSize: 13, fontWeight: 700, color: '#4F46E5' }}>{total} €</p></td>
                          <td style={{ padding: '14px 18px' }}>
                            <span style={{ fontSize: 11, fontWeight: 600, background: event.status === 'published' ? '#F0FDF4' : '#F8FAFC', color: event.status === 'published' ? '#16A34A' : '#94A3B8', padding: '3px 9px', borderRadius: 100, border: `1px solid ${event.status === 'published' ? '#BBF7D0' : '#E2E8F0'}` }}>
                              {event.status === 'published' ? 'Actif' : 'Fermé'}
                            </span>
                          </td>
                          <td style={{ padding: '14px 18px' }}><ChevronRight size={14} style={{ color: isSelected ? '#4F46E5' : '#CBD5E1', transform: isSelected ? 'rotate(90deg)' : 'none', transition: 'all 0.2s' }} /></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </motion.div>

          </motion.div>
        </main>
      </div>
    </div>
  )
}
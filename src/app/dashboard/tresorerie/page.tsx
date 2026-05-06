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

export default function Tresorerie() {
  const [profile, setProfile] = useState<any>(null)
  const [events, setEvents] = useState<any[]>([])
  const [candidatures, setCandidatures] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

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
        const { data: apps } = await supabase
          .from('applications')
          .select('*, profiles:exposant_id(full_name, email, phone), events:event_id(title, price_per_spot, start_date)')
          .in('event_id', eventIds)
          .order('created_at', { ascending: false })

        // Charger exposant_data pour chaque candidature
        const appsWithData = await Promise.all(
          (apps || []).map(async (app: any) => {
            const { data: expData } = await supabase.from('exposant_data').select('*').eq('user_id', app.exposant_id).single()
            return { ...app, exposant_data: expData }
          })
        )
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

  // Exposants d'un événement sélectionné
  const selectedEventApps = selectedEvent
    ? candidatures.filter(c => c.event_id === selectedEvent.id && (c.status === 'validated' || c.status === 'paid'))
    : []

  const generateRapport = () => {
    const now = new Date()
    const mois = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    const total = validated.reduce((acc, c) => acc + (c.events?.price_per_spot || 0), 0)
    const ref = `RPT-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`

    const rows = validated.map((c) => `
      <tr style="border-bottom: 1px solid #F1F5F9;">
        <td style="padding: 10px 14px; font-size: 13px; color: #0F172A; font-weight: 500;">${c.profiles?.full_name || '—'}</td>
        <td style="padding: 10px 14px; font-size: 13px; color: #475569;">${c.events?.title || '—'}</td>
        <td style="padding: 10px 14px; font-size: 13px; color: #475569;">${new Date(c.created_at).toLocaleDateString('fr-FR')}</td>
        <td style="padding: 10px 14px; font-size: 13px; font-weight: 700; color: #0F172A;">${c.events?.price_per_spot || 0} €</td>
        <td style="padding: 10px 14px; font-size: 11px; color: #64748B; font-family: monospace;">PM-${c.id.slice(0, 8).toUpperCase()}</td>
        <td style="padding: 10px 14px;">
          <span style="background: #F0FDF4; color: #16A34A; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 100px; border: 1px solid #BBF7D0;">Validé</span>
        </td>
      </tr>
    `).join('')

    const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>Rapport financier ${mois} — PulseMarket</title>
    <style>* { margin: 0; padding: 0; box-sizing: border-box; } body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #0F172A; background: white; padding: 48px; } @media print { body { padding: 24px; } .no-print { display: none !important; } }</style>
    </head><body>
    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 24px; border-bottom: 2px solid #E2E8F0;">
      <div><div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;"><div style="width: 32px; height: 32px; background: #4F46E5; border-radius: 8px; display: flex; align-items: center; justify-content: center;"><span style="color: white; font-size: 12px; font-weight: 800;">PM</span></div><span style="font-size: 18px; font-weight: 700; color: #0F172A;">PulseMarket</span></div><p style="font-size: 13px; color: #64748B;">Plateforme de gestion des marchés municipaux</p></div>
      <div style="text-align: right;"><p style="font-size: 22px; font-weight: 800; color: #0F172A; margin-bottom: 4px;">Rapport financier</p><p style="font-size: 15px; color: #4F46E5; font-weight: 600; text-transform: capitalize;">${mois}</p><p style="font-size: 12px; color: #94A3B8; margin-top: 6px;">Généré le ${now.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p><p style="font-size: 11px; color: #CBD5E1; margin-top: 3px; font-family: monospace;">${ref}</p></div>
    </div>
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 36px;">
      <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 20px;"><p style="font-size: 11px; font-weight: 600; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 8px;">Total brut encaissé</p><p style="font-size: 30px; font-weight: 800; color: #4F46E5;">${total} €</p></div>
      <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 20px;"><p style="font-size: 11px; font-weight: 600; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 8px;">Nombre de forains</p><p style="font-size: 30px; font-weight: 800; color: #0F172A;">${validated.length}</p></div>
      <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 20px;"><p style="font-size: 11px; font-weight: 600; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 8px;">Événements concernés</p><p style="font-size: 30px; font-weight: 800; color: #0F172A;">${events.length}</p></div>
    </div>
    <p style="font-size: 14px; font-weight: 700; color: #0F172A; margin-bottom: 14px;">Détail des redevances par forain</p>
    <table style="width: 100%; border-collapse: collapse; border: 1px solid #E2E8F0; overflow: hidden;">
      <thead><tr style="background: #F8FAFC; border-bottom: 2px solid #E2E8F0;"><th style="padding: 11px 14px; text-align: left; font-size: 11px; font-weight: 600; color: #94A3B8; text-transform: uppercase;">Forain</th><th style="padding: 11px 14px; text-align: left; font-size: 11px; font-weight: 600; color: #94A3B8; text-transform: uppercase;">Événement</th><th style="padding: 11px 14px; text-align: left; font-size: 11px; font-weight: 600; color: #94A3B8; text-transform: uppercase;">Date</th><th style="padding: 11px 14px; text-align: left; font-size: 11px; font-weight: 600; color: #94A3B8; text-transform: uppercase;">Redevance</th><th style="padding: 11px 14px; text-align: left; font-size: 11px; font-weight: 600; color: #94A3B8; text-transform: uppercase;">Réf.</th><th style="padding: 11px 14px; text-align: left; font-size: 11px; font-weight: 600; color: #94A3B8; text-transform: uppercase;">Statut</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="6" style="padding: 24px; text-align: center; color: #94A3B8;">Aucune transaction</td></tr>'}</tbody>
      <tfoot><tr style="background: #F8FAFC; border-top: 2px solid #E2E8F0;"><td colspan="3" style="padding: 12px 14px; font-size: 13px; font-weight: 700; color: #0F172A;">TOTAL GÉNÉRAL</td><td style="padding: 12px 14px; font-size: 16px; font-weight: 800; color: #4F46E5;">${total} €</td><td colspan="2"></td></tr></tfoot>
    </table>
    <div style="margin-top: 48px; padding-top: 20px; border-top: 1px solid #E2E8F0;">
      <div style="background: #EEF2FF; border: 1px solid #C7D2FE; border-radius: 10px; padding: 16px 20px; margin-bottom: 20px;">
        <p style="font-size: 12px; font-weight: 700; color: #4338CA; margin-bottom: 6px;">Mention légale de conformité</p>
        <p style="font-size: 12px; color: #4F46E5; line-height: 1.7;">Certifié conforme aux transactions enregistrées sur la plateforme PulseMarket. Ce document récapitule l'ensemble des redevances d'occupation du domaine public (AOT) collectées pour la période indiquée.</p>
      </div>
      <p style="font-size: 11px; color: #CBD5E1; text-align: center;">PulseMarket SAS · PulseMarket.fr · ${now.toLocaleDateString('fr-FR')} · Réf : ${ref}</p>
    </div>
    <div class="no-print" style="margin-top: 32px; text-align: center;">
      <button onclick="window.print()" style="background: #4F46E5; color: white; border: none; border-radius: 10px; padding: 12px 32px; font-size: 14px; font-weight: 600; cursor: pointer; margin-right: 12px;">Imprimer / Enregistrer en PDF</button>
      <button onclick="window.close()" style="background: #F8FAFC; color: #64748B; border: 1px solid #E2E8F0; border-radius: 10px; padding: 12px 24px; font-size: 14px; font-weight: 500; cursor: pointer;">Fermer</button>
    </div>
    </body></html>`

    const win = window.open('', '_blank')
    if (win) { win.document.write(html); win.document.close() }
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

      {/* ── SLIDE-OVER EXPOSANTS ─────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedEvent && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedEvent(null)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 40, backdropFilter: 'blur(2px)' }} />

            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 460, background: 'white', zIndex: 50, display: 'flex', flexDirection: 'column', boxShadow: '-4px 0 40px rgba(0,0,0,0.12)' }}>

              {/* Header slide-over */}
              <div style={{ padding: '18px 22px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginBottom: 3 }}>{selectedEvent.title}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748B' }}>
                    <Calendar size={11} />
                    {formatDate(selectedEvent.start_date)}
                    <span>·</span>
                    <span style={{ color: '#4F46E5', fontWeight: 600 }}>{selectedEventApps.length} exposant{selectedEventApps.length > 1 ? 's' : ''}</span>
                    <span>·</span>
                    <span style={{ color: '#16A34A', fontWeight: 600 }}>{selectedEventApps.reduce((acc, c) => acc + (selectedEvent.price_per_spot || 0), 0)} €</span>
                  </div>
                </div>
                <button onClick={() => setSelectedEvent(null)}
                  style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '6px', cursor: 'pointer', display: 'flex' }}>
                  <X size={14} style={{ color: '#64748B' }} />
                </button>
              </div>

              {/* Liste exposants */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px 22px' }}>
                {selectedEventApps.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '48px 0', color: '#94A3B8' }}>
                    <User size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                    <p style={{ fontSize: 13 }}>Aucun exposant validé pour cet événement</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {selectedEventApps.map((c, i) => (
                      <div key={c.id} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: '14px 16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {/* Avatar */}
                            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#EEF2FF', border: '1.5px solid #C7D2FE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <span style={{ fontSize: 13, fontWeight: 700, color: '#4F46E5' }}>
                                {(c.exposant_data?.business_name || c.profiles?.full_name || '?').charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
                                {c.exposant_data?.business_name || c.profiles?.full_name || '—'}
                              </p>
                              <p style={{ fontSize: 11, color: '#94A3B8' }}>{c.profiles?.full_name}</p>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <p style={{ fontSize: 15, fontWeight: 800, color: '#4F46E5' }}>{selectedEvent.price_per_spot || 0} €</p>
                            <span style={{ fontSize: 10, fontWeight: 600, background: c.status === 'paid' ? '#EEF2FF' : '#F0FDF4', color: c.status === 'paid' ? '#4F46E5' : '#16A34A', padding: '2px 7px', borderRadius: 100 }}>
                              {c.status === 'paid' ? 'Payé' : 'Validé'}
                            </span>
                          </div>
                        </div>

                        {/* Détails */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {[
                            { icon: <Shield size={11} />, label: 'SIREN', value: c.exposant_data?.siren || '—' },
                            { icon: <Phone size={11} />, label: 'Téléphone', value: c.profiles?.phone || '—' },
                            { icon: <User size={11} />, label: 'Email', value: c.profiles?.email || '—' },
                            { icon: <FileText size={11} />, label: 'Réf. transaction', value: `PM-${c.id.slice(0, 8).toUpperCase()}` },
                          ].map((item, j) => (
                            <div key={j} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#64748B' }}>
                                {item.icon} {item.label}
                              </div>
                              <span style={{ color: '#0F172A', fontWeight: 500, fontFamily: item.label === 'Réf. transaction' ? 'monospace' : 'inherit', fontSize: item.label === 'Réf. transaction' ? 11 : 12 }}>
                                {item.value}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Docs */}
                        <div style={{ display: 'flex', gap: 6, marginTop: 10, paddingTop: 10, borderTop: '1px solid #F1F5F9' }}>
                          <span style={{ fontSize: 10, fontWeight: 600, background: c.exposant_data?.kbis_url ? '#F0FDF4' : '#FEF2F2', color: c.exposant_data?.kbis_url ? '#16A34A' : '#DC2626', padding: '2px 8px', borderRadius: 100 }}>
                            {c.exposant_data?.kbis_url ? '✓ Kbis' : '✗ Kbis'}
                          </span>
                          <span style={{ fontSize: 10, fontWeight: 600, background: c.exposant_data?.assurance_url ? '#F0FDF4' : '#FEF2F2', color: c.exposant_data?.assurance_url ? '#16A34A' : '#DC2626', padding: '2px 8px', borderRadius: 100 }}>
                            {c.exposant_data?.assurance_url ? '✓ RC Pro' : '✗ RC Pro'}
                          </span>
                          {c.exposant_data?.is_verified && (
                            <span style={{ fontSize: 10, fontWeight: 600, background: '#EEF2FF', color: '#4F46E5', padding: '2px 8px', borderRadius: 100 }}>
                              ✓ SIREN vérifié
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer total */}
              <div style={{ padding: '14px 22px', borderTop: '1px solid #E2E8F0', background: '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ fontSize: 12, color: '#64748B' }}>{selectedEventApps.length} exposant{selectedEventApps.length > 1 ? 's' : ''} · {selectedEvent.title}</p>
                <p style={{ fontSize: 16, fontWeight: 800, color: '#4F46E5' }}>
                  Total : {selectedEventApps.length * (selectedEvent.price_per_spot || 0)} €
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="dash-wrap" style={{ marginLeft: 220, flex: 1 }}>
        <header style={{ background: 'white', borderBottom: '1px solid #E2E8F0', padding: '0 28px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>Trésorerie</p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => {
              const csv = candidatures.map(c => `${c.id};${c.events?.title};${c.status};${c.events?.price_per_spot || 0}€`).join('\n')
              const blob = new Blob([`ID;Événement;Statut;Montant\n${csv}`], { type: 'text/csv' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url; a.download = 'tresorerie-PulseMarket.csv'; a.click()
            }} style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#F8FAFC', color: '#475569', border: '1px solid #E2E8F0', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
              <Download size={13} /> Exporter CSV
            </button>
            <button onClick={generateRapport}
              style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#4F46E5', color: 'white', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              <FileText size={13} /> Rapport fin de mois
            </button>
          </div>
        </header>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

        <main className="dash-main" style={{ padding: "24px 28px" }}>
          <motion.div variants={stagger} initial="hidden" animate="visible" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* STATS */}
            <motion.div variants={fadeUp} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
              {[
                { label: 'Recettes encaissées', value: `${revenuePaid} €`, icon: <CheckCircle size={15} style={{ color: '#16A34A' }} />, color: '#16A34A' },
                { label: 'Recettes validées', value: `${revenueValidated} €`, icon: <TrendingUp size={15} style={{ color: '#4F46E5' }} />, color: '#4F46E5' },
                { label: 'Dossiers en attente', value: pending.length, icon: <Clock size={15} style={{ color: '#F59E0B' }} />, color: '#F59E0B' },
                { label: 'Événements actifs', value: events.length, icon: <BarChart3 size={15} style={{ color: '#0EA5E9' }} />, color: '#0EA5E9' },
              ].map((s, i) => (
                <div key={i} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</span>
                    {s.icon}
                  </div>
                  <p style={{ fontSize: 26, fontWeight: 700, color: s.color }}>{s.value}</p>
                </div>
              ))}
            </motion.div>

            {/* STRIPE BANNER */}
            <motion.div variants={fadeUp} style={{ background: '#0F172A', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, background: 'rgba(79,70,229,0.2)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CreditCard size={18} style={{ color: '#818CF8' }} />
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'white', marginBottom: 2 }}>Paiements Stripe — Bientôt disponible</p>
                  <p style={{ fontSize: 11, color: '#64748B' }}>Les redevances AOT seront collectées automatiquement et virées sur votre compte municipal</p>
                </div>
              </div>
              <span style={{ fontSize: 11, background: '#1E293B', color: '#64748B', padding: '4px 10px', borderRadius: 100, whiteSpace: 'nowrap' }}>Q3 2026</span>
            </motion.div>

            {/* TABLEAU PAR ÉVÉNEMENT — cliquable */}
            <motion.div variants={fadeUp} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>Détail par événement</p>
                  <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>Cliquez sur un événement pour voir le détail des exposants</p>
                </div>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #F1F5F9', background: '#FAFAFA' }}>
                    {['Événement', 'Date', 'Exposants validés', 'Prix/emplacement', 'Total estimé', 'Statut', ''].map((h, i) => (
                      <th key={i} style={{ padding: '11px 18px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {events.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>
                        Aucun événement créé pour le moment
                      </td>
                    </tr>
                  ) : events.map((event, i) => {
                    const eventApps = candidatures.filter(c => c.event_id === event.id && (c.status === 'validated' || c.status === 'paid'))
                    const total = eventApps.length * (event.price_per_spot || 0)
                    const isSelected = selectedEvent?.id === event.id
                    return (
                      <tr key={event.id}
                        onClick={() => setSelectedEvent(isSelected ? null : event)}
                        style={{ borderBottom: i < events.length - 1 ? '1px solid #F8FAFC' : 'none', transition: 'background 0.1s', cursor: 'pointer', background: isSelected ? '#EEF2FF' : 'transparent' }}
                        onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#F8FAFC' }}
                        onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}>
                        <td style={{ padding: '14px 18px' }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{event.title}</p>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#64748B' }}>
                            <Calendar size={11} />
                            {formatDate(event.start_date)}
                          </div>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{eventApps.length}</p>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <p style={{ fontSize: 13, color: '#475569' }}>{event.price_per_spot || 0} €</p>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <p style={{ fontSize: 13, fontWeight: 700, color: '#4F46E5' }}>{total} €</p>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <span style={{ fontSize: 11, fontWeight: 600, background: event.status === 'published' ? '#F0FDF4' : '#F8FAFC', color: event.status === 'published' ? '#16A34A' : '#94A3B8', padding: '3px 9px', borderRadius: 100, border: `1px solid ${event.status === 'published' ? '#BBF7D0' : '#E2E8F0'}` }}>
                            {event.status === 'published' ? 'Actif' : 'Fermé'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <ChevronRight size={14} style={{ color: isSelected ? '#4F46E5' : '#CBD5E1', transform: isSelected ? 'rotate(90deg)' : 'none', transition: 'all 0.2s' }} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </motion.div>

          </motion.div>
        </main>
      </div>
    </div>
  )
}
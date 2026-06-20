'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import type { Variants } from 'framer-motion'
import Sidebar from '@/components/Sidebar'
import {
  TrendingUp, CheckCircle, Clock, Download, Calendar,
  CreditCard, BarChart3, FileText, X, ChevronRight,
  Phone, Shield, User, AlertCircle, Loader, ArrowUp, ArrowDown
} from 'lucide-react'

const BRAND = '#4F46E5'

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
}
const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
}

type PeriodFilter = 'this_month' | 'last_month' | 'this_year' | 'all'

const PERIOD_LABELS: Record<PeriodFilter, string> = {
  this_month: 'Ce mois',
  last_month: 'Mois passé',
  this_year: 'Cette année',
  all: 'Tout',
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

function isInPeriod(date: string, period: PeriodFilter): boolean {
  const d = new Date(date)
  const now = new Date()
  if (period === 'all') return true
  if (period === 'this_year') return d.getFullYear() === now.getFullYear()
  if (period === 'this_month') return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  if (period === 'last_month') {
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1)
    return d.getFullYear() === lastMonth.getFullYear() && d.getMonth() === lastMonth.getMonth()
  }
  return true
}

function MonthlyChart({ data, isMobile }: { data: { month: string; revenue: number; events: number }[]; isMobile: boolean }) {
  if (data.length === 0) return null
  const max = Math.max(...data.map(d => d.revenue), 1)
  const w = isMobile ? 280 : 600
  const h = 140
  const padding = { top: 20, bottom: 30, left: 40, right: 20 }
  const chartW = w - padding.left - padding.right
  const chartH = h - padding.top - padding.bottom
  const barW = chartW / data.length - 8

  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ maxWidth: '100%' }}>
      {[0, 0.25, 0.5, 0.75, 1].map(p => (
        <line key={p} x1={padding.left} y1={padding.top + chartH * (1 - p)}
          x2={w - padding.right} y2={padding.top + chartH * (1 - p)}
          stroke="#E2E8F0" strokeWidth="1" strokeDasharray="2 2" />
      ))}
      {data.map((d, i) => {
        const x = padding.left + i * (chartW / data.length) + 4
        const barH = (d.revenue / max) * chartH
        const y = padding.top + chartH - barH
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={barH}
              fill={d.revenue > 0 ? BRAND : '#E2E8F0'}
              rx="3"
              opacity={d.revenue > 0 ? 0.9 : 0.5}>
              <title>{d.month}: {d.revenue}€ ({d.events} événements)</title>
            </rect>
            {d.revenue > 0 && (
              <text x={x + barW / 2} y={y - 4} textAnchor="middle"
                fontSize="9" fill="#475569" fontWeight="600">
                {d.revenue}€
              </text>
            )}
            <text x={x + barW / 2} y={h - 8} textAnchor="middle"
              fontSize="10" fill="#94A3B8" fontWeight="500">
              {d.month}
            </text>
          </g>
        )
      })}
      <text x={5} y={padding.top + 4} fontSize="9" fill="#94A3B8">{max}€</text>
      <text x={5} y={padding.top + chartH / 2 + 4} fontSize="9" fill="#94A3B8">{Math.round(max / 2)}€</text>
      <text x={5} y={padding.top + chartH + 4} fontSize="9" fill="#94A3B8">0€</text>
    </svg>
  )
}

export default function Tresorerie() {
  const [profile, setProfile] = useState<any>(null)
  const [events, setEvents] = useState<any[]>([])
  const [candidatures, setCandidatures] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [period, setPeriod] = useState<PeriodFilter>('this_month')
  const [generatingPDF, setGeneratingPDF] = useState(false)
  const [generatingCSV, setGeneratingCSV] = useState(false)

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

  const filteredCandidatures = useMemo(() =>
    candidatures.filter(c => isInPeriod(c.events?.start_date || c.created_at, period)),
    [candidatures, period]
  )

  const filteredEvents = useMemo(() =>
    events.filter(e => isInPeriod(e.start_date, period)),
    [events, period]
  )

  const validated = filteredCandidatures.filter(c => c.status === 'validated' || c.status === 'paid')
  const paid = filteredCandidatures.filter(c => c.status === 'paid')
  const pending = filteredCandidatures.filter(c => c.status === 'pending')

  const revenueValidated = validated.reduce((acc, c) => acc + (c.events?.price_per_spot || 0), 0)
  const revenuePaid = paid.reduce((acc, c) => acc + (c.events?.price_per_spot || 0), 0)
  const revenueDue = revenueValidated - revenuePaid

  const previousPeriod = useMemo((): PeriodFilter => {
    if (period === 'this_month') return 'last_month'
    return 'all'
  }, [period])

  const previousRevenue = useMemo(() => {
    if (period === 'all') return null
    const prev = candidatures
      .filter(c => isInPeriod(c.events?.start_date || c.created_at, previousPeriod))
      .filter(c => c.status === 'validated' || c.status === 'paid')
      .reduce((acc, c) => acc + (c.events?.price_per_spot || 0), 0)
    return prev
  }, [candidatures, period, previousPeriod])

  const revenueTrend = previousRevenue !== null && previousRevenue > 0
    ? Math.round(((revenueValidated - previousRevenue) / previousRevenue) * 100)
    : null

  const monthlyData = useMemo(() => {
    const data: { month: string; revenue: number; events: number }[] = []
    const now = new Date()
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthLabel = date.toLocaleDateString('fr-FR', { month: 'short' })

      const monthEvents = events.filter(e => {
        const d = new Date(e.start_date)
        return d.getFullYear() === date.getFullYear() && d.getMonth() === date.getMonth()
      })

      const monthRevenue = candidatures
        .filter(c => c.status === 'validated' || c.status === 'paid')
        .filter(c => {
          const d = new Date(c.events?.start_date || c.created_at)
          return d.getFullYear() === date.getFullYear() && d.getMonth() === date.getMonth()
        })
        .reduce((acc, c) => acc + (c.events?.price_per_spot || 0), 0)

      data.push({ month: monthLabel, revenue: monthRevenue, events: monthEvents.length })
    }
    return data
  }, [events, candidatures])

  const formatDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  const formatShort = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  const selectedEventApps = selectedEvent ? candidatures.filter(c => c.event_id === selectedEvent.id && (c.status === 'validated' || c.status === 'paid')) : []

  const exportCSV = async () => {
    setGeneratingCSV(true)
    try {
      const escape = (val: any) => `"${String(val ?? '').replace(/"/g, '""')}"`
      const headers = ['Date événement', 'Événement', 'Exposant', 'Email', 'Téléphone', 'SIREN', 'Statut', 'Redevance (€)', 'Référence']
      const rows = filteredCandidatures.map(c => [
        c.events?.start_date ? new Date(c.events.start_date).toLocaleDateString('fr-FR') : '',
        c.events?.title || '',
        c.exposant_data?.business_name || c.profiles?.full_name || '',
        c.profiles?.email || '',
        c.profiles?.phone || '',
        c.exposant_data?.siren || '',
        c.status,
        c.events?.price_per_spot || 0,
        `PM-${c.id.slice(0, 8).toUpperCase()}`,
      ].map(escape).join(';'))

      const csv = '\ufeff' + [headers.map(escape).join(';'), ...rows].join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `tresorerie-${PERIOD_LABELS[period].toLowerCase().replace(/ /g, '-')}-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
    } catch (err: any) {
      alert('Erreur : ' + err.message)
    }
    setGeneratingCSV(false)
  }

  const generateRapport = async () => {
    setGeneratingPDF(true)
    try {
      const { jsPDF } = await import('jspdf')
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageW = 210
      const pageH = 297

      // Header
      pdf.setFillColor(15, 23, 42)
      pdf.rect(0, 0, pageW, 24, 'F')
      pdf.setTextColor(255, 255, 255)
      pdf.setFontSize(16)
      pdf.setFont('helvetica', 'bold')
      pdf.text('PulseMarket', 15, 12)
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'normal')
      pdf.text('Rapport financier — Redevances AOT', 15, 18)

      pdf.setTextColor(148, 163, 184)
      pdf.setFontSize(8)
      pdf.text(new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }), pageW - 50, 12)
      const ref = `RPT-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
      pdf.text(`Réf : ${ref}`, pageW - 50, 18)

      pdf.setTextColor(15, 23, 42)
      pdf.setFontSize(14)
      pdf.setFont('helvetica', 'bold')
      pdf.text(PERIOD_LABELS[period], 15, 35)
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(100, 116, 139)
      pdf.text(profile?.organisation_name || profile?.full_name || 'Organisation', 15, 41)

      let y = 50
      const kpiW = (pageW - 30 - 10) / 3
      const kpis = [
        { label: 'Encaissé', value: `${revenuePaid} €`, color: [22, 163, 74] },
        { label: 'À percevoir', value: `${revenueDue} €`, color: [79, 70, 229] },
        { label: 'Total validé', value: `${revenueValidated} €`, color: [15, 23, 42] },
      ]
      kpis.forEach((k, i) => {
        const x = 15 + i * (kpiW + 5)
        pdf.setDrawColor(226, 232, 240)
        pdf.setFillColor(248, 250, 252)
        pdf.roundedRect(x, y, kpiW, 22, 2, 2, 'FD')
        pdf.setFontSize(8)
        pdf.setFont('helvetica', 'normal')
        pdf.setTextColor(148, 163, 184)
        pdf.text(k.label.toUpperCase(), x + 4, y + 7)
        pdf.setFontSize(13)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(k.color[0], k.color[1], k.color[2])
        pdf.text(k.value, x + 4, y + 16)
      })

      y += 32

      pdf.setFontSize(11)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(15, 23, 42)
      pdf.text('Détail des redevances', 15, y)
      y += 5

      pdf.setFillColor(241, 245, 249)
      pdf.rect(15, y, pageW - 30, 7, 'F')
      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(100, 116, 139)
      pdf.text('DATE', 17, y + 5)
      pdf.text('FORAIN', 40, y + 5)
      pdf.text('ÉVÉNEMENT', 85, y + 5)
      pdf.text('STATUT', 140, y + 5)
      pdf.text('MONTANT', 170, y + 5)

      y += 9
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(15, 23, 42)

      validated.forEach((c, i) => {
        if (y > pageH - 30) {
          pdf.addPage()
          y = 20
        }
        if (i % 2 === 0) {
          pdf.setFillColor(249, 250, 251)
          pdf.rect(15, y - 4, pageW - 30, 6, 'F')
        }
        pdf.setFontSize(8)
        pdf.text(c.events?.start_date ? new Date(c.events.start_date).toLocaleDateString('fr-FR') : '—', 17, y)
        pdf.text((c.exposant_data?.business_name || c.profiles?.full_name || '').substring(0, 28), 40, y)
        pdf.text((c.events?.title || '').substring(0, 28), 85, y)

        if (c.status === 'paid') {
          pdf.setTextColor(22, 163, 74)
          pdf.text('Payé', 140, y)
        } else {
          pdf.setTextColor(79, 70, 229)
          pdf.text('Validé', 140, y)
        }

        pdf.setTextColor(15, 23, 42)
        pdf.setFont('helvetica', 'bold')
        pdf.text(`${c.events?.price_per_spot || 0} €`, 170, y)
        pdf.setFont('helvetica', 'normal')
        y += 6
      })

      const footerY = pageH - 15
      pdf.setDrawColor(226, 232, 240)
      pdf.line(15, footerY - 5, pageW - 15, footerY - 5)
      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(15, 23, 42)
      pdf.text(`Total : ${revenueValidated} €`, 15, footerY)
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(7)
      pdf.setTextColor(148, 163, 184)
      pdf.text('Généré par PulseMarket · pulse-market.fr', pageW - 75, footerY)

      const filename = `rapport-tresorerie-${PERIOD_LABELS[period].toLowerCase().replace(/ /g, '-')}-${new Date().toISOString().slice(0, 10)}.pdf`
      pdf.save(filename)
    } catch (err: any) {
      alert('Erreur : ' + err.message)
    }
    setGeneratingPDF(false)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 28, height: 28, border: `2px solid ${BRAND}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <Sidebar profile={profile} />

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
                    <span style={{ color: BRAND, fontWeight: 600 }}>{selectedEventApps.length} exposant(s)</span>
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
                              <span style={{ fontSize: 12, fontWeight: 700, color: BRAND }}>{(c.exposant_data?.business_name || c.profiles?.full_name || '?').charAt(0).toUpperCase()}</span>
                            </div>
                            <div>
                              <p style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{c.exposant_data?.business_name || c.profiles?.full_name || '—'}</p>
                              <p style={{ fontSize: 11, color: '#94A3B8' }}>{c.profiles?.email}</p>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <p style={{ fontSize: 14, fontWeight: 800, color: BRAND }}>{selectedEvent.price_per_spot || 0} €</p>
                            <span style={{ fontSize: 10, fontWeight: 600, background: c.status === 'paid' ? '#EEF2FF' : '#F0FDF4', color: c.status === 'paid' ? BRAND : '#16A34A', padding: '2px 7px', borderRadius: 100 }}>
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
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 600, background: c.exposant_data?.kbis_url ? '#F0FDF4' : '#FEF2F2', color: c.exposant_data?.kbis_url ? '#16A34A' : '#DC2626', padding: '2px 7px', borderRadius: 100 }}>
                            {c.exposant_data?.kbis_url ? <CheckCircle size={9} /> : <AlertCircle size={9} />} Kbis
                          </span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 600, background: c.exposant_data?.assurance_url ? '#F0FDF4' : '#FEF2F2', color: c.exposant_data?.assurance_url ? '#16A34A' : '#DC2626', padding: '2px 7px', borderRadius: 100 }}>
                            {c.exposant_data?.assurance_url ? <CheckCircle size={9} /> : <AlertCircle size={9} />} RC Pro
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ padding: '12px 18px', borderTop: '1px solid #E2E8F0', background: '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ fontSize: 12, color: '#64748B' }}>{selectedEventApps.length} exposant(s)</p>
                <p style={{ fontSize: 15, fontWeight: 800, color: BRAND }}>Total : {selectedEventApps.length * (selectedEvent.price_per_spot || 0)} €</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div style={{ marginLeft: isMobile ? 0 : 220, flex: 1, minWidth: 0 }}>
        <header style={{ background: 'white', borderBottom: '1px solid #E2E8F0', padding: isMobile ? '0 14px 0 60px' : '0 28px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>Trésorerie</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={exportCSV} disabled={generatingCSV}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F8FAFC', color: '#475569', border: '1px solid #E2E8F0', borderRadius: 8, padding: '7px 10px', fontSize: 12, fontWeight: 500, cursor: 'pointer', opacity: generatingCSV ? 0.7 : 1 }}>
              {generatingCSV ? <Loader size={12} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Download size={13} />}
              {!isMobile && 'CSV'}
            </button>
            <button onClick={generateRapport} disabled={generatingPDF}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: BRAND, color: 'white', border: 'none', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: generatingPDF ? 0.7 : 1 }}>
              {generatingPDF ? <Loader size={12} style={{ animation: 'spin 0.8s linear infinite' }} /> : <FileText size={13} />}
              {!isMobile ? (generatingPDF ? 'Génération...' : 'Rapport PDF') : 'PDF'}
            </button>
          </div>
        </header>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

        <main style={{ padding: isMobile ? '14px' : '24px 28px' }}>
          <motion.div variants={stagger} initial="hidden" animate="visible" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            <motion.div variants={fadeUp} style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
              {(['this_month', 'last_month', 'this_year', 'all'] as PeriodFilter[]).map(p => (
                <button key={p} onClick={() => setPeriod(p)}
                  style={{
                    padding: '7px 14px', borderRadius: 8,
                    border: period === p ? `1.5px solid ${BRAND}` : '1px solid #E2E8F0',
                    background: period === p ? '#EEF2FF' : 'white',
                    color: period === p ? BRAND : '#64748B',
                    fontSize: 12, fontWeight: period === p ? 600 : 500,
                    cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                  }}>
                  {PERIOD_LABELS[p]}
                </button>
              ))}
            </motion.div>

            <motion.div variants={fadeUp} style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 10 }}>
              {[
                { label: 'Total validé', value: `${revenueValidated} €`, icon: <TrendingUp size={14} style={{ color: BRAND }} />, color: BRAND, trend: revenueTrend, sub: undefined as any },
                { label: 'Encaissé', value: `${revenuePaid} €`, icon: <CheckCircle size={14} style={{ color: '#16A34A' }} />, color: '#16A34A', sub: paid.length > 0 ? `${paid.length} paiement(s)` : 'Aucun encaissé', trend: undefined as any },
                { label: 'À percevoir', value: `${revenueDue} €`, icon: <Clock size={14} style={{ color: '#F59E0B' }} />, color: '#F59E0B', sub: validated.length > 0 ? `${validated.length - paid.length} en attente` : '—', trend: undefined as any },
                { label: 'Événements', value: filteredEvents.length, icon: <BarChart3 size={14} style={{ color: '#0EA5E9' }} />, color: '#0EA5E9', sub: `${pending.length} candidatures en cours`, trend: undefined as any },
              ].map((s, i) => (
                <div key={i} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: '14px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontSize: 10, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</span>
                    {s.icon}
                  </div>
                  <p style={{ fontSize: 22, fontWeight: 700, color: s.color, marginBottom: 4 }}>{s.value}</p>
                  {s.trend !== null && s.trend !== undefined && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: s.trend >= 0 ? '#16A34A' : '#DC2626', fontWeight: 600 }}>
                      {s.trend >= 0 ? <ArrowUp size={9} /> : <ArrowDown size={9} />}
                      {Math.abs(s.trend)}% vs période précédente
                    </div>
                  )}
                  {s.sub && (
                    <p style={{ fontSize: 10, color: '#94A3B8' }}>{s.sub}</p>
                  )}
                </div>
              ))}
            </motion.div>

            <motion.div variants={fadeUp} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: '16px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>Évolution des revenus</p>
                  <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>12 derniers mois</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#64748B' }}>
                  <div style={{ width: 10, height: 10, background: BRAND, borderRadius: 2 }} />
                  Redevances
                </div>
              </div>
              <MonthlyChart data={monthlyData} isMobile={isMobile} />
            </motion.div>

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

            <motion.div variants={fadeUp} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid #F1F5F9' }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>Détail par événement</p>
                <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>Cliquez pour voir les exposants · {PERIOD_LABELS[period]}</p>
              </div>

              {filteredEvents.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>
                  Aucun événement {period !== 'all' ? `pour ${PERIOD_LABELS[period].toLowerCase()}` : 'créé'}
                </div>
              ) : isMobile ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {filteredEvents.map((event, i) => {
                    const eventApps = candidatures.filter(c => c.event_id === event.id && (c.status === 'validated' || c.status === 'paid'))
                    const total = eventApps.length * (event.price_per_spot || 0)
                    const isSelected = selectedEvent?.id === event.id
                    return (
                      <div key={event.id} onClick={() => setSelectedEvent(isSelected ? null : event)}
                        style={{ padding: '14px 16px', background: isSelected ? '#EEF2FF' : 'white', borderBottom: i < filteredEvents.length - 1 ? '1px solid #F8FAFC' : 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{event.title}</p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                            <p style={{ fontSize: 11, color: '#94A3B8' }}>{formatShort(event.start_date)} · {eventApps.length} expo.</p>
                            <span style={{ fontSize: 9, fontWeight: 700, background: event.status === 'published' ? '#F0FDF4' : '#F8FAFC', color: event.status === 'published' ? '#16A34A' : '#94A3B8', padding: '1px 6px', borderRadius: 100 }}>
                              {event.status === 'published' ? 'Actif' : 'Fermé'}
                            </span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                          <p style={{ fontSize: 14, fontWeight: 800, color: BRAND }}>{total} €</p>
                          <ChevronRight size={14} style={{ color: isSelected ? BRAND : '#CBD5E1', transform: isSelected ? 'rotate(90deg)' : 'none', transition: 'all 0.2s' }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #F1F5F9', background: '#FAFAFA' }}>
                      {['Événement', 'Date', 'Exposants', 'Prix/empl.', 'Total estimé', 'Statut', ''].map((h) => (
                        <th key={h} style={{ padding: '11px 18px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEvents.map((event, i) => {
                      const eventApps = candidatures.filter(c => c.event_id === event.id && (c.status === 'validated' || c.status === 'paid'))
                      const total = eventApps.length * (event.price_per_spot || 0)
                      const isSelected = selectedEvent?.id === event.id
                      return (
                        <tr key={event.id} onClick={() => setSelectedEvent(isSelected ? null : event)}
                          style={{ borderBottom: i < filteredEvents.length - 1 ? '1px solid #F8FAFC' : 'none', cursor: 'pointer', background: isSelected ? '#EEF2FF' : 'transparent', transition: 'background 0.1s' }}
                          onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#F8FAFC' }}
                          onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}>
                          <td style={{ padding: '14px 18px' }}><p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{event.title}</p></td>
                          <td style={{ padding: '14px 18px' }}><div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#64748B' }}><Calendar size={11} />{formatDate(event.start_date)}</div></td>
                          <td style={{ padding: '14px 18px' }}><p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{eventApps.length}</p></td>
                          <td style={{ padding: '14px 18px' }}><p style={{ fontSize: 13, color: '#475569' }}>{event.price_per_spot || 0} €</p></td>
                          <td style={{ padding: '14px 18px' }}><p style={{ fontSize: 13, fontWeight: 700, color: BRAND }}>{total} €</p></td>
                          <td style={{ padding: '14px 18px' }}>
                            <span style={{ fontSize: 11, fontWeight: 600, background: event.status === 'published' ? '#F0FDF4' : '#F8FAFC', color: event.status === 'published' ? '#16A34A' : '#94A3B8', padding: '3px 9px', borderRadius: 100, border: `1px solid ${event.status === 'published' ? '#BBF7D0' : '#E2E8F0'}` }}>
                              {event.status === 'published' ? 'Actif' : 'Fermé'}
                            </span>
                          </td>
                          <td style={{ padding: '14px 18px' }}><ChevronRight size={14} style={{ color: isSelected ? BRAND : '#CBD5E1', transform: isSelected ? 'rotate(90deg)' : 'none', transition: 'all 0.2s' }} /></td>
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
'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from '@/components/Sidebar'
import { ACTION_LABELS, ACTION_SEVERITY, type AuditAction } from '@/lib/auditLogger'
import {
  Activity, Search, Filter, Download, FileText, Calendar,
  User, ChevronRight, X, MapPin, Smartphone, Monitor, Tablet,
  AlertTriangle, CheckCircle, XCircle, Info, Loader, ArrowLeft,
  Shield, Clock, Globe, ChevronDown, RefreshCw, FileSpreadsheet
} from 'lucide-react'

const BRAND = '#4F46E5'
const RETENTION_MONTHS = 60

type PeriodFilter = 'today' | 'this_week' | 'this_month' | 'last_month' | 'this_year' | 'all'
type SeverityFilter = 'all' | 'critical' | 'warning' | 'info'

const PERIOD_LABELS: Record<PeriodFilter, string> = {
  today: 'Aujourd\'hui',
  this_week: 'Cette semaine',
  this_month: 'Ce mois',
  last_month: 'Mois passé',
  this_year: 'Cette année',
  all: 'Tout',
}

function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t) }, [onClose])
  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 2000, background: 'white', borderRadius: 12, padding: '12px 18px', boxShadow: '0 8px 32px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: 10, borderLeft: `3px solid ${type === 'success' ? '#16A34A' : '#DC2626'}`, minWidth: 280 }}>
      {type === 'success' ? <CheckCircle size={15} style={{ color: '#16A34A' }} /> : <XCircle size={15} style={{ color: '#DC2626' }} />}
      <span style={{ fontSize: 13, fontWeight: 500, color: '#0F172A' }}>{message}</span>
    </motion.div>
  )
}

function SeverityBadge({ severity }: { severity: 'info' | 'warning' | 'critical' }) {
  const config = {
    info:     { color: BRAND,    bg: '#EEF2FF', icon: <Info size={9} />,           label: 'Info' },
    warning:  { color: '#F59E0B', bg: '#FFFBEB', icon: <AlertTriangle size={9} />, label: 'Warning' },
    critical: { color: '#DC2626', bg: '#FEF2F2', icon: <XCircle size={9} />,        label: 'Critique' },
  }[severity]
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: config.bg, color: config.color, fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 100 }}>
      {config.icon} {config.label}
    </span>
  )
}

function isInPeriod(date: string, period: PeriodFilter): boolean {
  const d = new Date(date)
  const now = new Date()
  if (period === 'all') return true
  if (period === 'today') return d.toDateString() === now.toDateString()
  if (period === 'this_week') {
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    return d >= weekAgo
  }
  if (period === 'this_month') return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  if (period === 'last_month') {
    const lm = new Date(now.getFullYear(), now.getMonth() - 1)
    return d.getFullYear() === lm.getFullYear() && d.getMonth() === lm.getMonth()
  }
  if (period === 'this_year') return d.getFullYear() === now.getFullYear()
  return true
}

function parseUserAgent(ua: string): { browser: string; os: string; device: 'mobile' | 'desktop' | 'tablet' } {
  let browser = 'Inconnu', os = 'Inconnu', device: 'mobile' | 'desktop' | 'tablet' = 'desktop'
  if (/Firefox/i.test(ua)) browser = 'Firefox'
  else if (/Chrome/i.test(ua) && !/Edg/i.test(ua)) browser = 'Chrome'
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari'
  else if (/Edg/i.test(ua)) browser = 'Edge'
  if (/Windows/i.test(ua)) os = 'Windows'
  else if (/Mac OS/i.test(ua)) os = 'macOS'
  else if (/Linux/i.test(ua)) os = 'Linux'
  else if (/iPhone|iPad/i.test(ua)) { os = 'iOS'; device = /iPad/i.test(ua) ? 'tablet' : 'mobile' }
  else if (/Android/i.test(ua)) { os = 'Android'; device = 'mobile' }
  return { browser, os, device }
}

export default function AuditLogsPage() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState<any[]>([])
  const [period, setPeriod] = useState<PeriodFilter>('this_month')
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all')
  const [search, setSearch] = useState('')
  const [selectedLog, setSelectedLog] = useState<any>(null)
  const [exportingCsv, setExportingCsv] = useState(false)
  const [exportingPdf, setExportingPdf] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [actionFilter, setActionFilter] = useState<string>('all')
  const [showActionDropdown, setShowActionDropdown] = useState(false)
  const [actorFilter, setActorFilter] = useState<string>('all')
  const [refreshing, setRefreshing] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (profileData?.role !== 'organisateur') { router.push('/dashboard'); return }
      setProfile(profileData)
      await loadLogs(user.id)

      // Log la consultation de la page audit
      await fetch('/api/audit-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'audit_logs_view' })
      }).catch(() => {})

      setLoading(false)
    }
    getData()
  }, [])

  const loadLogs = async (mairieId: string) => {
    const { data } = await supabase
      .from('audit_logs')
      .select('*, actor:actor_id(full_name, email, avatar_url)')
      .eq('mairie_id', mairieId)
      .order('created_at', { ascending: false })
      .limit(1000)
    setLogs(data || [])
  }

  const refresh = async () => {
    setRefreshing(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) await loadLogs(user.id)
    setRefreshing(false)
    setToast({ message: 'Logs actualisés', type: 'success' })
  }

  // Filtres
  const filteredLogs = useMemo(() => {
    return logs
      .filter(l => isInPeriod(l.created_at, period))
      .filter(l => severityFilter === 'all' ? true : ACTION_SEVERITY[l.action as AuditAction] === severityFilter)
      .filter(l => actionFilter === 'all' ? true : l.action === actionFilter)
      .filter(l => actorFilter === 'all' ? true : l.actor_id === actorFilter)
      .filter(l => !search ||
        l.actor?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        l.actor?.email?.toLowerCase().includes(search.toLowerCase()) ||
        l.actor_email?.toLowerCase().includes(search.toLowerCase()) ||
        ACTION_LABELS[l.action as AuditAction]?.toLowerCase().includes(search.toLowerCase()) ||
        l.action.toLowerCase().includes(search.toLowerCase())
      )
  }, [logs, period, severityFilter, actionFilter, actorFilter, search])

  // Stats
  const stats = useMemo(() => ({
    total: filteredLogs.length,
    critical: filteredLogs.filter(l => ACTION_SEVERITY[l.action as AuditAction] === 'critical').length,
    warning: filteredLogs.filter(l => ACTION_SEVERITY[l.action as AuditAction] === 'warning').length,
    info: filteredLogs.filter(l => ACTION_SEVERITY[l.action as AuditAction] === 'info').length,
  }), [filteredLogs])

  // Liste unique des actions et acteurs
  const uniqueActions = useMemo(() => {
    const set = new Set(logs.map(l => l.action))
    return Array.from(set).sort()
  }, [logs])

  const uniqueActors = useMemo(() => {
    const map = new Map()
    logs.forEach(l => {
      const id = l.actor_id || l.actor_email
      if (id && !map.has(id)) {
        map.set(id, {
          id: l.actor_id,
          name: l.actor?.full_name || l.actor_email || 'Inconnu',
          email: l.actor?.email || l.actor_email,
        })
      }
    })
    return Array.from(map.values())
  }, [logs])

  // ✅ Export CSV
  const exportCSV = async () => {
    setExportingCsv(true)
    try {
      const escape = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`
      const headers = ['Date', 'Heure', 'Acteur', 'Email', 'Action', 'Action (libellé)', 'Gravité', 'Ressource', 'ID ressource', 'IP', 'User-Agent', 'Détails']
      const rows = filteredLogs.map(l => {
        const date = new Date(l.created_at)
        return [
          date.toLocaleDateString('fr-FR'),
          date.toLocaleTimeString('fr-FR'),
          l.actor?.full_name || '—',
          l.actor?.email || l.actor_email || '—',
          l.action,
          ACTION_LABELS[l.action as AuditAction] || l.action,
          ACTION_SEVERITY[l.action as AuditAction] || 'info',
          l.resource_type || '—',
          l.resource_id || '—',
          l.ip_address || '—',
          l.user_agent || '—',
          JSON.stringify(l.details || {}),
        ].map(escape).join(';')
      })
      const csv = '\ufeff' + [headers.map(escape).join(';'), ...rows].join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `audit-logs-${PERIOD_LABELS[period].toLowerCase().replace(/ /g, '-')}-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()

      await fetch('/api/audit-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'audit_logs_export', details: { format: 'csv', count: filteredLogs.length } })
      }).catch(() => {})

      setToast({ message: 'Export CSV téléchargé', type: 'success' })
    } catch (err: any) {
      setToast({ message: 'Erreur : ' + err.message, type: 'error' })
    }
    setExportingCsv(false)
  }

  // ✅ Export PDF rapport
  const exportPDF = async () => {
    setExportingPdf(true)
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
      pdf.text('Rapport d\'audit RGPD', 15, 18)

      pdf.setTextColor(148, 163, 184)
      pdf.setFontSize(8)
      pdf.text(new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }), pageW - 50, 12)
      const ref = `AUDIT-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
      pdf.text(`Réf : ${ref}`, pageW - 50, 18)

      // Titre
      pdf.setTextColor(15, 23, 42)
      pdf.setFontSize(14)
      pdf.setFont('helvetica', 'bold')
      pdf.text(`Période : ${PERIOD_LABELS[period]}`, 15, 35)
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(100, 116, 139)
      pdf.text(profile?.organisation_name || profile?.full_name || 'Organisation', 15, 41)

      // KPIs
      let y = 50
      const kpiW = (pageW - 30 - 15) / 4
      const kpis = [
        { label: 'Total', value: stats.total, color: [15, 23, 42] },
        { label: 'Critiques', value: stats.critical, color: [220, 38, 38] },
        { label: 'Warnings', value: stats.warning, color: [245, 158, 11] },
        { label: 'Info', value: stats.info, color: [79, 70, 229] },
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
        pdf.setFontSize(15)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(k.color[0], k.color[1], k.color[2])
        pdf.text(String(k.value), x + 4, y + 17)
      })

      y += 32

      // Tableau logs
      pdf.setFontSize(11)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(15, 23, 42)
      pdf.text('Journal des actions', 15, y)
      y += 6

      pdf.setFillColor(241, 245, 249)
      pdf.rect(15, y, pageW - 30, 7, 'F')
      pdf.setFontSize(7)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(100, 116, 139)
      pdf.text('DATE', 17, y + 5)
      pdf.text('ACTEUR', 50, y + 5)
      pdf.text('ACTION', 100, y + 5)
      pdf.text('GRAVITÉ', 165, y + 5)

      y += 9
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(15, 23, 42)

      filteredLogs.slice(0, 200).forEach((l, i) => {
        if (y > pageH - 25) {
          pdf.addPage()
          y = 20
        }
        if (i % 2 === 0) {
          pdf.setFillColor(249, 250, 251)
          pdf.rect(15, y - 4, pageW - 30, 6, 'F')
        }
        pdf.setFontSize(7)
        const date = new Date(l.created_at)
        pdf.text(`${date.toLocaleDateString('fr-FR')} ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`, 17, y)
        pdf.text((l.actor?.full_name || l.actor_email || '—').substring(0, 22), 50, y)
        pdf.text((ACTION_LABELS[l.action as AuditAction] || l.action).substring(0, 30), 100, y)

        const sev = ACTION_SEVERITY[l.action as AuditAction] || 'info'
        if (sev === 'critical') { pdf.setTextColor(220, 38, 38); pdf.text('Critique', 165, y) }
        else if (sev === 'warning') { pdf.setTextColor(245, 158, 11); pdf.text('Warning', 165, y) }
        else { pdf.setTextColor(79, 70, 229); pdf.text('Info', 165, y) }
        pdf.setTextColor(15, 23, 42)
        y += 6
      })

      // Footer
      const footerY = pageH - 15
      pdf.setDrawColor(226, 232, 240)
      pdf.line(15, footerY - 5, pageW - 15, footerY - 5)
      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(15, 23, 42)
      pdf.text(`${stats.total} entrées dans la période`, 15, footerY)
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(7)
      pdf.setTextColor(148, 163, 184)
      pdf.text(`Conformité RGPD · Rétention ${RETENTION_MONTHS} mois · pulse-market.fr`, pageW - 90, footerY)

      pdf.save(`audit-rapport-${PERIOD_LABELS[period].toLowerCase().replace(/ /g, '-')}-${new Date().toISOString().slice(0, 10)}.pdf`)

      await fetch('/api/audit-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'audit_logs_export', details: { format: 'pdf', count: filteredLogs.length } })
      }).catch(() => {})

      setToast({ message: 'Rapport PDF téléchargé', type: 'success' })
    } catch (err: any) {
      setToast({ message: 'Erreur : ' + err.message, type: 'error' })
    }
    setExportingPdf(false)
  }

  const formatDateFull = (d: string) => new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 28, height: 28, border: `2px solid ${BRAND}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <Sidebar profile={profile} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <AnimatePresence>{toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}</AnimatePresence>

      {/* Slide-over détails log */}
      <AnimatePresence>
        {selectedLog && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedLog(null)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 40, backdropFilter: 'blur(2px)' }} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 440, background: 'white', zIndex: 50, display: 'flex', flexDirection: 'column', boxShadow: '-4px 0 40px rgba(0,0,0,0.12)' }}>

              <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <SeverityBadge severity={ACTION_SEVERITY[selectedLog.action as AuditAction] || 'info'} />
                  </div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>
                    {ACTION_LABELS[selectedLog.action as AuditAction] || selectedLog.action}
                  </p>
                  <p style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'monospace', marginTop: 2 }}>{selectedLog.action}</p>
                </div>
                <button onClick={() => setSelectedLog(null)}
                  style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '6px', cursor: 'pointer', display: 'flex', flexShrink: 0 }}>
                  <X size={14} style={{ color: '#64748B' }} />
                </button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>

                {/* Acteur */}
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: '12px 14px' }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Acteur</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1.5px solid #C7D2FE' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: BRAND }}>
                        {(selectedLog.actor?.full_name || selectedLog.actor_email || '?').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{selectedLog.actor?.full_name || '—'}</p>
                      <p style={{ fontSize: 11, color: '#64748B' }}>{selectedLog.actor?.email || selectedLog.actor_email || '—'}</p>
                    </div>
                  </div>
                </div>

                {/* Date */}
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: '12px 14px' }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Date et heure</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Calendar size={13} style={{ color: '#64748B' }} />
                    <p style={{ fontSize: 13, fontWeight: 500, color: '#0F172A' }}>{formatDateFull(selectedLog.created_at)}</p>
                  </div>
                </div>

                {/* Ressource */}
                {selectedLog.resource_type && (
                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: '12px 14px' }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Ressource</p>
                    <div style={{ fontSize: 12, color: '#475569' }}>
                      <p><strong>Type :</strong> {selectedLog.resource_type}</p>
                      {selectedLog.resource_id && (
                        <p style={{ fontFamily: 'monospace', fontSize: 10, color: '#94A3B8', marginTop: 4 }}>ID : {selectedLog.resource_id}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Connexion / Device */}
                {(selectedLog.ip_address || selectedLog.user_agent) && (
                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: '12px 14px' }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Connexion</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {selectedLog.ip_address && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Globe size={12} style={{ color: '#64748B' }} />
                          <span style={{ fontSize: 12, color: '#475569', fontFamily: 'monospace' }}>{selectedLog.ip_address}</span>
                        </div>
                      )}
                      {selectedLog.user_agent && (() => {
                        const { browser, os, device } = parseUserAgent(selectedLog.user_agent)
                        const DeviceIcon = device === 'mobile' ? Smartphone : device === 'tablet' ? Tablet : Monitor
                        return (
                          <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <DeviceIcon size={12} style={{ color: '#64748B' }} />
                              <span style={{ fontSize: 12, color: '#475569' }}>{browser} sur {os}</span>
                            </div>
                            <details style={{ fontSize: 10, color: '#94A3B8', cursor: 'pointer' }}>
                              <summary>User-Agent complet</summary>
                              <p style={{ marginTop: 4, fontFamily: 'monospace', wordBreak: 'break-all', padding: 8, background: 'white', borderRadius: 6 }}>{selectedLog.user_agent}</p>
                            </details>
                          </>
                        )
                      })()}
                    </div>
                  </div>
                )}

                {/* Détails JSON */}
                {selectedLog.details && Object.keys(selectedLog.details).length > 0 && (
                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: '12px 14px' }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Détails contextuels</p>
                    <pre style={{ fontSize: 11, color: '#0F172A', background: 'white', padding: 10, borderRadius: 6, overflow: 'auto', margin: 0, fontFamily: 'monospace' }}>
                      {JSON.stringify(selectedLog.details, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Référence */}
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: '12px 14px' }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Référence d'audit</p>
                  <p style={{ fontSize: 11, color: '#0F172A', fontFamily: 'monospace' }}>LOG-{selectedLog.id.slice(0, 8).toUpperCase()}</p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div style={{ marginLeft: 220, flex: 1, minWidth: 0 }}>
        <header style={{ background: 'white', borderBottom: '1px solid #E2E8F0', padding: '0 28px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => router.push('/dashboard/parametres/mairie')}
              style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', fontSize: 12 }}>
              <ArrowLeft size={13} /> Paramètres
            </button>
            <div style={{ width: 1, height: 16, background: '#E2E8F0' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Activity size={14} style={{ color: BRAND }} />
              <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>Audit & Logs</p>
              <span style={{ background: '#0F172A', color: 'white', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>RGPD</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={refresh} disabled={refreshing}
              style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#F8FAFC', color: '#475569', border: '1px solid #E2E8F0', borderRadius: 8, padding: '7px 10px', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
              {refreshing ? <Loader size={12} style={{ animation: 'spin 0.8s linear infinite' }} /> : <RefreshCw size={12} />}
              Actualiser
            </button>
            <button onClick={exportCSV} disabled={exportingCsv}
              style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'white', color: '#16A34A', border: '1px solid #BBF7D0', borderRadius: 8, padding: '7px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              {exportingCsv ? <Loader size={12} style={{ animation: 'spin 0.8s linear infinite' }} /> : <FileSpreadsheet size={12} />}
              CSV
            </button>
            <button onClick={exportPDF} disabled={exportingPdf}
              style={{ display: 'flex', alignItems: 'center', gap: 5, background: BRAND, color: 'white', border: 'none', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              {exportingPdf ? <Loader size={12} style={{ animation: 'spin 0.8s linear infinite' }} /> : <FileText size={12} />}
              Rapport PDF
            </button>
          </div>
        </header>

        <main style={{ padding: '24px 28px', maxWidth: 1200 }}>

          {/* Banner conformité */}
          <div style={{ background: 'linear-gradient(135deg, #0F172A, #1E293B)', borderRadius: 12, padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, background: 'rgba(79,70,229,0.2)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Shield size={17} style={{ color: '#818CF8' }} />
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'white', marginBottom: 2 }}>Journal d'audit RGPD</p>
                <p style={{ fontSize: 11, color: '#94A3B8' }}>Rétention {RETENTION_MONTHS} mois · Conforme administration française · Logs immuables</p>
              </div>
            </div>
            <span style={{ fontSize: 11, background: '#1E293B', color: '#94A3B8', padding: '4px 10px', borderRadius: 100, whiteSpace: 'nowrap', flexShrink: 0 }}>
              {logs.length} entrées totales
            </span>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Total', value: stats.total, color: '#0F172A', icon: <Activity size={14} /> },
              { label: 'Critiques', value: stats.critical, color: '#DC2626', icon: <XCircle size={14} /> },
              { label: 'Warnings', value: stats.warning, color: '#F59E0B', icon: <AlertTriangle size={14} /> },
              { label: 'Info', value: stats.info, color: BRAND, icon: <Info size={14} /> },
            ].map(stat => (
              <div key={stat.label} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{stat.label}</span>
                  <div style={{ color: stat.color }}>{stat.icon}</div>
                </div>
                <p style={{ fontSize: 22, fontWeight: 800, color: stat.color }}>{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Filtres */}
          <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: '14px 16px', marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Search */}
            <div style={{ position: 'relative' }}>
              <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher par acteur, email, action..."
                style={{ width: '100%', padding: '8px 12px 8px 30px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 12, color: '#0F172A', background: '#F8FAFC', outline: 'none', boxSizing: 'border-box' }} />
            </div>

            {/* Période */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {(['today', 'this_week', 'this_month', 'last_month', 'this_year', 'all'] as PeriodFilter[]).map(p => (
                <button key={p} onClick={() => setPeriod(p)}
                  style={{
                    padding: '6px 12px', borderRadius: 8,
                    border: period === p ? `1.5px solid ${BRAND}` : '1px solid #E2E8F0',
                    background: period === p ? '#EEF2FF' : 'white',
                    color: period === p ? BRAND : '#64748B',
                    fontSize: 11, fontWeight: period === p ? 600 : 500,
                    cursor: 'pointer', whiteSpace: 'nowrap',
                  }}>
                  {PERIOD_LABELS[p]}
                </button>
              ))}
            </div>

            {/* Gravité + Action + Acteur */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              <Filter size={12} style={{ color: '#94A3B8' }} />

              {/* Gravité */}
              {(['all', 'critical', 'warning', 'info'] as SeverityFilter[]).map(s => {
                const isActive = severityFilter === s
                const color = s === 'critical' ? '#DC2626' : s === 'warning' ? '#F59E0B' : s === 'info' ? BRAND : '#64748B'
                return (
                  <button key={s} onClick={() => setSeverityFilter(s)}
                    style={{
                      padding: '5px 10px', borderRadius: 8,
                      border: isActive ? `1.5px solid ${color}` : '1px solid #E2E8F0',
                      background: isActive ? `${color}15` : 'white',
                      color: isActive ? color : '#64748B',
                      fontSize: 11, fontWeight: isActive ? 600 : 500,
                      cursor: 'pointer', whiteSpace: 'nowrap',
                    }}>
                    {s === 'all' ? 'Toutes' : s === 'critical' ? 'Critique' : s === 'warning' ? 'Warning' : 'Info'}
                  </button>
                )
              })}

              <div style={{ width: 1, height: 16, background: '#E2E8F0', margin: '0 4px' }} />

              {/* Action dropdown */}
              <div style={{ position: 'relative' }}>
                <button onClick={() => setShowActionDropdown(!showActionDropdown)}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 8, border: actionFilter !== 'all' ? `1.5px solid ${BRAND}` : '1px solid #E2E8F0', background: actionFilter !== 'all' ? '#EEF2FF' : 'white', color: actionFilter !== 'all' ? BRAND : '#64748B', fontSize: 11, fontWeight: 500, cursor: 'pointer' }}>
                  {actionFilter === 'all' ? 'Toutes actions' : ACTION_LABELS[actionFilter as AuditAction] || actionFilter}
                  <ChevronDown size={10} />
                </button>
                {showActionDropdown && (
                  <>
                    <div onClick={() => setShowActionDropdown(false)} style={{ position: 'fixed', inset: 0, zIndex: 998 }} />
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                      style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, background: 'white', borderRadius: 10, boxShadow: '0 12px 32px rgba(0,0,0,0.12)', border: '1px solid #E2E8F0', padding: 6, zIndex: 999, minWidth: 240, maxHeight: 320, overflowY: 'auto' }}>
                      <button onClick={() => { setActionFilter('all'); setShowActionDropdown(false) }}
                        style={{ width: '100%', padding: '6px 8px', borderRadius: 6, background: actionFilter === 'all' ? '#EEF2FF' : 'none', border: 'none', cursor: 'pointer', color: '#0F172A', fontSize: 11, textAlign: 'left' }}>
                        Toutes actions
                      </button>
                      {uniqueActions.map(a => (
                        <button key={a} onClick={() => { setActionFilter(a); setShowActionDropdown(false) }}
                          style={{ width: '100%', padding: '6px 8px', borderRadius: 6, background: actionFilter === a ? '#EEF2FF' : 'none', border: 'none', cursor: 'pointer', color: '#475569', fontSize: 11, textAlign: 'left' }}
                          onMouseEnter={e => actionFilter !== a && (e.currentTarget.style.background = '#F8FAFC')}
                          onMouseLeave={e => actionFilter !== a && (e.currentTarget.style.background = 'transparent')}>
                          {ACTION_LABELS[a as AuditAction] || a}
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </div>

              {/* Acteur */}
              {uniqueActors.length > 1 && (
                <select value={actorFilter} onChange={e => setActorFilter(e.target.value)}
                  style={{ padding: '5px 10px', border: actorFilter !== 'all' ? `1.5px solid ${BRAND}` : '1px solid #E2E8F0', background: actorFilter !== 'all' ? '#EEF2FF' : 'white', color: actorFilter !== 'all' ? BRAND : '#64748B', borderRadius: 8, fontSize: 11, fontWeight: 500, cursor: 'pointer', outline: 'none' }}>
                  <option value="all">Tous acteurs</option>
                  {uniqueActors.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Liste des logs */}
          {filteredLogs.length === 0 ? (
            <div style={{ background: 'white', border: '1px dashed #E2E8F0', borderRadius: 12, padding: '60px 20px', textAlign: 'center' }}>
              <Activity size={36} style={{ color: '#CBD5E1', marginBottom: 14 }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', marginBottom: 4 }}>Aucun événement</p>
              <p style={{ fontSize: 12, color: '#64748B' }}>Aucun log ne correspond à vos filtres</p>
            </div>
          ) : (
            <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
              {filteredLogs.map((log, i) => {
                const severity = ACTION_SEVERITY[log.action as AuditAction] || 'info'
                const date = new Date(log.created_at)
                const sevColor = severity === 'critical' ? '#DC2626' : severity === 'warning' ? '#F59E0B' : BRAND
                return (
                  <div key={log.id} onClick={() => setSelectedLog(log)}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '8px 1fr 200px 130px 24px',
                      gap: 12,
                      alignItems: 'center',
                      padding: '12px 16px 12px 12px',
                      borderBottom: i < filteredLogs.length - 1 ? '1px solid #F8FAFC' : 'none',
                      cursor: 'pointer',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    {/* Bar gravité */}
                    <div style={{ width: 4, height: 32, background: sevColor, borderRadius: 100 }} />

                    {/* Action */}
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>
                          {ACTION_LABELS[log.action as AuditAction] || log.action}
                        </p>
                        <SeverityBadge severity={severity} />
                      </div>
                      {log.resource_type && (
                        <p style={{ fontSize: 11, color: '#94A3B8' }}>
                          {log.resource_type}{log.resource_id ? ` · ${log.resource_id.slice(0, 8)}` : ''}
                        </p>
                      )}
                    </div>

                    {/* Acteur */}
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 500, color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {log.actor?.full_name || log.actor_email || '—'}
                      </p>
                      {log.actor?.email && (
                        <p style={{ fontSize: 11, color: '#94A3B8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {log.actor.email}
                        </p>
                      )}
                    </div>

                    {/* Date */}
                    <div>
                      <p style={{ fontSize: 12, color: '#475569', whiteSpace: 'nowrap' }}>
                        {date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                      </p>
                      <p style={{ fontSize: 11, color: '#94A3B8' }}>
                        {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                    <ChevronRight size={14} style={{ color: '#CBD5E1' }} />
                  </div>
                )
              })}
            </div>
          )}

          {filteredLogs.length >= 1000 && (
            <p style={{ fontSize: 11, color: '#94A3B8', textAlign: 'center', marginTop: 14 }}>
              Affichage des 1000 logs les plus récents. Affinez vos filtres pour explorer les autres.
            </p>
          )}

        </main>
      </div>
    </div>
  )
}
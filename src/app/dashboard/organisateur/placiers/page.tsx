'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  QrCode, CheckCircle, XCircle, AlertTriangle, X,
  Loader, Search, Plus, User, MapPin, CreditCard,
  Clock, Shield, ChevronRight, LogOut
} from 'lucide-react'

type ScanResult = {
  status: 'valid' | 'already_scanned' | 'invalid'
  candidature?: any
}

export default function DashboardPlacier() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'list' | 'scan' | 'add'>('list')
  const [candidatures, setCandidatures] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [search, setSearch] = useState('')
  const [scanning, setScanning] = useState(false)
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [validating, setValidating] = useState(false)
  const [validated, setValidated] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const scannerRef = useRef<any>(null)

  // Ajout express
  const [addNom, setAddNom] = useState('')
  const [addSiren, setAddSiren] = useState('')
  const [addMontant, setAddMontant] = useState('')
  const [addLoading, setAddLoading] = useState(false)
  const [addSuccess, setAddSuccess] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (profileData?.role !== 'placier' && profileData?.role !== 'organisateur') {
        router.push('/dashboard'); return
      }
      setProfile(profileData)

      // Événements du jour et à venir
      const today = new Date().toISOString().split('T')[0]
      const { data: eventsData } = await supabase
        .from('events')
        .select('*')
        .gte('start_date', today)
        .order('start_date', { ascending: true })
        .limit(10)
      setEvents(eventsData || [])
      if (eventsData && eventsData.length > 0) {
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
      .in('status', ['paid', 'present'])
      .order('created_at', { ascending: true })
    setCandidatures(apps || [])
  }

  const handleSelectEvent = async (event: any) => {
    setSelectedEvent(event)
    await loadCandidatures(event.id)
  }

  // Scanner
  const startScanner = async () => {
    setScanResult(null)
    setValidated(false)
    setCameraError('')
    setScanning(true)
    await new Promise(r => setTimeout(r, 300))
    try {
      const { Html5Qrcode } = await import('html5-qrcode')
      const html5QrCode = new Html5Qrcode('qr-reader-placier')
      scannerRef.current = html5QrCode
      await html5QrCode.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        async (decodedText: string) => {
          await html5QrCode.stop()
          setScanning(false)
          await handleScanResult(decodedText)
        },
        () => {}
      )
    } catch {
      setScanning(false)
      setCameraError("Impossible d'accéder à la caméra.")
    }
  }

  const stopScanner = async () => {
    try { if (scannerRef.current) { await scannerRef.current.stop(); scannerRef.current = null } } catch {}
    setScanning(false)
  }

  const handleScanResult = async (decodedText: string) => {
    try {
      const { data: app, error } = await supabase
        .from('applications')
        .select(`*, profiles:exposant_id(full_name, email, phone), events:event_id(title, start_date, location_name, price_per_spot)`)
        .eq('id', decodedText.trim())
        .single()
      if (error || !app) { setScanResult({ status: 'invalid' }); return }
      if (app.status === 'present') { setScanResult({ status: 'already_scanned', candidature: app }); return }
      if (app.status !== 'paid') { setScanResult({ status: 'invalid' }); return }
      setScanResult({ status: 'valid', candidature: app })
    } catch { setScanResult({ status: 'invalid' }) }
  }

  const handleValidateEntry = async () => {
    if (!scanResult?.candidature) return
    setValidating(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      await supabase.from('applications').update({
        status: 'present',
        scanned_at: new Date().toISOString(),
        scanned_by: user?.id,
      }).eq('id', scanResult.candidature.id)
      setValidated(true)
      if (selectedEvent) await loadCandidatures(selectedEvent.id)
    } catch (err) { console.error(err) }
    setValidating(false)
  }

  const resetScan = async () => {
    await stopScanner()
    setScanResult(null)
    setValidated(false)
    setCameraError('')
  }

  // Ajout express
  const handleAddExpress = async () => {
    if (!addNom || !addMontant || !selectedEvent) return
    setAddLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()

      // Créer une candidature express
      const { data: newApp } = await supabase.from('applications').insert({
        event_id: selectedEvent.id,
        exposant_id: user?.id, // temporaire
        status: 'paid',
        message: `AJOUT EXPRESS - Nom: ${addNom} - SIREN: ${addSiren || 'NC'} - Montant: ${addMontant}€`,
        validated_by: user?.id,
        validated_at: new Date().toISOString(),
      }).select().single()

      setAddSuccess(true)
      setAddNom(''); setAddSiren(''); setAddMontant('')
      if (selectedEvent) await loadCandidatures(selectedEvent.id)
      setTimeout(() => setAddSuccess(false), 3000)
    } catch (err) { console.error(err) }
    setAddLoading(false)
  }

  const filteredCandidatures = candidatures.filter(c =>
    c.profiles?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.profiles?.email?.toLowerCase().includes(search.toLowerCase())
  )

  const presents = candidatures.filter(c => c.status === 'present').length
  const total = candidatures.length

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 28, height: 28, border: '2px solid #4F46E5', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#0F172A', fontFamily: "'Inter', system-ui, sans-serif", maxWidth: 480, margin: '0 auto' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>

      {/* ── HEADER MOBILE ── */}
      <div style={{ background: '#0F172A', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '16px 20px', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22C55E', display: 'inline-block', animation: 'pulse 2s infinite' }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: '#22C55E', letterSpacing: '0.08em' }}>PLACIER ACTIF</span>
            </div>
            <p style={{ fontSize: 16, fontWeight: 800, color: 'white' }}>
              {selectedEvent?.title || 'Aucun marché'}
            </p>
            <p style={{ fontSize: 11, color: '#475569' }}>
              {selectedEvent?.start_date
                ? new Date(selectedEvent.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
                : '—'}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Progression */}
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 20, fontWeight: 800, color: '#4F46E5' }}>{presents}/{total}</p>
              <p style={{ fontSize: 9, color: '#475569', textTransform: 'uppercase' }}>présents</p>
            </div>
            <button onClick={async () => { await supabase.auth.signOut(); router.push('/') }}
              style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 8, padding: '8px', cursor: 'pointer' }}>
              <LogOut size={14} style={{ color: '#64748B' }} />
            </button>
          </div>
        </div>

        {/* Sélecteur événement */}
        {events.length > 1 && (
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
            {events.map(event => (
              <button key={event.id} onClick={() => handleSelectEvent(event)}
                style={{ flexShrink: 0, padding: '5px 12px', borderRadius: 100, border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer', background: selectedEvent?.id === event.id ? '#4F46E5' : 'rgba(255,255,255,0.06)', color: selectedEvent?.id === event.id ? 'white' : '#64748B' }}>
                {event.title.split(' ').slice(0, 2).join(' ')}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── TABS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', background: '#1E293B', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {[
          { key: 'list', label: 'Émargement', icon: <User size={14} /> },
          { key: 'scan', label: 'Scanner', icon: <QrCode size={14} /> },
          { key: 'add', label: 'Ajout express', icon: <Plus size={14} /> },
        ].map(tab => (
          <button key={tab.key} onClick={() => { setActiveTab(tab.key as any); if (tab.key !== 'scan') stopScanner() }}
            style={{ padding: '12px 0', border: 'none', cursor: 'pointer', background: 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, borderBottom: activeTab === tab.key ? '2px solid #4F46E5' : '2px solid transparent', color: activeTab === tab.key ? '#4F46E5' : '#475569', fontSize: 11, fontWeight: activeTab === tab.key ? 700 : 400 }}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <div style={{ padding: '16px' }}>
        <AnimatePresence mode="wait">

          {/* ── LISTE ÉMARGEMENT ── */}
          {activeTab === 'list' && (
            <motion.div key="list" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>

              {/* Barre progression */}
              <div style={{ background: '#1E293B', borderRadius: 12, padding: '14px 16px', marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: '#64748B' }}>Présents</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'white' }}>{presents} / {total}</span>
                </div>
                <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 100, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${total > 0 ? (presents / total) * 100 : 0}%`, background: 'linear-gradient(90deg, #4F46E5, #22C55E)', borderRadius: 100, transition: 'width 0.5s' }} />
                </div>
              </div>

              {/* Recherche */}
              <div style={{ position: 'relative', marginBottom: 14 }}>
                <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Rechercher un forain..."
                  style={{ width: '100%', padding: '10px 12px 10px 36px', background: '#1E293B', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, fontSize: 13, color: 'white', outline: 'none', boxSizing: 'border-box' }} />
              </div>

              {/* Liste */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {filteredCandidatures.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px 0', color: '#475569', fontSize: 13 }}>
                    Aucun exposant trouvé
                  </div>
                ) : filteredCandidatures.map(c => (
                  <div key={c.id} style={{ background: '#1E293B', border: `1px solid ${c.status === 'present' ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.06)'}`, borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: c.status === 'present' ? 'rgba(34,197,94,0.15)' : '#2D3748', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {c.status === 'present'
                          ? <CheckCircle size={16} style={{ color: '#22C55E' }} />
                          : <span style={{ fontSize: 13, fontWeight: 700, color: '#64748B' }}>{(c.profiles?.full_name || '?').charAt(0).toUpperCase()}</span>
                        }
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.profiles?.full_name || 'Forain express'}</p>
                        <p style={{ fontSize: 11, color: '#475569' }}>{c.events?.price_per_spot || 0} €</p>
                      </div>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 100, background: c.status === 'present' ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.06)', color: c.status === 'present' ? '#22C55E' : '#64748B', flexShrink: 0 }}>
                      {c.status === 'present' ? '✓ Présent' : 'Attendu'}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── SCANNER ── */}
          {activeTab === 'scan' && (
            <motion.div key="scan" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>

              <AnimatePresence mode="wait">

                {!scanning && !scanResult && (
                  <motion.div key="scan-idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    style={{ textAlign: 'center', padding: '32px 0' }}>
                    <div style={{ width: 80, height: 80, background: '#1E293B', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                      <QrCode size={36} style={{ color: '#4F46E5' }} />
                    </div>
                    <p style={{ fontSize: 17, fontWeight: 800, color: 'white', marginBottom: 8 }}>Scanner un exposant</p>
                    <p style={{ fontSize: 13, color: '#475569', marginBottom: 24 }}>Ouvrez la caméra et pointez vers le QR Code sur la facture</p>
                    {cameraError && <p style={{ fontSize: 12, color: '#DC2626', marginBottom: 16 }}>{cameraError}</p>}
                    <button onClick={startScanner}
                      style={{ background: '#4F46E5', color: 'white', border: 'none', borderRadius: 12, padding: '14px 28px', fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                      <QrCode size={18} /> Ouvrir caméra
                    </button>
                  </motion.div>
                )}

                {scanning && (
                  <motion.div key="scan-active" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div style={{ background: '#1E293B', borderRadius: 16, overflow: 'hidden', marginBottom: 12 }}>
                      <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#DC2626', animation: 'pulse 1s infinite', display: 'inline-block' }} />
                          <span style={{ fontSize: 12, fontWeight: 700, color: 'white' }}>SCAN EN COURS</span>
                        </div>
                        <button onClick={stopScanner} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 7, padding: '5px 10px', fontSize: 11, color: 'white', cursor: 'pointer' }}>Arrêter</button>
                      </div>
                      <div id="qr-reader-placier" style={{ width: '100%', minHeight: 280 }} />
                    </div>
                    <p style={{ fontSize: 12, color: '#475569', textAlign: 'center' }}>Pointez vers le QR Code sur la facture</p>
                  </motion.div>
                )}

                {scanResult?.status === 'valid' && !validated && (
                  <motion.div key="scan-valid" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                    <div style={{ background: 'rgba(34,197,94,0.1)', border: '2px solid #22C55E', borderRadius: 14, padding: '16px', marginBottom: 14, display: 'flex', gap: 12 }}>
                      <CheckCircle size={24} style={{ color: '#22C55E', flexShrink: 0 }} />
                      <div>
                        <p style={{ fontSize: 15, fontWeight: 800, color: '#22C55E' }}>QR Code valide ✓</p>
                        <p style={{ fontSize: 12, color: '#4ADE80' }}>Paiement confirmé</p>
                      </div>
                    </div>

                    <div style={{ background: '#1E293B', borderRadius: 14, overflow: 'hidden', marginBottom: 14 }}>
                      <div style={{ padding: '14px 16px', background: '#2D3748', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: 15, fontWeight: 800, color: 'white' }}>
                            {(scanResult.candidature?.profiles?.full_name || '?').charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>{scanResult.candidature?.profiles?.full_name}</p>
                          <p style={{ fontSize: 11, color: '#64748B' }}>{scanResult.candidature?.profiles?.phone || scanResult.candidature?.profiles?.email}</p>
                        </div>
                      </div>
                      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {[
                          { label: 'Événement', value: scanResult.candidature?.events?.title },
                          { label: 'Montant payé', value: `${(scanResult.candidature?.events?.price_per_spot || 0) + 2} €` },
                          { label: 'Réf.', value: `PM-${scanResult.candidature?.id?.slice(0, 8).toUpperCase()}` },
                        ].map((item, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                            <span style={{ color: '#475569' }}>{item.label}</span>
                            <span style={{ fontWeight: 600, color: 'white' }}>{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button onClick={handleValidateEntry} disabled={validating}
                      style={{ width: '100%', background: '#22C55E', color: 'white', border: 'none', borderRadius: 12, padding: '16px', fontSize: 16, fontWeight: 800, cursor: validating ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 10 }}>
                      {validating ? <Loader size={18} style={{ animation: 'spin 0.8s linear infinite' }} /> : <CheckCircle size={20} />}
                      {validating ? 'Validation...' : "Valider l'entrée"}
                    </button>
                    <button onClick={resetScan} style={{ width: '100%', background: 'transparent', color: '#64748B', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '12px', fontSize: 13, cursor: 'pointer' }}>
                      Annuler
                    </button>
                  </motion.div>
                )}

                {validated && (
                  <motion.div key="scan-success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    style={{ textAlign: 'center', padding: '40px 20px', background: '#1E293B', borderRadius: 16, border: '2px solid #22C55E' }}>
                    <div style={{ width: 72, height: 72, background: 'rgba(34,197,94,0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                      <CheckCircle size={36} style={{ color: '#22C55E' }} />
                    </div>
                    <p style={{ fontSize: 22, fontWeight: 800, color: '#22C55E', marginBottom: 6 }}>Entrée validée ! 🎉</p>
                    <p style={{ fontSize: 14, color: 'white', marginBottom: 4 }}>{scanResult?.candidature?.profiles?.full_name}</p>
                    <p style={{ fontSize: 12, color: '#475569', marginBottom: 24 }}>Présence enregistrée</p>
                    <button onClick={resetScan}
                      style={{ background: '#4F46E5', color: 'white', border: 'none', borderRadius: 12, padding: '12px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                      Scanner suivant
                    </button>
                  </motion.div>
                )}

                {scanResult?.status === 'already_scanned' && (
                  <motion.div key="scan-used" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                    <div style={{ background: 'rgba(245,158,11,0.1)', border: '2px solid #F59E0B', borderRadius: 14, padding: '16px', marginBottom: 14, display: 'flex', gap: 12 }}>
                      <AlertTriangle size={24} style={{ color: '#F59E0B', flexShrink: 0 }} />
                      <div>
                        <p style={{ fontSize: 15, fontWeight: 800, color: '#F59E0B' }}>Déjà scanné ⚠️</p>
                        <p style={{ fontSize: 12, color: '#D97706' }}>{scanResult.candidature?.profiles?.full_name} est déjà marqué présent</p>
                      </div>
                    </div>
                    <button onClick={resetScan} style={{ width: '100%', background: '#F59E0B', color: 'white', border: 'none', borderRadius: 12, padding: '14px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                      Scanner un autre
                    </button>
                  </motion.div>
                )}

                {scanResult?.status === 'invalid' && (
                  <motion.div key="scan-invalid" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                    <div style={{ background: 'rgba(220,38,38,0.1)', border: '2px solid #DC2626', borderRadius: 14, padding: '16px', marginBottom: 14, display: 'flex', gap: 12 }}>
                      <XCircle size={24} style={{ color: '#DC2626', flexShrink: 0 }} />
                      <div>
                        <p style={{ fontSize: 15, fontWeight: 800, color: '#DC2626' }}>QR Code invalide ✗</p>
                        <p style={{ fontSize: 12, color: '#EF4444' }}>Aucune réservation valide trouvée</p>
                      </div>
                    </div>
                    <button onClick={resetScan} style={{ width: '100%', background: '#DC2626', color: 'white', border: 'none', borderRadius: 12, padding: '14px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                      Réessayer
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ── AJOUT EXPRESS ── */}
          {activeTab === 'add' && (
            <motion.div key="add" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>

              <div style={{ background: '#1E293B', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '16px', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <Plus size={16} style={{ color: '#4F46E5' }} />
                  <p style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>Forain de dernière minute</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Nom complet *</label>
                    <input value={addNom} onChange={e => setAddNom(e.target.value)} placeholder="Marie Dupont"
                      style={{ width: '100%', padding: '12px', background: '#0F172A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: 14, color: 'white', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>SIREN (optionnel)</label>
                    <input value={addSiren} onChange={e => setAddSiren(e.target.value)} placeholder="123 456 789"
                      style={{ width: '100%', padding: '12px', background: '#0F172A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: 14, color: 'white', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Montant encaissé (€) *</label>
                    <input type="number" value={addMontant} onChange={e => setAddMontant(e.target.value)} placeholder="45"
                      style={{ width: '100%', padding: '12px', background: '#0F172A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: 14, color: 'white', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                </div>
              </div>

              {addSuccess && (
                <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid #22C55E', borderRadius: 10, padding: '12px 16px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#22C55E', fontWeight: 600 }}>
                  <CheckCircle size={15} /> Forain ajouté avec succès !
                </div>
              )}

              <button onClick={handleAddExpress} disabled={!addNom || !addMontant || addLoading}
                style={{ width: '100%', background: !addNom || !addMontant ? '#1E293B' : '#4F46E5', color: !addNom || !addMontant ? '#475569' : 'white', border: 'none', borderRadius: 12, padding: '16px', fontSize: 15, fontWeight: 700, cursor: !addNom || !addMontant ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                {addLoading ? <Loader size={18} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Plus size={18} />}
                {addLoading ? 'Ajout...' : 'Ajouter au marché'}
              </button>

              <div style={{ background: '#1E293B', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '14px 16px', marginTop: 16 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 8 }}>Audit Trail</p>
                <p style={{ fontSize: 12, color: '#475569', lineHeight: 1.6 }}>
                  Toutes les actions sont enregistrées avec votre ID placier pour une traçabilité totale côté administration.
                </p>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}
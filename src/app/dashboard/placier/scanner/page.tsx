'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  QrCode, CheckCircle, XCircle, AlertTriangle,
  Loader, Camera, ScanLine, MapPin, Zap,
  Ban, Clock, User, Euro, ArrowLeft
} from 'lucide-react'

const BRAND = '#4F46E5'

type ScanResult = {
  status: 'valid' | 'already_scanned' | 'invalid' | 'wrong_event' | 'expired'
  candidature?: any
  message?: string
}

export default function PlacierScanner() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [validating, setValidating] = useState(false)
  const [validated, setValidated] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const [todayEvent, setTodayEvent] = useState<any>(null)
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const scannerRef = useRef<any>(null)

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

      // Détecter l'événement du jour
      const today = new Date().toISOString().split('T')[0]
      const todayStart = today + 'T00:00:00'
      const todayEnd = today + 'T23:59:59'

      let event: any = null

      // 1. Via planning
      const { data: planning } = await supabase
        .from('placier_planning')
        .select('event:event_id(*)')
        .eq('placier_id', user.id)

      if (planning && planning.length > 0) {
        const todayEvents = planning
          .map((p: any) => p.event)
          .filter((e: any) => e && e.start_date >= todayStart && e.start_date <= todayEnd)
        if (todayEvents.length > 0) event = todayEvents[0]
      }

      // 2. Fallback : event de la mairie aujourd'hui
      if (!event && profileData.mairie_id) {
        const { data: fallback } = await supabase
          .from('events')
          .select('*')
          .eq('organisateur_id', profileData.mairie_id)
          .gte('start_date', todayStart)
          .lte('start_date', todayEnd)
          .limit(1)
          .maybeSingle()
        event = fallback
      }

      setTodayEvent(event)

      // Récupérer la géoloc
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          pos => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          () => {}, // Pas grave si refusé
          { enableHighAccuracy: true, timeout: 5000 }
        )
      }

      setLoading(false)
    }
    getData()
  }, [])

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
        { fps: 10, qrbox: { width: 260, height: 260 } },
        async (decodedText: string) => {
          await html5QrCode.stop()
          setScanning(false)
          // Vibration de feedback
          if (navigator.vibrate) navigator.vibrate(100)
          await handleScanResult(decodedText)
        },
        () => {}
      )
    } catch {
      setScanning(false)
      setCameraError("Impossible d'accéder à la caméra. Vérifiez les permissions.")
    }
  }

  const stopScanner = async () => {
    try {
      if (scannerRef.current) {
        await scannerRef.current.stop()
        scannerRef.current = null
      }
    } catch {}
    setScanning(false)
  }

  // ✅ Recherche par qr_token (sécurisé) avec fallback par ID
  const handleScanResult = async (decodedText: string) => {
    try {
      const cleaned = decodedText.trim()

      // ✅ Essai 1 : par qr_token (sécurisé)
      let { data: app } = await supabase
        .from('applications')
        .select(`*, profiles:exposant_id(full_name, email, phone), events:event_id(title, start_date, location_name, price_per_spot)`)
        .eq('qr_token', cleaned)
        .maybeSingle()

      // ✅ Essai 2 : par ID (compatibilité ancienne)
      if (!app) {
        const { data: appById } = await supabase
          .from('applications')
          .select(`*, profiles:exposant_id(full_name, email, phone), events:event_id(title, start_date, location_name, price_per_spot)`)
          .eq('id', cleaned)
          .maybeSingle()
        app = appById
      }

      if (!app) {
        await logScan(null, null, 'invalid', cleaned)
        setScanResult({ status: 'invalid', message: 'QR Code introuvable' })
        return
      }

      // Check : statut
      if (app.status === 'present') {
        await logScan(app.id, app.event_id, 'duplicate', cleaned)
        setScanResult({ status: 'already_scanned', candidature: app })
        return
      }

      if (app.status !== 'paid' && app.status !== 'validated') {
        await logScan(app.id, app.event_id, 'invalid', cleaned)
        setScanResult({ status: 'invalid', candidature: app, message: 'Candidature non payée' })
        return
      }

      // Check : event du jour
      if (todayEvent && app.event_id !== todayEvent.id) {
        await logScan(app.id, app.event_id, 'wrong_event', cleaned)
        setScanResult({ status: 'wrong_event', candidature: app })
        return
      }

      // OK !
      setScanResult({ status: 'valid', candidature: app })
    } catch (err: any) {
      console.error(err)
      setScanResult({ status: 'invalid', message: err.message })
    }
  }

  // ✅ Logger le scan dans scan_history
  const logScan = async (appId: string | null, eventId: string | null, result: string, tokenScanned: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      await supabase.from('scan_history').insert({
        placier_id: user.id,
        application_id: appId,
        event_id: eventId,
        scan_result: result,
        qr_token_scanned: tokenScanned.substring(0, 100),
        lat: coords?.lat,
        lng: coords?.lng,
      })
    } catch {} // Silent fail
  }

  const handleValidateEntry = async () => {
    if (!scanResult?.candidature) return
    setValidating(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // 1. Update application
      await supabase.from('applications').update({
        status: 'present',
        scanned_at: new Date().toISOString(),
        scanned_by: user.id,
        scan_location_lat: coords?.lat,
        scan_location_lng: coords?.lng,
      }).eq('id', scanResult.candidature.id)

      // 2. Log
      await logScan(
        scanResult.candidature.id,
        scanResult.candidature.event_id,
        'valid',
        scanResult.candidature.qr_token || scanResult.candidature.id
      )

      // 3. Increment placier stats
      await supabase.from('profiles').update({
        last_scan_at: new Date().toISOString(),
        total_scans: (profile?.total_scans || 0) + 1,
      }).eq('id', user.id)

      // 4. Vibration succès
      if (navigator.vibrate) navigator.vibrate([100, 50, 100])

      setValidated(true)
    } catch (err) {
      console.error(err)
    }
    setValidating(false)
  }

  const resetScan = async () => {
    await stopScanner()
    setScanResult(null)
    setValidated(false)
    setCameraError('')
  }

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
        @keyframes scanLine { 0%{top:0} 100%{top:100%} }
      `}</style>

      {/* HEADER compact */}
      <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: 14, fontWeight: 800, color: 'white' }}>Scanner QR</p>
          <p style={{ fontSize: 11, color: '#64748B' }}>
            {todayEvent ? todayEvent.title : 'Aucun marché aujourd\'hui'}
          </p>
        </div>
        {coords && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#22C55E', background: 'rgba(34,197,94,0.1)', padding: '4px 8px', borderRadius: 100 }}>
            <MapPin size={9} /> GPS
          </span>
        )}
      </div>

      <div style={{ padding: '20px 16px 110px' }}>
        <AnimatePresence mode="wait">

          {/* ── IDLE ── */}
          {!scanning && !scanResult && (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{
                width: 110,
                height: 110,
                background: `linear-gradient(135deg, ${BRAND}22, #7C3AED22)`,
                borderRadius: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                border: `1px solid ${BRAND}44`,
              }}>
                <QrCode size={48} style={{ color: BRAND }} />
              </div>

              <p style={{ fontSize: 22, fontWeight: 800, color: 'white', marginBottom: 8 }}>Scanner un exposant</p>
              <p style={{ fontSize: 13, color: '#64748B', marginBottom: 28, lineHeight: 1.5 }}>
                Pointez la caméra vers le QR Code<br />présent sur la facture du forain
              </p>

              {cameraError && (
                <div style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
                  <AlertTriangle size={13} style={{ color: '#DC2626', flexShrink: 0 }} />
                  <p style={{ fontSize: 11, color: '#FCA5A5', textAlign: 'left' }}>{cameraError}</p>
                </div>
              )}

              <button onClick={startScanner}
                style={{
                  background: `linear-gradient(135deg, ${BRAND}, #7C3AED)`,
                  color: 'white',
                  border: 'none',
                  borderRadius: 14,
                  padding: '16px 32px',
                  fontSize: 15,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  boxShadow: `0 8px 24px ${BRAND}55`,
                }}>
                <Camera size={20} /> Ouvrir la caméra
              </button>

              {!todayEvent && (
                <div style={{ marginTop: 24, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 10, padding: '12px 14px', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <AlertTriangle size={14} style={{ color: '#F59E0B', flexShrink: 0, marginTop: 1 }} />
                  <p style={{ fontSize: 12, color: '#FCD34D', textAlign: 'left', lineHeight: 1.5 }}>
                    Aucun marché n'est prévu pour aujourd'hui. Vérifiez votre planning avec votre mairie.
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* ── SCANNING ── */}
          {scanning && (
            <motion.div key="scanning" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div style={{ background: '#1E293B', borderRadius: 16, overflow: 'hidden', marginBottom: 14, border: `1px solid ${BRAND}55` }}>
                <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(79,70,229,0.1)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#DC2626', animation: 'pulse 1s infinite', display: 'inline-block' }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'white', letterSpacing: '0.05em' }}>SCAN EN COURS</span>
                  </div>
                  <button onClick={stopScanner}
                    style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 7, padding: '5px 12px', fontSize: 11, color: 'white', cursor: 'pointer', fontWeight: 600 }}>
                    Arrêter
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <div id="qr-reader-placier" style={{ width: '100%', minHeight: 320 }} />
                </div>
              </div>

              <p style={{ fontSize: 12, color: '#64748B', textAlign: 'center' }}>
                Centrez le QR Code dans le cadre
              </p>
            </motion.div>
          )}

          {/* ── VALID ── */}
          {scanResult?.status === 'valid' && !validated && (
            <motion.div key="valid" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <div style={{ background: 'rgba(34,197,94,0.1)', border: '2px solid #22C55E', borderRadius: 14, padding: '14px 16px', marginBottom: 14, display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, background: 'rgba(34,197,94,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <CheckCircle size={22} style={{ color: '#22C55E' }} />
                </div>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 800, color: '#22C55E' }}>QR Code valide</p>
                  <p style={{ fontSize: 11, color: '#86EFAC' }}>Paiement confirmé · Prêt à valider</p>
                </div>
              </div>

              <div style={{ background: '#1E293B', borderRadius: 14, overflow: 'hidden', marginBottom: 14, border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: `linear-gradient(135deg, ${BRAND}, #7C3AED)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 16, fontWeight: 800, color: 'white' }}>
                      {(scanResult.candidature?.profiles?.full_name || '?').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>{scanResult.candidature?.profiles?.full_name}</p>
                    <p style={{ fontSize: 11, color: '#64748B' }}>{scanResult.candidature?.profiles?.email}</p>
                  </div>
                </div>
                <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { icon: <Zap size={11} />, label: 'Événement', value: scanResult.candidature?.events?.title },
                    { icon: <Euro size={11} />, label: 'Montant payé', value: `${(scanResult.candidature?.events?.price_per_spot || 0) + 2} €` },
                    { icon: <MapPin size={11} />, label: 'Case attribuée', value: scanResult.candidature?.spot_label || 'Non attribuée' },
                    { icon: <User size={11} />, label: 'Réf.', value: `PM-${scanResult.candidature?.id?.slice(0, 8).toUpperCase()}` },
                  ].map(item => (
                    <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: '#64748B' }}>{item.icon} {item.label}</span>
                      <span style={{ fontWeight: 600, color: 'white' }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={handleValidateEntry} disabled={validating}
                style={{ width: '100%', background: '#22C55E', color: 'white', border: 'none', borderRadius: 12, padding: '16px', fontSize: 16, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 10, boxShadow: '0 6px 20px rgba(34,197,94,0.4)' }}>
                {validating ? <Loader size={18} style={{ animation: 'spin 0.8s linear infinite' }} /> : <CheckCircle size={20} />}
                {validating ? 'Validation...' : "Valider l'entrée"}
              </button>
              <button onClick={resetScan}
                style={{ width: '100%', background: 'transparent', color: '#64748B', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '12px', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>
                Annuler
              </button>
            </motion.div>
          )}

          {/* ── VALIDATED ── */}
          {validated && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              style={{ textAlign: 'center', padding: '40px 20px', background: 'rgba(34,197,94,0.1)', borderRadius: 16, border: '2px solid #22C55E', marginTop: 20 }}>
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.1 }}
                style={{ width: 76, height: 76, background: '#22C55E', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 8px 24px rgba(34,197,94,0.4)' }}>
                <CheckCircle size={42} style={{ color: 'white' }} />
              </motion.div>
              <p style={{ fontSize: 22, fontWeight: 800, color: '#22C55E', marginBottom: 6 }}>Entrée validée !</p>
              <p style={{ fontSize: 14, color: 'white', marginBottom: 4 }}>{scanResult?.candidature?.profiles?.full_name}</p>
              <p style={{ fontSize: 11, color: '#86EFAC', marginBottom: 24 }}>{new Date().toLocaleTimeString('fr-FR')}</p>
              <button onClick={resetScan}
                style={{ background: BRAND, color: 'white', border: 'none', borderRadius: 12, padding: '14px 28px', fontSize: 14, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <ScanLine size={16} /> Scanner suivant
              </button>
            </motion.div>
          )}

          {/* ── ALREADY SCANNED ── */}
          {scanResult?.status === 'already_scanned' && (
            <motion.div key="used" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <div style={{ background: 'rgba(245,158,11,0.1)', border: '2px solid #F59E0B', borderRadius: 14, padding: '14px 16px', marginBottom: 14, display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, background: 'rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <AlertTriangle size={22} style={{ color: '#F59E0B' }} />
                </div>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 800, color: '#F59E0B' }}>Déjà scanné</p>
                  <p style={{ fontSize: 11, color: '#FCD34D' }}>{scanResult.candidature?.profiles?.full_name} est déjà présent</p>
                </div>
              </div>
              {scanResult.candidature?.scanned_at && (
                <div style={{ background: '#1E293B', borderRadius: 12, padding: '12px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Clock size={12} style={{ color: '#64748B' }} />
                  <p style={{ fontSize: 12, color: '#94A3B8' }}>
                    Pointé à <strong style={{ color: 'white' }}>{new Date(scanResult.candidature.scanned_at).toLocaleTimeString('fr-FR')}</strong>
                  </p>
                </div>
              )}
              <button onClick={resetScan}
                style={{ width: '100%', background: '#F59E0B', color: 'white', border: 'none', borderRadius: 12, padding: '14px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                Scanner un autre
              </button>
            </motion.div>
          )}

          {/* ── WRONG EVENT ── */}
          {scanResult?.status === 'wrong_event' && (
            <motion.div key="wrong" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <div style={{ background: 'rgba(220,38,38,0.1)', border: '2px solid #DC2626', borderRadius: 14, padding: '14px 16px', marginBottom: 14, display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, background: 'rgba(220,38,38,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Ban size={22} style={{ color: '#DC2626' }} />
                </div>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 800, color: '#DC2626' }}>Mauvais marché</p>
                  <p style={{ fontSize: 11, color: '#FCA5A5' }}>Réservation pour : {scanResult.candidature?.events?.title}</p>
                </div>
              </div>
              <button onClick={resetScan}
                style={{ width: '100%', background: '#DC2626', color: 'white', border: 'none', borderRadius: 12, padding: '14px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                Scanner un autre
              </button>
            </motion.div>
          )}

          {/* ── INVALID ── */}
          {scanResult?.status === 'invalid' && (
            <motion.div key="invalid" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <div style={{ background: 'rgba(220,38,38,0.1)', border: '2px solid #DC2626', borderRadius: 14, padding: '14px 16px', marginBottom: 14, display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, background: 'rgba(220,38,38,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <XCircle size={22} style={{ color: '#DC2626' }} />
                </div>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 800, color: '#DC2626' }}>QR Code invalide</p>
                  <p style={{ fontSize: 11, color: '#FCA5A5' }}>{scanResult.message || 'Aucune réservation valide trouvée'}</p>
                </div>
              </div>
              <button onClick={resetScan}
                style={{ width: '100%', background: '#DC2626', color: 'white', border: 'none', borderRadius: 12, padding: '14px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                Réessayer
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
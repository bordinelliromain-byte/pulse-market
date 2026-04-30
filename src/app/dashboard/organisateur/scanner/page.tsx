'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from '@/components/Sidebar'
import {
  QrCode, CheckCircle, XCircle, AlertTriangle,
  User, MapPin, CreditCard, Calendar, Shield, X, Loader
} from 'lucide-react'

type ScanResult = {
  status: 'valid' | 'already_scanned' | 'invalid'
  candidature?: any
}

export default function Scanner() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [validating, setValidating] = useState(false)
  const [validated, setValidated] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const scannerRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (profileData?.role !== 'organisateur') { router.push('/dashboard'); return }
      setProfile(profileData)
      setLoading(false)
    }
    getData()
  }, [])

  const startScanner = async () => {
    setScanResult(null)
    setValidated(false)
    setCameraError('')
    setScanning(true)

    // Petit délai pour que le DOM soit prêt
    await new Promise(r => setTimeout(r, 300))

    try {
      const { Html5Qrcode } = await import('html5-qrcode')
      const html5QrCode = new Html5Qrcode('qr-reader')
      scannerRef.current = html5QrCode

      await html5QrCode.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText: string) => {
          await html5QrCode.stop()
          setScanning(false)
          await handleScanResult(decodedText)
        },
        () => {} // erreur silencieuse pendant le scan
      )
    } catch (err: any) {
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

  const handleScanResult = async (decodedText: string) => {
    try {
      // Le QR code contient l'ID de la candidature
      const candidatureId = decodedText.trim()

      const { data: app, error } = await supabase
        .from('applications')
        .select(`
          *,
          profiles:exposant_id(full_name, email, phone),
          events:event_id(title, start_date, location_name, price_per_spot)
        `)
        .eq('id', candidatureId)
        .single()

      if (error || !app) {
        setScanResult({ status: 'invalid' })
        return
      }

      if (app.status === 'present') {
        setScanResult({ status: 'already_scanned', candidature: app })
        return
      }

      if (app.status !== 'paid') {
        setScanResult({ status: 'invalid' })
        return
      }

      setScanResult({ status: 'valid', candidature: app })
    } catch {
      setScanResult({ status: 'invalid' })
    }
  }

  const handleValidateEntry = async () => {
    if (!scanResult?.candidature) return
    setValidating(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      await supabase
        .from('applications')
        .update({
          status: 'present',
          scanned_at: new Date().toISOString(),
          scanned_by: user?.id,
        })
        .eq('id', scanResult.candidature.id)
      setValidated(true)
    } catch (err) {
      console.error(err)
    }
    setValidating(false)
  }

  const reset = async () => {
    await stopScanner()
    setScanResult(null)
    setValidated(false)
    setCameraError('')
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
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>

      <div style={{ marginLeft: 220, flex: 1 }}>
        <header style={{ background: 'white', borderBottom: '1px solid #E2E8F0', padding: '0 28px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 30, height: 30, background: '#EEF2FF', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <QrCode size={15} style={{ color: '#4F46E5' }} />
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>Scanner QR Code</p>
              <p style={{ fontSize: 11, color: '#94A3B8' }}>Validation des exposants sur le terrain</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22C55E', display: 'inline-block' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#22C55E' }}>PLACIER</span>
          </div>
        </header>

        <main style={{ padding: '32px', maxWidth: 560, margin: '0 auto' }}>

          <AnimatePresence mode="wait">

            {/* ── ÉTAT INITIAL ── */}
            {!scanning && !scanResult && (
              <motion.div key="idle" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 16, padding: '40px 32px', textAlign: 'center' }}>
                  <div style={{ width: 80, height: 80, background: '#EEF2FF', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                    <QrCode size={40} style={{ color: '#4F46E5' }} />
                  </div>
                  <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>Scanner un exposant</h1>
                  <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6, marginBottom: 28, maxWidth: 320, margin: '0 auto 28px' }}>
                    Scannez le QR Code sur la facture de l'exposant pour vérifier sa place et valider sa présence.
                  </p>
                  {cameraError && (
                    <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#DC2626', textAlign: 'left' }}>
                      {cameraError}
                    </div>
                  )}
                  <button onClick={startScanner}
                    style={{ background: '#4F46E5', color: 'white', border: 'none', borderRadius: 12, padding: '14px 32px', fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                    <QrCode size={18} /> Ouvrir la caméra
                  </button>
                </div>

                {/* Instructions */}
                <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: '20px' }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', marginBottom: 14 }}>Comment ça marche</p>
                  {[
                    { icon: '📄', label: "L'exposant présente sa facture PDF (imprimée ou sur téléphone)" },
                    { icon: '📷', label: "Vous scannez le QR Code avec cette interface" },
                    { icon: '✅', label: "Les infos de l'exposant s'affichent — cliquez Valider l'entrée" },
                    { icon: '🔒', label: "Le QR Code est marqué comme utilisé — impossible de le réutiliser" },
                  ].map((s, i) => (
                    <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: i < 3 ? 12 : 0 }}>
                      <span style={{ fontSize: 16 }}>{s.icon}</span>
                      <p style={{ fontSize: 12, color: '#64748B', lineHeight: 1.5 }}>{s.label}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── SCANNER ACTIF ── */}
            {scanning && (
              <motion.div key="scanning" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                <div style={{ background: '#0F172A', borderRadius: 16, overflow: 'hidden' }}>
                  <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#DC2626', animation: 'pulse 1.5s infinite', display: 'inline-block' }} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'white' }}>SCAN EN COURS</span>
                    </div>
                    <button onClick={stopScanner}
                      style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <X size={12} /> Arrêter
                    </button>
                  </div>
                  {/* Zone caméra */}
                  <div id="qr-reader" ref={containerRef} style={{ width: '100%', minHeight: 320 }} />
                </div>

                <p style={{ fontSize: 12, color: '#94A3B8', textAlign: 'center' }}>
                  Pointez la caméra vers le QR Code sur la facture de l'exposant
                </p>
              </motion.div>
            )}

            {/* ── RÉSULTAT : VALIDE ── */}
            {scanResult?.status === 'valid' && !validated && (
              <motion.div key="valid" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                <div style={{ background: '#F0FDF4', border: '2px solid #16A34A', borderRadius: 16, padding: '20px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <CheckCircle size={28} style={{ color: '#16A34A', flexShrink: 0 }} />
                  <div>
                    <p style={{ fontSize: 16, fontWeight: 800, color: '#15803D', marginBottom: 2 }}>QR Code valide ✓</p>
                    <p style={{ fontSize: 12, color: '#16A34A' }}>Place confirmée et paiement vérifié</p>
                  </div>
                </div>

                {/* Infos exposant */}
                <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 14, overflow: 'hidden' }}>
                  <div style={{ padding: '16px 20px', background: '#0F172A', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 16, fontWeight: 800, color: 'white' }}>
                        {(scanResult.candidature?.profiles?.full_name || '?').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p style={{ fontSize: 15, fontWeight: 700, color: 'white' }}>{scanResult.candidature?.profiles?.full_name}</p>
                      <p style={{ fontSize: 12, color: '#64748B' }}>{scanResult.candidature?.profiles?.email}</p>
                    </div>
                  </div>

                  <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {[
                      { icon: <Calendar size={13} />, label: 'Événement', value: scanResult.candidature?.events?.title },
                      { icon: <MapPin size={13} />, label: 'Lieu', value: scanResult.candidature?.events?.location_name },
                      { icon: <CreditCard size={13} />, label: 'Montant payé', value: `${(scanResult.candidature?.events?.price_per_spot || 0) + 2} €` },
                      { icon: <Shield size={13} />, label: 'Réf.', value: `PM-${scanResult.candidature?.id?.slice(0, 8).toUpperCase()}` },
                    ].map((item, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: '#64748B' }}>
                          {item.icon} {item.label}
                        </div>
                        <span style={{ fontWeight: 600, color: '#0F172A' }}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Boutons */}
                <button onClick={handleValidateEntry} disabled={validating}
                  style={{ width: '100%', background: '#16A34A', color: 'white', border: 'none', borderRadius: 12, padding: '16px', fontSize: 16, fontWeight: 800, cursor: validating ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, opacity: validating ? 0.8 : 1 }}>
                  {validating
                    ? <><Loader size={18} style={{ animation: 'spin 0.8s linear infinite' }} /> Validation...</>
                    : <><CheckCircle size={20} /> Valider l'entrée</>
                  }
                </button>
                <button onClick={reset}
                  style={{ width: '100%', background: 'white', color: '#64748B', border: '1px solid #E2E8F0', borderRadius: 12, padding: '12px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                  Annuler
                </button>
              </motion.div>
            )}

            {/* ── RÉSULTAT : VALIDÉ ── */}
            {validated && (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                style={{ textAlign: 'center', padding: '48px 32px', background: 'white', borderRadius: 16, border: '2px solid #16A34A' }}>
                <div style={{ width: 80, height: 80, background: '#F0FDF4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: '3px solid #BBF7D0' }}>
                  <CheckCircle size={40} style={{ color: '#16A34A' }} />
                </div>
                <p style={{ fontSize: 24, fontWeight: 800, color: '#15803D', marginBottom: 8 }}>Entrée validée ! 🎉</p>
                <p style={{ fontSize: 14, color: '#64748B', marginBottom: 8 }}>
                  <strong>{scanResult?.candidature?.profiles?.full_name}</strong>
                </p>
                <p style={{ fontSize: 12, color: '#94A3B8', marginBottom: 28 }}>Présence enregistrée dans le système</p>
                <button onClick={reset}
                  style={{ background: '#4F46E5', color: 'white', border: 'none', borderRadius: 12, padding: '12px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                  Scanner un autre exposant
                </button>
              </motion.div>
            )}

            {/* ── RÉSULTAT : DÉJÀ SCANNÉ ── */}
            {scanResult?.status === 'already_scanned' && (
              <motion.div key="used" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                <div style={{ background: '#FFFBEB', border: '2px solid #F59E0B', borderRadius: 16, padding: '20px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <AlertTriangle size={28} style={{ color: '#D97706', flexShrink: 0 }} />
                  <div>
                    <p style={{ fontSize: 16, fontWeight: 800, color: '#92400E', marginBottom: 2 }}>QR Code déjà utilisé ⚠️</p>
                    <p style={{ fontSize: 12, color: '#D97706' }}>Ce forain a déjà été validé pour ce marché</p>
                  </div>
                </div>

                <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: '16px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <User size={15} style={{ color: '#64748B' }} />
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>{scanResult.candidature?.profiles?.full_name}</p>
                  </div>
                  <p style={{ fontSize: 12, color: '#94A3B8' }}>
                    Scanné le {scanResult.candidature?.scanned_at
                      ? new Date(scanResult.candidature.scanned_at).toLocaleString('fr-FR')
                      : '—'}
                  </p>
                </div>

                <button onClick={reset}
                  style={{ width: '100%', background: '#F59E0B', color: 'white', border: 'none', borderRadius: 12, padding: '14px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                  Scanner un autre exposant
                </button>
              </motion.div>
            )}

            {/* ── RÉSULTAT : INVALIDE ── */}
            {scanResult?.status === 'invalid' && (
              <motion.div key="invalid" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                <div style={{ background: '#FEF2F2', border: '2px solid #DC2626', borderRadius: 16, padding: '20px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <XCircle size={28} style={{ color: '#DC2626', flexShrink: 0 }} />
                  <div>
                    <p style={{ fontSize: 16, fontWeight: 800, color: '#DC2626', marginBottom: 2 }}>QR Code invalide ✗</p>
                    <p style={{ fontSize: 12, color: '#DC2626' }}>Ce code ne correspond à aucune réservation valide ou le paiement n'a pas été effectué.</p>
                  </div>
                </div>

                <button onClick={reset}
                  style={{ width: '100%', background: '#DC2626', color: 'white', border: 'none', borderRadius: 12, padding: '14px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                  Réessayer
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
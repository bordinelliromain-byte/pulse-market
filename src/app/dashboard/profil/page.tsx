'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import Sidebar from '@/components/Sidebar'
import {
  ArrowLeft, Upload, CheckCircle, AlertCircle,
  Shield, Building2, Ruler, Zap, Camera, Save, Loader,
  Star, Trophy, Award, ScanLine, AlertTriangle, Clock
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

function getLevel(count: number) {
  if (count >= 50) return { label: 'Platine', color: '#0EA5E9', bg: '#F0F9FF', border: '#BAE6FD', icon: '💎', next: null, min: 50 }
  if (count >= 20) return { label: 'Or', color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A', icon: '🥇', next: 50, min: 20 }
  if (count >= 5)  return { label: 'Argent', color: '#64748B', bg: '#F8FAFC', border: '#CBD5E1', icon: '🥈', next: 20, min: 5 }
  return { label: 'Bronze', color: '#EA580C', bg: '#FFF7ED', border: '#FED7AA', icon: '🥉', next: 5, min: 0 }
}

function SirenStatus({ status }: { status: 'idle' | 'loading' | 'valid' | 'invalid' }) {
  if (status === 'idle') return null
  if (status === 'loading') return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748B', marginTop: 8 }}>
      <Loader size={12} style={{ animation: 'spin 1s linear infinite' }} /> Vérification via API INSEE...
    </div>
  )
  if (status === 'valid') return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#16A34A', marginTop: 8, background: '#F0FDF4', padding: '6px 10px', borderRadius: 7, border: '1px solid #BBF7D0' }}>
      <CheckCircle size={13} /> Entreprise active — SIREN vérifié via INSEE
    </div>
  )
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#DC2626', marginTop: 8, background: '#FEF2F2', padding: '6px 10px', borderRadius: 7, border: '1px solid #FECACA' }}>
      <AlertCircle size={13} /> SIREN invalide ou entreprise introuvable
    </div>
  )
}

function OcrResult({ result }: { result: any }) {
  if (!result) return null
  const badgeColor = ({ platinum: '#0EA5E9', verifie: '#16A34A', partiel: '#F59E0B', incomplet: '#DC2626' } as Record<string, string>)[String(result.badge)] || '#64748B'
  const badgeBg = ({ platinum: '#F0F9FF', verifie: '#F0FDF4', partiel: '#FFFBEB', incomplet: '#FEF2F2' } as Record<string, string>)[String(result.badge)] || '#F8FAFC'
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      style={{ background: badgeBg, border: `1px solid ${badgeColor}30`, borderRadius: 10, padding: '12px 14px', marginTop: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: badgeColor }}>{result.badgeLabel}</span>
        <span style={{ fontSize: 11, color: '#64748B' }}>{result.score}/{result.total} checks</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {Object.entries(result.checks).map(([key, ok]: [string, any]) => {
          const labels: Record<string, string> = { readable: 'Document lisible', sirenMatch: 'SIREN correspond', nameMatch: 'Raison sociale correspond', notExpired: 'Document valide', crossValid: 'Cross-validation OK' }
          return (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
              {ok ? <CheckCircle size={11} style={{ color: '#16A34A', flexShrink: 0 }} /> : <AlertTriangle size={11} style={{ color: '#DC2626', flexShrink: 0 }} />}
              <span style={{ color: ok ? '#475569' : '#DC2626' }}>{labels[key] || key}</span>
            </div>
          )
        })}
      </div>
      {result.daysUntilExpiry !== null && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 11, color: result.daysUntilExpiry < 30 ? '#DC2626' : result.daysUntilExpiry < 90 ? '#F59E0B' : '#16A34A' }}>
          <Clock size={11} />
          {result.daysUntilExpiry < 0 ? `⚠️ Expiré depuis ${Math.abs(result.daysUntilExpiry)} jours` : `Expire dans ${result.daysUntilExpiry} jours`}
        </div>
      )}
    </motion.div>
  )
}

export default function ProfilExposant() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [sirenStatus, setSirenStatus] = useState<'idle' | 'loading' | 'valid' | 'invalid'>('idle')
  const [marchesCount, setMarchesCount] = useState(0)
  const [isVerified, setIsVerified] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState('')
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [businessName, setBusinessName] = useState('')
  const [siren, setSiren] = useState('')
  const [standWidth, setStandWidth] = useState('')
  const [standLength, setStandLength] = useState('')
  const [needsElectricity, setNeedsElectricity] = useState(false)
  const [description, setDescription] = useState('')
  const [kbisFile, setKbisFile] = useState<File | null>(null)
  const [assuranceFile, setAssuranceFile] = useState<File | null>(null)
  const [kbisUrl, setKbisUrl] = useState('')
  const [assuranceUrl, setAssuranceUrl] = useState('')
  const [kbisVerifying, setKbisVerifying] = useState(false)
  const [assuranceVerifying, setAssuranceVerifying] = useState(false)
  const [kbisOcrResult, setKbisOcrResult] = useState<any>(null)
  const [assuranceOcrResult, setAssuranceOcrResult] = useState<any>(null)

  const router = useRouter()
  const supabase = createClient()
  const isMobile = useIsMobile()

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (profileData?.role !== 'exposant') { router.push('/dashboard'); return }
      setProfile(profileData)
      setAvatarUrl(profileData?.avatar_url || '')
      const { data: exposantData } = await supabase.from('exposant_data').select('*').eq('user_id', user.id).single()
      if (exposantData) {
        setBusinessName(exposantData.business_name || '')
        setSiren(exposantData.siren || '')
        setStandWidth(exposantData.stand_width || '')
        setStandLength(exposantData.stand_length || '')
        setNeedsElectricity(exposantData.needs_electricity || false)
        setDescription(exposantData.description || '')
        setKbisUrl(exposantData.kbis_url || '')
        setAssuranceUrl(exposantData.assurance_url || '')
        setIsVerified(exposantData.is_verified || false)
      }
      const { data: apps } = await supabase.from('applications').select('id').eq('exposant_id', user.id).eq('status', 'paid')
      setMarchesCount(apps?.length || 0)
      setLoading(false)
    }
    getData()
  }, [])

  const level = getLevel(marchesCount)
  const pct = level.next ? Math.round(((marchesCount - level.min) / (level.next - level.min)) * 100) : 100
  const initials = (businessName || profile?.full_name || '?').split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()

  const badges = [
    { label: 'SIREN vérifié', icon: <Shield size={11} />, ok: isVerified || sirenStatus === 'valid', color: '#4F46E5' },
    { label: 'Kbis fourni', icon: <CheckCircle size={11} />, ok: !!kbisUrl, color: '#16A34A' },
    { label: 'RC Pro fourni', icon: <CheckCircle size={11} />, ok: !!assuranceUrl, color: '#16A34A' },
    { label: 'Dossier vérifié IA', icon: <ScanLine size={11} />, ok: kbisOcrResult?.badge === 'verifie' || kbisOcrResult?.badge === 'platinum', color: '#0EA5E9' },
    { label: 'Premier marché', icon: <Trophy size={11} />, ok: marchesCount >= 1, color: '#F59E0B' },
    { label: 'Forain confirmé', icon: <Award size={11} />, ok: marchesCount >= 10, color: '#EA580C' },
  ]

  const globalScore = (() => {
    if (!kbisOcrResult && !assuranceOcrResult) return null
    const kbisScore = kbisOcrResult?.score || 0; const kbisTotal = kbisOcrResult?.total || 1
    const assuranceScore = assuranceOcrResult?.score || 0; const assuranceTotal = assuranceOcrResult?.total || 1
    const total = ((kbisScore / kbisTotal) + (assuranceScore / assuranceTotal)) / 2
    if (total >= 0.9) return { label: '💎 Dossier Platinum', color: '#0EA5E9' }
    if (total >= 0.7) return { label: '✅ Dossier Vérifié', color: '#16A34A' }
    if (total >= 0.5) return { label: '⚠️ Dossier Partiel', color: '#F59E0B' }
    return { label: '❌ Dossier Incomplet', color: '#DC2626' }
  })()

  const verifySiren = async () => {
    if (!siren) return
    setSirenStatus('loading')
    const timer = setTimeout(() => setSirenStatus('invalid'), 10000)
    try {
      const res = await fetch('/api/verify-siren', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ siren }) })
      const data = await res.json()
      clearTimeout(timer)
      setSirenStatus(data.valid ? 'valid' : 'invalid')
      if (data.valid) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) { await supabase.from('exposant_data').upsert({ user_id: user.id, is_verified: true }); setIsVerified(true) }
      }
    } catch { clearTimeout(timer); setSirenStatus('invalid') }
  }

  const verifyDocument = async (file: File, type: 'kbis' | 'assurance') => {
    const setVerifying = type === 'kbis' ? setKbisVerifying : setAssuranceVerifying
    const setResult = type === 'kbis' ? setKbisOcrResult : setAssuranceOcrResult
    setVerifying(true)
    try {
      const formData = new FormData()
      formData.append('file', file); formData.append('type', type)
      formData.append('siren', siren); formData.append('businessName', businessName)
      const res = await fetch('/api/verify-document', { method: 'POST', body: formData })
      setResult(await res.json())
    } catch (err) { console.error(err) }
    setVerifying(false)
  }

  const uploadFile = async (file: File, path: string) => {
    const { data, error } = await supabase.storage.from('documents').upload(path, file, { upsert: true })
    if (error) throw error
    return data.path
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setAvatarUploading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser(); if (!user) return
      await supabase.storage.from('images').upload(`avatars/${user.id}`, file, { upsert: true })
      const { data } = supabase.storage.from('images').getPublicUrl(`avatars/${user.id}`)
      await supabase.from('profiles').update({ avatar_url: data.publicUrl }).eq('id', user.id)
      setAvatarUrl(data.publicUrl)
    } catch (err) { console.error(err) }
    setAvatarUploading(false)
  }

  const handleSave = async () => {
    setSaving(true); setMessage(null)
    try {
      const { data: { user } } = await supabase.auth.getUser(); if (!user) return
      let finalKbisUrl = kbisUrl, finalAssuranceUrl = assuranceUrl
      if (kbisFile) finalKbisUrl = await uploadFile(kbisFile, `${user.id}/kbis.pdf`)
      if (assuranceFile) finalAssuranceUrl = await uploadFile(assuranceFile, `${user.id}/assurance.pdf`)
      const { error } = await supabase.from('exposant_data').upsert({
        user_id: user.id, business_name: businessName, siren,
        stand_width: parseFloat(standWidth), stand_length: parseFloat(standLength),
        needs_electricity: needsElectricity, description,
        kbis_url: finalKbisUrl, assurance_url: finalAssuranceUrl,
        kbis_badge: kbisOcrResult?.badge || null,
        assurance_expiry: assuranceOcrResult?.expiryDate || null,
      })
      if (error) throw error
      setMessage({ type: 'success', text: 'Dossier sauvegardé avec succès' })
    } catch (err: any) { setMessage({ type: 'error', text: err.message }) }
    setSaving(false)
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
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ marginLeft: isMobile ? 0 : 220, flex: 1, minWidth: 0 }}>

        {/* Header */}
        <header style={{ background: 'white', borderBottom: '1px solid #E2E8F0', padding: isMobile ? '0 14px 0 60px' : '0 28px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => router.push('/dashboard')}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', fontSize: 13 }}>
              <ArrowLeft size={14} /> {!isMobile && 'Retour'}
            </button>
            <div style={{ width: 1, height: 16, background: '#E2E8F0' }} />
            <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>Mon profil</p>
          </div>
          <button onClick={handleSave} disabled={saving}
            style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#4F46E5', color: 'white', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={14} />}
            {saving ? 'Saving...' : 'Sauvegarder'}
          </button>
        </header>

        <main style={{ padding: isMobile ? '14px' : '28px', maxWidth: 960, margin: '0 auto' }}>
          <motion.div variants={stagger} initial="hidden" animate="visible" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {message && (
              <motion.div variants={fadeUp} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 10, background: message.type === 'success' ? '#F0FDF4' : '#FEF2F2', border: `1px solid ${message.type === 'success' ? '#BBF7D0' : '#FECACA'}`, color: message.type === 'success' ? '#15803D' : '#DC2626', fontSize: 13, fontWeight: 500 }}>
                {message.type === 'success' ? <CheckCircle size={15} /> : <AlertCircle size={15} />} {message.text}
              </motion.div>
            )}

            {/* Hero profil — adapté mobile */}
            <motion.div variants={fadeUp} style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', borderRadius: 16, padding: isMobile ? '18px' : '28px' }}>
              <div style={{ display: 'flex', gap: isMobile ? 14 : 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                {/* Avatar */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{ width: isMobile ? 60 : 80, height: isMobile ? 60 : 80, borderRadius: '50%', background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid rgba(255,255,255,0.15)', overflow: 'hidden' }}>
                    {avatarUrl ? <img src={avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: isMobile ? 20 : 28, fontWeight: 800, color: 'white' }}>{initials}</span>}
                  </div>
                  <label style={{ position: 'absolute', bottom: -2, right: -2, width: 24, height: 24, background: '#4F46E5', borderRadius: '50%', border: '2px solid #0F172A', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {avatarUploading ? <Loader size={10} style={{ color: 'white', animation: 'spin 0.8s linear infinite' }} /> : <Camera size={10} style={{ color: 'white' }} />}
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload} />
                  </label>
                </div>

                {/* Infos */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <p style={{ fontSize: isMobile ? 16 : 20, fontWeight: 800, color: 'white' }}>{businessName || profile?.full_name}</p>
                    <span style={{ fontSize: 10, fontWeight: 700, background: level.bg, color: level.color, padding: '2px 8px', borderRadius: 100, border: `1px solid ${level.border}` }}>
                      {level.label}
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: '#64748B', marginBottom: 12 }}>{profile?.email}</p>

                  <div style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: '#64748B' }}>{marchesCount} marché(s)</span>
                      {level.next && <span style={{ fontSize: 11, color: '#64748B' }}>→ {level.next}</span>}
                    </div>
                    <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 100, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${level.color}, ${level.color}99)`, borderRadius: 100 }} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: isMobile ? 16 : 24 }}>
                    {[
                      { label: 'Marchés', value: marchesCount },
                      { label: 'Kbis', value: kbisUrl ? '✓' : '—' },
                      { label: 'RC Pro', value: assuranceUrl ? '✓' : '—' },
                      { label: 'SIREN', value: (isVerified || sirenStatus === 'valid') ? '✓' : '—' },
                    ].map((s, i) => (
                      <div key={i}>
                        <p style={{ fontSize: isMobile ? 14 : 18, fontWeight: 800, color: 'white' }}>{s.value}</p>
                        <p style={{ fontSize: 9, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Badges — cachés sur mobile, accordion possible */}
                {!isMobile && (
                  <div style={{ flexShrink: 0, minWidth: 160 }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Badges</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                      {badges.map((badge, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, opacity: badge.ok ? 1 : 0.3 }}>
                          <div style={{ width: 22, height: 22, borderRadius: 6, background: badge.ok ? `${badge.color}20` : 'rgba(255,255,255,0.04)', border: `1px solid ${badge.ok ? badge.color + '50' : 'rgba(255,255,255,0.08)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: badge.ok ? badge.color : '#475569' }}>
                            {badge.icon}
                          </div>
                          <span style={{ fontSize: 11, color: badge.ok ? 'white' : '#475569', fontWeight: badge.ok ? 600 : 400 }}>{badge.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Formulaire grid */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 280px', gap: 16, alignItems: 'start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Infos entreprise */}
                <motion.div variants={fadeUp} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
                  <div style={{ padding: '14px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 30, height: 30, background: '#EEF2FF', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Building2 size={15} style={{ color: '#4F46E5' }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>Informations entreprise</p>
                      <p style={{ fontSize: 11, color: '#94A3B8' }}>Raison sociale, SIREN, activité</p>
                    </div>
                  </div>
                  <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Nom commercial</label>
                      <input value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="Mon Food Truck SARL"
                        style={{ width: '100%', padding: '9px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, color: '#0F172A', background: '#FAFAFA', outline: 'none', boxSizing: 'border-box' }}
                        onFocus={e => { e.target.style.borderColor = '#4F46E5'; e.target.style.background = 'white' }}
                        onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.background = '#FAFAFA' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Numéro SIREN</label>
                      <div style={{ display: 'flex', gap: 8, flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
                        <input value={siren} onChange={e => setSiren(e.target.value)} placeholder="123 456 789"
                          style={{ flex: 1, minWidth: 0, padding: '9px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, color: '#0F172A', background: '#FAFAFA', outline: 'none' }}
                          onFocus={e => { e.target.style.borderColor = '#4F46E5'; e.target.style.background = 'white' }}
                          onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.background = '#FAFAFA' }} />
                        <button onClick={verifySiren} disabled={sirenStatus === 'loading'}
                          style={{ background: '#4F46E5', color: 'white', border: 'none', borderRadius: 8, padding: '9px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', width: isMobile ? '100%' : 'auto', justifyContent: 'center' }}>
                          <Shield size={13} /> Vérifier INSEE
                        </button>
                      </div>
                      <SirenStatus status={sirenStatus} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Description</label>
                      <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Burgers artisanaux, cuisine du monde..."
                        style={{ width: '100%', padding: '9px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, color: '#0F172A', background: '#FAFAFA', outline: 'none', resize: 'none', height: 70, boxSizing: 'border-box', fontFamily: 'inherit' }}
                        onFocus={e => { e.target.style.borderColor = '#4F46E5'; e.target.style.background = 'white' }}
                        onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.background = '#FAFAFA' }} />
                    </div>
                  </div>
                </motion.div>

                {/* Stand */}
                <motion.div variants={fadeUp} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
                  <div style={{ padding: '14px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 30, height: 30, background: '#EEF2FF', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Ruler size={15} style={{ color: '#4F46E5' }} />
                    </div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>Caractéristiques du stand</p>
                  </div>
                  <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      {[{ label: 'Largeur (m)', val: standWidth, set: setStandWidth }, { label: 'Longueur (m)', val: standLength, set: setStandLength }].map((f, i) => (
                        <div key={i}>
                          <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>{f.label}</label>
                          <input type="number" value={f.val} onChange={e => f.set(e.target.value)} placeholder="3"
                            style={{ width: '100%', padding: '9px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, color: '#0F172A', background: '#FAFAFA', outline: 'none', boxSizing: 'border-box' }}
                            onFocus={e => { e.target.style.borderColor = '#4F46E5'; e.target.style.background = 'white' }}
                            onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.background = '#FAFAFA' }} />
                        </div>
                      ))}
                    </div>
                    {standWidth && standLength && (
                      <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#64748B' }}>
                        Surface : <strong style={{ color: '#0F172A' }}>{(parseFloat(standWidth) * parseFloat(standLength)).toFixed(1)} m²</strong>
                      </div>
                    )}
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>Branchement électrique</label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {[{ val: false, label: 'Aucun' }, { val: true, label: 'Requis' }].map(opt => (
                          <button key={String(opt.val)} onClick={() => setNeedsElectricity(opt.val)}
                            style={{ flex: 1, padding: '8px 0', border: needsElectricity === opt.val ? '1.5px solid #4F46E5' : '1px solid #E2E8F0', borderRadius: 8, background: needsElectricity === opt.val ? '#EEF2FF' : 'white', color: needsElectricity === opt.val ? '#4F46E5' : '#64748B', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                            <Zap size={13} /> {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Documents */}
                <motion.div variants={fadeUp} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
                  <div style={{ padding: '14px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 30, height: 30, background: '#EEF2FF', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ScanLine size={15} style={{ color: '#4F46E5' }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>Documents légaux</p>
                      <p style={{ fontSize: 11, color: '#94A3B8' }}>Vérification IA automatique</p>
                    </div>
                  </div>
                  <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {[
                      { label: 'Extrait Kbis', file: kbisFile, url: kbisUrl, setFile: setKbisFile, verifying: kbisVerifying, result: kbisOcrResult, setResult: setKbisOcrResult, type: 'kbis' as const },
                      { label: 'Attestation RC Pro', file: assuranceFile, url: assuranceUrl, setFile: setAssuranceFile, verifying: assuranceVerifying, result: assuranceOcrResult, setResult: setAssuranceOcrResult, type: 'assurance' as const },
                    ].map(doc => (
                      <div key={doc.type}>
                        <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>{doc.label}</label>
                        {doc.url && !doc.file && <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#16A34A', marginBottom: 8, background: '#F0FDF4', padding: '5px 9px', borderRadius: 6 }}><CheckCircle size={11} /> Document déjà fourni</div>}
                        <div style={{ display: 'flex', gap: 8, flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
                          <label style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '10px', border: `1.5px dashed ${doc.file ? '#4F46E5' : '#E2E8F0'}`, borderRadius: 9, cursor: 'pointer', fontSize: 12, color: doc.file ? '#4F46E5' : '#64748B', background: doc.file ? '#EEF2FF' : 'transparent' }}>
                            <Upload size={13} /> {doc.file ? doc.file.name : 'Déposer un PDF'}
                            <input type="file" accept=".pdf,image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0] || null; doc.setFile(f); doc.setResult(null) }} />
                          </label>
                          {doc.file && (
                            <button onClick={() => verifyDocument(doc.file!, doc.type)} disabled={doc.verifying}
                              style={{ background: doc.verifying ? '#64748B' : '#0EA5E9', color: 'white', border: 'none', borderRadius: 9, padding: '10px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', width: isMobile ? '100%' : 'auto', justifyContent: 'center' }}>
                              {doc.verifying ? <Loader size={12} style={{ animation: 'spin 0.8s linear infinite' }} /> : <ScanLine size={12} />}
                              {doc.verifying ? 'Analyse...' : 'Vérifier IA'}
                            </button>
                          )}
                        </div>
                        <OcrResult result={doc.result} />
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>

              {/* Colonne droite */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <motion.div variants={fadeUp} style={{ background: '#0F172A', borderRadius: 12, padding: '16px' }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Statut du dossier</p>
                  {[
                    { label: 'Kbis fourni', ok: !!kbisUrl || !!kbisFile },
                    { label: 'Kbis vérifié IA', ok: kbisOcrResult?.badge === 'verifie' || kbisOcrResult?.badge === 'platinum' },
                    { label: 'RC Pro fourni', ok: !!assuranceUrl || !!assuranceFile },
                    { label: 'RC Pro valide', ok: assuranceOcrResult?.checks?.notExpired === true },
                    { label: 'SIREN vérifié', ok: isVerified || sirenStatus === 'valid' },
                    { label: 'Stand renseigné', ok: !!(standWidth && standLength) },
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: i < 5 ? 10 : 0, marginBottom: i < 5 ? 10 : 0, borderBottom: i < 5 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                      <span style={{ fontSize: 12, color: '#64748B' }}>{item.label}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: item.ok ? '#4ADE80' : '#F59E0B' }}>{item.ok ? '✓ OK' : '⏳'}</span>
                    </div>
                  ))}
                </motion.div>

                <motion.div variants={fadeUp} style={{ background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', borderRadius: 12, padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                    <Star size={15} style={{ color: '#FBBF24' }} />
                    <p style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>Passez en Pro</p>
                    <span style={{ background: 'rgba(255,255,255,0.15)', color: 'white', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100 }}>20€/mois</span>
                  </div>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, marginBottom: 12 }}>Candidatures illimitées, alertes et marchés exclusifs.</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                    {['Candidatures illimitées', 'Badge Pro visible', 'Alertes SMS géolocalisées', 'Marchés exclusifs Pro'].map((f, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'rgba(255,255,255,0.85)' }}>
                        <CheckCircle size={11} style={{ color: '#4ADE80', flexShrink: 0 }} /> {f}
                      </div>
                    ))}
                  </div>
                  <button style={{ width: '100%', background: 'white', color: '#4F46E5', border: 'none', borderRadius: 9, padding: '11px 0', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                    Upgrader →
                  </button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  )
}
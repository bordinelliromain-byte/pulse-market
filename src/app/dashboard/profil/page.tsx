'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import type { Variants } from 'framer-motion'
import Sidebar from '@/components/Sidebar'
import {
  ArrowLeft, Upload, CheckCircle, AlertCircle,
  Shield, Building2, Ruler, Zap, Camera, Save, Loader,
  Star, Trophy, Award, ScanLine, AlertTriangle, Clock,
  CloudCheck, RefreshCw, Undo2
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

const MAX_FILE_SIZE = 10 * 1024 * 1024
const ALLOWED_DOC_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
const ALLOWED_IMG_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

async function getFileMagicType(file: File): Promise<string | null> {
  const buffer = await file.slice(0, 8).arrayBuffer()
  const bytes = new Uint8Array(buffer)
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) return 'application/pdf'
  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) return 'image/jpeg'
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) return 'image/png'
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) return 'image/webp'
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) return 'image/gif'
  return null
}

async function validateFile(file: File, allowedTypes: string[]): Promise<string | null> {
  if (file.size > MAX_FILE_SIZE) return `Fichier trop volumineux — max 10MB (actuel : ${(file.size / 1024 / 1024).toFixed(1)}MB)`
  if (file.size === 0) return 'Fichier vide'
  if (!allowedTypes.includes(file.type)) return `Format non supporté. Formats acceptés : PDF, JPG, PNG`
  const magicType = await getFileMagicType(file)
  if (!magicType) return 'Fichier non reconnu ou corrompu'
  if (!allowedTypes.includes(magicType)) return 'Le contenu du fichier ne correspond pas à son extension'
  return null
}

function getLevel(count: number) {
  if (count >= 50) return { label: 'Platine', color: '#0EA5E9', bg: '#F0F9FF', border: '#BAE6FD', next: null, min: 50 }
  if (count >= 20) return { label: 'Or', color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A', next: 50, min: 20 }
  if (count >= 5)  return { label: 'Argent', color: '#64748B', bg: '#F8FAFC', border: '#CBD5E1', next: 20, min: 5 }
  return { label: 'Bronze', color: '#EA580C', bg: '#FFF7ED', border: '#FED7AA', next: 5, min: 0 }
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
          const labels: Record<string, string> = {
            readable: 'Document lisible',
            sirenMatch: 'SIREN correspond',
            nameMatch: 'Raison sociale correspond',
            notExpired: 'Document valide',
            crossValid: 'Cross-validation OK'
          }
          return (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
              {ok
                ? <CheckCircle size={11} style={{ color: '#16A34A', flexShrink: 0 }} />
                : <AlertTriangle size={11} style={{ color: '#DC2626', flexShrink: 0 }} />
              }
              <span style={{ color: ok ? '#475569' : '#DC2626' }}>{labels[key] || key}</span>
            </div>
          )
        })}
      </div>
      {result.daysUntilExpiry !== null && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 11, color: result.daysUntilExpiry < 30 ? '#DC2626' : result.daysUntilExpiry < 90 ? '#F59E0B' : '#16A34A' }}>
          <Clock size={11} />
          {result.daysUntilExpiry < 0
            ? `Expiré depuis ${Math.abs(result.daysUntilExpiry)} jours`
            : `Expire dans ${result.daysUntilExpiry} jours`
          }
        </div>
      )}
    </motion.div>
  )
}

// ✅ Indicateur sauvegarde
function SaveIndicator({ status, lastSaved }: { status: 'idle' | 'saving' | 'saved' | 'error'; lastSaved: Date | null }) {
  const [timeAgo, setTimeAgo] = useState('')
  
  useEffect(() => {
    if (!lastSaved) return
    const update = () => {
      const diff = Math.floor((Date.now() - lastSaved.getTime()) / 1000)
      if (diff < 5) setTimeAgo('à l\'instant')
      else if (diff < 60) setTimeAgo(`il y a ${diff}s`)
      else if (diff < 3600) setTimeAgo(`il y a ${Math.floor(diff / 60)}min`)
      else setTimeAgo(`il y a ${Math.floor(diff / 3600)}h`)
    }
    update()
    const t = setInterval(update, 5000)
    return () => clearInterval(t)
  }, [lastSaved])

  if (status === 'saving') return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#64748B' }}>
      <Loader size={11} style={{ animation: 'spin 1s linear infinite' }} /> Sauvegarde...
    </div>
  )
  if (status === 'saved' || lastSaved) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#16A34A' }}>
      <CloudCheck size={12} /> Sauvegardé {timeAgo}
    </div>
  )
  if (status === 'error') return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#DC2626' }}>
      <AlertCircle size={11} /> Erreur de sauvegarde
    </div>
  )
  return null
}

export default function ProfilExposant() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
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
  const [fileErrors, setFileErrors] = useState<{ kbis?: string; assurance?: string; avatar?: string }>({})
  const [upgradingPro, setUpgradingPro] = useState(false)
  const [originalData, setOriginalData] = useState<any>(null)

  const router = useRouter()
  const supabase = createClient()
  const isMobile = useIsMobile()
  const autosaveTimer = useRef<NodeJS.Timeout | null>(null)
  const hasChanges = useRef(false)

  // ✅ Calcul progression profil
  const calculateProgress = useCallback(() => {
    const fields = [
      !!businessName,
      !!siren,
      isVerified || sirenStatus === 'valid',
      !!description,
      !!standWidth && !!standLength,
      !!kbisUrl || !!kbisFile,
      !!assuranceUrl || !!assuranceFile,
      !!avatarUrl,
    ]
    const completed = fields.filter(Boolean).length
    return Math.round((completed / fields.length) * 100)
  }, [businessName, siren, isVerified, sirenStatus, description, standWidth, standLength, kbisUrl, kbisFile, assuranceUrl, assuranceFile, avatarUrl])

  const progress = calculateProgress()

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
        setStandWidth(exposantData.stand_width?.toString() || '')
        setStandLength(exposantData.stand_length?.toString() || '')
        setNeedsElectricity(exposantData.needs_electricity || false)
        setDescription(exposantData.description || '')
        setKbisUrl(exposantData.kbis_url || '')
        setAssuranceUrl(exposantData.assurance_url || '')
        setIsVerified(exposantData.is_verified || false)
        // ✅ Sauvegarde données originales pour "annuler"
        setOriginalData({
          businessName: exposantData.business_name || '',
          siren: exposantData.siren || '',
          standWidth: exposantData.stand_width?.toString() || '',
          standLength: exposantData.stand_length?.toString() || '',
          needsElectricity: exposantData.needs_electricity || false,
          description: exposantData.description || '',
        })
        if (exposantData.updated_at) setLastSaved(new Date(exposantData.updated_at))
      }
      const { data: apps } = await supabase.from('applications').select('id').eq('exposant_id', user.id).eq('status', 'paid')
      setMarchesCount(apps?.length || 0)
      setLoading(false)
    }
    getData()
  }, [])

  // ✅ AUTOSAVE — Toutes les 30 secondes si modifications
  const performAutosave = useCallback(async () => {
    if (!hasChanges.current) return
    setSaveStatus('saving')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { error } = await supabase.rpc('save_exposant_data', {
        p_user_id: user.id,
        p_business_name: businessName,
        p_siren: siren,
        p_stand_width: standWidth ? parseFloat(standWidth) : null,
        p_stand_length: standLength ? parseFloat(standLength) : null,
        p_needs_electricity: needsElectricity,
        p_description: description,
        p_kbis_url: kbisUrl,
        p_assurance_url: assuranceUrl,
        p_kbis_badge: kbisOcrResult?.badge || null,
        p_assurance_expiry: assuranceOcrResult?.expiryDate || null,
      })
      if (error) throw new Error(error.message)
      setSaveStatus('saved')
      setLastSaved(new Date())
      hasChanges.current = false
    } catch (err) {
      setSaveStatus('error')
    }
  }, [businessName, siren, standWidth, standLength, needsElectricity, description, kbisUrl, assuranceUrl, kbisOcrResult, assuranceOcrResult])

  // ✅ Marque modifications + autosave timer
  useEffect(() => {
    if (loading) return
    hasChanges.current = true
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
    autosaveTimer.current = setTimeout(performAutosave, 3000) // 3s après dernière modif
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
    }
  }, [businessName, siren, standWidth, standLength, needsElectricity, description, loading])

  // ✅ Sauvegarde avant fermeture page
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges.current) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  const level = getLevel(marchesCount)
  const pct = level.next ? Math.round(((marchesCount - level.min) / (level.next - level.min)) * 100) : 100
  const initials = (businessName || profile?.full_name || '?').split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()

  const badges = [
    { label: 'SIREN vérifié', icon: <Shield size={11} />, ok: isVerified || sirenStatus === 'valid', color: BRAND },
    { label: 'Kbis fourni', icon: <CheckCircle size={11} />, ok: !!kbisUrl, color: '#16A34A' },
    { label: 'RC Pro fourni', icon: <CheckCircle size={11} />, ok: !!assuranceUrl, color: '#16A34A' },
    { label: 'Dossier vérifié IA', icon: <ScanLine size={11} />, ok: kbisOcrResult?.badge === 'verifie' || kbisOcrResult?.badge === 'platinum', color: '#0EA5E9' },
    { label: 'Premier marché', icon: <Trophy size={11} />, ok: marchesCount >= 1, color: '#F59E0B' },
    { label: 'Forain confirmé', icon: <Award size={11} />, ok: marchesCount >= 10, color: '#EA580C' },
  ]

  const verifySiren = async () => {
    if (!siren) return
    setSirenStatus('loading')
    const timer = setTimeout(() => setSirenStatus('invalid'), 10000)
    try {
      const res = await fetch('/api/verify-siren', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siren })
      })
      const data = await res.json()
      clearTimeout(timer)
      setSirenStatus(data.valid ? 'valid' : 'invalid')
      if (data.valid) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await supabase.from('exposant_data').upsert(
            { user_id: user.id, is_verified: true },
            { onConflict: 'user_id' }
          )
          setIsVerified(true)
        }
      }
    } catch {
      clearTimeout(timer)
      setSirenStatus('invalid')
    }
  }

  const verifyDocument = async (file: File, type: 'kbis' | 'assurance') => {
    const setVerifying = type === 'kbis' ? setKbisVerifying : setAssuranceVerifying
    const setResult = type === 'kbis' ? setKbisOcrResult : setAssuranceOcrResult
    setVerifying(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', type)
      formData.append('siren', siren)
      formData.append('businessName', businessName)
      const res = await fetch('/api/verify-document', { method: 'POST', body: formData })
      setResult(await res.json())
    } catch (err) { console.error(err) }
    setVerifying(false)
  }

  const uploadFile = async (file: File, path: string) => {
    const error = await validateFile(file, ALLOWED_DOC_TYPES)
    if (error) throw new Error(error)
    const { data, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(path, file, { upsert: true })
    if (uploadError) throw new Error(uploadError.message)
    return data.path
  }

  const handleDocumentSelect = async (file: File | null, type: 'kbis' | 'assurance') => {
    const setFile = type === 'kbis' ? setKbisFile : setAssuranceFile
    const setResult = type === 'kbis' ? setKbisOcrResult : setAssuranceOcrResult
    if (!file) { setFile(null); return }
    const error = await validateFile(file, ALLOWED_DOC_TYPES)
    if (error) {
      setFileErrors(prev => ({ ...prev, [type]: error }))
      setFile(null)
      return
    }
    setFileErrors(prev => ({ ...prev, [type]: undefined }))
    setFile(file)
    setResult(null)
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const error = await validateFile(file, ALLOWED_IMG_TYPES)
    if (error) {
      setFileErrors(prev => ({ ...prev, avatar: error }))
      return
    }
    setFileErrors(prev => ({ ...prev, avatar: undefined }))
    setAvatarUploading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      await supabase.storage.from('images').upload(`avatars/${user.id}`, file, { upsert: true })
      const { data } = supabase.storage.from('images').getPublicUrl(`avatars/${user.id}`)
      await supabase.from('profiles').update({ avatar_url: data.publicUrl }).eq('id', user.id)
      setAvatarUrl(data.publicUrl)
    } catch (err) { console.error(err) }
    setAvatarUploading(false)
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      let finalKbisUrl = kbisUrl
      let finalAssuranceUrl = assuranceUrl

      if (kbisFile) finalKbisUrl = await uploadFile(kbisFile, `${user.id}/kbis.pdf`)
      if (assuranceFile) finalAssuranceUrl = await uploadFile(assuranceFile, `${user.id}/assurance.pdf`)

      const { error } = await supabase.rpc('save_exposant_data', {
        p_user_id: user.id,
        p_business_name: businessName,
        p_siren: siren,
        p_stand_width: standWidth ? parseFloat(standWidth) : null,
        p_stand_length: standLength ? parseFloat(standLength) : null,
        p_needs_electricity: needsElectricity,
        p_description: description,
        p_kbis_url: finalKbisUrl,
        p_assurance_url: finalAssuranceUrl,
        p_kbis_badge: kbisOcrResult?.badge || null,
        p_assurance_expiry: assuranceOcrResult?.expiryDate || null,
      })

      if (error) throw new Error(error.message)
      setMessage({ type: 'success', text: 'Dossier sauvegardé avec succès' })
      setLastSaved(new Date())
      setKbisUrl(finalKbisUrl)
      setAssuranceUrl(finalAssuranceUrl)
      setKbisFile(null)
      setAssuranceFile(null)
      hasChanges.current = false
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message })
    }
    setSaving(false)
  }

  // ✅ Annuler les modifications
  const handleUndo = () => {
    if (!originalData) return
    if (!confirm('Annuler toutes les modifications non sauvegardées ?')) return
    setBusinessName(originalData.businessName)
    setSiren(originalData.siren)
    setStandWidth(originalData.standWidth)
    setStandLength(originalData.standLength)
    setNeedsElectricity(originalData.needsElectricity)
    setDescription(originalData.description)
    hasChanges.current = false
  }

  // ✅ Upgrade Pro fonctionnel
  const handleUpgradePro = async () => {
    setUpgradingPro(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const res = await fetch('/api/create-pro-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, email: profile?.email || '' })
      })
      const { url, error } = await res.json()
      if (error) throw new Error(error)
      if (url) window.location.href = url
    } catch (err: any) {
      alert('Erreur : ' + err.message)
    }
    setUpgradingPro(false)
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
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ marginLeft: isMobile ? 0 : 220, flex: 1, minWidth: 0 }}>
        <header style={{ background: 'white', borderBottom: '1px solid #E2E8F0', padding: isMobile ? '0 14px 0 60px' : '0 28px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <button onClick={() => router.push('/dashboard')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', fontSize: 13 }}>
              <ArrowLeft size={14} /> {!isMobile && 'Retour'}
            </button>
            <div style={{ width: 1, height: 16, background: '#E2E8F0' }} />
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>Mon profil</p>
              <SaveIndicator status={saveStatus} lastSaved={lastSaved} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {!isMobile && hasChanges.current && (
              <button onClick={handleUndo}
                style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'transparent', color: '#64748B', border: '1px solid #E2E8F0', borderRadius: 8, padding: '8px 12px', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
                <Undo2 size={13} /> Annuler
              </button>
            )}
            <button onClick={handleSave} disabled={saving}
              style={{ display: 'flex', alignItems: 'center', gap: 7, background: BRAND, color: 'white', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
              {saving ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={14} />}
              {saving ? 'Sauvegarde...' : isMobile ? '' : 'Sauvegarder'}
            </button>
          </div>
        </header>

        {/* ✅ Barre de progression */}
        <div style={{ background: 'white', borderBottom: '1px solid #E2E8F0', padding: isMobile ? '10px 14px' : '12px 28px' }}>
          <div style={{ maxWidth: 960, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Profil complété</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: progress >= 80 ? '#16A34A' : progress >= 50 ? '#F59E0B' : BRAND }}>{progress}%</span>
            </div>
            <div style={{ height: 6, background: '#F1F5F9', borderRadius: 100, overflow: 'hidden' }}>
              <motion.div
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4 }}
                style={{ height: '100%', background: progress >= 80 ? '#16A34A' : progress >= 50 ? '#F59E0B' : BRAND, borderRadius: 100 }}
              />
            </div>
          </div>
        </div>

        <main style={{ padding: isMobile ? '14px 14px 100px' : '28px', maxWidth: 960, margin: '0 auto' }}>
          <motion.div variants={stagger} initial="hidden" animate="visible" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            <AnimatePresence>
              {message && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 10, background: message.type === 'success' ? '#F0FDF4' : '#FEF2F2', border: `1px solid ${message.type === 'success' ? '#BBF7D0' : '#FECACA'}`, color: message.type === 'success' ? '#15803D' : '#DC2626', fontSize: 13, fontWeight: 500 }}>
                  {message.type === 'success' ? <CheckCircle size={15} /> : <AlertCircle size={15} />} {message.text}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Hero profil */}
            <motion.div variants={fadeUp} style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', borderRadius: 16, padding: isMobile ? '16px' : '28px' }}>
              <div style={{ display: 'flex', gap: isMobile ? 12 : 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{ width: isMobile ? 56 : 80, height: isMobile ? 56 : 80, borderRadius: '50%', background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid rgba(255,255,255,0.15)', overflow: 'hidden' }}>
                    {avatarUrl
                      ? <img src={avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ fontSize: isMobile ? 18 : 28, fontWeight: 800, color: 'white' }}>{initials}</span>
                    }
                  </div>
                  <label style={{ position: 'absolute', bottom: -2, right: -2, width: 24, height: 24, background: BRAND, borderRadius: '50%', border: '2px solid #0F172A', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {avatarUploading
                      ? <Loader size={10} style={{ color: 'white', animation: 'spin 0.8s linear infinite' }} />
                      : <Camera size={10} style={{ color: 'white' }} />
                    }
                    <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" style={{ display: 'none' }} onChange={handleAvatarUpload} />
                  </label>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <p style={{ fontSize: isMobile ? 15 : 20, fontWeight: 800, color: 'white' }}>{businessName || profile?.full_name}</p>
                    <span style={{ fontSize: 10, fontWeight: 700, background: level.bg, color: level.color, padding: '2px 8px', borderRadius: 100, border: `1px solid ${level.border}` }}>{level.label}</span>
                  </div>
                  <p style={{ fontSize: 12, color: '#64748B', marginBottom: 12 }}>{profile?.email}</p>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: '#64748B' }}>{marchesCount} marché(s)</span>
                      {level.next && <span style={{ fontSize: 11, color: '#64748B' }}>Prochain niveau : {level.next}</span>}
                    </div>
                    <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 100, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${level.color}, ${level.color}99)`, borderRadius: 100 }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: isMobile ? 14 : 24 }}>
                    {[
                      { label: 'Marchés', value: marchesCount, icon: null },
                      { label: 'Kbis', value: kbisUrl, icon: <CheckCircle size={isMobile ? 13 : 16} style={{ color: '#4ADE80' }} /> },
                      { label: 'RC Pro', value: assuranceUrl, icon: <CheckCircle size={isMobile ? 13 : 16} style={{ color: '#4ADE80' }} /> },
                      { label: 'SIREN', value: (isVerified || sirenStatus === 'valid'), icon: <Shield size={isMobile ? 13 : 16} style={{ color: '#4ADE80' }} /> }
                    ].map((s, i) => (
                      <div key={i}>
                        {s.icon ? (
                          <div style={{ height: isMobile ? 18 : 22, display: 'flex', alignItems: 'center' }}>
                            {s.value ? s.icon : <span style={{ color: '#475569', fontSize: isMobile ? 14 : 18 }}>—</span>}
                          </div>
                        ) : (
                          <p style={{ fontSize: isMobile ? 14 : 18, fontWeight: 800, color: 'white' }}>{s.value}</p>
                        )}
                        <p style={{ fontSize: 9, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

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

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 280px', gap: 16, alignItems: 'start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Infos entreprise */}
                <motion.div variants={fadeUp} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
                  <div style={{ padding: '14px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 30, height: 30, background: '#EEF2FF', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Building2 size={15} style={{ color: BRAND }} />
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
                        onFocus={e => { e.target.style.borderColor = BRAND; e.target.style.background = 'white' }}
                        onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.background = '#FAFAFA' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Numéro SIREN</label>
                      <div style={{ display: 'flex', gap: 8, flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
                        <input value={siren} onChange={e => setSiren(e.target.value)} placeholder="123 456 789"
                          style={{ flex: 1, minWidth: 0, padding: '9px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, color: '#0F172A', background: '#FAFAFA', outline: 'none' }}
                          onFocus={e => { e.target.style.borderColor = BRAND; e.target.style.background = 'white' }}
                          onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.background = '#FAFAFA' }} />
                        <button onClick={verifySiren} disabled={sirenStatus === 'loading'}
                          style={{ background: BRAND, color: 'white', border: 'none', borderRadius: 8, padding: '9px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', width: isMobile ? '100%' : 'auto', justifyContent: 'center' }}>
                          <Shield size={13} /> Vérifier INSEE
                        </button>
                      </div>
                      <SirenStatus status={sirenStatus} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Description</label>
                      <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Burgers artisanaux, cuisine du monde..."
                        style={{ width: '100%', padding: '9px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, color: '#0F172A', background: '#FAFAFA', outline: 'none', resize: 'none', height: 70, boxSizing: 'border-box', fontFamily: 'inherit' }}
                        onFocus={e => { e.target.style.borderColor = BRAND; e.target.style.background = 'white' }}
                        onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.background = '#FAFAFA' }} />
                    </div>
                  </div>
                </motion.div>

                {/* Stand */}
                <motion.div variants={fadeUp} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
                  <div style={{ padding: '14px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 30, height: 30, background: '#EEF2FF', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Ruler size={15} style={{ color: BRAND }} />
                    </div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>Caractéristiques du stand</p>
                  </div>
                  <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      {[
                        { label: 'Largeur (m)', val: standWidth, set: setStandWidth },
                        { label: 'Longueur (m)', val: standLength, set: setStandLength }
                      ].map((f, i) => (
                        <div key={i}>
                          <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>{f.label}</label>
                          <input type="number" value={f.val} onChange={e => f.set(e.target.value)} placeholder="3"
                            style={{ width: '100%', padding: '9px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, color: '#0F172A', background: '#FAFAFA', outline: 'none', boxSizing: 'border-box' }}
                            onFocus={e => { e.target.style.borderColor = BRAND; e.target.style.background = 'white' }}
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
                            style={{ flex: 1, padding: '8px 0', border: needsElectricity === opt.val ? `1.5px solid ${BRAND}` : '1px solid #E2E8F0', borderRadius: 8, background: needsElectricity === opt.val ? '#EEF2FF' : 'white', color: needsElectricity === opt.val ? BRAND : '#64748B', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
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
                      <ScanLine size={15} style={{ color: BRAND }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>Documents légaux</p>
                      <p style={{ fontSize: 11, color: '#94A3B8' }}>PDF, JPG ou PNG — max 10MB</p>
                    </div>
                  </div>
                  <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {[
                      { label: 'Extrait Kbis', file: kbisFile, url: kbisUrl, type: 'kbis' as const, verifying: kbisVerifying, result: kbisOcrResult, error: fileErrors.kbis },
                      { label: 'Attestation RC Pro', file: assuranceFile, url: assuranceUrl, type: 'assurance' as const, verifying: assuranceVerifying, result: assuranceOcrResult, error: fileErrors.assurance },
                    ].map(doc => (
                      <div key={doc.type}>
                        <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>{doc.label}</label>

                        {doc.url && !doc.file && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#16A34A', marginBottom: 8, background: '#F0FDF4', padding: '5px 9px', borderRadius: 6 }}>
                            <CheckCircle size={11} /> Document déjà fourni
                          </div>
                        )}

                        {doc.error && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#DC2626', marginBottom: 8, background: '#FEF2F2', padding: '6px 10px', borderRadius: 6, border: '1px solid #FECACA' }}>
                            <AlertTriangle size={11} /> {doc.error}
                          </div>
                        )}

                        <div style={{ display: 'flex', gap: 8, flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
                          <label style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '10px', border: `1.5px dashed ${doc.file ? BRAND : '#E2E8F0'}`, borderRadius: 9, cursor: 'pointer', fontSize: 12, color: doc.file ? BRAND : '#64748B', background: doc.file ? '#EEF2FF' : 'transparent' }}>
                            <Upload size={13} /> {doc.file ? doc.file.name : 'Déposer un PDF / image'}
                            <input type="file" accept=".pdf,image/jpeg,image/png,image/webp" style={{ display: 'none' }}
                              onChange={e => handleDocumentSelect(e.target.files?.[0] || null, doc.type)} />
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
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 600, color: item.ok ? '#4ADE80' : '#F59E0B' }}>
                        {item.ok ? <><CheckCircle size={11} /> OK</> : <><Clock size={11} /> À faire</>}
                      </span>
                    </div>
                  ))}
                </motion.div>

                {/* ✅ Bouton Upgrader FONCTIONNEL */}
                <motion.div variants={fadeUp} style={{ background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', borderRadius: 12, padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                    <Star size={15} style={{ color: '#FBBF24', fill: '#FBBF24' }} />
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
                  <button onClick={handleUpgradePro} disabled={upgradingPro}
                    style={{ width: '100%', background: 'white', color: BRAND, border: 'none', borderRadius: 9, padding: '11px 0', fontSize: 13, fontWeight: 700, cursor: upgradingPro ? 'not-allowed' : 'pointer', opacity: upgradingPro ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    {upgradingPro ? <><Loader size={13} style={{ animation: 'spin 0.8s linear infinite' }} /> Chargement...</> : 'Upgrader'}
                  </button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </main>

        {/* ✅ Bouton sauvegarder flottant sur mobile */}
        {isMobile && hasChanges.current && (
          <motion.div
            initial={{ y: 80 }}
            animate={{ y: 0 }}
            style={{ position: 'fixed', bottom: 16, left: 16, right: 16, zIndex: 100, display: 'flex', gap: 8 }}>
            <button onClick={handleUndo}
              style={{ flex: 1, background: 'white', color: '#64748B', border: '1px solid #E2E8F0', borderRadius: 12, padding: '14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
              <Undo2 size={14} /> Annuler
            </button>
            <button onClick={handleSave} disabled={saving}
              style={{ flex: 2, background: BRAND, color: 'white', border: 'none', borderRadius: 12, padding: '14px', fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, boxShadow: '0 4px 24px rgba(79,70,229,0.4)' }}>
              {saving ? <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Sauvegarde...</> : <><Save size={14} /> Sauvegarder</>}
            </button>
          </motion.div>
        )}
      </div>
    </div>
  )
}
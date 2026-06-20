'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import type { Variants } from 'framer-motion'
import Sidebar from '@/components/Sidebar'
import {
  ArrowLeft, Save, Loader, Upload, ImageIcon,
  MapPin, Star, ChevronRight,
  CheckCircle, Grid, Zap, Utensils, Brush, ShoppingBag,
  Leaf, PartyPopper, Moon, Repeat, FileEdit, AlertCircle,
  CloudUpload, X
} from 'lucide-react'
import AddressMap from '@/components/AddressMap'

const BRAND = '#4F46E5'
const DRAFT_KEY = 'pulsemarket_event_draft'

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

const EVENT_TYPES = [
  { label: 'Marché alimentaire', icon: <Utensils size={16} /> },
  { label: 'Foire artisanale', icon: <Brush size={16} /> },
  { label: 'Brocante', icon: <ShoppingBag size={16} /> },
  { label: 'Marché bio', icon: <Leaf size={16} /> },
  { label: 'Festival', icon: <PartyPopper size={16} /> },
  { label: 'Marché nocturne', icon: <Moon size={16} /> },
]

const RECURRENCE_OPTIONS = [
  { value: 'none', label: 'Une seule fois', desc: 'Marché unique' },
  { value: 'weekly', label: 'Hebdomadaire', desc: 'Tous les 7 jours' },
  { value: 'biweekly', label: 'Bi-mensuel', desc: 'Toutes les 2 semaines' },
  { value: 'monthly', label: 'Mensuel', desc: 'Tous les mois' },
]

export default function CreerEvenement() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingDraft, setSavingDraft] = useState(false)
  const [success, setSuccess] = useState(false)
  const [step, setStep] = useState(1)
  const [terrainTemplate, setTerrainTemplate] = useState<any>(null)
  const [templateApplied, setTemplateApplied] = useState(false)
  const [draftLoaded, setDraftLoaded] = useState(false)
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [eventType, setEventType] = useState('')
  const [locationName, setLocationName] = useState('')
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [city, setCity] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [totalSpots, setTotalSpots] = useState('')
  const [pricePerSpot, setPricePerSpot] = useState('')
  const [isExclusive, setIsExclusive] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageDragging, setImageDragging] = useState(false)

  const [recurrence, setRecurrence] = useState<'none' | 'weekly' | 'biweekly' | 'monthly'>('none')
  const [recurrenceCount, setRecurrenceCount] = useState('4')

  const [error, setError] = useState('')

  const router = useRouter()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isMobile = useIsMobile()

  // ✅ Charger draft
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY)
      if (saved) {
        const draft = JSON.parse(saved)
        if (draft.title) {
          setTitle(draft.title || '')
          setDescription(draft.description || '')
          setEventType(draft.eventType || '')
          setLocationName(draft.locationName || '')
          setLatitude(draft.latitude ?? null)
          setLongitude(draft.longitude ?? null)
          setCity(draft.city || '')
          setPostalCode(draft.postalCode || '')
          setStartDate(draft.startDate || '')
          setEndDate(draft.endDate || '')
          setTotalSpots(draft.totalSpots || '')
          setPricePerSpot(draft.pricePerSpot || '')
          setIsExclusive(draft.isExclusive || false)
          setRecurrence(draft.recurrence || 'none')
          setRecurrenceCount(draft.recurrenceCount || '4')
          setDraftLoaded(true)
          setTimeout(() => setDraftLoaded(false), 5000)
        }
      }
    } catch (e) {}
  }, [])

  // ✅ Auto-save 5s
  useEffect(() => {
    if (!title && !description && !locationName) return
    const timer = setTimeout(() => {
      setAutoSaveStatus('saving')
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({
          title, description, eventType, locationName, latitude, longitude,
          city, postalCode, startDate, endDate, totalSpots, pricePerSpot,
          isExclusive, recurrence, recurrenceCount
        }))
        setTimeout(() => setAutoSaveStatus('saved'), 200)
        setTimeout(() => setAutoSaveStatus('idle'), 2000)
      } catch (e) {
        setAutoSaveStatus('idle')
      }
    }, 5000)
    return () => clearTimeout(timer)
  }, [title, description, eventType, locationName, latitude, longitude, city, postalCode, startDate, endDate, totalSpots, pricePerSpot, isExclusive, recurrence, recurrenceCount])

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (profileData?.role !== 'organisateur') { router.push('/dashboard'); return }
      setProfile(profileData)
      try {
        const { data: templates } = await supabase.from('terrain_templates').select('*').eq('organisateur_id', user.id).order('updated_at', { ascending: false }).limit(1)
        if (templates && templates.length > 0) setTerrainTemplate(templates[0])
      } catch (e) {}
      setLoading(false)
    }
    getData()
  }, [])

  const applyTemplate = () => {
    if (!terrainTemplate) return
    setTotalSpots(String(terrainTemplate.allees * terrainTemplate.emplacements_par_allee))
    setTemplateApplied(true)
  }

  const handleImageChange = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      setError('Image trop grosse (max 5MB)')
      return
    }
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = e => setImagePreview(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setImageDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) handleImageChange(file)
  }

  const validateForm = () => {
    setError('')
    if (!title || !startDate || !endDate || !locationName || !totalSpots) {
      setError('Veuillez remplir tous les champs obligatoires')
      return false
    }
    if (new Date(endDate) <= new Date(startDate)) {
      setError('La date de fin doit être après la date de début')
      return false
    }
    if (parseInt(totalSpots) <= 0) {
      setError('Le nombre de places doit être supérieur à 0')
      return false
    }
    if (pricePerSpot && parseFloat(pricePerSpot) < 0) {
      setError('Le prix ne peut pas être négatif')
      return false
    }
    return true
  }

  const generateRecurringDates = (start: string, end: string, type: string, count: number) => {
    const dates: { start: string; end: string }[] = []
    const startD = new Date(start)
    const endD = new Date(end)
    const interval = type === 'weekly' ? 7 : type === 'biweekly' ? 14 : type === 'monthly' ? 30 : 0
    if (interval === 0) return [{ start, end }]
    for (let i = 0; i < count; i++) {
      const newStart = new Date(startD)
      const newEnd = new Date(endD)
      newStart.setDate(newStart.getDate() + i * interval)
      newEnd.setDate(newEnd.getDate() + i * interval)
      dates.push({
        start: newStart.toISOString().slice(0, 16),
        end: newEnd.toISOString().slice(0, 16),
      })
    }
    return dates
  }

  const uploadImage = async (userId: string): Promise<string | null> => {
    if (!imageFile) return null
    const ext = imageFile.name.split('.').pop()
    const path = `events/${userId}/${Date.now()}.${ext}`
    const { data, error: uploadError } = await supabase.storage.from('images').upload(path, imageFile, { upsert: true })
    if (!uploadError && data) {
      const { data: urlData } = supabase.storage.from('images').getPublicUrl(data.path)
      return urlData.publicUrl
    }
    return null
  }

  const handleSubmit = async (status: 'published' | 'draft' = 'published') => {
    if (status === 'published' && !validateForm()) return
    if (status === 'draft' && !title) {
      setError('Veuillez au moins renseigner le titre pour sauvegarder')
      return
    }

    if (status === 'draft') setSavingDraft(true)
    else setSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser(); if (!user) return
      const imageUrl = await uploadImage(user.id)

      const dates = status === 'published' && recurrence !== 'none'
        ? generateRecurringDates(startDate, endDate, recurrence, parseInt(recurrenceCount) || 4)
        : [{ start: startDate, end: endDate }]

      const events = dates.map(d => ({
        organisateur_id: user.id, title, description,
        start_date: d.start, end_date: d.end, location_name: locationName,
        total_spots: parseInt(totalSpots) || 0, available_spots: parseInt(totalSpots) || 0,
        price_per_spot: parseFloat(pricePerSpot) || 0, is_exclusive: isExclusive,
        image_url: imageUrl, latitude, longitude, city, postal_code: postalCode,
        status,
      }))

      const { error } = await supabase.from('events').insert(events)
      if (error) throw error

      try { localStorage.removeItem(DRAFT_KEY) } catch (e) {}

      await new Promise(r => setTimeout(r, 800))
      setSuccess(true)
    } catch (err: any) {
      setError('Erreur : ' + err.message)
    }
    setSaving(false)
    setSavingDraft(false)
  }

  const clearDraft = () => {
    try { localStorage.removeItem(DRAFT_KEY) } catch (e) {}
    setTitle(''); setDescription(''); setEventType(''); setLocationName('')
    setLatitude(null); setLongitude(null); setCity(''); setPostalCode('')
    setStartDate(''); setEndDate(''); setTotalSpots(''); setPricePerSpot('')
    setIsExclusive(false); setImageFile(null); setImagePreview(null)
    setRecurrence('none'); setRecurrenceCount('4')
    setDraftLoaded(false)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 28, height: 28, border: `2px solid ${BRAND}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  if (success) {
    const dateCount = recurrence !== 'none' ? parseInt(recurrenceCount) || 4 : 1
    return (
      <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', system-ui, sans-serif", padding: '20px' }}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}
          style={{ background: 'white', borderRadius: 16, padding: isMobile ? '32px 24px' : '48px 40px', maxWidth: 440, width: '100%', textAlign: 'center', boxShadow: '0 4px 40px rgba(0,0,0,0.08)' }}>
          <div style={{ width: 60, height: 60, background: '#F0FDF4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
            <CheckCircle size={28} style={{ color: '#16A34A' }} />
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>
            {dateCount > 1 ? `${dateCount} événements publiés !` : 'Événement publié !'}
          </h2>
          <p style={{ fontSize: 13, color: '#64748B', marginBottom: 24, lineHeight: 1.6 }}>
            <strong style={{ color: '#0F172A' }}>{title}</strong> est maintenant visible par tous les exposants.
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => router.push('/dashboard/candidatures')}
              style={{ flex: 1, background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: '11px 0', fontSize: 13, fontWeight: 500, color: '#475569', cursor: 'pointer' }}>
              Candidatures
            </button>
            <button onClick={() => { setSuccess(false); clearDraft(); setStep(1); setTemplateApplied(false) }}
              style={{ flex: 1, background: BRAND, color: 'white', border: 'none', borderRadius: 10, padding: '11px 0', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Créer un autre
            </button>
          </div>
        </motion.div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  const canGoStep2 = title && eventType && locationName
  const canSubmit = title && startDate && endDate && locationName && totalSpots

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <Sidebar profile={profile} />

      <div style={{ marginLeft: isMobile ? 0 : 220, flex: 1, minWidth: 0 }}>
        <header style={{ background: 'white', borderBottom: '1px solid #E2E8F0', padding: isMobile ? '0 14px 0 60px' : '0 28px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => router.push('/dashboard')}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', fontSize: 13 }}>
              <ArrowLeft size={14} /> {!isMobile && 'Retour'}
            </button>
            <div style={{ width: 1, height: 16, background: '#E2E8F0' }} />
            <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>Créer un événement</p>
            {autoSaveStatus !== 'idle' && !isMobile && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: autoSaveStatus === 'saved' ? '#16A34A' : '#64748B' }}>
                {autoSaveStatus === 'saving' ? <Loader size={11} style={{ animation: 'spin 0.8s linear infinite' }} /> : <CloudUpload size={11} />}
                {autoSaveStatus === 'saving' ? 'Sauvegarde...' : 'Sauvegardé'}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => handleSubmit('draft')} disabled={savingDraft || !title}
              style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'white', color: '#64748B', border: '1px solid #E2E8F0', borderRadius: 8, padding: '7px 11px', fontSize: 12, fontWeight: 600, cursor: title ? 'pointer' : 'not-allowed', opacity: title ? 1 : 0.5 }}>
              {savingDraft ? <Loader size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <FileEdit size={12} />}
              {!isMobile && (savingDraft ? '...' : 'Brouillon')}
            </button>
            <button onClick={() => handleSubmit('published')} disabled={saving || !canSubmit}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: canSubmit ? BRAND : '#E2E8F0', color: canSubmit ? 'white' : '#94A3B8', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 13, fontWeight: 600, cursor: canSubmit ? 'pointer' : 'not-allowed', opacity: saving ? 0.7 : 1 }}>
              {saving ? <Loader size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={13} />}
              {saving ? '...' : 'Publier'}
            </button>
          </div>
        </header>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

        <main style={{ padding: isMobile ? '14px' : '28px', maxWidth: 960, margin: '0 auto' }}>

          <AnimatePresence>
            {draftLoaded && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ marginBottom: 14, background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <FileEdit size={14} style={{ color: BRAND, flexShrink: 0 }} />
                <p style={{ fontSize: 12, color: '#4338CA', flex: 1 }}>
                  <strong>Brouillon récupéré.</strong> Vous pouvez continuer ou repartir de zéro.
                </p>
                <button onClick={clearDraft}
                  style={{ background: 'white', color: '#64748B', border: '1px solid #C7D2FE', borderRadius: 7, padding: '4px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                  Repartir de zéro
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <div style={{ marginBottom: 14, background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={13} style={{ color: '#DC2626', flexShrink: 0 }} />
              <p style={{ fontSize: 12, color: '#DC2626', flex: 1 }}>{error}</p>
              <button onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626' }}>
                <X size={12} />
              </button>
            </div>
          )}

          <motion.div variants={stagger} initial="hidden" animate="visible"
            style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 300px', gap: 20, alignItems: 'start' }}>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              <motion.div variants={fadeUp} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center' }}>
                {[{ n: 1, label: 'Identité' }, { n: 2, label: 'Logistique' }, { n: 3, label: 'Publication' }].map((s, i) => (
                  <div key={s.n} style={{ display: 'flex', alignItems: 'center', flex: i < 2 ? 1 : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: step >= s.n ? BRAND : '#F1F5F9', color: step >= s.n ? 'white' : '#94A3B8', fontSize: 11, fontWeight: 700, boxShadow: step === s.n ? '0 0 0 3px rgba(79,70,229,0.15)' : 'none' }}>
                        {step > s.n ? <CheckCircle size={12} /> : s.n}
                      </div>
                      {!isMobile && <span style={{ fontSize: 12, fontWeight: step === s.n ? 600 : 400, color: step === s.n ? '#0F172A' : '#94A3B8', whiteSpace: 'nowrap' }}>{s.label}</span>}
                    </div>
                    {i < 2 && <div style={{ flex: 1, height: 1, background: step > s.n ? BRAND : '#E2E8F0', margin: '0 8px', transition: 'background 0.3s' }} />}
                  </div>
                ))}
              </motion.div>

              {step === 1 && (
                <motion.div variants={fadeUp} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 28, height: 28, background: '#EEF2FF', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ImageIcon size={13} style={{ color: BRAND }} />
                      </div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>Image de couverture</p>
                    </div>
                    <div style={{ padding: '14px' }}>
                      {imagePreview ? (
                        <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', height: isMobile ? 160 : 200 }}>
                          <img src={imagePreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button onClick={() => { setImageFile(null); setImagePreview(null) }}
                            style={{ position: 'absolute', top: 8, right: 8, background: 'white', color: '#DC2626', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                            Supprimer
                          </button>
                        </div>
                      ) : (
                        <div onDragOver={e => { e.preventDefault(); setImageDragging(true) }} onDragLeave={() => setImageDragging(false)} onDrop={handleDrop}
                          onClick={() => fileInputRef.current?.click()}
                          style={{ height: isMobile ? 120 : 160, border: `2px dashed ${imageDragging ? BRAND : '#E2E8F0'}`, borderRadius: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', background: imageDragging ? '#EEF2FF' : '#FAFAFA' }}>
                          <Upload size={20} style={{ color: BRAND }} />
                          <p style={{ fontSize: 12, color: '#475569' }}>Glissez une image ou touchez ici</p>
                          <p style={{ fontSize: 10, color: '#94A3B8' }}>Max 5MB</p>
                          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleImageChange(f) }} />
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Titre <span style={{ color: '#DC2626' }}>*</span></label>
                      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Marché de Noël d'Aubagne 2026"
                        style={{ width: '100%', padding: '9px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, color: '#0F172A', background: '#FAFAFA', outline: 'none', boxSizing: 'border-box' }}
                        onFocus={e => { e.target.style.borderColor = BRAND; e.target.style.background = 'white' }}
                        onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.background = '#FAFAFA' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>Type <span style={{ color: '#DC2626' }}>*</span></label>
                      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: 8 }}>
                        {EVENT_TYPES.map(t => (
                          <button key={t.label} onClick={() => setEventType(t.label)}
                            style={{ padding: '10px 8px', border: eventType === t.label ? `2px solid ${BRAND}` : '1px solid #E2E8F0', borderRadius: 9, background: eventType === t.label ? '#EEF2FF' : 'white', cursor: 'pointer', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                            <div style={{ color: eventType === t.label ? BRAND : '#94A3B8' }}>{t.icon}</div>
                            <p style={{ fontSize: 10, fontWeight: eventType === t.label ? 600 : 400, color: eventType === t.label ? BRAND : '#475569', lineHeight: 1.3 }}>{t.label}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Adresse <span style={{ color: '#DC2626' }}>*</span></label>
                      <AddressMap value={locationName} onChange={(address) => { setLocationName(address.label); setLatitude(address.lat); setLongitude(address.lng); setCity(address.city); setPostalCode(address.postcode) }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Description</label>
                      <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Décrivez votre événement..."
                        style={{ width: '100%', padding: '9px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, color: '#0F172A', background: '#FAFAFA', outline: 'none', resize: 'none', height: 80, boxSizing: 'border-box', fontFamily: 'inherit' }}
                        onFocus={e => { e.target.style.borderColor = BRAND; e.target.style.background = 'white' }}
                        onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.background = '#FAFAFA' }} />
                    </div>
                  </div>

                  <button onClick={() => canGoStep2 && setStep(2)} disabled={!canGoStep2}
                    style={{ background: canGoStep2 ? BRAND : '#E2E8F0', color: canGoStep2 ? 'white' : '#94A3B8', border: 'none', borderRadius: 10, padding: '12px 0', fontSize: 14, fontWeight: 600, cursor: canGoStep2 ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    Continuer <ChevronRight size={16} />
                  </button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div variants={fadeUp} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {terrainTemplate && (
                    <div style={{ border: `2px solid ${templateApplied ? '#16A34A' : BRAND}`, borderRadius: 12, padding: '14px', background: templateApplied ? '#F0FDF4' : '#EEF2FF' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 36, height: 36, background: templateApplied ? '#DCFCE7' : '#C7D2FE', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {templateApplied ? <CheckCircle size={18} style={{ color: '#16A34A' }} /> : <Grid size={18} style={{ color: BRAND }} />}
                          </div>
                          <div>
                            <p style={{ fontSize: 12, fontWeight: 700, color: templateApplied ? '#15803D' : '#3730A3' }}>
                              {templateApplied ? 'Plan appliqué !' : `Plan : ${terrainTemplate.name}`}
                            </p>
                            <p style={{ fontSize: 11, color: templateApplied ? '#16A34A' : BRAND }}>
                              {terrainTemplate.allees * terrainTemplate.emplacements_par_allee} emplacements
                            </p>
                          </div>
                        </div>
                        {!templateApplied ? (
                          <button onClick={applyTemplate}
                            style={{ display: 'flex', alignItems: 'center', gap: 5, background: BRAND, color: 'white', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                            <Zap size={12} /> Utiliser
                          </button>
                        ) : (
                          <button onClick={() => { setTemplateApplied(false); setTotalSpots('') }}
                            style={{ background: 'white', color: '#64748B', border: '1px solid #E2E8F0', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
                            Retirer
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      {[{ label: 'Date de début', val: startDate, set: setStartDate }, { label: 'Date de fin', val: endDate, set: setEndDate }].map((f, i) => (
                        <div key={i}>
                          <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>{f.label} <span style={{ color: '#DC2626' }}>*</span></label>
                          <input type="datetime-local" value={f.val} onChange={e => f.set(e.target.value)}
                            style={{ width: '100%', padding: '9px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 12, color: '#0F172A', background: '#FAFAFA', outline: 'none', boxSizing: 'border-box' }}
                            onFocus={e => { e.target.style.borderColor = BRAND; e.target.style.background = 'white' }}
                            onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.background = '#FAFAFA' }} />
                        </div>
                      ))}
                    </div>

                    {/* ✅ RÉCURRENCE */}
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
                        <Repeat size={11} /> Répétition
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 6 }}>
                        {RECURRENCE_OPTIONS.map(opt => (
                          <button key={opt.value} onClick={() => setRecurrence(opt.value as any)}
                            style={{ padding: '8px 6px', border: recurrence === opt.value ? `1.5px solid ${BRAND}` : '1px solid #E2E8F0', borderRadius: 8, background: recurrence === opt.value ? '#EEF2FF' : 'white', cursor: 'pointer', textAlign: 'center' }}>
                            <p style={{ fontSize: 11, fontWeight: recurrence === opt.value ? 700 : 500, color: recurrence === opt.value ? BRAND : '#0F172A', marginBottom: 2 }}>{opt.label}</p>
                            <p style={{ fontSize: 9, color: '#94A3B8' }}>{opt.desc}</p>
                          </button>
                        ))}
                      </div>
                      {recurrence !== 'none' && (
                        <div style={{ marginTop: 10, background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 8, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Repeat size={13} style={{ color: BRAND, flexShrink: 0 }} />
                          <p style={{ fontSize: 12, color: '#4338CA', flex: 1 }}>Nombre d'éditions :</p>
                          <input type="number" min="2" max="52" value={recurrenceCount} onChange={e => setRecurrenceCount(e.target.value)}
                            style={{ width: 60, padding: '5px 8px', border: '1px solid #C7D2FE', borderRadius: 6, fontSize: 12, color: BRAND, background: 'white', outline: 'none', fontWeight: 700, textAlign: 'center' }} />
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Places <span style={{ color: '#DC2626' }}>*</span></label>
                        <input type="number" min="1" value={totalSpots} onChange={e => setTotalSpots(e.target.value)} placeholder="20"
                          style={{ width: '100%', padding: '9px 12px', border: `1px solid ${templateApplied ? '#BBF7D0' : '#E2E8F0'}`, borderRadius: 8, fontSize: 13, color: '#0F172A', background: templateApplied ? '#F0FDF4' : '#FAFAFA', outline: 'none', boxSizing: 'border-box' }}
                          onFocus={e => { e.target.style.borderColor = BRAND; e.target.style.background = 'white' }}
                          onBlur={e => { e.target.style.borderColor = templateApplied ? '#BBF7D0' : '#E2E8F0'; e.target.style.background = templateApplied ? '#F0FDF4' : '#FAFAFA' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Prix (€)</label>
                        <input type="number" min="0" value={pricePerSpot} onChange={e => setPricePerSpot(e.target.value)} placeholder="0"
                          style={{ width: '100%', padding: '9px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, color: '#0F172A', background: '#FAFAFA', outline: 'none', boxSizing: 'border-box' }}
                          onFocus={e => { e.target.style.borderColor = BRAND; e.target.style.background = 'white' }}
                          onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.background = '#FAFAFA' }} />
                      </div>
                    </div>

                    <div style={{ border: '1px solid #E2E8F0', borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Star size={14} style={{ color: isExclusive ? '#F59E0B' : '#94A3B8', fill: isExclusive ? '#F59E0B' : 'none' }} />
                        <div>
                          <p style={{ fontSize: 12, fontWeight: 500, color: '#0F172A' }}>Exclusif Pro</p>
                          <p style={{ fontSize: 11, color: '#94A3B8' }}>Réservé aux abonnés Pro</p>
                        </div>
                      </div>
                      <button onClick={() => setIsExclusive(!isExclusive)}
                        style={{ width: 44, height: 24, borderRadius: 100, border: 'none', cursor: 'pointer', background: isExclusive ? BRAND : '#E2E8F0', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                        <div style={{ width: 18, height: 18, background: 'white', borderRadius: '50%', position: 'absolute', top: 3, left: isExclusive ? 23 : 3, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => setStep(1)} style={{ flex: 1, background: 'white', border: '1px solid #E2E8F0', borderRadius: 10, padding: '11px 0', fontSize: 13, fontWeight: 500, color: '#64748B', cursor: 'pointer' }}>Retour</button>
                    <button onClick={() => setStep(3)} style={{ flex: 2, background: BRAND, color: 'white', border: 'none', borderRadius: 10, padding: '12px 0', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      Continuer <ChevronRight size={16} />
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div variants={fadeUp} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>Récapitulatif</p>
                  {imagePreview && <img src={imagePreview} alt="cover" style={{ width: '100%', height: 130, objectFit: 'cover', borderRadius: 10 }} />}
                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: '14px' }}>
                    {[
                      { label: 'Titre', value: title },
                      { label: 'Type', value: eventType },
                      { label: 'Adresse', value: locationName },
                      { label: 'Date début', value: startDate ? new Date(startDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—' },
                      { label: 'Emplacements', value: `${totalSpots} places` },
                      { label: 'Prix', value: pricePerSpot && parseFloat(pricePerSpot) > 0 ? `${pricePerSpot} €` : 'Gratuit' },
                      ...(recurrence !== 'none' ? [{ label: 'Récurrence', value: `${RECURRENCE_OPTIONS.find(o => o.value === recurrence)?.label} × ${recurrenceCount}` }] : []),
                      ...(isExclusive ? [{ label: 'Accès', value: 'Exclusif Pro' }] : []),
                    ].map((item, i, arr) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, paddingBottom: i < arr.length - 1 ? 8 : 0, marginBottom: i < arr.length - 1 ? 8 : 0, borderBottom: i < arr.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                        <span style={{ color: '#64748B' }}>{item.label}</span>
                        <span style={{ fontWeight: 600, color: '#0F172A', maxWidth: 180, textAlign: 'right' }}>{item.value}</span>
                      </div>
                    ))}
                  </div>

                  {recurrence !== 'none' && (
                    <div style={{ background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Repeat size={14} style={{ color: BRAND, flexShrink: 0 }} />
                      <p style={{ fontSize: 12, color: '#4338CA' }}>
                        <strong>{recurrenceCount} événements</strong> vont être créés en une fois.
                      </p>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => setStep(2)} style={{ flex: 1, background: 'white', border: '1px solid #E2E8F0', borderRadius: 10, padding: '11px 0', fontSize: 13, fontWeight: 500, color: '#64748B', cursor: 'pointer' }}>Retour</button>
                    <button onClick={() => handleSubmit('published')} disabled={saving}
                      style={{ flex: 2, background: saving ? '#818CF8' : BRAND, color: 'white', border: 'none', borderRadius: 10, padding: '12px 0', fontSize: 14, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      {saving ? <><Loader size={13} style={{ animation: 'spin 1s linear infinite' }} /> Publication...</> : <><Save size={13} /> Publier {recurrence !== 'none' && `(${recurrenceCount})`}</>}
                    </button>
                  </div>
                </motion.div>
              )}
            </div>

            {!isMobile && (
              <motion.div variants={fadeUp} style={{ position: 'sticky', top: 72 }}>
                <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid #F1F5F9', background: '#0F172A' }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Aperçu</p>
                  </div>
                  <div>
                    {imagePreview ? <img src={imagePreview} alt="cover" style={{ width: '100%', height: 120, objectFit: 'cover' }} />
                      : <div style={{ height: 120, background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ImageIcon size={24} style={{ color: 'rgba(255,255,255,0.3)' }} /></div>
                    }
                    <div style={{ padding: '12px 14px' }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>{title || "Titre de l'événement"}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#64748B', marginBottom: 8 }}>
                        <MapPin size={10} style={{ color: BRAND }} /> {locationName || 'Localisation'}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>{pricePerSpot && parseFloat(pricePerSpot) > 0 ? `${pricePerSpot}€` : 'Gratuit'}</span>
                        <span style={{ fontSize: 11, color: '#94A3B8' }}>{totalSpots || '—'} places</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: '12px 14px', borderTop: '1px solid #F1F5F9' }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 8 }}>Checklist</p>
                    {[
                      { label: 'Titre', ok: !!title },
                      { label: 'Type', ok: !!eventType },
                      { label: 'Adresse', ok: !!locationName },
                      { label: 'Dates', ok: !!(startDate && endDate) },
                      { label: 'Emplacements', ok: !!totalSpots },
                      { label: 'Image', ok: !!imageFile },
                    ].map((item, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 5 }}>
                        <span style={{ color: '#64748B' }}>{item.label}</span>
                        {item.ok ? <CheckCircle size={11} style={{ color: '#16A34A' }} /> : <div style={{ width: 11, height: 11, borderRadius: '50%', border: '1.5px solid #CBD5E1' }} />}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

          </motion.div>
        </main>
      </div>
    </div>
  )
}
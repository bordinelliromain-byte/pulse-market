'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import Sidebar from '@/components/Sidebar'
import {
  ArrowLeft, Save, Loader, Upload, ImageIcon,
  MapPin, Calendar, Users, Euro, Star, ChevronRight,
  CheckCircle, Grid, Zap, Map
} from 'lucide-react'
import AddressMap from '@/components/AddressMap'

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
  { label: 'Marché alimentaire', icon: '🥖' },
  { label: 'Foire artisanale', icon: '🎨' },
  { label: 'Brocante', icon: '🪑' },
  { label: 'Marché bio', icon: '🌿' },
  { label: 'Festival', icon: '🎪' },
  { label: 'Marché nocturne', icon: '🌙' },
]

export default function CreerEvenement() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [step, setStep] = useState(1)
  const [terrainTemplate, setTerrainTemplate] = useState<any>(null)
  const [templateApplied, setTemplateApplied] = useState(false)
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

  const router = useRouter()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isMobile = useIsMobile()

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

  const handleSubmit = async () => {
    if (!title || !startDate || !endDate || !locationName || !totalSpots) return
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser(); if (!user) return
      let imageUrl = null
      if (imageFile) {
        const ext = imageFile.name.split('.').pop()
        const path = `events/${user.id}/${Date.now()}.${ext}`
        const { data, error: uploadError } = await supabase.storage.from('images').upload(path, imageFile, { upsert: true })
        if (!uploadError && data) {
          const { data: urlData } = supabase.storage.from('images').getPublicUrl(data.path)
          imageUrl = urlData.publicUrl
        }
      }
      const { error } = await supabase.from('events').insert({
        organisateur_id: user.id, title, description,
        start_date: startDate, end_date: endDate, location_name: locationName,
        total_spots: parseInt(totalSpots), available_spots: parseInt(totalSpots),
        price_per_spot: parseFloat(pricePerSpot) || 0, is_exclusive: isExclusive,
        image_url: imageUrl, latitude, longitude, city, postal_code: postalCode, status: 'published',
      })
      if (error) throw error
      await new Promise(r => setTimeout(r, 800))
      setSuccess(true)
    } catch (err: any) { alert('Erreur : ' + err.message) }
    setSaving(false)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 28, height: 28, border: '2px solid #4F46E5', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  if (success) return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', system-ui, sans-serif", padding: '20px' }}>
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}
        style={{ background: 'white', borderRadius: 16, padding: isMobile ? '32px 24px' : '48px 40px', maxWidth: 440, width: '100%', textAlign: 'center', boxShadow: '0 4px 40px rgba(0,0,0,0.08)' }}>
        <div style={{ width: 60, height: 60, background: '#F0FDF4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
          <CheckCircle size={28} style={{ color: '#16A34A' }} />
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>Événement publié !</h2>
        <p style={{ fontSize: 13, color: '#64748B', marginBottom: 24, lineHeight: 1.6 }}>
          <strong style={{ color: '#0F172A' }}>{title}</strong> est maintenant visible par tous les exposants.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => router.push('/dashboard/candidatures')}
            style={{ flex: 1, background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: '11px 0', fontSize: 13, fontWeight: 500, color: '#475569', cursor: 'pointer' }}>
            Candidatures
          </button>
          <button onClick={() => { setSuccess(false); setTitle(''); setDescription(''); setStep(1); setTemplateApplied(false) }}
            style={{ flex: 1, background: '#4F46E5', color: 'white', border: 'none', borderRadius: 10, padding: '11px 0', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Créer un autre
          </button>
        </div>
      </motion.div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  const canGoStep2 = title && eventType && locationName
  const canSubmit = title && startDate && endDate && locationName && totalSpots

  const inputStyle = (focused?: boolean): React.CSSProperties => ({
    width: '100%', padding: '9px 12px', border: `1px solid ${focused ? '#4F46E5' : '#E2E8F0'}`,
    borderRadius: 8, fontSize: 13, color: '#0F172A', background: focused ? 'white' : '#FAFAFA',
    outline: 'none', boxSizing: 'border-box'
  })

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
          </div>
          <button onClick={handleSubmit} disabled={saving || !canSubmit}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: canSubmit ? '#4F46E5' : '#E2E8F0', color: canSubmit ? 'white' : '#94A3B8', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 13, fontWeight: 600, cursor: canSubmit ? 'pointer' : 'not-allowed', opacity: saving ? 0.7 : 1 }}>
            {saving ? <Loader size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={13} />}
            {saving ? '...' : 'Publier'}
          </button>
        </header>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

        <main style={{ padding: isMobile ? '14px' : '28px', maxWidth: 960, margin: '0 auto' }}>
          <motion.div variants={stagger} initial="hidden" animate="visible"
            style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 300px', gap: 20, alignItems: 'start' }}>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Stepper */}
              <motion.div variants={fadeUp} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center' }}>
                {[{ n: 1, label: 'Identité' }, { n: 2, label: 'Logistique' }, { n: 3, label: 'Publication' }].map((s, i) => (
                  <div key={s.n} style={{ display: 'flex', alignItems: 'center', flex: i < 2 ? 1 : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: step >= s.n ? '#4F46E5' : '#F1F5F9', color: step >= s.n ? 'white' : '#94A3B8', fontSize: 11, fontWeight: 700, boxShadow: step === s.n ? '0 0 0 3px rgba(79,70,229,0.15)' : 'none' }}>
                        {step > s.n ? <CheckCircle size={12} /> : s.n}
                      </div>
                      {!isMobile && <span style={{ fontSize: 12, fontWeight: step === s.n ? 600 : 400, color: step === s.n ? '#0F172A' : '#94A3B8', whiteSpace: 'nowrap' }}>{s.label}</span>}
                    </div>
                    {i < 2 && <div style={{ flex: 1, height: 1, background: step > s.n ? '#4F46E5' : '#E2E8F0', margin: '0 8px', transition: 'background 0.3s' }} />}
                  </div>
                ))}
              </motion.div>

              {/* Étape 1 */}
              {step === 1 && (
                <motion.div variants={fadeUp} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {/* Image upload */}
                  <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 28, height: 28, background: '#EEF2FF', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ImageIcon size={13} style={{ color: '#4F46E5' }} />
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
                          style={{ height: isMobile ? 120 : 160, border: `2px dashed ${imageDragging ? '#4F46E5' : '#E2E8F0'}`, borderRadius: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', background: imageDragging ? '#EEF2FF' : '#FAFAFA' }}>
                          <Upload size={20} style={{ color: '#4F46E5' }} />
                          <p style={{ fontSize: 12, color: '#475569' }}>Glissez une image ou touchez ici</p>
                          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleImageChange(f) }} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Infos */}
                  <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Titre *</label>
                      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Marché de Noël d'Aubagne 2026"
                        style={inputStyle()} onFocus={e => { e.target.style.borderColor = '#4F46E5'; e.target.style.background = 'white' }} onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.background = '#FAFAFA' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>Type *</label>
                      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: 8 }}>
                        {EVENT_TYPES.map(t => (
                          <button key={t.label} onClick={() => setEventType(t.label)}
                            style={{ padding: '10px 8px', border: eventType === t.label ? '2px solid #4F46E5' : '1px solid #E2E8F0', borderRadius: 9, background: eventType === t.label ? '#EEF2FF' : 'white', cursor: 'pointer', textAlign: 'center' }}>
                            <div style={{ fontSize: 18, marginBottom: 4 }}>{t.icon}</div>
                            <p style={{ fontSize: 10, fontWeight: eventType === t.label ? 600 : 400, color: eventType === t.label ? '#4F46E5' : '#475569', lineHeight: 1.3 }}>{t.label}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Adresse *</label>
                      <AddressMap value={locationName} onChange={(address) => { setLocationName(address.label); setLatitude(address.lat); setLongitude(address.lng); setCity(address.city); setPostalCode(address.postcode) }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Description</label>
                      <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Décrivez votre événement..."
                        style={{ width: '100%', padding: '9px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, color: '#0F172A', background: '#FAFAFA', outline: 'none', resize: 'none', height: 80, boxSizing: 'border-box', fontFamily: 'inherit' }}
                        onFocus={e => { e.target.style.borderColor = '#4F46E5'; e.target.style.background = 'white' }} onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.background = '#FAFAFA' }} />
                    </div>
                  </div>

                  <button onClick={() => canGoStep2 && setStep(2)} disabled={!canGoStep2}
                    style={{ background: canGoStep2 ? '#4F46E5' : '#E2E8F0', color: canGoStep2 ? 'white' : '#94A3B8', border: 'none', borderRadius: 10, padding: '12px 0', fontSize: 14, fontWeight: 600, cursor: canGoStep2 ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    Continuer <ChevronRight size={16} />
                  </button>
                </motion.div>
              )}

              {/* Étape 2 */}
              {step === 2 && (
                <motion.div variants={fadeUp} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {terrainTemplate && (
                    <div style={{ border: `2px solid ${templateApplied ? '#16A34A' : '#4F46E5'}`, borderRadius: 12, padding: '14px', background: templateApplied ? '#F0FDF4' : '#EEF2FF' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 36, height: 36, background: templateApplied ? '#DCFCE7' : '#C7D2FE', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {templateApplied ? <CheckCircle size={18} style={{ color: '#16A34A' }} /> : <Grid size={18} style={{ color: '#4F46E5' }} />}
                          </div>
                          <div>
                            <p style={{ fontSize: 12, fontWeight: 700, color: templateApplied ? '#15803D' : '#3730A3' }}>
                              {templateApplied ? 'Plan appliqué !' : `Plan : ${terrainTemplate.name}`}
                            </p>
                            <p style={{ fontSize: 11, color: templateApplied ? '#16A34A' : '#4F46E5' }}>
                              {terrainTemplate.allees * terrainTemplate.emplacements_par_allee} emplacements
                            </p>
                          </div>
                        </div>
                        {!templateApplied ? (
                          <button onClick={applyTemplate}
                            style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#4F46E5', color: 'white', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
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
                      {[{ label: 'Date de début *', val: startDate, set: setStartDate }, { label: 'Date de fin *', val: endDate, set: setEndDate }].map((f, i) => (
                        <div key={i}>
                          <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>{f.label}</label>
                          <input type="datetime-local" value={f.val} onChange={e => f.set(e.target.value)}
                            style={{ width: '100%', padding: '9px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 12, color: '#0F172A', background: '#FAFAFA', outline: 'none', boxSizing: 'border-box' }}
                            onFocus={e => { e.target.style.borderColor = '#4F46E5'; e.target.style.background = 'white' }} onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.background = '#FAFAFA' }} />
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Places *</label>
                        <input type="number" value={totalSpots} onChange={e => setTotalSpots(e.target.value)} placeholder="20"
                          style={{ width: '100%', padding: '9px 12px', border: `1px solid ${templateApplied ? '#BBF7D0' : '#E2E8F0'}`, borderRadius: 8, fontSize: 13, color: '#0F172A', background: templateApplied ? '#F0FDF4' : '#FAFAFA', outline: 'none', boxSizing: 'border-box' }}
                          onFocus={e => { e.target.style.borderColor = '#4F46E5'; e.target.style.background = 'white' }} onBlur={e => { e.target.style.borderColor = templateApplied ? '#BBF7D0' : '#E2E8F0'; e.target.style.background = templateApplied ? '#F0FDF4' : '#FAFAFA' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Prix (€)</label>
                        <input type="number" value={pricePerSpot} onChange={e => setPricePerSpot(e.target.value)} placeholder="0"
                          style={{ width: '100%', padding: '9px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, color: '#0F172A', background: '#FAFAFA', outline: 'none', boxSizing: 'border-box' }}
                          onFocus={e => { e.target.style.borderColor = '#4F46E5'; e.target.style.background = 'white' }} onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.background = '#FAFAFA' }} />
                      </div>
                    </div>
                    <div style={{ border: '1px solid #E2E8F0', borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Star size={14} style={{ color: isExclusive ? '#F59E0B' : '#94A3B8' }} />
                        <div>
                          <p style={{ fontSize: 12, fontWeight: 500, color: '#0F172A' }}>Exclusif Pro</p>
                          <p style={{ fontSize: 11, color: '#94A3B8' }}>Réservé aux abonnés Pro</p>
                        </div>
                      </div>
                      <button onClick={() => setIsExclusive(!isExclusive)}
                        style={{ width: 44, height: 24, borderRadius: 100, border: 'none', cursor: 'pointer', background: isExclusive ? '#4F46E5' : '#E2E8F0', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                        <div style={{ width: 18, height: 18, background: 'white', borderRadius: '50%', position: 'absolute', top: 3, left: isExclusive ? 23 : 3, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => setStep(1)} style={{ flex: 1, background: 'white', border: '1px solid #E2E8F0', borderRadius: 10, padding: '11px 0', fontSize: 13, fontWeight: 500, color: '#64748B', cursor: 'pointer' }}>Retour</button>
                    <button onClick={() => setStep(3)} style={{ flex: 2, background: '#4F46E5', color: 'white', border: 'none', borderRadius: 10, padding: '12px 0', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      Continuer <ChevronRight size={16} />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Étape 3 */}
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
                      { label: 'Prix', value: pricePerSpot ? `${pricePerSpot} €` : 'Gratuit' },
                    ].map((item, i, arr) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, paddingBottom: i < arr.length - 1 ? 8 : 0, marginBottom: i < arr.length - 1 ? 8 : 0, borderBottom: i < arr.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                        <span style={{ color: '#64748B' }}>{item.label}</span>
                        <span style={{ fontWeight: 600, color: '#0F172A', maxWidth: 180, textAlign: 'right' }}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => setStep(2)} style={{ flex: 1, background: 'white', border: '1px solid #E2E8F0', borderRadius: 10, padding: '11px 0', fontSize: 13, fontWeight: 500, color: '#64748B', cursor: 'pointer' }}>Retour</button>
                    <button onClick={handleSubmit} disabled={saving}
                      style={{ flex: 2, background: saving ? '#818CF8' : '#4F46E5', color: 'white', border: 'none', borderRadius: 10, padding: '12px 0', fontSize: 14, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      {saving ? <><Loader size={13} style={{ animation: 'spin 1s linear infinite' }} /> Publication...</> : <><Save size={13} /> Publier</>}
                    </button>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Preview — desktop seulement */}
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
                        <MapPin size={10} style={{ color: '#4F46E5' }} /> {locationName || 'Localisation'}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>{pricePerSpot ? `${pricePerSpot}€` : 'Gratuit'}</span>
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
                        <span style={{ color: item.ok ? '#16A34A' : '#94A3B8', fontWeight: 600 }}>{item.ok ? '✓' : '○'}</span>
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
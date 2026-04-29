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

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (profileData?.role !== 'organisateur') { router.push('/dashboard'); return }
      setProfile(profileData)

      try {
        const { data: templates } = await supabase
          .from('terrain_templates')
          .select('*')
          .eq('organisateur_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(1)
        if (templates && templates.length > 0) setTerrainTemplate(templates[0])
      } catch (e) {
        // pas de template, on continue
      }

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
    e.preventDefault()
    setImageDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) handleImageChange(file)
  }

  const handleSubmit = async () => {
    if (!title || !startDate || !endDate || !locationName || !totalSpots) return
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      let imageUrl = null
      if (imageFile) {
        const ext = imageFile.name.split('.').pop()
        const path = `events/${user.id}/${Date.now()}.${ext}`
        const { data, error: uploadError } = await supabase.storage
          .from('images').upload(path, imageFile, { upsert: true })
        if (!uploadError && data) {
          const { data: urlData } = supabase.storage.from('images').getPublicUrl(data.path)
          imageUrl = urlData.publicUrl
        }
      }

      const { error } = await supabase.from('events').insert({
        organisateur_id: user.id,
        title, description,
        start_date: startDate, end_date: endDate,
        location_name: locationName,
        total_spots: parseInt(totalSpots),
        available_spots: parseInt(totalSpots),
        price_per_spot: parseFloat(pricePerSpot) || 0,
        is_exclusive: isExclusive,
        image_url: imageUrl,
        latitude, longitude, city,
        postal_code: postalCode,
        status: 'published',
      })

      if (error) throw error
      await new Promise(r => setTimeout(r, 800))
      setSuccess(true)
    } catch (err: any) {
      alert('Erreur : ' + err.message)
    }
    setSaving(false)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 28, height: 28, border: '2px solid #4F46E5', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  if (success) return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}
        style={{ background: 'white', borderRadius: 16, padding: '48px 40px', maxWidth: 440, width: '100%', textAlign: 'center', boxShadow: '0 4px 40px rgba(0,0,0,0.08)' }}>
        <div style={{ width: 64, height: 64, background: '#F0FDF4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <CheckCircle size={30} style={{ color: '#16A34A' }} />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>Événement publié !</h2>
        <p style={{ fontSize: 13, color: '#64748B', marginBottom: 6, lineHeight: 1.6 }}>
          <strong style={{ color: '#0F172A' }}>{title}</strong> est maintenant visible par tous les exposants.
        </p>
        <p style={{ fontSize: 12, color: '#94A3B8', marginBottom: 28 }}>{totalSpots} emplacements · {pricePerSpot ? `Dès ${pricePerSpot}€` : 'Gratuit'}</p>
        {templateApplied && (
          <div style={{ background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 10, padding: '10px 14px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Grid size={14} style={{ color: '#4F46E5' }} />
            <p style={{ fontSize: 12, color: '#4F46E5', fontWeight: 500 }}>Plan de terrain "{terrainTemplate?.name}" appliqué</p>
          </div>
        )}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => router.push('/dashboard/candidatures')}
            style={{ flex: 1, background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: '11px 0', fontSize: 13, fontWeight: 500, color: '#475569', cursor: 'pointer' }}>
            Voir les candidatures
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

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <Sidebar profile={profile} />

      <div style={{ marginLeft: 220, flex: 1 }}>
        <header style={{ background: 'white', borderBottom: '1px solid #E2E8F0', padding: '0 28px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => router.push('/dashboard')}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', fontSize: 13 }}>
              <ArrowLeft size={14} /> Retour
            </button>
            <div style={{ width: 1, height: 16, background: '#E2E8F0' }} />
            <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>Créer un événement</p>
          </div>
          <button onClick={handleSubmit} disabled={saving || !canSubmit}
            style={{ display: 'flex', alignItems: 'center', gap: 7, background: canSubmit ? '#4F46E5' : '#E2E8F0', color: canSubmit ? 'white' : '#94A3B8', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: canSubmit ? 'pointer' : 'not-allowed', opacity: saving ? 0.7 : 1 }}>
            {saving ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={14} />}
            {saving ? 'Publication...' : 'Publier'}
          </button>
        </header>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

        <main style={{ padding: '28px', maxWidth: 960, margin: '0 auto' }}>
          <motion.div variants={stagger} initial="hidden" animate="visible" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'start' }}>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* STEPPER */}
              <motion.div variants={fadeUp} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: '14px 20px', display: 'flex', alignItems: 'center' }}>
                {[{ n: 1, label: 'Identité' }, { n: 2, label: 'Logistique' }, { n: 3, label: 'Publication' }].map((s, i) => (
                  <div key={s.n} style={{ display: 'flex', alignItems: 'center', flex: i < 2 ? 1 : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: step >= s.n ? '#4F46E5' : '#F1F5F9', color: step >= s.n ? 'white' : '#94A3B8', fontSize: 11, fontWeight: 700, boxShadow: step === s.n ? '0 0 0 3px rgba(79,70,229,0.15)' : 'none' }}>
                        {step > s.n ? <CheckCircle size={13} /> : s.n}
                      </div>
                      <span style={{ fontSize: 12, fontWeight: step === s.n ? 600 : 400, color: step === s.n ? '#0F172A' : '#94A3B8', whiteSpace: 'nowrap' }}>{s.label}</span>
                    </div>
                    {i < 2 && <div style={{ flex: 1, height: 1, background: step > s.n ? '#4F46E5' : '#E2E8F0', margin: '0 12px', transition: 'background 0.3s' }} />}
                  </div>
                ))}
              </motion.div>

              {/* ÉTAPE 1 */}
              {step === 1 && (
                <motion.div variants={fadeUp} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
                    <div style={{ padding: '14px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 30, height: 30, background: '#EEF2FF', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ImageIcon size={15} style={{ color: '#4F46E5' }} />
                      </div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>Image de couverture</p>
                        <p style={{ fontSize: 11, color: '#94A3B8' }}>Donnez envie aux exposants de postuler</p>
                      </div>
                    </div>
                    <div style={{ padding: '16px' }}>
                      {imagePreview ? (
                        <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', height: 200 }}>
                          <img src={imagePreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}
                            onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                            onMouseLeave={e => e.currentTarget.style.opacity = '0'}>
                            <button onClick={() => { setImageFile(null); setImagePreview(null) }}
                              style={{ background: 'white', color: '#DC2626', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                              Supprimer
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div onDragOver={e => { e.preventDefault(); setImageDragging(true) }} onDragLeave={() => setImageDragging(false)} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()}
                          style={{ height: 160, border: `2px dashed ${imageDragging ? '#4F46E5' : '#E2E8F0'}`, borderRadius: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', background: imageDragging ? '#EEF2FF' : '#FAFAFA', transition: 'all 0.2s' }}>
                          <div style={{ width: 40, height: 40, background: '#EEF2FF', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Upload size={18} style={{ color: '#4F46E5' }} />
                          </div>
                          <p style={{ fontSize: 13, fontWeight: 500, color: '#475569' }}>Glissez une image ou cliquez</p>
                          <p style={{ fontSize: 11, color: '#94A3B8' }}>JPG, PNG — max 5 MB</p>
                          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleImageChange(f) }} />
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Titre de l'événement *</label>
                      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Marché de Noël d'Aubagne 2026"
                        style={{ width: '100%', padding: '9px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 14, fontWeight: 500, color: '#0F172A', background: '#FAFAFA', outline: 'none', boxSizing: 'border-box' }}
                        onFocus={e => { e.target.style.borderColor = '#4F46E5'; e.target.style.background = 'white' }}
                        onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.background = '#FAFAFA' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>Type d'événement *</label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                        {EVENT_TYPES.map(t => (
                          <button key={t.label} onClick={() => setEventType(t.label)}
                            style={{ padding: '10px 8px', border: eventType === t.label ? '2px solid #4F46E5' : '1px solid #E2E8F0', borderRadius: 9, background: eventType === t.label ? '#EEF2FF' : 'white', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s' }}>
                            <div style={{ fontSize: 18, marginBottom: 4 }}>{t.icon}</div>
                            <p style={{ fontSize: 11, fontWeight: eventType === t.label ? 600 : 400, color: eventType === t.label ? '#4F46E5' : '#475569', lineHeight: 1.3 }}>{t.label}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Adresse exacte *</label>
                      <AddressMap value={locationName} onChange={(address) => { setLocationName(address.label); setLatitude(address.lat); setLongitude(address.lng); setCity(address.city); setPostalCode(address.postcode) }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Description</label>
                      <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Décrivez votre événement..."
                        style={{ width: '100%', padding: '9px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, color: '#0F172A', background: '#FAFAFA', outline: 'none', resize: 'none', height: 90, boxSizing: 'border-box', fontFamily: 'inherit' }}
                        onFocus={e => { e.target.style.borderColor = '#4F46E5'; e.target.style.background = 'white' }}
                        onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.background = '#FAFAFA' }}
                      />
                    </div>
                  </div>

                  <button onClick={() => canGoStep2 && setStep(2)} disabled={!canGoStep2}
                    style={{ background: canGoStep2 ? '#4F46E5' : '#E2E8F0', color: canGoStep2 ? 'white' : '#94A3B8', border: 'none', borderRadius: 10, padding: '12px 0', fontSize: 14, fontWeight: 600, cursor: canGoStep2 ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    Continuer <ChevronRight size={16} />
                  </button>
                </motion.div>
              )}

              {/* ÉTAPE 2 */}
              {step === 2 && (
                <motion.div variants={fadeUp} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                  {terrainTemplate ? (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                      style={{ border: `2px solid ${templateApplied ? '#16A34A' : '#4F46E5'}`, borderRadius: 12, overflow: 'hidden', background: templateApplied ? '#F0FDF4' : '#EEF2FF' }}>
                      <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 40, height: 40, background: templateApplied ? '#DCFCE7' : '#C7D2FE', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {templateApplied ? <CheckCircle size={20} style={{ color: '#16A34A' }} /> : <Grid size={20} style={{ color: '#4F46E5' }} />}
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                              <p style={{ fontSize: 13, fontWeight: 700, color: templateApplied ? '#15803D' : '#3730A3' }}>
                                {templateApplied ? 'Plan de terrain appliqué !' : 'Plan de terrain détecté'}
                              </p>
                              <span style={{ fontSize: 10, fontWeight: 700, background: templateApplied ? '#16A34A' : '#4F46E5', color: 'white', padding: '2px 7px', borderRadius: 100 }}>
                                {templateApplied ? 'ACTIF' : 'DISPONIBLE'}
                              </span>
                            </div>
                            <p style={{ fontSize: 12, color: templateApplied ? '#16A34A' : '#4F46E5', lineHeight: 1.5 }}>
                              {terrainTemplate.name} · {terrainTemplate.allees} allée{terrainTemplate.allees > 1 ? 's' : ''} · {terrainTemplate.allees * terrainTemplate.emplacements_par_allee} emplacements
                              {terrainTemplate.zones?.length > 0 && ` · ${terrainTemplate.zones.length} zone${terrainTemplate.zones.length > 1 ? 's' : ''} définies`}
                            </p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                          {!templateApplied ? (
                            <>
                              <button onClick={applyTemplate}
                                style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#4F46E5', color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                                <Zap size={13} /> Utiliser ce plan
                              </button>
                              <button onClick={() => router.push('/dashboard/terrain')}
                                style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'white', color: '#4F46E5', border: '1px solid #C7D2FE', borderRadius: 8, padding: '8px 12px', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
                                Modifier
                              </button>
                            </>
                          ) : (
                            <button onClick={() => { setTemplateApplied(false); setTotalSpots('') }}
                              style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'white', color: '#64748B', border: '1px solid #E2E8F0', borderRadius: 8, padding: '8px 12px', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
                              Retirer
                            </button>
                          )}
                        </div>
                      </div>
                      {templateApplied && terrainTemplate.zones?.length > 0 && (
                        <div style={{ padding: '10px 18px 14px', borderTop: '1px solid #BBF7D0' }}>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {terrainTemplate.zones.map((zone: any, i: number) => {
                              const count = terrainTemplate.grid?.filter((c: any) => c.zoneId === zone.id).length || 0
                              return (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, background: `${zone.color}15`, border: `1px solid ${zone.color}30`, borderRadius: 100, padding: '3px 10px' }}>
                                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: zone.color }} />
                                  <span style={{ fontSize: 11, color: zone.color, fontWeight: 600 }}>{zone.name}</span>
                                  <span style={{ fontSize: 10, color: '#94A3B8' }}>({count})</span>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    <div style={{ border: '1px dashed #E2E8F0', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FAFAFA' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Map size={16} style={{ color: '#CBD5E1' }} />
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 500, color: '#64748B' }}>Aucun plan de terrain configuré</p>
                          <p style={{ fontSize: 11, color: '#94A3B8' }}>Créez votre plan pour le réutiliser à chaque événement</p>
                        </div>
                      </div>
                      <button onClick={() => router.push('/dashboard/terrain')}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F8FAFC', color: '#4F46E5', border: '1px solid #C7D2FE', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        <Grid size={12} /> Créer un plan
                      </button>
                    </div>
                  )}

                  <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Date de début *</label>
                        <div style={{ position: 'relative' }}>
                          <Calendar size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                          <input type="datetime-local" value={startDate} onChange={e => setStartDate(e.target.value)}
                            style={{ width: '100%', padding: '9px 12px 9px 30px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, color: '#0F172A', background: '#FAFAFA', outline: 'none', boxSizing: 'border-box' }}
                            onFocus={e => { e.target.style.borderColor = '#4F46E5'; e.target.style.background = 'white' }}
                            onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.background = '#FAFAFA' }}
                          />
                        </div>
                      </div>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Date de fin *</label>
                        <div style={{ position: 'relative' }}>
                          <Calendar size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                          <input type="datetime-local" value={endDate} onChange={e => setEndDate(e.target.value)}
                            style={{ width: '100%', padding: '9px 12px 9px 30px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, color: '#0F172A', background: '#FAFAFA', outline: 'none', boxSizing: 'border-box' }}
                            onFocus={e => { e.target.style.borderColor = '#4F46E5'; e.target.style.background = 'white' }}
                            onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.background = '#FAFAFA' }}
                          />
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>
                          Nombre de places *
                          {templateApplied && <span style={{ marginLeft: 6, color: '#16A34A', fontSize: 10 }}>· du plan terrain</span>}
                        </label>
                        <div style={{ position: 'relative' }}>
                          <Users size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: templateApplied ? '#16A34A' : '#94A3B8' }} />
                          <input type="number" value={totalSpots} onChange={e => setTotalSpots(e.target.value)} placeholder="20"
                            style={{ width: '100%', padding: '9px 12px 9px 30px', border: `1px solid ${templateApplied ? '#BBF7D0' : '#E2E8F0'}`, borderRadius: 8, fontSize: 13, color: '#0F172A', background: templateApplied ? '#F0FDF4' : '#FAFAFA', outline: 'none', boxSizing: 'border-box', fontWeight: templateApplied ? 600 : 400 }}
                            onFocus={e => { e.target.style.borderColor = '#4F46E5'; e.target.style.background = 'white' }}
                            onBlur={e => { e.target.style.borderColor = templateApplied ? '#BBF7D0' : '#E2E8F0'; e.target.style.background = templateApplied ? '#F0FDF4' : '#FAFAFA' }}
                          />
                        </div>
                      </div>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Prix par emplacement (€)</label>
                        <div style={{ position: 'relative' }}>
                          <Euro size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                          <input type="number" value={pricePerSpot} onChange={e => setPricePerSpot(e.target.value)} placeholder="0"
                            style={{ width: '100%', padding: '9px 12px 9px 30px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, color: '#0F172A', background: '#FAFAFA', outline: 'none', boxSizing: 'border-box' }}
                            onFocus={e => { e.target.style.borderColor = '#4F46E5'; e.target.style.background = 'white' }}
                            onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.background = '#FAFAFA' }}
                          />
                        </div>
                      </div>
                    </div>

                    <div style={{ border: '1px solid #E2E8F0', borderRadius: 10, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, background: isExclusive ? '#FEF3C7' : '#F8FAFC', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Star size={15} style={{ color: isExclusive ? '#F59E0B' : '#94A3B8' }} />
                        </div>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 500, color: '#0F172A' }}>Événement exclusif Pro</p>
                          <p style={{ fontSize: 11, color: '#94A3B8' }}>Réservé aux exposants abonnés Plan Pro</p>
                        </div>
                      </div>
                      <button onClick={() => setIsExclusive(!isExclusive)}
                        style={{ width: 44, height: 24, borderRadius: 100, border: 'none', cursor: 'pointer', background: isExclusive ? '#4F46E5' : '#E2E8F0', position: 'relative', transition: 'background 0.2s' }}>
                        <div style={{ width: 18, height: 18, background: 'white', borderRadius: '50%', position: 'absolute', top: 3, left: isExclusive ? 23 : 3, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => setStep(1)}
                      style={{ flex: 1, background: 'white', border: '1px solid #E2E8F0', borderRadius: 10, padding: '11px 0', fontSize: 13, fontWeight: 500, color: '#64748B', cursor: 'pointer' }}>
                      Retour
                    </button>
                    <button onClick={() => setStep(3)}
                      style={{ flex: 2, background: '#4F46E5', color: 'white', border: 'none', borderRadius: 10, padding: '12px 0', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      Continuer <ChevronRight size={16} />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ÉTAPE 3 */}
              {step === 3 && (
                <motion.div variants={fadeUp} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', marginBottom: 4 }}>Récapitulatif avant publication</p>
                  {imagePreview && <img src={imagePreview} alt="cover" style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 10 }} />}
                  {templateApplied && (
                    <div style={{ background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Grid size={13} style={{ color: '#4F46E5' }} />
                      <p style={{ fontSize: 12, color: '#4F46E5', fontWeight: 500 }}>Plan terrain "{terrainTemplate?.name}" inclus · {terrainTemplate?.zones?.length || 0} zones configurées</p>
                    </div>
                  )}
                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: '14px 16px' }}>
                    {[
                      { label: 'Titre', value: title },
                      { label: 'Type', value: eventType },
                      { label: 'Adresse', value: locationName },
                      { label: 'Ville', value: city ? `${city} ${postalCode}` : '—' },
                      { label: 'GPS', value: latitude ? `${latitude.toFixed(4)}, ${longitude?.toFixed(4)}` : '—' },
                      { label: 'Date début', value: startDate ? new Date(startDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—' },
                      { label: 'Emplacements', value: `${totalSpots} places${templateApplied ? ' (du plan terrain)' : ''}` },
                      { label: 'Prix', value: pricePerSpot ? `${pricePerSpot} €/emplacement` : 'Gratuit' },
                    ].map((item, i, arr) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, paddingBottom: i < arr.length - 1 ? 8 : 0, marginBottom: i < arr.length - 1 ? 8 : 0, borderBottom: i < arr.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                        <span style={{ color: '#64748B' }}>{item.label}</span>
                        <span style={{ fontWeight: 600, color: '#0F172A', maxWidth: 220, textAlign: 'right' }}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => setStep(2)}
                      style={{ flex: 1, background: 'white', border: '1px solid #E2E8F0', borderRadius: 10, padding: '11px 0', fontSize: 13, fontWeight: 500, color: '#64748B', cursor: 'pointer' }}>
                      Retour
                    </button>
                    <button onClick={handleSubmit} disabled={saving}
                      style={{ flex: 2, background: saving ? '#818CF8' : '#4F46E5', color: 'white', border: 'none', borderRadius: 10, padding: '12px 0', fontSize: 14, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      {saving ? <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Publication...</> : <><Save size={14} /> Publier l'événement</>}
                    </button>
                  </div>
                </motion.div>
              )}
            </div>

            {/* STICKY PREVIEW */}
            <motion.div variants={fadeUp} style={{ position: 'sticky', top: 72 }}>
              <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid #F1F5F9', background: '#0F172A' }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Aperçu de l'annonce</p>
                </div>
                <div>
                  {imagePreview
                    ? <img src={imagePreview} alt="cover" style={{ width: '100%', height: 120, objectFit: 'cover' }} />
                    : <div style={{ height: 120, background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ImageIcon size={28} style={{ color: 'rgba(255,255,255,0.3)' }} />
                      </div>
                  }
                  <div style={{ padding: '14px 16px' }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>{title || "Titre de l'événement"}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#64748B', marginBottom: 8 }}>
                      <MapPin size={10} style={{ color: '#4F46E5' }} />
                      {locationName || 'Localisation'}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>{pricePerSpot ? `Dès ${pricePerSpot}€` : 'Gratuit'}</span>
                      <span style={{ fontSize: 11, color: '#94A3B8' }}>{totalSpots || '—'} places</span>
                    </div>
                  </div>
                </div>
                <div style={{ padding: '14px 16px', borderTop: '1px solid #F1F5F9' }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Checklist</p>
                  {[
                    { label: 'Titre', ok: !!title },
                    { label: 'Type', ok: !!eventType },
                    { label: 'Adresse', ok: !!locationName },
                    { label: 'GPS', ok: !!(latitude && longitude) },
                    { label: 'Dates', ok: !!(startDate && endDate) },
                    { label: 'Emplacements', ok: !!totalSpots },
                    { label: 'Image', ok: !!imageFile },
                    { label: 'Plan terrain', ok: templateApplied },
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 6 }}>
                      <span style={{ color: '#64748B' }}>{item.label}</span>
                      <span style={{ color: item.ok ? '#16A34A' : '#94A3B8', fontWeight: 600 }}>{item.ok ? '✓' : '○'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

          </motion.div>
        </main>
      </div>
    </div>
  )
}
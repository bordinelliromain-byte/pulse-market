'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'

type Step = 1 | 2 | 3 | 4

type AdData = {
  photo: File | null
  photoPreview: string
  photoUrl: string
  nom: string
  offre: string
  detail: string
  adresse: string
  eventId: string
  eventTitle: string
}

type EventWithSlots = {
  id: string
  title: string
  start_date: string
  location_name: string
  slots_taken: number
  is_full: boolean
}

function StepBar({ current }: { current: Step }) {
  const steps = ['Photo', 'Texte', 'Marché', 'Paiement']
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 32 }}>
      {steps.map((label, i) => {
        const n = (i + 1) as Step
        const done = current > n
        const active = current === n
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < 3 ? 1 : 'none' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: done ? '#10B981' : active ? '#111827' : '#F3F4F6', transition: 'all 0.3s' }}>
                {done
                  ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  : <span style={{ fontSize: 12, fontWeight: 700, color: active ? 'white' : '#9CA3AF' }}>{n}</span>
                }
              </div>
              <span style={{ fontSize: 10, fontWeight: active ? 600 : 400, color: active ? '#111827' : '#9CA3AF', whiteSpace: 'nowrap' }}>{label}</span>
            </div>
            {i < 3 && <div style={{ flex: 1, height: 2, background: done ? '#10B981' : '#F3F4F6', margin: '0 4px 14px', transition: 'background 0.3s' }} />}
          </div>
        )
      })}
    </div>
  )
}

function Step1({ data, onChange, onNext }: { data: AdData; onChange: (d: Partial<AdData>) => void; onNext: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const handleFile = (file: File) => { const url = URL.createObjectURL(file); onChange({ photo: file, photoPreview: url }) }
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      <p style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: 22, fontWeight: 700, color: '#111827', marginBottom: 6 }}>Votre photo</p>
      <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 24, lineHeight: 1.6 }}>Elle s'affichera dans l'app Whatmarket à la place des icônes. Choisissez une belle photo de votre stand ou produits.</p>
      <div onClick={() => inputRef.current?.click()} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
        style={{ border: `2px dashed ${data.photoPreview ? '#10B981' : '#E5E7EB'}`, borderRadius: 20, overflow: 'hidden', cursor: 'pointer', background: data.photoPreview ? 'transparent' : '#FAFAFA', minHeight: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
        {data.photoPreview ? (
          <div style={{ position: 'relative', width: '100%' }}>
            <img src={data.photoPreview} alt="preview" style={{ width: '100%', height: 220, objectFit: 'cover', display: 'block' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.opacity = '1' }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.opacity = '0' }}>
              <span style={{ color: 'white', fontSize: 13, fontWeight: 600 }}>Changer la photo</span>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 24px' }}>
            <div style={{ width: 56, height: 56, background: '#F3F4F6', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            </div>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Déposer une photo</p>
            <p style={{ fontSize: 12, color: '#9CA3AF' }}>ou cliquez pour parcourir · JPG, PNG · max 5MB</p>
          </div>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
      <button onClick={onNext} disabled={!data.photoPreview}
        style={{ width: '100%', background: data.photoPreview ? '#111827' : '#F3F4F6', color: data.photoPreview ? 'white' : '#9CA3AF', border: 'none', borderRadius: 14, padding: '16px', fontSize: 15, fontWeight: 700, cursor: data.photoPreview ? 'pointer' : 'not-allowed', fontFamily: '"DM Sans", sans-serif', transition: 'all 0.2s' }}>
        Continuer →
      </button>
    </motion.div>
  )
}

function Step2({ data, onChange, onNext, onBack }: { data: AdData; onChange: (d: Partial<AdData>) => void; onNext: () => void; onBack: () => void }) {
  const valid = data.nom.trim() && data.offre.trim()
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      <p style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: 22, fontWeight: 700, color: '#111827', marginBottom: 6 }}>Votre message</p>
      <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 24, lineHeight: 1.6 }}>Ce texte apparaîtra sur votre pub dans Whatmarket.</p>
      <div style={{ borderRadius: 18, overflow: 'hidden', background: '#F3F4F6', marginBottom: 24, display: 'flex', alignItems: 'stretch', minHeight: 80 }}>
        <div style={{ width: 80, flexShrink: 0 }}>
          {data.photoPreview
            ? <img src={data.photoPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', minHeight: 80 }} />
            : <div style={{ width: '100%', height: '100%', background: '#E5E7EB', minHeight: 80 }} />
          }
        </div>
        <div style={{ flex: 1, padding: '12px 14px' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 3 }}>{data.nom || 'Votre commerce'}</p>
          <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 3 }}>{data.offre || 'Votre offre'}</p>
          <p style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 3 }}>{data.detail || 'Détail optionnel'}</p>
          {data.adresse && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#EEF2FF', borderRadius: 100, padding: '3px 8px' }}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              <span style={{ fontSize: 10, color: '#4F46E5', fontWeight: 500 }}>{data.adresse}</span>
            </div>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Nom de votre commerce *', key: 'nom', placeholder: 'Ex: Rôtisserie Santini', maxLength: 40 },
          { label: 'Votre offre *', key: 'offre', placeholder: 'Ex: Demi-poulet + frites pour 2 — 18€', maxLength: 60 },
          { label: 'Détail (optionnel)', key: 'detail', placeholder: 'Ex: Valable ce samedi uniquement', maxLength: 80 },
          { label: 'Adresse (optionnel)', key: 'adresse', placeholder: 'Ex: 12 Rue de la Paix, Aubagne', maxLength: 100 },
        ].map(field => (
          <div key={field.key}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{field.label}</label>
              <span style={{ fontSize: 10, color: '#9CA3AF' }}>{((data as any)[field.key] || '').length}/{field.maxLength}</span>
            </div>
            <input value={(data as any)[field.key]} onChange={e => onChange({ [field.key]: e.target.value.slice(0, field.maxLength) })} placeholder={field.placeholder}
              style={{ width: '100%', padding: '11px 14px', border: '1px solid #E5E7EB', borderRadius: 12, fontSize: 14, color: '#111827', outline: 'none', boxSizing: 'border-box', fontFamily: '"DM Sans", sans-serif', background: '#FAFAFA', transition: 'all 0.2s' }}
              onFocus={e => { e.target.style.borderColor = '#4F46E5'; e.target.style.background = 'white' }}
              onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.background = '#FAFAFA' }} />
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onBack} style={{ flex: 1, background: '#F9FAFB', color: '#374151', border: '1px solid #E5E7EB', borderRadius: 14, padding: '14px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: '"DM Sans", sans-serif' }}>← Retour</button>
        <button onClick={onNext} disabled={!valid} style={{ flex: 2, background: valid ? '#111827' : '#F3F4F6', color: valid ? 'white' : '#9CA3AF', border: 'none', borderRadius: 14, padding: '14px', fontSize: 14, fontWeight: 700, cursor: valid ? 'pointer' : 'not-allowed', fontFamily: '"DM Sans", sans-serif', transition: 'all 0.2s' }}>Continuer →</button>
      </div>
    </motion.div>
  )
}

function Step3({ data, onChange, onNext, onBack }: { data: AdData; onChange: (d: Partial<AdData>) => void; onNext: () => void; onBack: () => void }) {
  const [events, setEvents] = useState<EventWithSlots[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const load = async () => {
      try {
        const { createClient } = await import('@/lib/supabase')
        const supabase = createClient()
        const today = new Date().toISOString().split('T')[0]
        const { data: evs } = await supabase.from('events').select('id, title, start_date, location_name')
          .eq('status', 'published').gte('start_date', today).order('start_date', { ascending: true }).limit(10)
        if (!evs) { setLoading(false); return }
        const enriched = await Promise.all(evs.map(async ev => {
          const { count } = await supabase.from('boost_ads').select('*', { count: 'exact', head: true })
            .eq('event_id', ev.id).eq('status', 'active')
          return { ...ev, slots_taken: count || 0, is_full: (count || 0) >= 3 }
        }))
        setEvents(enriched)
      } catch (err) { console.error(err) }
      setLoading(false)
    }
    load()
  }, [])
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      <p style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: 22, fontWeight: 700, color: '#111827', marginBottom: 6 }}>Choisir le marché</p>
      <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 24, lineHeight: 1.6 }}>Votre pub sera visible par tous les visiteurs de ce marché dans Whatmarket.</p>
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 2, 3].map(i => <div key={i} style={{ height: 72, borderRadius: 14, background: '#F3F4F6' }} />)}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {events.map(ev => {
            const isSelected = data.eventId === ev.id
            const isFull = ev.is_full
            return (
              <div key={ev.id} onClick={() => !isFull && onChange({ eventId: ev.id, eventTitle: ev.title })}
                style={{ borderRadius: 14, padding: '14px 16px', border: `1.5px solid ${isSelected ? '#4F46E5' : isFull ? '#F3F4F6' : '#E5E7EB'}`, background: isSelected ? '#EEF2FF' : isFull ? '#F9FAFB' : 'white', cursor: isFull ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 12, opacity: isFull ? 0.6 : 1, transition: 'all 0.2s' }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: isSelected ? '#4F46E5' : '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={isSelected ? 'white' : '#9CA3AF'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: isSelected ? '#4F46E5' : isFull ? '#9CA3AF' : '#111827' }}>{ev.title}</p>
                    {isFull && <span style={{ fontSize: 10, fontWeight: 700, color: '#EF4444', background: '#FEF2F2', padding: '1px 7px', borderRadius: 100 }}>COMPLET</span>}
                  </div>
                  <p style={{ fontSize: 12, color: '#9CA3AF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {new Date(ev.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} · {ev.location_name}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 5 }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} style={{ width: 16, height: 4, borderRadius: 2, background: i < ev.slots_taken ? '#EF4444' : '#E5E7EB' }} />
                    ))}
                    <span style={{ fontSize: 10, color: '#9CA3AF', marginLeft: 2 }}>
                      {isFull ? 'Aucune place' : `${3 - ev.slots_taken} place${3 - ev.slots_taken > 1 ? 's' : ''} restante${3 - ev.slots_taken > 1 ? 's' : ''}`}
                    </span>
                  </div>
                </div>
                {isSelected && !isFull && (
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                )}
              </div>
            )
          })}
          {events.length === 0 && <div style={{ textAlign: 'center', padding: '32px 0', color: '#9CA3AF', fontSize: 13 }}>Aucun marché disponible</div>}
        </div>
      )}
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onBack} style={{ flex: 1, background: '#F9FAFB', color: '#374151', border: '1px solid #E5E7EB', borderRadius: 14, padding: '14px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: '"DM Sans", sans-serif' }}>← Retour</button>
        <button onClick={onNext} disabled={!data.eventId} style={{ flex: 2, background: data.eventId ? '#111827' : '#F3F4F6', color: data.eventId ? 'white' : '#9CA3AF', border: 'none', borderRadius: 14, padding: '14px', fontSize: 14, fontWeight: 700, cursor: data.eventId ? 'pointer' : 'not-allowed', fontFamily: '"DM Sans", sans-serif', transition: 'all 0.2s' }}>Continuer →</button>
      </div>
    </motion.div>
  )
}

function Step4({ data, onBack }: { data: AdData; onBack: () => void }) {
  const [paying, setPaying] = useState(false)
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)

  const uploadPhoto = async (): Promise<string> => {
    if (!data.photo) return ''
    setUploading(true)
    try {
      const { createClient } = await import('@/lib/supabase')
      const supabase = createClient()
      const ext = data.photo.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: uploadError } = await supabase.storage.from('boost-photos').upload(fileName, data.photo, { contentType: data.photo.type, upsert: false })
      if (uploadError) throw uploadError
      const { data: urlData } = supabase.storage.from('boost-photos').getPublicUrl(fileName)
      return urlData.publicUrl
    } catch (err) { console.error('Upload error:', err); return '' }
    finally { setUploading(false) }
  }

  const handlePay = async () => {
    if (!email) return
    setPaying(true)
    setError('')
    try {
      const photoUrl = await uploadPhoto()
      const res = await fetch('/api/create-boost-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom: data.nom, offre: data.offre, detail: data.detail, adresse: data.adresse, photoUrl, eventId: data.eventId, eventTitle: data.eventTitle, email })
      })
      const { url, error: stripeError } = await res.json()
      if (stripeError) throw new Error(stripeError)
      window.location.href = url
    } catch (err: any) { setError(err.message || 'Erreur lors du paiement'); setPaying(false) }
  }

  // ✅ Icônes SVG au lieu des emojis
  const guarantees = [
    { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0EA5E9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>, text: 'Paiement sécurisé Stripe' },
    { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0EA5E9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>, text: 'Publication immédiate' },
    { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0EA5E9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>, text: 'Confirmation par email' },
  ]

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      <p style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: 22, fontWeight: 700, color: '#111827', marginBottom: 6 }}>Finaliser la publication</p>
      <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 24, lineHeight: 1.6 }}>Votre pub sera visible dans Whatmarket dès validation du paiement.</p>
      <div style={{ borderRadius: 18, overflow: 'hidden', background: '#F3F4F6', display: 'flex', alignItems: 'stretch', marginBottom: 20, minHeight: 80 }}>
        <div style={{ width: 90, flexShrink: 0 }}>
          {data.photoPreview
            ? <img src={data.photoPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', minHeight: 80 }} />
            : <div style={{ width: '100%', height: '100%', minHeight: 80, background: '#E5E7EB' }} />
          }
        </div>
        <div style={{ flex: 1, padding: '14px 16px' }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 4 }}>{data.nom}</p>
          <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>{data.offre}</p>
          {data.adresse && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#EEF2FF', borderRadius: 100, padding: '3px 8px' }}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              <span style={{ fontSize: 10, color: '#4F46E5', fontWeight: 500 }}>{data.adresse}</span>
            </div>
          )}
        </div>
      </div>
      <div style={{ background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 14, padding: '14px 18px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#4338CA' }}>Publication sponsorisée</p>
          <p style={{ fontSize: 11, color: '#818CF8' }}>Visible pendant toute la durée du marché</p>
        </div>
        <p style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: 24, fontWeight: 700, color: '#4338CA' }}>20€</p>
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 7 }}>Email de confirmation</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="votre@email.fr"
          style={{ width: '100%', padding: '11px 14px', border: '1px solid #E5E7EB', borderRadius: 12, fontSize: 14, color: '#111827', outline: 'none', boxSizing: 'border-box', fontFamily: '"DM Sans", sans-serif', background: '#FAFAFA', transition: 'all 0.2s' }}
          onFocus={e => { e.target.style.borderColor = '#4F46E5'; e.target.style.background = 'white' }}
          onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.background = '#FAFAFA' }} />
      </div>
      {error && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#DC2626' }}>{error}</div>}
      {/* ✅ Garanties avec icônes SVG */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        {guarantees.map((t, i) => (
          <div key={i} style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>{t.icon}</div>
            <span style={{ fontSize: 10, color: '#9CA3AF', lineHeight: 1.4 }}>{t.text}</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onBack} style={{ flex: 1, background: '#F9FAFB', color: '#374151', border: '1px solid #E5E7EB', borderRadius: 14, padding: '14px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: '"DM Sans", sans-serif' }}>← Retour</button>
        <button onClick={handlePay} disabled={!email || paying || uploading}
          style={{ flex: 2, background: !email ? '#F3F4F6' : 'linear-gradient(135deg, #4F46E5, #7C3AED)', color: !email ? '#9CA3AF' : 'white', border: 'none', borderRadius: 14, padding: '14px', fontSize: 14, fontWeight: 700, cursor: !email ? 'not-allowed' : 'pointer', fontFamily: '"DM Sans", sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s' }}>
          {uploading
            ? <><div style={{ width: 15, height: 15, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Upload...</>
            : paying
            ? <><div style={{ width: 15, height: 15, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Redirection...</>
            : <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> Payer 20€ et Publier</>
          }
        </button>
      </div>
    </motion.div>
  )
}

export default function BoostMyBusiness() {
  const [step, setStep] = useState<Step>(1)
  const [adData, setAdData] = useState<AdData>({ photo: null, photoPreview: '', photoUrl: '', nom: '', offre: '', detail: '', adresse: '', eventId: '', eventTitle: '' })
  const update = (d: Partial<AdData>) => setAdData(prev => ({ ...prev, ...d }))
  const router = useRouter()

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', system-ui, sans-serif; background: #F9F8F6; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
      <div style={{ minHeight: '100vh', background: '#F9F8F6', fontFamily: '"DM Sans", system-ui, sans-serif' }}>

        {/* ✅ Header avec bouton retour explicite */}
        <div style={{ background: 'white', borderBottom: '0.5px solid #E5E7EB', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 10 }}>
          {/* ✅ Bouton retour */}
          <button onClick={() => router.push('/whatmarket')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F3F4F6', border: 'none', borderRadius: 10, padding: '7px 12px', cursor: 'pointer', color: '#374151', fontSize: 13, fontWeight: 600, fontFamily: '"DM Sans", sans-serif' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            Accueil
          </button>

          <div style={{ width: 1, height: 16, background: '#E5E7EB' }} />

          <a href="/whatmarket" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ width: 28, height: 28, background: '#0EA5E9', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 40 40" fill="none">
                <path d="M4 8L9 22L16 12L23 22L28 8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 15, fontWeight: 700, color: '#111827' }}>
              What<span style={{ color: '#0EA5E9', fontWeight: 400 }}>market</span>
            </span>
          </a>

          <span style={{ fontSize: 13, color: '#6B7280' }}>Boost My Business</span>

          {/* ✅ Badge Pro sans emoji */}
          <div style={{ marginLeft: 'auto', background: '#EFF6FF', color: '#1D4ED8', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 100, display: 'flex', alignItems: 'center', gap: 5 }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="#1D4ED8"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            Pro
          </div>
        </div>

        <div style={{ maxWidth: 480, margin: '0 auto', padding: '32px 20px 60px' }}>
          {step === 1 && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 32, textAlign: 'center' }}>
              <p style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: 28, fontWeight: 900, color: '#111827', lineHeight: 1.2, marginBottom: 8 }}>Soyez en tête d'affiche</p>
              <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.7 }}>Touchez des milliers de visiteurs du marché. Votre pub, leur téléphone, en temps réel.</p>
            </motion.div>
          )}
          <StepBar current={step} />
          <div style={{ background: 'white', borderRadius: 24, padding: '24px', boxShadow: '0 2px 20px rgba(0,0,0,0.06)' }}>
            <AnimatePresence mode="wait">
              {step === 1 && <Step1 key="1" data={adData} onChange={update} onNext={() => setStep(2)} />}
              {step === 2 && <Step2 key="2" data={adData} onChange={update} onNext={() => setStep(3)} onBack={() => setStep(1)} />}
              {step === 3 && <Step3 key="3" data={adData} onChange={update} onNext={() => setStep(4)} onBack={() => setStep(2)} />}
              {step === 4 && <Step4 key="4" data={adData} onBack={() => setStep(3)} />}
            </AnimatePresence>
          </div>
          {step === 1 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} style={{ marginTop: 24, display: 'flex', gap: 16, justifyContent: 'center' }}>
              {[{ value: '2 400', label: 'visiteurs/marché' }, { value: '68%', label: 'taux de clic' }, { value: '20€', label: 'seulement' }].map((s, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <p style={{ fontFamily: '"Playfair Display", serif', fontSize: 18, fontWeight: 700, color: '#111827' }}>{s.value}</p>
                  <p style={{ fontSize: 11, color: '#9CA3AF' }}>{s.label}</p>
                </div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </>
  )
}
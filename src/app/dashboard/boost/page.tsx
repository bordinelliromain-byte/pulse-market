'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase'

type Step = 1 | 2 | 3

type BoostData = {
  nom: string
  offre: string
  stand: string
  eventId: string
  eventTitle: string
}

function StepBar({ current }: { current: Step }) {
  const steps = ['Votre offre', 'Marché', 'Paiement']
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 28 }}>
      {steps.map((label, i) => {
        const n = (i + 1) as Step
        const done = current > n
        const active = current === n
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < 2 ? 1 : 'none' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: done ? '#10B981' : active ? '#111827' : '#F3F4F6', transition: 'all 0.3s' }}>
                {done
                  ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  : <span style={{ fontSize: 11, fontWeight: 700, color: active ? 'white' : '#9CA3AF' }}>{n}</span>
                }
              </div>
              <span style={{ fontSize: 10, fontWeight: active ? 600 : 400, color: active ? '#111827' : '#9CA3AF', whiteSpace: 'nowrap' }}>{label}</span>
            </div>
            {i < 2 && <div style={{ flex: 1, height: 2, background: done ? '#10B981' : '#F3F4F6', margin: '0 4px 14px', transition: 'background 0.3s' }} />}
          </div>
        )
      })}
    </div>
  )
}

function Step1({ data, onChange, onNext }: { data: BoostData; onChange: (d: Partial<BoostData>) => void; onNext: () => void }) {
  const valid = data.nom.trim() && data.offre.trim()
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      <p style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 6 }}>Votre offre du jour</p>
      <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 20, lineHeight: 1.6 }}>Ce message s'affichera dans la section "À ne pas manquer" du marché.</p>

      {/* Preview */}
      <div style={{ borderRadius: 16, overflow: 'hidden', background: 'linear-gradient(135deg,#1A1A2E 0%,#16213E 100%)', marginBottom: 20, display: 'flex', alignItems: 'stretch', minHeight: 72 }}>
        <div style={{ flex: 1, padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span style={{ fontSize: 16 }}>⭐</span>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>{data.nom || 'Votre commerce'}</p>
          </div>
          <p style={{ fontSize: 11, color: '#C7C5C0', marginBottom: 6 }}>{data.offre || 'Votre offre spéciale du jour'}</p>
          {data.stand && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 100, padding: '3px 8px' }}>
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)' }}>{data.stand}</span>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Nom de votre stand *', key: 'nom', placeholder: 'Ex: Fromagerie Martin', max: 40 },
          { label: 'Votre offre spéciale *', key: 'offre', placeholder: 'Ex: Plateau dégustation 3 fromages — 12€', max: 80 },
          { label: 'Numéro de stand', key: 'stand', placeholder: 'Ex: Stand B7 (optionnel)', max: 30 },
        ].map(f => (
          <div key={f.key}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <label style={{ fontSize: 10, fontWeight: 600, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{f.label}</label>
              <span style={{ fontSize: 10, color: '#9CA3AF' }}>{((data as any)[f.key] || '').length}/{f.max}</span>
            </div>
            <input value={(data as any)[f.key]} onChange={e => onChange({ [f.key]: e.target.value.slice(0, f.max) })} placeholder={f.placeholder}
              style={{ width: '100%', padding: '10px 13px', border: '1px solid #E5E7EB', borderRadius: 10, fontSize: 13, color: '#111827', outline: 'none', boxSizing: 'border-box', fontFamily: '"DM Sans", sans-serif', background: '#FAFAFA' }}
              onFocus={e => { e.target.style.borderColor = '#4F46E5'; e.target.style.background = 'white' }}
              onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.background = '#FAFAFA' }} />
          </div>
        ))}
      </div>

      <button onClick={onNext} disabled={!valid}
        style={{ width: '100%', background: valid ? '#111827' : '#F3F4F6', color: valid ? 'white' : '#9CA3AF', border: 'none', borderRadius: 12, padding: '14px', fontSize: 14, fontWeight: 700, cursor: valid ? 'pointer' : 'not-allowed', fontFamily: '"DM Sans", sans-serif' }}>
        Continuer →
      </button>
    </motion.div>
  )
}

function Step2({ data, onChange, onNext, onBack }: { data: BoostData; onChange: (d: Partial<BoostData>) => void; onNext: () => void; onBack: () => void }) {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const supabase = createClient()
        const today = new Date().toISOString().split('T')[0]
        const { data: evs } = await supabase.from('events').select('id, title, start_date, location_name')
          .eq('status', 'published').gte('start_date', today).order('start_date', { ascending: true }).limit(10)

        // Vérifie quels marchés ont déjà un slot pris
        const enriched = await Promise.all((evs || []).map(async ev => {
          const { count } = await supabase.from('exposant_boosts').select('*', { count: 'exact', head: true })
            .eq('event_id', ev.id).eq('status', 'active')
          return { ...ev, is_full: (count || 0) >= 1 }
        }))
        setEvents(enriched)
      } catch (err) { console.error(err) }
      setLoading(false)
    }
    load()
  }, [])

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      <p style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 6 }}>Choisir le marché</p>
      <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 20, lineHeight: 1.6 }}>1 seul exposant peut être "À ne pas manquer" par marché.</p>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1, 2, 3].map(i => <div key={i} style={{ height: 64, borderRadius: 12, background: '#F3F4F6' }} />)}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {events.map(ev => {
            const isSelected = data.eventId === ev.id
            return (
              <div key={ev.id} onClick={() => !ev.is_full && onChange({ eventId: ev.id, eventTitle: ev.title })}
                style={{ borderRadius: 12, padding: '12px 14px', border: `1.5px solid ${isSelected ? '#4F46E5' : ev.is_full ? '#F3F4F6' : '#E5E7EB'}`, background: isSelected ? '#EEF2FF' : ev.is_full ? '#F9FAFB' : 'white', cursor: ev.is_full ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 10, opacity: ev.is_full ? 0.6 : 1, transition: 'all 0.2s' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: isSelected ? '#4F46E5' : '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={isSelected ? 'white' : '#9CA3AF'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: isSelected ? '#4F46E5' : ev.is_full ? '#9CA3AF' : '#111827' }}>{ev.title}</p>
                    {ev.is_full && <span style={{ fontSize: 9, fontWeight: 700, color: '#EF4444', background: '#FEF2F2', padding: '1px 6px', borderRadius: 100 }}>COMPLET</span>}
                    {!ev.is_full && <span style={{ fontSize: 9, fontWeight: 700, color: '#10B981', background: '#ECFDF5', padding: '1px 6px', borderRadius: 100 }}>1 place dispo</span>}
                  </div>
                  <p style={{ fontSize: 11, color: '#9CA3AF' }}>{new Date(ev.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} · {ev.location_name}</p>
                </div>
                {isSelected && <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>}
              </div>
            )
          })}
          {events.length === 0 && <div style={{ textAlign: 'center', padding: '24px 0', color: '#9CA3AF', fontSize: 13 }}>Aucun marché disponible</div>}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onBack} style={{ flex: 1, background: '#F9FAFB', color: '#374151', border: '1px solid #E5E7EB', borderRadius: 12, padding: '12px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: '"DM Sans", sans-serif' }}>← Retour</button>
        <button onClick={onNext} disabled={!data.eventId} style={{ flex: 2, background: data.eventId ? '#111827' : '#F3F4F6', color: data.eventId ? 'white' : '#9CA3AF', border: 'none', borderRadius: 12, padding: '12px', fontSize: 13, fontWeight: 700, cursor: data.eventId ? 'pointer' : 'not-allowed', fontFamily: '"DM Sans", sans-serif' }}>Continuer →</button>
      </div>
    </motion.div>
  )
}

function Step3({ data, onBack, profile }: { data: BoostData; onBack: () => void; profile: any }) {
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')

  const handlePay = async () => {
    setPaying(true)
    setError('')
    try {
      const res = await fetch('/api/create-exposant-boost-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom: data.nom,
          offre: data.offre,
          stand: data.stand,
          eventId: data.eventId,
          eventTitle: data.eventTitle,
          email: profile?.email || '',
          exposantId: profile?.id || '',
        })
      })
      const { url, error: err } = await res.json()
      if (err) throw new Error(err)
      window.location.href = url
    } catch (err: any) {
      setError(err.message || 'Erreur lors du paiement')
      setPaying(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      <p style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 6 }}>Confirmer et payer</p>
      <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 20, lineHeight: 1.6 }}>Votre stand sera mis en avant dès validation du paiement.</p>

      {/* Récap */}
      <div style={{ borderRadius: 14, background: '#111827', padding: '14px 16px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 16 }}>⭐</span>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>{data.nom}</p>
        </div>
        <p style={{ fontSize: 11, color: '#D1D5DB', marginBottom: 4 }}>{data.offre}</p>
        <p style={{ fontSize: 11, color: '#6B7280' }}>{data.eventTitle}</p>
      </div>

      {/* Prix */}
      <div style={{ background: '#ECFDF5', border: '1px solid #BBF7D0', borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, color: '#065F46' }}>Slot "À ne pas manquer"</p>
          <p style={{ fontSize: 11, color: '#10B981' }}>Position vedette · 1 seul exposant par marché</p>
        </div>
        <p style={{ fontFamily: '"Playfair Display", serif', fontSize: 22, fontWeight: 700, color: '#065F46' }}>15€</p>
      </div>

      <div style={{ background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 10, padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
        <p style={{ fontSize: 11, color: '#4338CA' }}>Facture envoyée à <strong>{profile?.email}</strong></p>
      </div>

      {error && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 12, color: '#DC2626' }}>{error}</div>}

      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onBack} style={{ flex: 1, background: '#F9FAFB', color: '#374151', border: '1px solid #E5E7EB', borderRadius: 12, padding: '12px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: '"DM Sans", sans-serif' }}>← Retour</button>
        <button onClick={handlePay} disabled={paying}
          style={{ flex: 2, background: 'linear-gradient(135deg, #10B981, #059669)', color: 'white', border: 'none', borderRadius: 12, padding: '12px', fontSize: 13, fontWeight: 700, cursor: paying ? 'not-allowed' : 'pointer', fontFamily: '"DM Sans", sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          {paying
            ? <><div style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Redirection...</>
            : '🔒 Payer 15€ et Publier'
          }
        </button>
      </div>
    </motion.div>
  )
}

export default function ExposantBoostPage() {
  const [step, setStep] = useState<Step>(1)
  const [profile, setProfile] = useState<any>(null)
  const [data, setData] = useState<BoostData>({ nom: '', offre: '', stand: '', eventId: '', eventTitle: '' })
  const router = useRouter()
  const update = (d: Partial<BoostData>) => setData(prev => ({ ...prev, ...d }))

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(prof)
      if (prof?.full_name) setData(prev => ({ ...prev, nom: prof.full_name }))
    }
    load()
  }, [])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:opsz,wght@9..40,400;9..40,600;9..40,700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', system-ui, sans-serif; background: #F9F8F6; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#F9F8F6', fontFamily: '"DM Sans", system-ui, sans-serif' }}>
        <div style={{ background: 'white', borderBottom: '0.5px solid #E5E7EB', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10, position: 'sticky', top: 0, zIndex: 10 }}>
          <button onClick={() => router.push('/dashboard')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: '#6B7280', fontSize: 13 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            Dashboard
          </button>
          <div style={{ width: 1, height: 14, background: '#E5E7EB' }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>⭐ Booster ma visibilité</span>
          <div style={{ marginLeft: 'auto', background: '#ECFDF5', color: '#065F46', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 100 }}>15€ seulement</div>
        </div>

        <div style={{ maxWidth: 480, margin: '0 auto', padding: '28px 20px 60px' }}>
          {step === 1 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24, textAlign: 'center' }}>
              <p style={{ fontFamily: '"Playfair Display", serif', fontSize: 24, fontWeight: 900, color: '#111827', lineHeight: 1.2, marginBottom: 6 }}>Soyez à ne pas manquer</p>
              <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.7 }}>1 seul exposant par marché. Soyez le premier à réserver votre slot.</p>
            </motion.div>
          )}

          <StepBar current={step} />

          <div style={{ background: 'white', borderRadius: 20, padding: '20px', boxShadow: '0 2px 20px rgba(0,0,0,0.06)' }}>
            <AnimatePresence mode="wait">
              {step === 1 && <Step1 key="1" data={data} onChange={update} onNext={() => setStep(2)} />}
              {step === 2 && <Step2 key="2" data={data} onChange={update} onNext={() => setStep(3)} onBack={() => setStep(1)} />}
              {step === 3 && <Step3 key="3" data={data} onBack={() => setStep(2)} profile={profile} />}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </>
  )
}
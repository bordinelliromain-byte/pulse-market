'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import {
  ArrowLeft, ChevronLeft, CheckCircle, Star,
  MapPin, Calendar, Loader, Lock, Mail,
  TrendingUp, Sparkles, Clock, AlertCircle, X
} from 'lucide-react'

const BRAND = '#4F46E5'

type Step = 1 | 2 | 3

type BoostData = {
  nom: string
  offre: string
  stand: string
  eventId: string
  eventTitle: string
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

function StepBar({ current, isMobile }: { current: Step; isMobile: boolean }) {
  const steps = ['Votre offre', 'Marché', 'Paiement']
  return (
    <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: '14px 18px', marginBottom: 16, display: 'flex', alignItems: 'center' }}>
      {steps.map((label, i) => {
        const n = (i + 1) as Step
        const done = current > n
        const active = current === n
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < 2 ? 1 : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: done || active ? BRAND : '#F1F5F9', color: done || active ? 'white' : '#94A3B8', fontSize: 11, fontWeight: 700, boxShadow: active ? '0 0 0 3px rgba(79,70,229,0.15)' : 'none' }}>
                {done ? <CheckCircle size={13} /> : n}
              </div>
              {!isMobile && <span style={{ fontSize: 12, fontWeight: active ? 600 : 400, color: active ? '#0F172A' : '#94A3B8', whiteSpace: 'nowrap' }}>{label}</span>}
            </div>
            {i < 2 && <div style={{ flex: 1, height: 1, background: done ? BRAND : '#E2E8F0', margin: '0 8px', transition: 'background 0.3s' }} />}
          </div>
        )
      })}
    </div>
  )
}

function Step1({ data, onChange, onNext, isMobile }: { data: BoostData; onChange: (d: Partial<BoostData>) => void; onNext: () => void; isMobile: boolean }) {
  const valid = data.nom.trim() && data.offre.trim()
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #F1F5F9' }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>Votre offre du jour</p>
          <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>Ce message s'affichera dans la section "À ne pas manquer" du marché.</p>
        </div>
        <div style={{ padding: '18px' }}>

          {/* ✅ Preview live */}
          <div style={{ borderRadius: 12, overflow: 'hidden', background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', marginBottom: 18, padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <Star size={16} style={{ color: '#FBBF24', fill: '#FBBF24' }} />
              <p style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>{data.nom || 'Votre commerce'}</p>
            </div>
            <p style={{ fontSize: 11, color: '#CBD5E1', marginBottom: 8 }}>{data.offre || 'Votre offre spéciale du jour'}</p>
            {data.stand && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 100, padding: '3px 8px' }}>
                <MapPin size={9} style={{ color: 'rgba(255,255,255,0.6)' }} />
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)' }}>{data.stand}</span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 18 }}>
            {[
              { label: 'Nom de votre stand', required: true, key: 'nom', placeholder: 'Ex: Fromagerie Martin', max: 40 },
              { label: 'Votre offre spéciale', required: true, key: 'offre', placeholder: 'Ex: Plateau dégustation 3 fromages — 12€', max: 80 },
              { label: 'Numéro de stand (optionnel)', required: false, key: 'stand', placeholder: 'Ex: Stand B7', max: 30 },
            ].map(f => (
              <div key={f.key}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {f.label}{f.required && <span style={{ color: '#DC2626' }}> *</span>}
                  </label>
                  <span style={{ fontSize: 10, color: '#94A3B8' }}>{((data as any)[f.key] || '').length}/{f.max}</span>
                </div>
                <input value={(data as any)[f.key]} onChange={e => onChange({ [f.key]: e.target.value.slice(0, f.max) })} placeholder={f.placeholder}
                  style={{ width: '100%', padding: '10px 13px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, color: '#0F172A', outline: 'none', boxSizing: 'border-box', background: '#FAFAFA' }}
                  onFocus={e => { e.target.style.borderColor = BRAND; e.target.style.background = 'white' }}
                  onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.background = '#FAFAFA' }} />
              </div>
            ))}
          </div>

          <button onClick={onNext} disabled={!valid}
            style={{ width: '100%', background: valid ? BRAND : '#F1F5F9', color: valid ? 'white' : '#94A3B8', border: 'none', borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 600, cursor: valid ? 'pointer' : 'not-allowed' }}>
            Continuer →
          </button>
        </div>
      </div>
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
      <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #F1F5F9' }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>Choisir le marché</p>
          <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>1 seul exposant peut être "À ne pas manquer" par marché.</p>
        </div>
        <div style={{ padding: '18px' }}>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[1, 2, 3].map(i => <div key={i} style={{ height: 64, borderRadius: 12, background: 'linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />)}
            </div>
          ) : events.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <Calendar size={32} style={{ color: '#CBD5E1', margin: '0 auto 10px' }} />
              <p style={{ fontSize: 13, color: '#94A3B8' }}>Aucun marché disponible</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
              {events.map(ev => {
                const isSelected = data.eventId === ev.id
                return (
                  <div key={ev.id} onClick={() => !ev.is_full && onChange({ eventId: ev.id, eventTitle: ev.title })}
                    style={{ borderRadius: 10, padding: '12px 14px', border: `1.5px solid ${isSelected ? BRAND : ev.is_full ? '#F1F5F9' : '#E2E8F0'}`, background: isSelected ? '#EEF2FF' : ev.is_full ? '#F8FAFC' : 'white', cursor: ev.is_full ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 10, opacity: ev.is_full ? 0.6 : 1, transition: 'all 0.2s' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: isSelected ? BRAND : '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Calendar size={16} style={{ color: isSelected ? 'white' : '#94A3B8' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2, flexWrap: 'wrap' }}>
                        <p style={{ fontSize: 12, fontWeight: 700, color: isSelected ? BRAND : ev.is_full ? '#94A3B8' : '#0F172A' }}>{ev.title}</p>
                        {ev.is_full
                          ? <span style={{ fontSize: 9, fontWeight: 700, color: '#DC2626', background: '#FEF2F2', padding: '1px 6px', borderRadius: 100 }}>COMPLET</span>
                          : <span style={{ fontSize: 9, fontWeight: 700, color: '#16A34A', background: '#F0FDF4', padding: '1px 6px', borderRadius: 100, display: 'inline-flex', alignItems: 'center', gap: 3 }}><Sparkles size={8} /> 1 place dispo</span>
                        }
                      </div>
                      <p style={{ fontSize: 11, color: '#94A3B8' }}>{new Date(ev.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} · {ev.location_name}</p>
                    </div>
                    {isSelected && <div style={{ width: 20, height: 20, borderRadius: '50%', background: BRAND, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <CheckCircle size={12} style={{ color: 'white' }} />
                    </div>}
                  </div>
                )
              })}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onBack} style={{ flex: 1, background: 'white', color: '#64748B', border: '1px solid #E2E8F0', borderRadius: 10, padding: '11px 0', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>← Retour</button>
            <button onClick={onNext} disabled={!data.eventId} style={{ flex: 2, background: data.eventId ? BRAND : '#F1F5F9', color: data.eventId ? 'white' : '#94A3B8', border: 'none', borderRadius: 10, padding: '12px 0', fontSize: 14, fontWeight: 600, cursor: data.eventId ? 'pointer' : 'not-allowed' }}>Continuer →</button>
          </div>
        </div>
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
      <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #F1F5F9' }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>Confirmer et payer</p>
          <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>Votre stand sera mis en avant dès validation du paiement.</p>
        </div>
        <div style={{ padding: '18px' }}>

          {/* Récap */}
          <div style={{ borderRadius: 12, background: 'linear-gradient(135deg, #0F172A, #1E293B)', padding: '14px 16px', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Star size={16} style={{ color: '#FBBF24', fill: '#FBBF24' }} />
              <p style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>{data.nom}</p>
            </div>
            <p style={{ fontSize: 11, color: '#CBD5E1', marginBottom: 4 }}>{data.offre}</p>
            <p style={{ fontSize: 11, color: '#64748B' }}>{data.eventTitle}</p>
          </div>

          {/* Prix */}
          <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: '12px 16px', marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#15803D', display: 'flex', alignItems: 'center', gap: 5 }}>
                <Star size={11} style={{ color: '#FBBF24', fill: '#FBBF24' }} /> Slot "À ne pas manquer"
              </p>
              <p style={{ fontSize: 11, color: '#16A34A', marginTop: 2 }}>Position vedette · 1 seul exposant par marché</p>
            </div>
            <p style={{ fontSize: 22, fontWeight: 800, color: '#15803D' }}>15€</p>
          </div>

          <div style={{ background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 10, padding: '10px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Mail size={13} style={{ color: BRAND, flexShrink: 0 }} />
            <p style={{ fontSize: 11, color: '#4338CA' }}>Facture envoyée à <strong>{profile?.email}</strong></p>
          </div>

          {error && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 12, color: '#DC2626', display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={13} style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onBack} style={{ flex: 1, background: 'white', color: '#64748B', border: '1px solid #E2E8F0', borderRadius: 10, padding: '11px 0', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>← Retour</button>
            <button onClick={handlePay} disabled={paying}
              style={{ flex: 2, background: paying ? '#818CF8' : BRAND, color: 'white', border: 'none', borderRadius: 10, padding: '12px 0', fontSize: 14, fontWeight: 600, cursor: paying ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
              {paying
                ? <><Loader size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> Redirection...</>
                : <><Lock size={14} /> Payer 15€ et Publier</>
              }
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ✅ Section "Mes boosts en cours"
function MyBoosts({ exposantId }: { exposantId: string }) {
  const [boosts, setBoosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      if (!exposantId) return
      const supabase = createClient()
      const { data: bs } = await supabase.from('exposant_boosts')
        .select('*, events:event_id(title, start_date, location_name)')
        .eq('exposant_id', exposantId)
        .order('created_at', { ascending: false })
        .limit(10)
      setBoosts(bs || [])
      setLoading(false)
    }
    load()
  }, [exposantId])

  if (loading) return null
  if (boosts.length === 0) return null

  const now = new Date()
  const active = boosts.filter(b => b.events?.start_date && new Date(b.events.start_date) >= now)
  const past = boosts.filter(b => b.events?.start_date && new Date(b.events.start_date) < now)

  return (
    <div style={{ marginTop: 24 }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 7 }}>
        <TrendingUp size={14} style={{ color: BRAND }} /> Mes boosts ({boosts.length})
      </p>

      {active.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#16A34A', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>En cours ({active.length})</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {active.map(b => (
              <div key={b.id} style={{ background: 'white', border: '1px solid #BBF7D0', borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Star size={15} style={{ color: '#FBBF24', fill: '#FBBF24' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.nom}</p>
                  <p style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>{b.events?.title} · {new Date(b.events?.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</p>
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#16A34A', background: '#F0FDF4', padding: '3px 8px', borderRadius: 100, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                  <CheckCircle size={9} /> Actif
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Historique ({past.length})</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {past.map(b => (
              <div key={b.id} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, opacity: 0.7 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Clock size={14} style={{ color: '#94A3B8' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.nom}</p>
                  <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{b.events?.title} · {new Date(b.events?.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</p>
                </div>
                <span style={{ fontSize: 10, fontWeight: 600, color: '#94A3B8', background: '#F8FAFC', padding: '3px 8px', borderRadius: 100 }}>Terminé</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function ExposantBoostPage() {
  const [step, setStep] = useState<Step>(1)
  const [profile, setProfile] = useState<any>(null)
  const [data, setData] = useState<BoostData>({ nom: '', offre: '', stand: '', eventId: '', eventTitle: '' })
  const router = useRouter()
  const isMobile = useIsMobile()
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
    <div style={{ display: 'flex', minHeight: '100vh', background: '#EEF2F7', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <Sidebar profile={profile} />
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
      `}</style>

      <div style={{ marginLeft: isMobile ? 0 : 220, flex: 1, minWidth: 0 }}>

        <header style={{ background: 'white', borderBottom: '1px solid #E2E8F0', padding: isMobile ? '0 14px 0 60px' : '0 28px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <button onClick={() => router.push('/dashboard')}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', fontSize: 13, flexShrink: 0 }}>
              <ArrowLeft size={14} /> {!isMobile && 'Retour'}
            </button>
            <div style={{ width: 1, height: 16, background: '#E2E8F0', flexShrink: 0 }} />
            <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Star size={13} style={{ color: '#FBBF24', fill: '#FBBF24' }} /> Booster ma visibilité
            </p>
          </div>
          <span style={{ background: '#F0FDF4', color: '#15803D', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 100, border: '1px solid #BBF7D0', flexShrink: 0 }}>15€ seulement</span>
        </header>

        <main style={{ maxWidth: 540, margin: '0 auto', padding: isMobile ? '14px' : '28px 24px' }}>

          {/* Hero */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            style={{ marginBottom: 20, textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, background: '#FFFBEB', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', border: '1px solid #FDE68A' }}>
              <Star size={22} style={{ color: '#FBBF24', fill: '#FBBF24' }} />
            </div>
            <h1 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, color: '#0F172A', marginBottom: 6, letterSpacing: '-0.02em' }}>Soyez à ne pas manquer</h1>
            <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6 }}>1 seul exposant par marché. Soyez le premier à réserver votre slot.</p>
          </motion.div>

          <StepBar current={step} isMobile={isMobile} />

          <AnimatePresence mode="wait">
            {step === 1 && <Step1 key="1" data={data} onChange={update} onNext={() => setStep(2)} isMobile={isMobile} />}
            {step === 2 && <Step2 key="2" data={data} onChange={update} onNext={() => setStep(3)} onBack={() => setStep(1)} />}
            {step === 3 && <Step3 key="3" data={data} onBack={() => setStep(2)} profile={profile} />}
          </AnimatePresence>

          {/* ✅ Section mes boosts */}
          {profile?.id && <MyBoosts exposantId={profile.id} />}
        </main>
      </div>
    </div>
  )
}
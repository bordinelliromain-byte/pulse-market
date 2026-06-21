'use client'

import { useEffect, useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import type { Variants } from 'framer-motion'
import Sidebar from '@/components/Sidebar'
import {
  ArrowLeft, CheckCircle, Upload, Shield, Zap,
  FileText, CreditCard, Loader, Star, Lock,
  ChevronRight, AlertCircle, X, Clock, Sparkles
} from 'lucide-react'

const BRAND = '#4F46E5'

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

const STAND_OPTIONS = [
  { size: 2, label: '2 ml', desc: 'Petit stand', price: 25 },
  { size: 3, label: '3 ml', desc: 'Standard', price: 35, popular: true },
  { size: 4, label: '4 ml', desc: 'Grand stand', price: 50 },
  { size: 6, label: '6 ml', desc: 'Stand XXL', price: 70 },
]

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

function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t) }, [onClose])
  return (
    <motion.div
      initial={{ opacity: 0, y: 60, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 100, background: 'white', borderRadius: 12, padding: '14px 18px', boxShadow: '0 8px 32px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: 10, borderLeft: `3px solid ${type === 'success' ? '#16A34A' : '#DC2626'}`, minWidth: 280, maxWidth: 380 }}>
      {type === 'success'
        ? <CheckCircle size={16} style={{ color: '#16A34A', flexShrink: 0 }} />
        : <AlertCircle size={16} style={{ color: '#DC2626', flexShrink: 0 }} />}
      <span style={{ fontSize: 13, fontWeight: 500, color: '#0F172A', flex: 1 }}>{message}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#CBD5E1', padding: 0, flexShrink: 0 }}>
        <X size={14} />
      </button>
    </motion.div>
  )
}

function CandidatureForm() {
  const searchParams = useSearchParams()
  const eventId = searchParams.get('eventId')
  const eventName = searchParams.get('eventName') || 'Événement'
  const eventDate = searchParams.get('eventDate') || ''
  const eventLocation = searchParams.get('eventLocation') || ''

  const [step, setStep] = useState(1)
  const [profile, setProfile] = useState<any>(null)
  const [exposantData, setExposantData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [alreadyApplied, setAlreadyApplied] = useState(false)
  const [blockedFree, setBlockedFree] = useState(false)

  const [selectedSize, setSelectedSize] = useState(3)
  const [needsElectricity, setNeedsElectricity] = useState(false)
  const [message, setMessage] = useState('')

  const router = useRouter()
  const supabase = createClient()
  const isMobile = useIsMobile()

  const selectedOption = STAND_OPTIONS.find(o => o.size === selectedSize) || STAND_OPTIONS[1]
  const electricityFee = needsElectricity ? 18 : 0
  const totalHT = selectedOption.price + electricityFee
  const tva = totalHT * 0.2
  const totalTTC = totalHT + tva

  useEffect(() => {
    const getData = async () => {
      // ✅ Vérification eventId
      if (!eventId) {
        setToast({ message: 'Aucun événement sélectionné', type: 'error' })
        setTimeout(() => router.push('/dashboard/evenements'), 1500)
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (profileData?.role !== 'exposant') { router.push('/dashboard'); return }
      setProfile(profileData)

      const { data: expData } = await supabase.from('exposant_data').select('*').eq('user_id', user.id).single()
      setExposantData(expData)

      // ✅ Check si déjà candidaté à cet event
      const { data: existingApp } = await supabase.from('applications')
        .select('id, status').eq('event_id', eventId).eq('exposant_id', user.id).maybeSingle()
      if (existingApp) {
        setAlreadyApplied(true)
      }

      // ✅ Check limite mensuelle pour free
      if (profileData?.plan !== 'pro') {
        const monthStart = new Date()
        monthStart.setDate(1)
        monthStart.setHours(0, 0, 0, 0)
        const { data: thisMonthApps } = await supabase.from('applications')
          .select('id').eq('exposant_id', user.id).gte('created_at', monthStart.toISOString())
        if (thisMonthApps && thisMonthApps.length >= 1) {
          setBlockedFree(true)
        }
      }

      setLoading(false)
    }
    getData()
  }, [eventId, router, supabase])

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { error } = await supabase.from('applications').insert({
        event_id: eventId, exposant_id: user.id, status: 'pending', message,
      })
      if (error) throw error

      // ✅ Récupérer les infos de l'événement + mairie pour les emails
      const { data: eventData } = await supabase
        .from('events')
        .select(`
          title, start_date, location_name, organisateur_id,
          organisateur:organisateur_id (email, organisation_name, full_name, logo_url)
        `)
        .eq('id', eventId)
        .single()

      const mairie = (eventData?.organisateur as any) || null
      const formattedDate = eventData?.start_date
        ? new Date(eventData.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
        : eventDate

      // ✅ Email à l'exposant — Confirmation candidature envoyée
      if (profile?.email) {
        fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'candidature_envoyee',
            to: profile.email,
            data: {
              exposantNom: profile.full_name || '',
              eventTitle: eventData?.title || eventName,
              eventDate: formattedDate,
              eventLocation: eventData?.location_name || eventLocation,
              mairieNom: mairie?.organisation_name || mairie?.full_name,
              mairieLogoUrl: mairie?.logo_url,
            }
          })
        }).catch(err => console.error('Email candidature_envoyee error:', err))
      }

      // ✅ Email à la mairie — Notification nouvelle candidature
      if (mairie?.email) {
        fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'nouvelle_candidature',
            to: mairie.email,
            data: {
              exposantNom: profile?.full_name || '',
              exposantEmail: profile?.email || '',
              exposantActivite: exposantData?.category || exposantData?.activity || '—',
              eventTitle: eventData?.title || eventName,
              eventDate: formattedDate,
            }
          })
        }).catch(err => console.error('Email nouvelle_candidature error:', err))
      }

      await new Promise(r => setTimeout(r, 1000))
      setToast({ message: 'Candidature envoyée avec succès !', type: 'success' })
      setTimeout(() => setSuccess(true), 1500)
    } catch (err: any) {
      setToast({ message: 'Erreur : ' + err.message, type: 'error' })
    }
    setSubmitting(false)
  }

  // ✅ Upgrade Pro
  const handleUpgradePro = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const res = await fetch('/api/create-pro-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, email: profile?.email || '' })
      })
      const { url } = await res.json()
      if (url) window.location.href = url
    } catch (err: any) {
      alert('Erreur : ' + err.message)
    }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#EEF2F7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 28, height: 28, border: `2px solid ${BRAND}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  // ✅ ÉCRAN — Déjà candidaté
  if (alreadyApplied) return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#EEF2F7', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <Sidebar profile={profile} />
      <div style={{ marginLeft: isMobile ? 0 : 220, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          style={{ background: 'white', borderRadius: 16, padding: isMobile ? '32px 24px' : '40px', maxWidth: 480, width: '100%', textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, background: '#EEF2FF', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
            <CheckCircle size={26} style={{ color: BRAND }} />
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>Vous avez déjà candidaté</h2>
          <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6, marginBottom: 22 }}>
            Vous avez déjà envoyé une candidature pour <strong>{eventName}</strong>. Suivez son statut dans votre tableau de bord.
          </p>
          <button onClick={() => router.push('/dashboard')}
            style={{ background: BRAND, color: 'white', border: 'none', borderRadius: 10, padding: '11px 24px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Voir mes candidatures
          </button>
        </motion.div>
      </div>
    </div>
  )

  // ✅ ÉCRAN — Bloqué free
  if (blockedFree) return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#EEF2F7', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <Sidebar profile={profile} />
      <div style={{ marginLeft: isMobile ? 0 : 220, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          style={{ background: 'white', borderRadius: 16, padding: isMobile ? '32px 24px' : '40px', maxWidth: 480, width: '100%', textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, background: '#FEF3C7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
            <Lock size={26} style={{ color: '#D97706' }} />
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>Limite mensuelle atteinte</h2>
          <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6, marginBottom: 22 }}>
            Avec le plan gratuit, vous pouvez envoyer <strong>1 candidature par mois</strong>. Passez Pro pour candidater sans limite.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button onClick={handleUpgradePro}
              style={{ background: BRAND, color: 'white', border: 'none', borderRadius: 10, padding: '12px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
              <Zap size={14} /> Passer Pro — 20€/mois
            </button>
            <button onClick={() => router.push('/dashboard/evenements')}
              style={{ background: 'transparent', color: '#64748B', border: 'none', padding: '8px 0', fontSize: 12, cursor: 'pointer' }}>
              Retour aux marchés
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )

  // ✅ ÉCRAN — Succès
  if (success) return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#EEF2F7', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <Sidebar profile={profile} />
      <div style={{ marginLeft: isMobile ? 0 : 220, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}
          style={{ background: 'white', borderRadius: 16, padding: isMobile ? '32px 24px' : '48px 40px', maxWidth: 480, width: '100%', textAlign: 'center', boxShadow: '0 4px 40px rgba(0,0,0,0.08)' }}>
          <div style={{ width: 60, height: 60, background: '#F0FDF4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
            <Sparkles size={28} style={{ color: '#16A34A' }} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>Candidature envoyée !</h2>
          <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.7, marginBottom: 6 }}>Votre dossier a été transmis à l'organisateur de</p>
          <p style={{ fontSize: 14, fontWeight: 600, color: BRAND, marginBottom: 24 }}>{eventName}</p>

          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: '14px 16px', marginBottom: 20, textAlign: 'left' }}>
            {[
              { label: 'Stand', value: `${selectedSize} ml — ${selectedOption.desc}` },
              { label: 'Total TTC', value: `${totalTTC.toFixed(2)} €` },
              { label: 'Statut', value: 'En attente de validation' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, paddingBottom: i < 2 ? 8 : 0, marginBottom: i < 2 ? 8 : 0, borderBottom: i < 2 ? '1px solid #F1F5F9' : 'none' }}>
                <span style={{ color: '#64748B' }}>{item.label}</span>
                <span style={{ fontWeight: 600, color: '#0F172A' }}>{item.value}</span>
              </div>
            ))}
          </div>

          <div style={{ background: '#FDF4FF', border: '1px solid #E9D5FF', borderRadius: 10, padding: '12px 14px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left' }}>
            <Clock size={16} style={{ color: '#9333EA', flexShrink: 0 }} />
            <p style={{ fontSize: 12, color: '#7C3AED', lineHeight: 1.5 }}>
              <strong>Post Instagram</strong> disponible une fois votre place confirmée et payée — vous le retrouverez dans votre suivi de candidature.
            </p>
          </div>

          <button onClick={() => router.push('/dashboard')}
            style={{ width: '100%', background: BRAND, color: 'white', border: 'none', borderRadius: 10, padding: '13px 0', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            Suivre ma candidature →
          </button>
        </motion.div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  const docsOk = !!(exposantData?.kbis_url && exposantData?.assurance_url)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#EEF2F7', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <Sidebar profile={profile} />

      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </AnimatePresence>

      <div style={{ marginLeft: isMobile ? 0 : 220, flex: 1, minWidth: 0 }}>
        <header style={{ background: 'white', borderBottom: '1px solid #E2E8F0', padding: isMobile ? '0 14px 0 60px' : '0 28px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <button onClick={() => router.push('/dashboard/evenements')}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', fontSize: 13, flexShrink: 0 }}>
              <ArrowLeft size={14} /> {!isMobile && 'Retour'}
            </button>
            <div style={{ width: 1, height: 16, background: '#E2E8F0', flexShrink: 0 }} />
            <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {isMobile ? eventName : `Candidature — ${eventName}`}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#16A34A', background: '#F0FDF4', padding: '4px 10px', borderRadius: 100, border: '1px solid #BBF7D0', flexShrink: 0 }}>
            <Shield size={11} /> {!isMobile && 'Garantie '}PulseMarket
          </div>
        </header>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

        <div style={{ maxWidth: 960, margin: '0 auto', padding: isMobile ? '14px' : '28px 24px', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 300px', gap: isMobile ? 14 : 24, alignItems: 'start' }}>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center' }}>
              {[{ n: 1, label: 'Configuration' }, { n: 2, label: 'Documents' }, { n: 3, label: 'Envoi' }].map((s, i) => (
                <div key={s.n} style={{ display: 'flex', alignItems: 'center', flex: i < 2 ? 1 : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: step >= s.n ? BRAND : '#F1F5F9', color: step >= s.n ? 'white' : '#94A3B8', fontSize: 11, fontWeight: 700, boxShadow: step === s.n ? '0 0 0 3px rgba(79,70,229,0.15)' : 'none' }}>
                      {step > s.n ? <CheckCircle size={13} /> : s.n}
                    </div>
                    {!isMobile && <span style={{ fontSize: 12, fontWeight: step === s.n ? 600 : 400, color: step === s.n ? '#0F172A' : '#94A3B8', whiteSpace: 'nowrap' }}>{s.label}</span>}
                  </div>
                  {i < 2 && <div style={{ flex: 1, height: 1, background: step > s.n ? BRAND : '#E2E8F0', margin: '0 8px', transition: 'background 0.3s' }} />}
                </div>
              ))}
            </div>

            <AnimatePresence mode="wait">

              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                  <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
                    <div style={{ padding: '14px 18px', borderBottom: '1px solid #F1F5F9' }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>Configuration de votre emplacement</p>
                      <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>Choisissez la taille de votre stand en mètres linéaires</p>
                    </div>
                    <div style={{ padding: '16px 18px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
                        {STAND_OPTIONS.map((opt) => (
                          <button key={opt.size} onClick={() => setSelectedSize(opt.size)}
                            style={{ position: 'relative', padding: '14px 10px', border: selectedSize === opt.size ? `2px solid ${BRAND}` : '1px solid #E2E8F0', borderRadius: 10, background: selectedSize === opt.size ? '#EEF2FF' : 'white', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s' }}>
                            {opt.popular && <span style={{ position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)', background: BRAND, color: 'white', fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 100, whiteSpace: 'nowrap' }}>POPULAIRE</span>}
                            <p style={{ fontSize: 16, fontWeight: 700, color: selectedSize === opt.size ? BRAND : '#0F172A', marginBottom: 2 }}>{opt.label}</p>
                            <p style={{ fontSize: 10, color: '#94A3B8', marginBottom: 6 }}>{opt.desc}</p>
                            <p style={{ fontSize: 13, fontWeight: 700, color: selectedSize === opt.size ? BRAND : '#0F172A' }}>{opt.price} €</p>
                            {selectedSize === opt.size && <div style={{ position: 'absolute', top: 6, right: 6 }}><CheckCircle size={13} style={{ color: BRAND }} /></div>}
                          </button>
                        ))}
                      </div>

                      <div style={{ border: '1px solid #E2E8F0', borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 30, height: 30, background: needsElectricity ? '#FFF7ED' : '#F8FAFC', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Zap size={14} style={{ color: needsElectricity ? '#EA580C' : '#94A3B8' }} />
                          </div>
                          <div>
                            <p style={{ fontSize: 12, fontWeight: 500, color: '#0F172A' }}>Branchement électrique</p>
                            <p style={{ fontSize: 11, color: '#94A3B8' }}>220V — +18 €/jour</p>
                          </div>
                        </div>
                        <button onClick={() => setNeedsElectricity(!needsElectricity)}
                          style={{ width: 44, height: 24, borderRadius: 100, border: 'none', cursor: 'pointer', background: needsElectricity ? BRAND : '#E2E8F0', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                          <div style={{ width: 18, height: 18, background: 'white', borderRadius: '50%', position: 'absolute', top: 3, left: needsElectricity ? 23 : 3, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                        </button>
                      </div>

                      <div style={{ marginBottom: 14 }}>
                        <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Message (optionnel)</label>
                        <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Présentez-vous brièvement, décrivez vos produits..."
                          style={{ width: '100%', padding: '10px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, color: '#0F172A', resize: 'none', height: 72, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', background: '#FAFAFA' }}
                          onFocus={e => { e.target.style.borderColor = BRAND; e.target.style.background = 'white' }}
                          onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.background = '#FAFAFA' }} />
                      </div>

                      <button onClick={() => setStep(2)}
                        style={{ width: '100%', background: BRAND, color: 'white', border: 'none', borderRadius: 10, padding: '12px 0', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        Continuer <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                  <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
                    <div style={{ padding: '14px 18px', borderBottom: '1px solid #F1F5F9' }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>Vérification de vos documents</p>
                      <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>Les organisateurs exigent ces documents</p>
                    </div>
                    <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {[
                        { label: 'Extrait Kbis ou immatriculation', ok: !!exposantData?.kbis_url },
                        { label: 'Attestation RC Pro en cours de validité', ok: !!exposantData?.assurance_url },
                        { label: 'SIREN vérifié via API INSEE', ok: !!exposantData?.is_verified },
                      ].map((doc, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', border: `1px solid ${doc.ok ? '#BBF7D0' : '#FED7AA'}`, borderRadius: 10, background: doc.ok ? '#F0FDF4' : '#FFF7ED' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {doc.ok ? <CheckCircle size={15} style={{ color: '#16A34A', flexShrink: 0 }} /> : <AlertCircle size={15} style={{ color: '#EA580C', flexShrink: 0 }} />}
                            <div>
                              <p style={{ fontSize: 12, fontWeight: 500, color: '#0F172A' }}>{doc.label}</p>
                              <p style={{ fontSize: 11, color: doc.ok ? '#16A34A' : '#EA580C', marginTop: 1, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                                {doc.ok ? <><CheckCircle size={9} /> Vérifié</> : 'Manquant'}
                              </p>
                            </div>
                          </div>
                          {!doc.ok && (
                            <button onClick={() => router.push('/dashboard/profil')}
                              style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#EA580C', color: 'white', border: 'none', borderRadius: 7, padding: '5px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>
                              <Upload size={11} /> Uploader
                            </button>
                          )}
                        </div>
                      ))}

                      {!docsOk && (
                        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 12px', display: 'flex', gap: 8 }}>
                          <AlertCircle size={13} style={{ color: '#DC2626', flexShrink: 0, marginTop: 1 }} />
                          <p style={{ fontSize: 12, color: '#DC2626', lineHeight: 1.6 }}>Dossier incomplet. Vous pouvez quand même candidater mais les mairies privilégient les dossiers complets.</p>
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                        <button onClick={() => setStep(1)} style={{ flex: 1, background: 'white', color: '#64748B', border: '1px solid #E2E8F0', borderRadius: 10, padding: '11px 0', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Retour</button>
                        <button onClick={() => setStep(3)} style={{ flex: 2, background: BRAND, color: 'white', border: 'none', borderRadius: 10, padding: '12px 0', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                          Continuer <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                  <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
                    <div style={{ padding: '14px 18px', borderBottom: '1px solid #F1F5F9' }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>Récapitulatif & Envoi</p>
                      <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>Vérifiez avant de soumettre</p>
                    </div>
                    <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: '14px 16px' }}>
                        {[
                          { label: 'Événement', value: eventName },
                          { label: 'Date', value: eventDate || '—' },
                          { label: 'Lieu', value: eventLocation || '—' },
                          { label: 'Stand', value: `${selectedSize} ml — ${selectedOption.desc}` },
                          { label: 'Électricité', value: needsElectricity ? 'Requise (+18€)' : 'Non requise' },
                        ].map((item, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, paddingBottom: i < 4 ? 8 : 0, marginBottom: i < 4 ? 8 : 0, borderBottom: i < 4 ? '1px solid #F1F5F9' : 'none' }}>
                            <span style={{ color: '#64748B' }}>{item.label}</span>
                            <span style={{ fontWeight: 600, color: '#0F172A', maxWidth: 180, textAlign: 'right' }}>{item.value}</span>
                          </div>
                        ))}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 10, padding: '12px 14px' }}>
                        <Shield size={15} style={{ color: BRAND, flexShrink: 0 }} />
                        <div>
                          <p style={{ fontSize: 12, fontWeight: 600, color: '#4338CA' }}>Garantie PulseMarket</p>
                          <p style={{ fontSize: 11, color: '#6366F1', lineHeight: 1.5 }}>En cas de refus, aucune somme n'est débitée.</p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 10 }}>
                        <button onClick={() => setStep(2)} style={{ flex: 1, background: 'white', color: '#64748B', border: '1px solid #E2E8F0', borderRadius: 10, padding: '11px 0', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Retour</button>
                        <button onClick={handleSubmit} disabled={submitting}
                          style={{ flex: 2, background: submitting ? '#818CF8' : BRAND, color: 'white', border: 'none', borderRadius: 10, padding: '12px 0', fontSize: 14, fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                          {submitting ? <><Loader size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> Envoi...</> : <><Lock size={14} /> Envoyer ma candidature</>}
                        </button>
                      </div>
                      <p style={{ fontSize: 11, color: '#94A3B8', textAlign: 'center' }}>Paiement sécurisé via Stripe — aucun débit avant validation</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {!isMobile && (
            <div style={{ position: 'sticky', top: 72 }}>
              <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid #F1F5F9', background: '#0F172A' }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Résumé</p>
                </div>
                <div style={{ padding: '16px 18px' }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', marginBottom: 4 }}>{eventName}</p>
                  {eventDate && <p style={{ fontSize: 12, color: '#94A3B8', marginBottom: 12 }}>{eventDate}</p>}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 12 }}>
                    {[
                      { label: `Stand ${selectedSize} ml`, value: `${selectedOption.price} €` },
                      ...(needsElectricity ? [{ label: 'Électricité', value: '18 €' }] : []),
                      { label: 'Total HT', value: `${totalHT.toFixed(2)} €`, border: true },
                      { label: 'TVA 20%', value: `${tva.toFixed(2)} €` },
                    ].map((item: any, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, paddingTop: item.border ? 8 : 0, borderTop: item.border ? '1px solid #F1F5F9' : 'none' }}>
                        <span style={{ color: '#64748B' }}>{item.label}</span>
                        <span style={{ color: '#0F172A', fontWeight: 500 }}>{item.value}</span>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, borderTop: '1px solid #E2E8F0', paddingTop: 8, marginTop: 2 }}>
                      <span style={{ fontWeight: 700, color: '#0F172A' }}>Total TTC</span>
                      <span style={{ fontWeight: 800, color: BRAND, fontSize: 16 }}>{totalTTC.toFixed(2)} €</span>
                    </div>
                  </div>
                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '10px 12px', marginBottom: 12 }}>
                    <p style={{ fontSize: 10, fontWeight: 600, color: '#64748B', marginBottom: 7 }}>ÉTAT DU DOSSIER</p>
                    {[{ label: 'Kbis', ok: !!exposantData?.kbis_url }, { label: 'RC Pro', ok: !!exposantData?.assurance_url }, { label: 'SIREN', ok: !!exposantData?.is_verified }].map((doc, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: i < 2 ? 5 : 0 }}>
                        <span style={{ color: '#64748B' }}>{doc.label}</span>
                        <span style={{ color: doc.ok ? '#16A34A' : '#F59E0B', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                          {doc.ok ? <><CheckCircle size={10} /> OK</> : <><Clock size={10} /> À faire</>}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div style={{ textAlign: 'center', fontSize: 11, color: '#94A3B8' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center', marginBottom: 4 }}>
                      <Lock size={10} /> Paiement sécurisé Stripe
                    </div>
                    <div style={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                      {[...Array(5)].map((_, i) => <Star key={i} size={10} style={{ color: '#FBBF24', fill: '#FBBF24' }} />)}
                      <span style={{ marginLeft: 4 }}>Garantie PulseMarket</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isMobile && step !== 3 && (
            <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: 11, color: '#94A3B8' }}>Total TTC estimé</p>
                <p style={{ fontSize: 18, fontWeight: 800, color: BRAND }}>{totalTTC.toFixed(2)} €</p>
              </div>
              <div style={{ fontSize: 11, color: '#64748B', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Lock size={10} /> Stripe sécurisé
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function CandidaturePage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#EEF2F7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 28, height: 28, border: `2px solid ${BRAND}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    }>
      <CandidatureForm />
    </Suspense>
  )
}
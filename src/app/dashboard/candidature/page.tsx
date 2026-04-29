'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import type { Variants } from 'framer-motion'
import {
  ArrowLeft, CheckCircle, Upload, Shield, Zap,
  FileText, CreditCard, Loader, Star, Lock,
  ChevronRight, AlertCircle
} from 'lucide-react'
import { Suspense } from 'react'

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

const STAND_OPTIONS = [
  { size: 2, label: '2 ml', desc: 'Petit stand', price: 25 },
  { size: 3, label: '3 ml', desc: 'Stand standard', price: 35, popular: true },
  { size: 4, label: '4 ml', desc: 'Grand stand', price: 50 },
  { size: 6, label: '6 ml', desc: 'Stand XXL', price: 70 },
]

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

  const [selectedSize, setSelectedSize] = useState(3)
  const [needsElectricity, setNeedsElectricity] = useState(false)
  const [message, setMessage] = useState('')

  const router = useRouter()
  const supabase = createClient()

  const selectedOption = STAND_OPTIONS.find(o => o.size === selectedSize) || STAND_OPTIONS[1]
  const electricityFee = needsElectricity ? 18 : 0
  const totalHT = selectedOption.price + electricityFee
  const tva = totalHT * 0.2
  const totalTTC = totalHT + tva

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (profileData?.role !== 'exposant') { router.push('/dashboard'); return }
      setProfile(profileData)
      const { data: expData } = await supabase.from('exposant_data').select('*').eq('user_id', user.id).single()
      setExposantData(expData)
      setLoading(false)
    }
    getData()
  }, [])

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { error } = await supabase.from('applications').insert({
        event_id: eventId,
        exposant_id: user.id,
        status: 'pending',
        message,
      })
      if (error) throw error
      await new Promise(r => setTimeout(r, 1500))
      setSuccess(true)
    } catch (err: any) {
      alert('Erreur : ' + err.message)
    }
    setSubmitting(false)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#EEF2F7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 28, height: 28, border: '2px solid #4F46E5', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  // ÉCRAN DE SUCCÈS
  if (success) return (
    <div style={{ minHeight: '100vh', background: '#EEF2F7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        style={{ background: 'white', borderRadius: 16, padding: '48px 40px', maxWidth: 480, width: '100%', textAlign: 'center', boxShadow: '0 4px 40px rgba(0,0,0,0.08)' }}
      >
        <div style={{ width: 64, height: 64, background: '#F0FDF4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <CheckCircle size={32} style={{ color: '#16A34A' }} />
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', marginBottom: 10, letterSpacing: '-0.02em' }}>
          Candidature envoyée !
        </h2>
        <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.7, marginBottom: 8 }}>
          Votre dossier a été transmis à l'organisateur de
        </p>
        <p style={{ fontSize: 15, fontWeight: 600, color: '#4F46E5', marginBottom: 28 }}>
          {eventName}
        </p>
        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: '14px 16px', marginBottom: 28, textAlign: 'left' }}>
          {[
            { label: 'Stand sélectionné', value: `${selectedSize} ml — ${selectedOption.desc}` },
            { label: 'Total TTC', value: `${totalTTC.toFixed(2)} €` },
            { label: 'Statut', value: 'En attente de validation' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, paddingBottom: i < 2 ? 8 : 0, marginBottom: i < 2 ? 8 : 0, borderBottom: i < 2 ? '1px solid #F1F5F9' : 'none' }}>
              <span style={{ color: '#64748B' }}>{item.label}</span>
              <span style={{ fontWeight: 600, color: '#0F172A' }}>{item.value}</span>
            </div>
          ))}
        </div>
        <button
          onClick={() => router.push(`/dashboard/partage?eventName=${encodeURIComponent(eventName)}&eventDate=${encodeURIComponent(eventDate)}&eventLocation=${encodeURIComponent(eventLocation)}`)}
          style={{ width: '100%', background: 'linear-gradient(135deg, #E1306C, #833AB4)', color: 'white', border: 'none', borderRadius: 10, padding: '12px 0', fontSize: 14, fontWeight: 600, cursor: 'pointer', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          📸 Préparer mon post Instagram
        </button>
        <button onClick={() => router.push('/dashboard')}
          style={{ width: '100%', background: '#4F46E5', color: 'white', border: 'none', borderRadius: 10, padding: '12px 0', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          Retour au tableau de bord
        </button>
      </motion.div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  const docsOk = !!(exposantData?.kbis_url && exposantData?.assurance_url)

  return (
    <div style={{ minHeight: '100vh', background: '#EEF2F7', fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* TOP BAR */}
      <header style={{ background: 'white', borderBottom: '1px solid #E2E8F0', padding: '0 28px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => router.push('/dashboard/evenements')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', fontSize: 13 }}>
            <ArrowLeft size={14} /> Retour aux événements
          </button>
          <div style={{ width: 1, height: 16, background: '#E2E8F0' }} />
          <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>Candidature — {eventName}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#16A34A', background: '#F0FDF4', padding: '4px 10px', borderRadius: 100, border: '1px solid #BBF7D0' }}>
          <Shield size={12} /> Garantie PlaceMarket
        </div>
      </header>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 24px', display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, alignItems: 'start' }}>

        {/* COLONNE PRINCIPALE */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* STEPPER HEADER */}
          <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 0 }}>
            {[
              { n: 1, label: 'Configuration' },
              { n: 2, label: 'Documents' },
              { n: 3, label: 'Paiement' },
            ].map((s, i) => (
              <div key={s.n} style={{ display: 'flex', alignItems: 'center', flex: i < 2 ? 1 : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    background: step > s.n ? '#4F46E5' : step === s.n ? '#4F46E5' : '#F1F5F9',
                    color: step >= s.n ? 'white' : '#94A3B8',
                    fontSize: 12, fontWeight: 700,
                    boxShadow: step === s.n ? '0 0 0 3px rgba(79,70,229,0.15)' : 'none',
                  }}>
                    {step > s.n ? <CheckCircle size={14} /> : s.n}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: step === s.n ? 600 : 400, color: step === s.n ? '#0F172A' : '#94A3B8', whiteSpace: 'nowrap' }}>{s.label}</span>
                </div>
                {i < 2 && <div style={{ flex: 1, height: 1, background: step > s.n ? '#4F46E5' : '#E2E8F0', margin: '0 12px', transition: 'background 0.3s' }} />}
              </div>
            ))}
          </div>

          {/* ÉTAPE 1 — CONFIGURATION */}
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid #F1F5F9' }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>Configuration de votre emplacement</p>
                    <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>Choisissez la taille de votre stand en mètres linéaires</p>
                  </div>
                  <div style={{ padding: '20px' }}>

                    {/* Cards de sélection */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
                      {STAND_OPTIONS.map((opt) => (
                        <button key={opt.size} onClick={() => setSelectedSize(opt.size)}
                          style={{
                            position: 'relative', padding: '16px 12px', border: selectedSize === opt.size ? '2px solid #4F46E5' : '1px solid #E2E8F0',
                            borderRadius: 10, background: selectedSize === opt.size ? '#EEF2FF' : 'white',
                            cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
                          }}>
                          {opt.popular && (
                            <span style={{ position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)', background: '#4F46E5', color: 'white', fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 100, whiteSpace: 'nowrap' }}>POPULAIRE</span>
                          )}
                          <p style={{ fontSize: 18, fontWeight: 700, color: selectedSize === opt.size ? '#4F46E5' : '#0F172A', marginBottom: 2 }}>{opt.label}</p>
                          <p style={{ fontSize: 11, color: '#94A3B8', marginBottom: 8 }}>{opt.desc}</p>
                          <p style={{ fontSize: 14, fontWeight: 700, color: selectedSize === opt.size ? '#4F46E5' : '#0F172A' }}>{opt.price} €</p>
                          {selectedSize === opt.size && (
                            <div style={{ position: 'absolute', top: 8, right: 8 }}>
                              <CheckCircle size={14} style={{ color: '#4F46E5' }} />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>

                    {/* Électricité */}
                    <div style={{ border: '1px solid #E2E8F0', borderRadius: 10, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, background: needsElectricity ? '#FFF7ED' : '#F8FAFC', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Zap size={15} style={{ color: needsElectricity ? '#EA580C' : '#94A3B8' }} />
                        </div>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 500, color: '#0F172A' }}>Branchement électrique</p>
                          <p style={{ fontSize: 11, color: '#94A3B8' }}>Monophasé 220V — +18 €/jour</p>
                        </div>
                      </div>
                      <button onClick={() => setNeedsElectricity(!needsElectricity)}
                        style={{
                          width: 44, height: 24, borderRadius: 100, border: 'none', cursor: 'pointer',
                          background: needsElectricity ? '#4F46E5' : '#E2E8F0',
                          position: 'relative', transition: 'background 0.2s',
                        }}>
                        <div style={{
                          width: 18, height: 18, background: 'white', borderRadius: '50%',
                          position: 'absolute', top: 3, transition: 'left 0.2s',
                          left: needsElectricity ? 23 : 3,
                          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                        }} />
                      </button>
                    </div>

                    {/* Message */}
                    <div style={{ marginBottom: 20 }}>
                      <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>
                        Message à l'organisateur (optionnel)
                      </label>
                      <textarea value={message} onChange={e => setMessage(e.target.value)}
                        placeholder="Présentez-vous brièvement, décrivez vos produits..."
                        style={{ width: '100%', padding: '10px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, color: '#0F172A', resize: 'none', height: 80, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', background: '#FAFAFA' }}
                        onFocus={e => { e.target.style.borderColor = '#4F46E5'; e.target.style.background = 'white' }}
                        onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.background = '#FAFAFA' }}
                      />
                    </div>

                    <button onClick={() => setStep(2)}
                      style={{ width: '100%', background: '#4F46E5', color: 'white', border: 'none', borderRadius: 10, padding: '12px 0', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      Continuer <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ÉTAPE 2 — DOCUMENTS */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid #F1F5F9' }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>Vérification de vos documents</p>
                    <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>Les organisateurs exigent ces documents pour valider votre candidature</p>
                  </div>
                  <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 12 }}>

                    {[
                      { label: 'Extrait Kbis ou immatriculation', key: 'kbis_url', ok: !!exposantData?.kbis_url },
                      { label: 'Attestation RC Pro en cours de validité', key: 'assurance_url', ok: !!exposantData?.assurance_url },
                      { label: 'SIREN vérifié via API INSEE', key: 'siren', ok: !!exposantData?.is_verified },
                    ].map((doc, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '14px 16px', border: `1px solid ${doc.ok ? '#BBF7D0' : '#FED7AA'}`,
                        borderRadius: 10, background: doc.ok ? '#F0FDF4' : '#FFF7ED',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {doc.ok
                            ? <CheckCircle size={16} style={{ color: '#16A34A', flexShrink: 0 }} />
                            : <AlertCircle size={16} style={{ color: '#EA580C', flexShrink: 0 }} />
                          }
                          <div>
                            <p style={{ fontSize: 13, fontWeight: 500, color: '#0F172A' }}>{doc.label}</p>
                            <p style={{ fontSize: 11, color: doc.ok ? '#16A34A' : '#EA580C', marginTop: 2 }}>
                              {doc.ok ? 'Document fourni et vérifié' : 'Document manquant'}
                            </p>
                          </div>
                        </div>
                        {!doc.ok && (
                          <button onClick={() => router.push('/dashboard/profil')}
                            style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#EA580C', color: 'white', border: 'none', borderRadius: 7, padding: '6px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                            <Upload size={12} /> Uploader
                          </button>
                        )}
                      </div>
                    ))}

                    {!docsOk && (
                      <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '12px 14px', display: 'flex', gap: 8 }}>
                        <AlertCircle size={14} style={{ color: '#DC2626', flexShrink: 0, marginTop: 1 }} />
                        <p style={{ fontSize: 12, color: '#DC2626', lineHeight: 1.6 }}>
                          Certains documents sont manquants. Vous pouvez quand même envoyer votre candidature, mais les mairies privilégient les dossiers complets.
                        </p>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                      <button onClick={() => setStep(1)}
                        style={{ flex: 1, background: 'white', color: '#64748B', border: '1px solid #E2E8F0', borderRadius: 10, padding: '11px 0', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                        Retour
                      </button>
                      <button onClick={() => setStep(3)}
                        style={{ flex: 2, background: '#4F46E5', color: 'white', border: 'none', borderRadius: 10, padding: '12px 0', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        Continuer <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ÉTAPE 3 — RÉCAPITULATIF & PAIEMENT */}
            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid #F1F5F9' }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>Récapitulatif & Envoi de la candidature</p>
                    <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>Vérifiez les détails avant de soumettre</p>
                  </div>
                  <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>

                    {/* Résumé événement */}
                    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: '14px 16px' }}>
                      <p style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Détails de l'événement</p>
                      {[
                        { label: 'Événement', value: eventName },
                        { label: 'Date', value: eventDate || 'Non précisée' },
                        { label: 'Lieu', value: eventLocation || 'Non précisé' },
                        { label: 'Taille du stand', value: `${selectedSize} ml — ${selectedOption.desc}` },
                        { label: 'Électricité', value: needsElectricity ? 'Requise (+18€)' : 'Non requise' },
                      ].map((item, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, paddingBottom: i < 4 ? 8 : 0, marginBottom: i < 4 ? 8 : 0, borderBottom: i < 4 ? '1px solid #F1F5F9' : 'none' }}>
                          <span style={{ color: '#64748B' }}>{item.label}</span>
                          <span style={{ fontWeight: 600, color: '#0F172A' }}>{item.value}</span>
                        </div>
                      ))}
                    </div>

                    {/* Badge garantie */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 10, padding: '12px 14px' }}>
                      <Shield size={16} style={{ color: '#4F46E5', flexShrink: 0 }} />
                      <div>
                        <p style={{ fontSize: 12, fontWeight: 600, color: '#4338CA' }}>Garantie PlaceMarket</p>
                        <p style={{ fontSize: 11, color: '#6366F1', lineHeight: 1.5 }}>Votre dossier est protégé. En cas de refus, aucune somme n'est débitée.</p>
                      </div>
                    </div>

                    {/* Bouton */}
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button onClick={() => setStep(2)}
                        style={{ flex: 1, background: 'white', color: '#64748B', border: '1px solid #E2E8F0', borderRadius: 10, padding: '11px 0', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                        Retour
                      </button>
                      <button onClick={handleSubmit} disabled={submitting}
                        style={{ flex: 2, background: submitting ? '#818CF8' : '#4F46E5', color: 'white', border: 'none', borderRadius: 10, padding: '12px 0', fontSize: 14, fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s' }}>
                        {submitting
                          ? <><Loader size={15} style={{ animation: 'spin 0.8s linear infinite' }} /> Envoi en cours...</>
                          : <><Lock size={14} /> Envoyer ma candidature</>
                        }
                      </button>
                    </div>
                    <p style={{ fontSize: 11, color: '#94A3B8', textAlign: 'center' }}>
                      Paiement sécurisé via Stripe — aucun débit avant validation
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* STICKY SIDEBAR */}
        <div style={{ position: 'sticky', top: 72 }}>
          <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #F1F5F9', background: '#0F172A' }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Résumé de la candidature</p>
            </div>
            <div style={{ padding: '16px 18px' }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', marginBottom: 4 }}>{eventName}</p>
              {eventDate && <p style={{ fontSize: 12, color: '#94A3B8', marginBottom: 14 }}>{eventDate}</p>}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: '#64748B' }}>Stand {selectedSize} ml</span>
                  <span style={{ color: '#0F172A', fontWeight: 500 }}>{selectedOption.price} €</span>
                </div>
                {needsElectricity && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: '#64748B' }}>Électricité</span>
                    <span style={{ color: '#0F172A', fontWeight: 500 }}>18 €</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, borderTop: '1px solid #F1F5F9', paddingTop: 8 }}>
                  <span style={{ color: '#64748B' }}>Total HT</span>
                  <span style={{ color: '#0F172A', fontWeight: 500 }}>{totalHT.toFixed(2)} €</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: '#64748B' }}>TVA 20%</span>
                  <span style={{ color: '#0F172A', fontWeight: 500 }}>{tva.toFixed(2)} €</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, borderTop: '1px solid #E2E8F0', paddingTop: 10, marginTop: 2 }}>
                  <span style={{ fontWeight: 700, color: '#0F172A' }}>Total TTC</span>
                  <span style={{ fontWeight: 700, color: '#4F46E5', fontSize: 16 }}>{totalTTC.toFixed(2)} €</span>
                </div>
              </div>

              {/* Statut documents */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '10px 12px', marginBottom: 14 }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#64748B', marginBottom: 8 }}>ÉTAT DU DOSSIER</p>
                {[
                  { label: 'Kbis', ok: !!exposantData?.kbis_url },
                  { label: 'RC Pro', ok: !!exposantData?.assurance_url },
                  { label: 'SIREN vérifié', ok: !!exposantData?.is_verified },
                ].map((doc, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: i < 2 ? 5 : 0 }}>
                    <span style={{ color: '#64748B' }}>{doc.label}</span>
                    <span style={{ color: doc.ok ? '#16A34A' : '#F59E0B', fontWeight: 600 }}>{doc.ok ? '✓ OK' : '⏳'}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#94A3B8', justifyContent: 'center' }}>
                <Lock size={11} />
                Paiement sécurisé via Stripe
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#94A3B8', justifyContent: 'center', marginTop: 4 }}>
                <Star size={11} style={{ color: '#FBBF24' }} />
                <Star size={11} style={{ color: '#FBBF24' }} />
                <Star size={11} style={{ color: '#FBBF24' }} />
                <Star size={11} style={{ color: '#FBBF24' }} />
                <Star size={11} style={{ color: '#FBBF24' }} />
                <span style={{ marginLeft: 4 }}>Garantie PlaceMarket</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default function CandidaturePage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#EEF2F7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 28, height: 28, border: '2px solid #4F46E5', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    }>
      <CandidatureForm />
    </Suspense>
  )
}
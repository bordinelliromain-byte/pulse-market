'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, ArrowRight, Users, Building2, Phone, Mail, User, UserPlus, ChevronRight } from 'lucide-react'

export default function TerrainPage({ params }: { params: { code: string } }) {
  const [step, setStep] = useState<'pin' | 'home' | 'form' | 'inscription' | 'success'>('pin')
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState(false)
  const [commercial, setCommercial] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({ total: 0, signes: 0, interesses: 0 })

  // Form contact
  const [type, setType] = useState<'mairie' | 'exposant'>('mairie')
  const [nom, setNom] = useState('')
  const [email, setEmail] = useState('')
  const [telephone, setTelephone] = useState('')
  const [statut, setStatut] = useState<'signe' | 'interesse' | 'non_interesse'>('interesse')
  const [notes, setNotes] = useState('')
  const [creerCompte, setCreerCompte] = useState(false)

  // Inscription rapide
  const [inscEmail, setInscEmail] = useState('')
  const [inscPassword, setInscPassword] = useState('')
  const [inscNom, setInscNom] = useState('')

  const supabase = createClient()

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '14px 16px',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 12, color: 'white', fontSize: 16,
    fontFamily: 'inherit', outline: 'none',
    boxSizing: 'border-box',
  }

  const loadStats = async (code: string) => {
    const { data } = await supabase
      .from('terrain_contacts')
      .select('statut')
      .eq('commercial_code', code)
    if (data) {
      setStats({
        total: data.length,
        signes: data.filter(c => c.statut === 'signe').length,
        interesses: data.filter(c => c.statut === 'interesse').length,
      })
    }
  }

  const handlePin = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('commerciaux')
      .select('*')
      .eq('code', params.code.toLowerCase())
      .eq('pin', pin)
      .eq('actif', true)
      .single()

    if (data) {
      setCommercial(data)
      await loadStats(data.code)
      setStep('home')
    } else {
      setPinError(true)
      setPin('')
      setTimeout(() => setPinError(false), 2000)
    }
    setLoading(false)
  }

  const handleSaveContact = async () => {
    if (!nom) return
    setLoading(true)

    const { data: contact } = await supabase.from('terrain_contacts').insert({
      commercial_code: commercial.code,
      commercial_name: commercial.nom,
      type, nom, email, telephone, statut, notes,
      compte_cree: false,
    }).select().single()

    if (creerCompte && email && inscPassword && inscNom) {
      // Créer le compte
      const { data: authData } = await supabase.auth.signUp({
        email: inscEmail || email,
        password: inscPassword,
        options: {
          data: {
            full_name: inscNom || nom,
            role: type === 'mairie' ? 'organisateur' : 'exposant',
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      })

      if (authData?.user && contact?.id) {
        await supabase.from('terrain_contacts')
          .update({ compte_cree: true, compte_id: authData.user.id, statut: 'signe' })
          .eq('id', contact.id)
      }
    }

    await loadStats(commercial.code)
    setStep('success')
    setLoading(false)

    // Reset après 3 secondes
    setTimeout(() => {
      setNom(''); setEmail(''); setTelephone(''); setNotes('')
      setStatut('interesse'); setCreerCompte(false)
      setInscEmail(''); setInscPassword(''); setInscNom('')
      setStep('home')
    }, 3000)
  }

  if (step === 'pin') return (
    <div style={{ minHeight: '100vh', background: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', system-ui, sans-serif", padding: 24 }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%', maxWidth: 360, textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, background: '#4F46E5', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: 20, fontWeight: 800, color: 'white' }}>PM</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'white', marginBottom: 8 }}>PulseMarket Terrain</h1>
        <p style={{ fontSize: 14, color: '#64748B', marginBottom: 32 }}>Entrez votre code PIN pour accéder</p>

        <input
          type="password" inputMode="numeric" maxLength={4}
          placeholder="Code PIN" value={pin}
          onChange={e => setPin(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handlePin()}
          style={{ ...inputStyle, textAlign: 'center', fontSize: 28, letterSpacing: 12, marginBottom: 16 }}
          onFocus={e => e.target.style.borderColor = '#4F46E5'}
          onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
          autoFocus
        />

        {pinError && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ fontSize: 13, color: '#F87171', marginBottom: 12 }}>
            Code PIN incorrect
          </motion.p>
        )}

        <button onClick={handlePin} disabled={loading || pin.length < 4}
          style={{ width: '100%', padding: '16px', background: pin.length >= 4 ? '#4F46E5' : 'rgba(79,70,229,0.3)', color: 'white', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 600, cursor: pin.length >= 4 ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>
          {loading ? 'Vérification...' : 'Accéder →'}
        </button>
      </motion.div>
    </div>
  )

  if (step === 'home') return (
    <div style={{ minHeight: '100vh', background: '#0F172A', fontFamily: "'Inter', system-ui, sans-serif", padding: 24 }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', paddingTop: 32, marginBottom: 40 }}>
          <div style={{ width: 48, height: 48, background: '#4F46E5', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 16, fontWeight: 800, color: 'white' }}>PM</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'white', marginBottom: 4 }}>Bonjour {commercial?.nom} !</h1>
          <p style={{ fontSize: 14, color: '#64748B' }}>Espace commercial terrain</p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 32 }}>
          {[
            { label: 'Total', value: stats.total, color: '#818CF8' },
            { label: 'Signés', value: stats.signes, color: '#34D399' },
            { label: 'Intéressés', value: stats.interesses, color: '#FCD34D' },
          ].map((s, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '16px 12px', textAlign: 'center' }}>
              <p style={{ fontSize: 28, fontWeight: 800, color: s.color, marginBottom: 4 }}>{s.value}</p>
              <p style={{ fontSize: 11, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* CTA principal */}
        <button onClick={() => setStep('form')}
          style={{ width: '100%', padding: '20px', background: '#4F46E5', color: 'white', border: 'none', borderRadius: 16, fontSize: 18, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 16 }}>
          <UserPlus size={22} /> Nouveau contact
        </button>

        <p style={{ textAlign: 'center', fontSize: 13, color: '#334155', marginTop: 24 }}>
          PulseMarket — Espace commercial confidentiel
        </p>
      </div>
    </div>
  )

  if (step === 'form') return (
    <div style={{ minHeight: '100vh', background: '#0F172A', fontFamily: "'Inter', system-ui, sans-serif", padding: '24px 24px 60px' }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32, paddingTop: 16 }}>
          <button onClick={() => setStep('home')} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#64748B', cursor: 'pointer', width: 36, height: 36, borderRadius: 10, fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>←</button>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'white' }}>Nouveau contact</h1>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Type */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Type</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { val: 'mairie', label: 'Mairie / Orga', icon: <Building2 size={18} /> },
                { val: 'exposant', label: 'Exposant', icon: <Users size={18} /> },
              ].map(t => (
                <button key={t.val} onClick={() => setType(t.val as any)}
                  style={{ padding: '16px', border: type === t.val ? '2px solid #4F46E5' : '1px solid rgba(255,255,255,0.08)', borderRadius: 12, background: type === t.val ? 'rgba(79,70,229,0.2)' : 'rgba(255,255,255,0.03)', cursor: 'pointer', color: type === t.val ? '#818CF8' : '#64748B', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, fontFamily: 'inherit', fontWeight: 600, fontSize: 13 }}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Nom */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Nom / Organisation *</label>
            <input type="text" placeholder={type === 'mairie' ? 'Mairie d\'Aubagne' : 'Le Burger d\'Arthur'} value={nom} onChange={e => setNom(e.target.value)}
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#4F46E5'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
          </div>

          {/* Email */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Email</label>
            <input type="email" placeholder="contact@exemple.fr" value={email} onChange={e => setEmail(e.target.value)}
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#4F46E5'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
          </div>

          {/* Téléphone */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Téléphone</label>
            <input type="tel" placeholder="06 12 34 56 78" value={telephone} onChange={e => setTelephone(e.target.value)}
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#4F46E5'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
          </div>

          {/* Statut */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Statut</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {[
                { val: 'signe', label: 'Signé', color: '#34D399', bg: 'rgba(16,185,129,0.15)' },
                { val: 'interesse', label: 'Intéressé', color: '#FCD34D', bg: 'rgba(245,158,11,0.15)' },
                { val: 'non_interesse', label: 'Non intéressé', color: '#F87171', bg: 'rgba(239,68,68,0.15)' },
              ].map(s => (
                <button key={s.val} onClick={() => setStatut(s.val as any)}
                  style={{ padding: '12px 8px', border: statut === s.val ? `2px solid ${s.color}` : '1px solid rgba(255,255,255,0.08)', borderRadius: 10, background: statut === s.val ? s.bg : 'transparent', cursor: 'pointer', color: statut === s.val ? s.color : '#64748B', fontFamily: 'inherit', fontWeight: 600, fontSize: 12 }}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Notes (optionnel)</label>
            <textarea placeholder="Rappeler lundi, intéressé par le marché de Noël..." value={notes} onChange={e => setNotes(e.target.value)}
              style={{ ...inputStyle, height: 80, resize: 'none' }}
              onFocus={e => e.target.style.borderColor = '#4F46E5'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
          </div>

          {/* Créer compte */}
          {email && (statut === 'signe' || statut === 'interesse') && (
            <div style={{ background: 'rgba(79,70,229,0.08)', border: '1px solid rgba(79,70,229,0.2)', borderRadius: 12, padding: 16 }}>
              <button onClick={() => setCreerCompte(!creerCompte)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', color: '#818CF8', fontFamily: 'inherit', fontWeight: 600, fontSize: 14, width: '100%' }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${creerCompte ? '#4F46E5' : 'rgba(255,255,255,0.2)'}`, background: creerCompte ? '#4F46E5' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {creerCompte && <CheckCircle size={12} style={{ color: 'white' }} />}
                </div>
                Créer son compte maintenant
              </button>

              <AnimatePresence>
                {creerCompte && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden', marginTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <input type="text" placeholder="Nom complet" value={inscNom} onChange={e => setInscNom(e.target.value)}
                      style={{ ...inputStyle, fontSize: 14 }}
                      onFocus={e => e.target.style.borderColor = '#4F46E5'}
                      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                    <input type="email" placeholder={email || 'Email'} value={inscEmail} onChange={e => setInscEmail(e.target.value)}
                      style={{ ...inputStyle, fontSize: 14 }}
                      onFocus={e => e.target.style.borderColor = '#4F46E5'}
                      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                    <input type="password" placeholder="Mot de passe (min 6 caractères)" value={inscPassword} onChange={e => setInscPassword(e.target.value)}
                      style={{ ...inputStyle, fontSize: 14 }}
                      onFocus={e => e.target.style.borderColor = '#4F46E5'}
                      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                    <p style={{ fontSize: 11, color: '#64748B' }}>Un email de confirmation sera envoyé au client</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <button onClick={handleSaveContact} disabled={!nom || loading}
            style={{ width: '100%', padding: '18px', background: nom ? '#4F46E5' : 'rgba(79,70,229,0.3)', color: 'white', border: 'none', borderRadius: 14, fontSize: 17, fontWeight: 700, cursor: nom ? 'pointer' : 'not-allowed', fontFamily: 'inherit', marginTop: 8 }}>
            {loading ? 'Enregistrement...' : 'Enregistrer le contact →'}
          </button>
        </div>
      </div>
    </div>
  )

  if (step === 'success') return (
    <div style={{ minHeight: '100vh', background: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center' }}>
        <div style={{ width: 80, height: 80, background: 'rgba(16,185,129,0.15)', border: '2px solid #10B981', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <CheckCircle size={36} style={{ color: '#10B981' }} />
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: 'white', marginBottom: 8 }}>Contact enregistré !</h2>
        <p style={{ fontSize: 14, color: '#64748B' }}>Retour automatique dans 3 secondes...</p>
      </motion.div>
    </div>
  )

  return null
}
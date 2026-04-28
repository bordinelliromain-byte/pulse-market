'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Store, Building2, Eye, EyeOff, ShieldCheck } from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
}

export default function AuthPage() {
  const searchParams = useSearchParams()
  const [tab, setTab] = useState<'signin' | 'signup'>(
  (searchParams.get('tab') as 'signin' | 'signup') || 'signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<'exposant' | 'organisateur'>('exposant')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSignIn = async () => {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    else router.push('/dashboard')
    setLoading(false)
  }

  const handleSignUp = async () => {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role } }
    })
    if (error) setError(error.message)
    else router.push('/dashboard')
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', fontFamily: 'system-ui, sans-serif' }}>

      {/* PANNEAU GAUCHE — Branding */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="hidden lg:flex"
        style={{ width: '45%', background: '#0F172A', padding: '48px', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}
      >
        {/* Fond décoratif */}
        <div style={{ position: 'absolute', top: -100, right: -100, width: 400, height: 400, background: 'radial-gradient(circle, rgba(79,70,229,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -80, left: -80, width: 300, height: 300, background: 'radial-gradient(circle, rgba(79,70,229,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, background: '#4F46E5', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'white', fontSize: 13, fontWeight: 700 }}>PM</span>
          </div>
          <span style={{ color: 'white', fontWeight: 600, fontSize: 16 }}>PlaceMarket</span>
        </div>

        {/* Message central */}
        <div>
          <h2 style={{ color: 'white', fontSize: 32, fontWeight: 700, lineHeight: 1.2, letterSpacing: '-0.02em', marginBottom: 20 }}>
            La numérisation des marchés du terroir français
          </h2>
          <p style={{ color: '#64748B', fontSize: 15, lineHeight: 1.7, marginBottom: 40 }}>
            Gérez vos Autorisations d'Occupation du Domaine Public, certifiez vos dossiers exposants et simplifiez vos marchés.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { icon: <ShieldCheck size={15} style={{ color: '#818CF8' }} />, text: 'Vérification SIREN via API INSEE en 10 secondes' },
              { icon: <ShieldCheck size={15} style={{ color: '#818CF8' }} />, text: 'Génération automatique des arrêtés municipaux' },
              { icon: <ShieldCheck size={15} style={{ color: '#818CF8' }} />, text: 'Dossiers certifiés OCR — RC Pro & Kbis' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ background: 'rgba(79,70,229,0.15)', borderRadius: 6, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {item.icon}
                </div>
                <span style={{ color: '#94A3B8', fontSize: 13 }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p style={{ color: '#334155', fontSize: 12 }}>© 2026 PlaceMarket SAS — Données hébergées en France</p>
      </motion.div>

      {/* PANNEAU DROIT — Formulaire */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 24px' }}>
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          style={{ width: '100%', maxWidth: 420 }}
        >
          {/* Logo mobile */}
          <motion.div variants={fadeUp} className="lg:hidden" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32 }}>
            <div style={{ width: 28, height: 28, background: '#0F172A', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'white', fontSize: 11, fontWeight: 700 }}>PM</span>
            </div>
            <span style={{ fontWeight: 600, fontSize: 15, color: '#0F172A' }}>PlaceMarket</span>
          </motion.div>

          {/* Titre */}
          <motion.div variants={fadeUp} style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0F172A', letterSpacing: '-0.02em', marginBottom: 8 }}>
              {tab === 'signin' ? 'Connexion à votre espace' : 'Créer votre compte'}
            </h1>
            <p style={{ fontSize: 14, color: '#64748B' }}>
              {tab === 'signin'
                ? "Accédez à votre tableau de bord PlaceMarket."
                : "Rejoignez la plateforme des marchés et festivals."}
            </p>
          </motion.div>

          {/* Tabs */}
          <motion.div variants={fadeUp} style={{ background: '#F1F5F9', borderRadius: 10, padding: 4, display: 'flex', marginBottom: 28 }}>
            {[
              { val: 'signin', label: 'Connexion' },
              { val: 'signup', label: 'Inscription' },
            ].map(t => (
              <button
                key={t.val}
                onClick={() => { setTab(t.val as any); setError('') }}
                style={{
                  flex: 1,
                  padding: '8px 0',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: 'none',
                  background: tab === t.val ? 'white' : 'transparent',
                  color: tab === t.val ? '#0F172A' : '#94A3B8',
                  boxShadow: tab === t.val ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                {t.label}
              </button>
            ))}
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
            >

              {/* Nom complet (inscription) */}
              {tab === 'signup' && (
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6, letterSpacing: '0.02em' }}>
                    NOM COMPLET
                  </label>
                  <input
                    type="text"
                    placeholder="Jean Dupont"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: '1px solid #E2E8F0',
                      borderRadius: 10,
                      fontSize: 14,
                      color: '#0F172A',
                      background: 'white',
                      outline: 'none',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={e => e.target.style.borderColor = '#4F46E5'}
                    onBlur={e => e.target.style.borderColor = '#E2E8F0'}
                  />
                </div>
              )}

              {/* Email */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6, letterSpacing: '0.02em' }}>
                  ADRESSE EMAIL
                </label>
                <input
                  type="email"
                  placeholder="vous@domaine.fr"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #E2E8F0',
                    borderRadius: 10,
                    fontSize: 14,
                    color: '#0F172A',
                    background: 'white',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={e => e.target.style.borderColor = '#4F46E5'}
                  onBlur={e => e.target.style.borderColor = '#E2E8F0'}
                />
              </div>

              {/* Mot de passe */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6, letterSpacing: '0.02em' }}>
                  MOT DE PASSE
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 42px 10px 14px',
                      border: '1px solid #E2E8F0',
                      borderRadius: 10,
                      fontSize: 14,
                      color: '#0F172A',
                      background: 'white',
                      outline: 'none',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={e => e.target.style.borderColor = '#4F46E5'}
                    onBlur={e => e.target.style.borderColor = '#E2E8F0'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 0 }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Choix du rôle (inscription) */}
              {tab === 'signup' && (
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 8, letterSpacing: '0.02em' }}>
                    TYPE DE COMPTE
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {[
                      { val: 'exposant', icon: <Store size={15} />, label: 'Exposant', sub: 'Food-truck, artisan' },
                      { val: 'organisateur', icon: <Building2 size={15} />, label: 'Organisateur', sub: 'Mairie, association' },
                    ].map(r => (
                      <button
                        key={r.val}
                        onClick={() => setRole(r.val as any)}
                        style={{
                          padding: '12px 14px',
                          border: role === r.val ? '1.5px solid #4F46E5' : '1px solid #E2E8F0',
                          borderRadius: 10,
                          background: role === r.val ? '#EEF2FF' : 'white',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.2s',
                        }}
                      >
                        <div style={{ color: role === r.val ? '#4F46E5' : '#64748B', marginBottom: 4 }}>{r.icon}</div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: role === r.val ? '#4338CA' : '#0F172A' }}>{r.label}</p>
                        <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{r.sub}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Erreur */}
              {error && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px' }}>
                  <p style={{ fontSize: 13, color: '#DC2626' }}>{error}</p>
                </div>
              )}

              {/* Bouton principal */}
              <button
                onClick={tab === 'signin' ? handleSignIn : handleSignUp}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px 0',
                  background: loading ? '#818CF8' : '#4F46E5',
                  color: 'white',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  transition: 'opacity 0.2s',
                }}
                className="hover:opacity-90"
              >
                {loading ? 'Chargement...' : (
                  <>
                    {tab === 'signin' ? 'Accéder à mon espace' : 'Créer mon compte'}
                    <ArrowRight size={15} />
                  </>
                )}
              </button>

              {/* Lien retour */}
              <p style={{ textAlign: 'center', fontSize: 13, color: '#94A3B8' }}>
                <button
                  onClick={() => router.push('/')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', fontSize: 13 }}
                  className="hover:text-slate-900 transition-colors"
                >
                  ← Retour à l'accueil
                </button>
              </p>

            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}
'use client'

import { useState, Suspense, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Eye, EyeOff, ShieldCheck, Loader, CheckCircle, Mail } from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
} as const

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
} as const

function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error' | 'info'; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 5000)
    return () => clearTimeout(t)
  }, [])

  const colors = {
    success: { bg: '#F0FDF4', border: '#BBF7D0', text: '#15803D', icon: <CheckCircle size={16} style={{ color: '#16A34A', flexShrink: 0 }} /> },
    error:   { bg: '#FEF2F2', border: '#FECACA', text: '#DC2626', icon: null },
    info:    { bg: '#EEF2FF', border: '#C7D2FE', text: '#4338CA', icon: <Mail size={16} style={{ color: '#4F46E5', flexShrink: 0 }} /> },
  }
  const c = colors[type]

  return (
    <motion.div
      initial={{ opacity: 0, y: 60, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      style={{
        position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
        zIndex: 100, background: c.bg, borderRadius: 12,
        padding: '14px 20px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        display: 'flex', alignItems: 'center', gap: 10,
        border: `1px solid ${c.border}`, minWidth: 300, maxWidth: 420,
      }}>
      {c.icon}
      <span style={{ fontSize: 13, fontWeight: 500, color: c.text, flex: 1 }}>{message}</span>
    </motion.div>
  )
}

function AuthForm() {
  const searchParams = useSearchParams()
  // ✅ Fix 1 : tab par défaut depuis l'URL (?tab=signup depuis la landing)
  const [tab, setTab] = useState<'signin' | 'signup'>(
    (searchParams.get('tab') as 'signin' | 'signup') || 'signin'
  )
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [emailSent, setEmailSent] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const confirmed = searchParams.get('confirmed')
    const error = searchParams.get('error')

    if (confirmed === 'true') {
      setToast({ message: 'Email confirmé ! Redirection vers votre espace...', type: 'success' })
      setTimeout(async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profileData } = await supabase.from('profiles').select('role').eq('id', user.id).single()
          if (profileData?.role === 'organisateur') {
            router.push('/dashboard/organisateur')
          } else if (profileData?.role === 'placier') {
            router.push('/dashboard/placier')
          } else {
            router.push('/dashboard')
          }
        }
      }, 2000)
    }

    if (error === 'confirmation_failed') {
      setToast({ message: 'Le lien de confirmation a expiré. Réessayez.', type: 'error' })
    }
  }, [])

  const handleSignIn = async () => {
    if (!email || !password) { setError('Veuillez remplir tous les champs'); return }
    setLoading(true); setError('')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError('Email ou mot de passe incorrect'); setLoading(false); return }

    const { data: profileData } = await supabase.from('profiles').select('role').eq('id', data.user.id).single()

    if (profileData?.role === 'organisateur') {
      await supabase.auth.signOut()
      setError("Ce compte est un compte organisateur. Connectez-vous via l'espace administration.")
      setLoading(false)
      return
    }

    if (profileData?.role === 'placier') {
      router.push('/dashboard/placier')
    } else {
      router.push('/dashboard')
    }
    setLoading(false)
  }

  const handleSignUp = async () => {
    if (!email || !password || !fullName) { setError('Veuillez remplir tous les champs'); return }
    if (password.length < 6) { setError('Le mot de passe doit faire au moins 6 caractères'); return }
    setLoading(true); setError('')

    const { error } = await supabase.auth.signUp({
      email, password,
      options: {
        // ✅ Fix 2 : toujours exposant — pas de choix de rôle
        data: { full_name: fullName, role: 'exposant' },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      }
    })

    if (error) {
      setError(error.message)
    } else {
      setEmailSent(true)
      setToast({ message: `Email de confirmation envoyé à ${email}`, type: 'info' })
    }
    setLoading(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      tab === 'signin' ? handleSignIn() : handleSignUp()
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px', border: '1px solid #E2E8F0',
    borderRadius: 10, fontSize: 14, color: '#0F172A', background: 'white',
    outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', fontFamily: "'Inter', system-ui, sans-serif" }}>

      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </AnimatePresence>

      {/* Panneau gauche */}
      <motion.div
        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}
        className="hidden lg:flex"
        style={{ width: '45%', background: '#0F172A', padding: '48px', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -100, right: -100, width: 400, height: 400, background: 'radial-gradient(circle, rgba(79,70,229,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -80, left: -80, width: 300, height: 300, background: 'radial-gradient(circle, rgba(79,70,229,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />

        {/* ✅ Logo SVG inline */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
            <rect width="40" height="40" rx="10" fill="#4F46E5"/>
            <path d="M6 20L12 20L14 11L17 29L20 14L22 20L34 20" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div style={{ display: 'flex', alignItems: 'baseline' }}>
            <span style={{ color: 'white', fontWeight: 700, fontSize: 16 }}>Pulse</span>
            <span style={{ color: '#818CF8', fontWeight: 400, fontSize: 16 }}>Market</span>
          </div>
        </div>

        <div>
          <h2 style={{ color: 'white', fontSize: 32, fontWeight: 700, lineHeight: 1.2, letterSpacing: '-0.02em', marginBottom: 20 }}>
            La numérisation des marchés du terroir français
          </h2>
          <p style={{ color: '#64748B', fontSize: 15, lineHeight: 1.7, marginBottom: 40 }}>
            Gérez vos AOT, certifiez vos dossiers exposants et simplifiez vos marchés.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {['Vérification SIREN via API INSEE en 10 secondes', 'Génération automatique des arrêtés municipaux', 'Dossiers certifiés OCR — RC Pro & Kbis'].map((text, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ background: 'rgba(79,70,229,0.15)', borderRadius: 6, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <ShieldCheck size={15} style={{ color: '#818CF8' }} />
                </div>
                <span style={{ color: '#94A3B8', fontSize: 13 }}>{text}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 24, marginTop: 40 }}>
            {[{ val: '36 000', label: 'communes en France' }, { val: '100%', label: 'données hébergées FR' }, { val: '< 10s', label: 'vérification SIREN' }].map((s, i) => (
              <div key={i}>
                <p style={{ fontSize: 18, fontWeight: 800, color: 'white', marginBottom: 2 }}>{s.val}</p>
                <p style={{ fontSize: 11, color: '#475569' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
        <p style={{ color: '#334155', fontSize: 12 }}>© 2026 PulseMarket SAS — Données hébergées en France</p>
      </motion.div>

      {/* Formulaire */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 20px' }}>
        <motion.div variants={stagger} initial="hidden" animate="visible" style={{ width: '100%', maxWidth: 420 }}>

          <motion.div variants={fadeUp} className="lg:hidden" style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
                <rect width="40" height="40" rx="10" fill="#4F46E5"/>
                <path d="M6 20L12 20L14 11L17 29L20 14L22 20L34 20" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div style={{ display: 'flex', alignItems: 'baseline' }}>
                <span style={{ fontWeight: 700, fontSize: 16, color: '#0F172A' }}>Pulse</span>
                <span style={{ fontWeight: 400, fontSize: 16, color: '#4F46E5' }}>Market</span>
              </div>
            </div>
          </motion.div>

          <AnimatePresence mode="wait">
            {emailSent ? (
              <motion.div key="email-sent"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ width: 64, height: 64, background: '#EEF2FF', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <Mail size={28} style={{ color: '#4F46E5' }} />
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', marginBottom: 10 }}>Vérifiez votre email</h2>
                <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.7, marginBottom: 8 }}>
                  Un email de confirmation a été envoyé à
                </p>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#4F46E5', marginBottom: 24 }}>{email}</p>
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: '16px', marginBottom: 24, textAlign: 'left' }}>
                  <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.7 }}>
                    Cliquez sur le lien dans l'email pour confirmer votre compte. Vous serez ensuite redirigé automatiquement vers votre espace.
                  </p>
                </div>
                <p style={{ fontSize: 12, color: '#94A3B8', marginBottom: 16 }}>
                  Vous n'avez pas reçu l'email ? Vérifiez vos spams.
                </p>
                <button onClick={() => { setEmailSent(false); setTab('signin') }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#4F46E5', fontWeight: 500 }}>
                  ← Retour à la connexion
                </button>
              </motion.div>
            ) : (
              <motion.div key="form">
                <motion.div variants={fadeUp} style={{ marginBottom: 28 }}>
                  <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', letterSpacing: '-0.02em', marginBottom: 6 }}>
                    {tab === 'signin' ? 'Connexion à votre espace' : 'Créer votre compte exposant'}
                  </h1>
                  <p style={{ fontSize: 14, color: '#64748B' }}>
                    {tab === 'signin'
                      ? 'Accédez à votre tableau de bord PulseMarket.'
                      : 'Rejoignez la plateforme des marchés et festivals.'
                    }
                  </p>
                  {/* ✅ Lien discret vers espace organisateur */}
                  {tab === 'signup' && (
                    <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 8 }}>
                      Vous êtes une mairie ?{' '}
                      <button onClick={() => router.push('/auth/mairie')}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4F46E5', fontSize: 12, fontWeight: 600 }}>
                        Espace organisateur →
                      </button>
                    </p>
                  )}
                </motion.div>

                <motion.div variants={fadeUp} style={{ background: '#F1F5F9', borderRadius: 10, padding: 4, display: 'flex', marginBottom: 24 }}>
                  {[{ val: 'signin', label: 'Connexion' }, { val: 'signup', label: 'Inscription' }].map(t => (
                    <button key={t.val} onClick={() => { setTab(t.val as any); setError('') }}
                      style={{ flex: 1, padding: '9px 0', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none', background: tab === t.val ? 'white' : 'transparent', color: tab === t.val ? '#0F172A' : '#94A3B8', boxShadow: tab === t.val ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.2s' }}>
                      {t.label}
                    </button>
                  ))}
                </motion.div>

                <AnimatePresence mode="wait">
                  <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}
                    style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                    {tab === 'signup' && (
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Nom complet</label>
                        <input type="text" placeholder="Jean Dupont" value={fullName} onChange={e => setFullName(e.target.value)} onKeyDown={handleKeyDown}
                          style={inputStyle} autoFocus
                          onFocus={e => e.target.style.borderColor = '#4F46E5'} onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
                      </div>
                    )}

                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Adresse email</label>
                      <input type="email" placeholder="vous@domaine.fr" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={handleKeyDown}
                        style={inputStyle} autoFocus={tab === 'signin'}
                        onFocus={e => e.target.style.borderColor = '#4F46E5'} onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Mot de passe</label>
                        {tab === 'signin' && (
                          <button onClick={async () => {
                            if (!email) { setError("Entrez votre email d'abord"); return }
                            await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/callback` })
                            setToast({ message: 'Email de réinitialisation envoyé !', type: 'info' })
                          }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#4F46E5', fontWeight: 500 }}>
                            Mot de passe oublié ?
                          </button>
                        )}
                      </div>
                      <div style={{ position: 'relative' }}>
                        <input type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={handleKeyDown}
                          style={{ ...inputStyle, paddingRight: 42 }}
                          onFocus={e => e.target.style.borderColor = '#4F46E5'} onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
                        <button type="button" onClick={() => setShowPassword(!showPassword)}
                          style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 0 }}>
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <AnimatePresence>
                      {error && (
                        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px' }}>
                          <p style={{ fontSize: 13, color: '#DC2626' }}>{error}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <button onClick={tab === 'signin' ? handleSignIn : handleSignUp} disabled={loading}
                      style={{ width: '100%', padding: '13px 0', background: loading ? '#818CF8' : '#4F46E5', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 2 }}>
                      {loading
                        ? <><Loader size={15} style={{ animation: 'spin 0.8s linear infinite' }} /> Chargement...</>
                        : <>{tab === 'signin' ? 'Accéder à mon espace' : 'Créer mon compte'}<ArrowRight size={15} /></>
                      }
                    </button>

                    <p style={{ textAlign: 'center', fontSize: 13, color: '#94A3B8' }}>
                      <button onClick={() => router.push('/')}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', fontSize: 13 }}>
                        ← Retour à l'accueil
                      </button>
                    </p>
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, border: '2px solid #4F46E5', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    }>
      <AuthForm />
    </Suspense>
  )
}
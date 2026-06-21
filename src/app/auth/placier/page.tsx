'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, CheckCircle, AlertCircle, Loader, Eye, EyeOff,
  Mail, Lock, ShieldCheck, ArrowRight, AlertTriangle
} from 'lucide-react'

const BRAND = '#4F46E5'

function PlacierAuthContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()

  // Détection mode : signup si token+email dans URL
  const token = searchParams.get('token')
  const emailFromUrl = searchParams.get('email')
  const nomFromUrl = searchParams.get('nom')
  const isSignupMode = !!(token && emailFromUrl)

  // Common states
  const [loading, setLoading] = useState(isSignupMode) // loading seulement si on doit vérifier le token
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Signup states
  const [tokenValid, setTokenValid] = useState(false)
  const [invitation, setInvitation] = useState<any>(null)
  const [fullName, setFullName] = useState('')
  const [signupSuccess, setSignupSuccess] = useState(false)

  // Login states
  const [loginEmail, setLoginEmail] = useState('')

  // Shared
  const [password, setPassword] = useState('')

  // ─────────────────────────────────────
  // MODE SIGNUP - Vérification token
  // ─────────────────────────────────────
  useEffect(() => {
    if (!isSignupMode) return

    const verifyToken = async () => {
      const { data: inv } = await supabase
        .from('placier_invitations')
        .select('*')
        .eq('token', token)
        .eq('email', emailFromUrl)
        .eq('used', false)
        .single()
      if (inv) {
        setInvitation(inv)
        setTokenValid(true)
        if (nomFromUrl) setFullName(decodeURIComponent(nomFromUrl))
      }
      setLoading(false)
    }
    verifyToken()
  }, [token, emailFromUrl, isSignupMode, nomFromUrl, supabase])

  // ─────────────────────────────────────
  // SIGNUP - Création du compte
  // ─────────────────────────────────────
  const handleSignup = async () => {
    if (!fullName || !password || !emailFromUrl || !token) return
    setSubmitting(true)
    setError('')
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: emailFromUrl!,
        password,
        options: { data: { full_name: fullName, role: 'placier' } }
      })
      if (authError) throw authError

      if (authData.user) {
        await supabase.from('profiles').upsert({
          id: authData.user.id,
          email: emailFromUrl,
          full_name: fullName,
          role: 'placier',
          mairie_id: invitation.mairie_id,
        })

        await supabase.from('placier_invitations')
          .update({ used: true })
          .eq('token', token)

        // ✅ Récupérer le nom de la mairie pour l'email de bienvenue
        let mairieNom = 'votre mairie'
        try {
          const { data: mairieData } = await supabase
            .from('profiles')
            .select('organisation_name, full_name')
            .eq('id', invitation.mairie_id)
            .single()
          mairieNom = mairieData?.organisation_name || mairieData?.full_name || 'votre mairie'
        } catch (e) {
          console.error('Mairie fetch error:', e)
        }

        // ✅ Envoyer email de bienvenue placier (fire and forget, ne bloque pas le flow)
        fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'bienvenue_placier',
            to: emailFromUrl,
            data: {
              nom: fullName,
              mairieNom: mairieNom,
            }
          })
        }).catch(err => console.error('Email bienvenue_placier error:', err))

        setSignupSuccess(true)
        setTimeout(() => router.push('/dashboard/placier'), 2000)
      }
    } catch (err: any) {
      setError(err.message)
    }
    setSubmitting(false)
  }

  // ─────────────────────────────────────
  // LOGIN - Connexion existante
  // ─────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: loginEmail.trim(),
        password,
      })

      if (authError) throw authError
      if (!data.user) throw new Error('Échec de la connexion')

      // Vérifier le rôle
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      if (!profile || (profile.role !== 'placier' && profile.role !== 'organisateur')) {
        await supabase.auth.signOut()
        setError('Ce compte n\'a pas les droits placier')
        setSubmitting(false)
        return
      }

      // Update last login
      await supabase.from('profiles').update({
        last_login_at: new Date().toISOString(),
      }).eq('id', data.user.id)

      router.push('/dashboard/placier')
    } catch (err: any) {
      setError(err.message || 'Email ou mot de passe incorrect')
      setSubmitting(false)
    }
  }

  // ─────────────────────────────────────
  // LOADING
  // ─────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Loader size={28} style={{ color: BRAND, animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  // ─────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0F172A',
      fontFamily: "'Inter', system-ui, sans-serif",
      display: 'flex',
      flexDirection: 'column',
      maxWidth: 480,
      margin: '0 auto',
      color: 'white',
    }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* HEADER GRADIENT */}
      <div style={{
        background: `linear-gradient(135deg, ${BRAND}, #7C3AED)`,
        padding: '60px 24px 80px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: -60, right: -60, width: 200, height: 200,
          background: 'radial-gradient(circle, rgba(255,255,255,0.1), transparent 70%)',
          borderRadius: '50%',
        }} />
        <div style={{
          position: 'absolute', bottom: -40, left: -40, width: 160, height: 160,
          background: 'radial-gradient(circle, rgba(251,191,36,0.1), transparent 70%)',
          borderRadius: '50%',
        }} />

        <div style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
          <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', delay: 0.1 }}
            style={{
              width: 78, height: 78, background: 'rgba(255,255,255,0.15)', borderRadius: 22,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 18px', backdropFilter: 'blur(10px)',
              border: '2px solid rgba(255,255,255,0.25)',
            }}>
            <ShieldCheck size={36} style={{ color: 'white' }} />
          </motion.div>

          <p style={{ fontSize: 22, fontWeight: 800, color: 'white', marginBottom: 6 }}>PulseMarket Placier</p>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>
            {isSignupMode ? 'Créez votre compte sécurisé' : 'Connectez-vous à votre espace terrain'}
          </p>
        </div>
      </div>

      {/* CARD */}
      <div style={{ flex: 1, padding: '0 16px 24px', marginTop: -50 }}>
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          style={{
            background: '#1E293B', borderRadius: 18, padding: '24px 20px',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}>

          {/* ═══════════════════════════════════
              MODE SIGNUP
              ═══════════════════════════════════ */}
          {isSignupMode ? (
            <>
              {!tokenValid ? (
                // ─── Token invalide ───
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <AlertCircle size={48} style={{ color: '#DC2626', margin: '0 auto 16px' }} />
                  <p style={{ fontSize: 18, fontWeight: 700, color: 'white', marginBottom: 8 }}>Lien invalide</p>
                  <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6, marginBottom: 24 }}>
                    Ce lien d'invitation est invalide ou a déjà été utilisé. Contactez votre mairie pour obtenir un nouveau lien.
                  </p>
                  <button onClick={() => router.push('/auth/placier')}
                    style={{ background: BRAND, color: 'white', border: 'none', borderRadius: 10, padding: '11px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                    Se connecter à la place
                  </button>
                </div>
              ) : signupSuccess ? (
                // ─── Succès ───
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.1 }}
                    style={{ width: 64, height: 64, background: 'rgba(34,197,94,0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <CheckCircle size={32} style={{ color: '#22C55E' }} />
                  </motion.div>
                  <p style={{ fontSize: 18, fontWeight: 700, color: 'white', marginBottom: 8 }}>Compte créé !</p>
                  <p style={{ fontSize: 13, color: '#64748B' }}>Redirection vers votre espace...</p>
                </div>
              ) : (
                // ─── Formulaire signup ───
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(79,70,229,0.1)', border: '1px solid rgba(79,70,229,0.3)', borderRadius: 10, padding: '10px 12px', marginBottom: 18 }}>
                    <Shield size={13} style={{ color: BRAND, flexShrink: 0 }} />
                    <p style={{ fontSize: 11, color: '#A5B4FC', lineHeight: 1.5 }}>
                      Invitation sécurisée — accès placier uniquement
                    </p>
                  </div>

                  <p style={{ fontSize: 17, fontWeight: 800, color: 'white', marginBottom: 4 }}>Créer votre compte</p>
                  <p style={{ fontSize: 12, color: '#64748B', marginBottom: 20 }}>{emailFromUrl}</p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: '#94A3B8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Nom complet
                      </label>
                      <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Jean Martin"
                        style={{ width: '100%', padding: '12px 14px', background: '#0F172A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: 14, color: 'white', outline: 'none', boxSizing: 'border-box' }}
                        onFocus={e => e.target.style.borderColor = BRAND}
                        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                    </div>

                    <div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: '#94A3B8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        <Lock size={11} /> Mot de passe
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input type={showPassword ? 'text' : 'password'} value={password}
                          onChange={e => setPassword(e.target.value)} placeholder="Minimum 8 caractères"
                          style={{ width: '100%', padding: '12px 40px 12px 14px', background: '#0F172A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: 14, color: 'white', outline: 'none', boxSizing: 'border-box' }}
                          onFocus={e => e.target.style.borderColor = BRAND}
                          onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                        <button type="button" onClick={() => setShowPassword(!showPassword)}
                          style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                          {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>

                    <AnimatePresence>
                      {error && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                          style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)', borderRadius: 9, padding: '10px 12px', fontSize: 12, color: '#FCA5A5', display: 'flex', alignItems: 'center', gap: 7, overflow: 'hidden' }}>
                          <AlertCircle size={13} style={{ flexShrink: 0 }} /> {error}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <button onClick={handleSignup} disabled={!fullName || !password || submitting}
                      style={{
                        width: '100%',
                        background: (!fullName || !password) ? '#0F172A' : `linear-gradient(135deg, ${BRAND}, #7C3AED)`,
                        color: (!fullName || !password) ? '#475569' : 'white',
                        border: 'none', borderRadius: 12, padding: '14px',
                        fontSize: 14, fontWeight: 800,
                        cursor: (!fullName || !password || submitting) ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        boxShadow: (!fullName || !password) ? 'none' : `0 6px 20px ${BRAND}55`,
                        marginTop: 6,
                      }}>
                      {submitting ? <Loader size={15} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Shield size={15} />}
                      {submitting ? 'Création du compte...' : 'Créer mon compte placier'}
                    </button>
                  </div>
                </>
              )}
            </>
          ) : (
            /* ═══════════════════════════════════
               MODE LOGIN
               ═══════════════════════════════════ */
            <form onSubmit={handleLogin}>
              <p style={{ fontSize: 16, fontWeight: 800, color: 'white', marginBottom: 4 }}>Connexion</p>
              <p style={{ fontSize: 12, color: '#64748B', marginBottom: 22 }}>Avec vos identifiants reçus par email</p>

              {/* Email */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: '#94A3B8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  <Mail size={11} /> Email
                </label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={e => { setLoginEmail(e.target.value); setError('') }}
                  placeholder="placier@email.fr"
                  required
                  autoComplete="email"
                  style={{
                    width: '100%', padding: '13px 14px', background: '#0F172A',
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
                    fontSize: 14, color: 'white', outline: 'none', boxSizing: 'border-box',
                  }}
                  onFocus={e => e.target.style.borderColor = BRAND}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
              </div>

              {/* Password */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: '#94A3B8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  <Lock size={11} /> Mot de passe
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError('') }}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    style={{
                      width: '100%', padding: '13px 42px 13px 14px', background: '#0F172A',
                      border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
                      fontSize: 14, color: 'white', outline: 'none', boxSizing: 'border-box',
                    }}
                    onFocus={e => e.target.style.borderColor = BRAND}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', color: '#64748B', padding: 4 }}>
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)', borderRadius: 10, padding: '10px 12px', marginBottom: 14, display: 'flex', gap: 8, alignItems: 'center', overflow: 'hidden' }}>
                    <AlertTriangle size={13} style={{ color: '#DC2626', flexShrink: 0 }} />
                    <p style={{ fontSize: 12, color: '#FCA5A5', fontWeight: 500 }}>{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <button type="submit" disabled={!loginEmail || !password || submitting}
                style={{
                  width: '100%',
                  background: (!loginEmail || !password) ? '#0F172A' : `linear-gradient(135deg, ${BRAND}, #7C3AED)`,
                  color: (!loginEmail || !password) ? '#475569' : 'white',
                  border: 'none', borderRadius: 12, padding: '14px',
                  fontSize: 15, fontWeight: 800,
                  cursor: (!loginEmail || !password || submitting) ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: (!loginEmail || !password) ? 'none' : `0 6px 20px ${BRAND}55`,
                }}>
                {submitting
                  ? <Loader size={16} style={{ animation: 'spin 0.8s linear infinite' }} />
                  : <ArrowRight size={16} />
                }
                {submitting ? 'Connexion...' : 'Se connecter'}
              </button>

              <div style={{ marginTop: 16, padding: '10px 12px', background: 'rgba(79,70,229,0.08)', border: '1px solid rgba(79,70,229,0.2)', borderRadius: 10, display: 'flex', gap: 8 }}>
                <Shield size={13} style={{ color: BRAND, flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: 11, color: '#A5B4FC', lineHeight: 1.5 }}>
                  Identifiants reçus par email après création de votre compte par votre mairie.
                </p>
              </div>
            </form>
          )}
        </motion.div>

        {/* Footer */}
        <div style={{ marginTop: 18, textAlign: 'center' }}>
          <p style={{ fontSize: 11, color: '#475569' }}>
            PulseMarket SAS · pulse-market.fr
          </p>
        </div>
      </div>
    </div>
  )
}

export default function PlacierAuth() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 28, height: 28, border: `2px solid ${BRAND}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    }>
      <PlacierAuthContent />
    </Suspense>
  )
}
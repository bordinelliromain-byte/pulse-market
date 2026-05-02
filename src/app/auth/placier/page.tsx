'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { Shield, CheckCircle, AlertCircle, Loader, Eye, EyeOff } from 'lucide-react'

function PlacierSignupContent() {
  const [loading, setLoading] = useState(true)
  const [tokenValid, setTokenValid] = useState(false)
  const [invitation, setInvitation] = useState<any>(null)
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()

  const token = searchParams.get('token')
  const email = searchParams.get('email')
  const nom = searchParams.get('nom')

  useEffect(() => {
    const verifyToken = async () => {
      if (!token || !email) { setLoading(false); return }
      const { data: inv } = await supabase
        .from('placier_invitations')
        .select('*')
        .eq('token', token)
        .eq('email', email)
        .eq('used', false)
        .single()
      if (inv) {
        setInvitation(inv)
        setTokenValid(true)
        if (nom) setFullName(decodeURIComponent(nom))
      }
      setLoading(false)
    }
    verifyToken()
  }, [token, email])

  const handleSignup = async () => {
    if (!fullName || !password || !email || !token) return
    setSubmitting(true)
    setError('')
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email!,
        password,
        options: { data: { full_name: fullName, role: 'placier' } }
      })
      if (authError) throw authError

      if (authData.user) {
        // Créer profil avec rôle placier ET mairie_id
        await supabase.from('profiles').upsert({
          id: authData.user.id,
          email,
          full_name: fullName,
          role: 'placier',
          mairie_id: invitation.mairie_id,
        })

        // Marquer invitation comme utilisée
        await supabase.from('placier_invitations')
          .update({ used: true })
          .eq('token', token)

        setSuccess(true)
        setTimeout(() => router.push('/dashboard/placier'), 2000)
      }
    } catch (err: any) {
      setError(err.message)
    }
    setSubmitting(false)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Loader size={28} style={{ color: '#4F46E5', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        style={{ background: '#1E293B', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '40px 36px', maxWidth: 420, width: '100%' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
          <div style={{ width: 36, height: 36, background: '#4F46E5', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'white', fontSize: 13, fontWeight: 800 }}>PM</span>
          </div>
          <span style={{ color: 'white', fontWeight: 700, fontSize: 16 }}>PlaceMarket</span>
        </div>

        {!tokenValid ? (
          <div style={{ textAlign: 'center' }}>
            <AlertCircle size={48} style={{ color: '#DC2626', margin: '0 auto 16px' }} />
            <p style={{ fontSize: 18, fontWeight: 700, color: 'white', marginBottom: 8 }}>Lien invalide</p>
            <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6 }}>
              Ce lien d'invitation est invalide ou a déjà été utilisé. Contactez votre mairie pour obtenir un nouveau lien.
            </p>
          </div>
        ) : success ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, background: 'rgba(34,197,94,0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <CheckCircle size={32} style={{ color: '#22C55E' }} />
            </div>
            <p style={{ fontSize: 18, fontWeight: 700, color: 'white', marginBottom: 8 }}>Compte créé ! 🎉</p>
            <p style={{ fontSize: 13, color: '#64748B' }}>Redirection vers votre espace placier...</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(79,70,229,0.1)', border: '1px solid rgba(79,70,229,0.3)', borderRadius: 10, padding: '10px 14px', marginBottom: 24 }}>
              <Shield size={14} style={{ color: '#4F46E5', flexShrink: 0 }} />
              <p style={{ fontSize: 12, color: '#818CF8', lineHeight: 1.5 }}>
                Invitation sécurisée — accès restreint à l'espace placier uniquement
              </p>
            </div>

            <p style={{ fontSize: 20, fontWeight: 800, color: 'white', marginBottom: 4 }}>Créer votre compte</p>
            <p style={{ fontSize: 13, color: '#64748B', marginBottom: 24 }}>Espace Placier · {email}</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 7 }}>Nom complet</label>
                <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Jean Martin"
                  style={{ width: '100%', padding: '11px 14px', background: '#0F172A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: 14, color: 'white', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = '#4F46E5'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 7 }}>Mot de passe</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Minimum 8 caractères"
                    style={{ width: '100%', padding: '11px 40px 11px 14px', background: '#0F172A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: 14, color: 'white', outline: 'none', boxSizing: 'border-box' }}
                    onFocus={e => e.target.style.borderColor = '#4F46E5'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                  <button onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {error && (
                <div style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)', borderRadius: 9, padding: '10px 14px', fontSize: 12, color: '#EF4444', display: 'flex', alignItems: 'center', gap: 7 }}>
                  <AlertCircle size={13} /> {error}
                </div>
              )}

              <button onClick={handleSignup} disabled={!fullName || !password || submitting}
                style={{ width: '100%', background: !fullName || !password ? '#1E293B' : '#4F46E5', color: !fullName || !password ? '#475569' : 'white', border: 'none', borderRadius: 10, padding: '13px', fontSize: 14, fontWeight: 700, cursor: !fullName || !password ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 }}>
                {submitting ? <Loader size={15} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Shield size={15} />}
                {submitting ? 'Création du compte...' : 'Créer mon compte placier'}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  )
}

export default function PlacierSignup() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 28, height: 28, border: '2px solid #4F46E5', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    }>
      <PlacierSignupContent />
    </Suspense>
  )
}
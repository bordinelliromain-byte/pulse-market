'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowRight, Eye, EyeOff, ShieldCheck, Loader, Building2, Users, TreePine, MapPin, Upload, Clock, CheckCircle } from 'lucide-react'

const ORG_TYPES = [
  { val: 'mairie', label: 'Commune / Mairie', icon: <Building2 size={14} />, placeholder: 'Mairie d\'Aubagne' },
  { val: 'comite', label: 'Comité des fêtes', icon: <TreePine size={14} />, placeholder: 'Comité des Fêtes de Saint-Éloi' },
  { val: 'association', label: 'Association', icon: <Users size={14} />, placeholder: 'Association des Marchands du Var' },
  { val: 'autre', label: 'Autre organisateur', icon: <MapPin size={14} />, placeholder: 'Office de Tourisme de Cassis' },
]

const MAX_ATTEMPTS = 5
const LOCKOUT_MS = 15 * 60 * 1000

function getLockoutState(): { attempts: number; lockedUntil: number } {
  try {
    const raw = sessionStorage.getItem('auth_mairie_attempts')
    return raw ? JSON.parse(raw) : { attempts: 0, lockedUntil: 0 }
  } catch { return { attempts: 0, lockedUntil: 0 } }
}

function recordFailedAttempt(): { attempts: number; lockedUntil: number } {
  const state = getLockoutState()
  const newAttempts = state.attempts + 1
  const lockedUntil = newAttempts >= MAX_ATTEMPTS ? Date.now() + LOCKOUT_MS : state.lockedUntil
  const newState = { attempts: newAttempts, lockedUntil }
  sessionStorage.setItem('auth_mairie_attempts', JSON.stringify(newState))
  return newState
}

function resetAttempts() { sessionStorage.removeItem('auth_mairie_attempts') }
function getRemainingMinutes(lockedUntil: number): number { return Math.ceil((lockedUntil - Date.now()) / 60_000) }

function AuthOrganisateurForm() {
  const searchParams = useSearchParams()
  const villeParam = searchParams.get('ville') || ''

  const [tab, setTab] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [orgName, setOrgName] = useState(villeParam ? `Mairie de ${villeParam}` : '')
  const [orgType, setOrgType] = useState('mairie')
  const [siret, setSiret] = useState('')
  const [justificatif, setJustificatif] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [pendingScreen, setPendingScreen] = useState(false)

  const [attemptCount, setAttemptCount] = useState(() => getLockoutState().attempts)
  const [lockedUntil, setLockedUntil] = useState(() => getLockoutState().lockedUntil)

  const router = useRouter()
  const supabase = createClient()
  const selectedOrgType = ORG_TYPES.find(t => t.val === orgType) || ORG_TYPES[0]
  const isLocked = lockedUntil > Date.now()

  const handleSignIn = async () => {
    if (isLocked) { setError(`Trop de tentatives. Réessayez dans ${getRemainingMinutes(lockedUntil)} minute(s).`); return }
    if (!email || !password) { setError('Veuillez remplir tous les champs'); return }
    setLoading(true); setError('')

    if (attemptCount > 0) {
      await new Promise(r => setTimeout(r, Math.min(attemptCount * 1000, 5000)))
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      const newState = recordFailedAttempt()
      setAttemptCount(newState.attempts)
      setLockedUntil(newState.lockedUntil)
      const remaining = MAX_ATTEMPTS - newState.attempts
      setError(newState.attempts >= MAX_ATTEMPTS
        ? 'Compte temporairement bloqué pendant 15 minutes.'
        : `Email ou mot de passe incorrect. ${remaining} tentative${remaining > 1 ? 's' : ''} restante${remaining > 1 ? 's' : ''}.`
      )
      setLoading(false); return
    }

    const { data: profileData } = await supabase.from('profiles').select('role, organisateur_status').eq('id', data.user.id).single()
    if (profileData?.role !== 'organisateur') {
      await supabase.auth.signOut()
      setError('Ce compte n\'est pas un compte organisateur.')
      setLoading(false); return
    }

    resetAttempts(); setAttemptCount(0)
    router.push('/dashboard/organisateur')
    setLoading(false)
  }

  const handleSignUp = async () => {
    if (!email || !password || !orgName || !siret) {
      setError('Veuillez remplir tous les champs obligatoires')
      return
    }
    if (password.length < 6) { setError('Le mot de passe doit faire au moins 6 caractères'); return }
    if (siret.replace(/\s/g, '').length !== 14) { setError('Le numéro SIRET doit contenir 14 chiffres'); return }
    if (!justificatif) { setError('Veuillez joindre un document justificatif'); return }

    setLoading(true); setError('')

    // 1. Inscription Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email, password,
      options: {
        data: {
          full_name: orgName,
          role: 'organisateur',
          organization_name: orgName,
          organization_type: orgType,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      }
    })

    if (authError) { setError(authError.message); setLoading(false); return }
    if (!authData.user) { setError('Erreur lors de la création du compte'); setLoading(false); return }

    // 2. Upload justificatif
    let justificatifUrl = ''
    try {
      const ext = justificatif.name.split('.').pop()
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(`justificatifs/${authData.user.id}/justificatif.${ext}`, justificatif, { upsert: true })
      if (!uploadError && uploadData) {
        justificatifUrl = uploadData.path
      }
    } catch (e) { console.error('Upload justificatif error:', e) }

    // 3. Mettre à jour le profil avec SIRET + justificatif + status pending
    await supabase.from('profiles').update({
      organisateur_status: 'pending',
      organisation_siret: siret.replace(/\s/g, ''),
      justificatif_url: justificatifUrl,
    }).eq('id', authData.user.id)

    setLoading(false)
    setPendingScreen(true)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading && !isLocked) tab === 'signin' ? handleSignIn() : handleSignUp()
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10, fontSize: 14, color: 'white', background: 'rgba(255,255,255,0.06)',
    outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
  }

  // ✅ Écran d'attente après inscription
  if (pendingScreen) {
    return (
      <div style={{ minHeight: '100vh', background: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', system-ui, sans-serif", padding: 24 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 40 }}>
            <div style={{ width: 32, height: 32, background: '#4F46E5', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'white', fontSize: 13, fontWeight: 700 }}>PM</span>
            </div>
            <span style={{ color: 'white', fontWeight: 600, fontSize: 16 }}>PulseMarket</span>
          </div>

          <div style={{ width: 64, height: 64, background: 'rgba(79,70,229,0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <Clock size={28} style={{ color: '#818CF8' }} />
          </div>

          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'white', marginBottom: 12, letterSpacing: '-0.02em' }}>
            Dossier reçu — en cours de validation
          </h1>

          <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.7, marginBottom: 32 }}>
            Votre demande a bien été enregistrée. Notre équipe va vérifier votre dossier dans les <strong style={{ color: '#94A3B8' }}>24 à 48h ouvrées</strong>.
          </p>

          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 20, marginBottom: 32, textAlign: 'left' }}>
            {[
              { label: 'Organisation', value: orgName },
              { label: 'SIRET', value: siret },
              { label: 'Email', value: email },
              { label: 'Justificatif', value: justificatif?.name || '—' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                <span style={{ fontSize: 12, color: '#475569' }}>{item.label}</span>
                <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 500, maxWidth: 220, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.value}</span>
              </div>
            ))}
          </div>

          <div style={{ background: 'rgba(79,70,229,0.1)', border: '1px solid rgba(79,70,229,0.2)', borderRadius: 10, padding: '12px 16px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
            <CheckCircle size={14} style={{ color: '#818CF8', flexShrink: 0 }} />
            <p style={{ fontSize: 12, color: '#818CF8', lineHeight: 1.5 }}>
              Vous recevrez un email de confirmation dès que votre compte sera activé.
            </p>
          </div>

          <button onClick={() => router.push('/')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#475569' }}>
            ← Retour à l'accueil
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0F172A', display: 'flex', fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Panneau gauche */}
      <div className="hidden lg:flex" style={{ width: '42%', background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', padding: '48px', flexDirection: 'column', justifyContent: 'space-between', borderRight: '1px solid rgba(255,255,255,0.06)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -80, right: -80, width: 320, height: 320, background: 'radial-gradient(circle, rgba(79,70,229,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -60, width: 280, height: 280, background: 'radial-gradient(circle, rgba(79,70,229,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, background: '#4F46E5', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'white', fontSize: 13, fontWeight: 700 }}>PM</span>
          </div>
          <span style={{ color: 'white', fontWeight: 600, fontSize: 16 }}>PulseMarket</span>
        </div>
        <div>
          {villeParam && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(79,70,229,0.15)', border: '1px solid rgba(79,70,229,0.3)', borderRadius: 100, padding: '6px 14px', marginBottom: 24 }}>
              <span style={{ width: 6, height: 6, background: '#4F46E5', borderRadius: '50%', display: 'inline-block' }} />
              <span style={{ fontSize: 12, color: '#818CF8', fontWeight: 600 }}>Espace réservé — {villeParam}</span>
            </div>
          )}
          <h2 style={{ color: 'white', fontSize: 30, fontWeight: 700, lineHeight: 1.2, letterSpacing: '-0.02em', marginBottom: 16 }}>
            La gestion des marchés,{' '}<span style={{ color: '#818CF8' }}>enfin numérisée</span>
          </h2>
          <p style={{ color: '#64748B', fontSize: 14, lineHeight: 1.7, marginBottom: 36 }}>
            PulseMarket permet à toutes les communes, comités des fêtes et associations de gérer leurs marchés et exposants en ligne.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { icon: <Building2 size={15} style={{ color: '#818CF8' }} />, text: 'Mairies, comités des fêtes, associations' },
              { icon: <CheckCircle size={15} style={{ color: '#818CF8' }} />, text: 'Dossiers exposants vérifiés automatiquement' },
              { icon: <ShieldCheck size={15} style={{ color: '#818CF8' }} />, text: 'Redevances AOT collectées via Stripe' },
              { icon: <Clock size={15} style={{ color: '#818CF8' }} />, text: 'Validation des comptes sous 24-48h' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 32, height: 32, background: 'rgba(79,70,229,0.12)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{item.icon}</div>
                <span style={{ color: '#94A3B8', fontSize: 13 }}>{item.text}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 28, marginTop: 36 }}>
            {[{ val: '36 000', label: 'communes FR' }, { val: 'RGPD', label: 'conforme' }, { val: '100%', label: 'données FR' }].map((s, i) => (
              <div key={i}>
                <p style={{ fontSize: 18, fontWeight: 800, color: 'white', marginBottom: 2 }}>{s.val}</p>
                <p style={{ fontSize: 11, color: '#475569' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ShieldCheck size={14} style={{ color: '#475569' }} />
          <p style={{ color: '#334155', fontSize: 12 }}>© 2026 PulseMarket SAS — Données hébergées en France</p>
        </div>
      </div>

      {/* Formulaire */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 20px' }}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ width: '100%', maxWidth: 440 }}>

          <div className="lg:hidden" style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div style={{ width: 30, height: 30, background: '#4F46E5', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: 'white', fontSize: 11, fontWeight: 700 }}>PM</span>
              </div>
              <span style={{ fontWeight: 700, fontSize: 15, color: 'white' }}>PulseMarket</span>
            </div>
            {villeParam && <p style={{ fontSize: 12, color: '#4F46E5', fontWeight: 600 }}>Espace réservé — {villeParam}</p>}
          </div>

          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(79,70,229,0.15)', border: '1px solid rgba(79,70,229,0.25)', borderRadius: 100, padding: '5px 12px', marginBottom: 16 }}>
              <Building2 size={12} style={{ color: '#818CF8' }} />
              <span style={{ fontSize: 11, color: '#818CF8', fontWeight: 600 }}>Espace Organisateur</span>
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: 'white', letterSpacing: '-0.02em', marginBottom: 6 }}>
              {tab === 'signin' ? 'Connexion à votre espace' : 'Créer votre compte organisateur'}
            </h1>
            <p style={{ fontSize: 14, color: '#475569' }}>
              {tab === 'signin' ? 'Accédez à votre tableau de bord.' : 'Votre dossier sera vérifié sous 24-48h.'}
            </p>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 4, display: 'flex', marginBottom: 24, border: '1px solid rgba(255,255,255,0.08)' }}>
            {[{ val: 'signin', label: 'Connexion' }, { val: 'signup', label: 'Inscription' }].map(t => (
              <button key={t.val} onClick={() => { setTab(t.val as any); setError('') }}
                style={{ flex: 1, padding: '9px 0', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none', background: tab === t.val ? '#4F46E5' : 'transparent', color: tab === t.val ? 'white' : '#475569', transition: 'all 0.2s' }}>
                {t.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {tab === 'signup' && (
              <>
                {/* Type organisation */}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Type d'organisation</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {ORG_TYPES.map(t => (
                      <button key={t.val} onClick={() => setOrgType(t.val)}
                        style={{ padding: '10px 12px', border: orgType === t.val ? '1.5px solid #4F46E5' : '1px solid rgba(255,255,255,0.08)', borderRadius: 10, background: orgType === t.val ? 'rgba(79,70,229,0.15)' : 'rgba(255,255,255,0.03)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}>
                        <div style={{ color: orgType === t.val ? '#818CF8' : '#475569', marginBottom: 4 }}>{t.icon}</div>
                        <p style={{ fontSize: 12, fontWeight: 600, color: orgType === t.val ? '#C7D2FE' : '#64748B' }}>{t.label}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Nom organisation */}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Nom de l'organisation <span style={{ color: '#EF4444' }}>*</span></label>
                  <input type="text" placeholder={selectedOrgType.placeholder} value={orgName} onChange={e => setOrgName(e.target.value)} onKeyDown={handleKeyDown}
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#4F46E5'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                </div>

                {/* SIRET */}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Numéro SIRET <span style={{ color: '#EF4444' }}>*</span></label>
                  <input type="text" placeholder="213 130 011 00019" value={siret} onChange={e => setSiret(e.target.value)} onKeyDown={handleKeyDown}
                    style={inputStyle} maxLength={17}
                    onFocus={e => e.target.style.borderColor = '#4F46E5'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                  <p style={{ fontSize: 11, color: '#475569', marginTop: 5 }}>Le SIRET de votre commune ou organisation (14 chiffres)</p>
                </div>

                {/* Justificatif */}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Document justificatif <span style={{ color: '#EF4444' }}>*</span></label>
                  <label style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '12px', border: `1.5px dashed ${justificatif ? '#4F46E5' : 'rgba(255,255,255,0.15)'}`,
                    borderRadius: 10, cursor: 'pointer', fontSize: 13,
                    color: justificatif ? '#818CF8' : '#475569',
                    background: justificatif ? 'rgba(79,70,229,0.08)' : 'transparent',
                    transition: 'all 0.2s',
                  }}>
                    <Upload size={14} />
                    {justificatif ? justificatif.name : 'Arrêté municipal, délibération ou carte agent'}
                    <input type="file" accept=".pdf,image/jpeg,image/png" style={{ display: 'none' }}
                      onChange={e => setJustificatif(e.target.files?.[0] || null)} />
                  </label>
                  <p style={{ fontSize: 11, color: '#475569', marginTop: 5 }}>PDF, JPG ou PNG — max 10MB</p>
                </div>
              </>
            )}

            {/* Email */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Adresse email <span style={{ color: '#EF4444' }}>*</span></label>
              <input type="email" placeholder="contact@mairie-aubagne.fr" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={handleKeyDown}
                style={inputStyle} autoFocus={tab === 'signin'}
                onFocus={e => e.target.style.borderColor = '#4F46E5'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
            </div>

            {/* Mot de passe */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Mot de passe <span style={{ color: '#EF4444' }}>*</span></label>
                {tab === 'signin' && (
                  <button onClick={async () => {
                    if (!email) { setError('Entrez votre email d\'abord'); return }
                    await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/reset` })
                    setError(''); alert('Email de réinitialisation envoyé à ' + email)
                  }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#4F46E5', fontWeight: 500 }}>
                    Mot de passe oublié ?
                  </button>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                <input type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={handleKeyDown}
                  style={{ ...inputStyle, paddingRight: 42 }}
                  onFocus={e => e.target.style.borderColor = '#4F46E5'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: 0 }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Barre tentatives */}
            {tab === 'signin' && attemptCount > 0 && !isLocked && (
              <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, padding: '8px 12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#F59E0B', marginBottom: 6 }}>
                  <span>Tentatives incorrectes</span>
                  <span>{attemptCount}/{MAX_ATTEMPTS}</span>
                </div>
                <div style={{ height: 3, background: 'rgba(245,158,11,0.2)', borderRadius: 100, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(attemptCount / MAX_ATTEMPTS) * 100}%`, background: '#F59E0B', borderRadius: 100 }} />
                </div>
              </div>
            )}

            {isLocked && (
              <div style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)', borderRadius: 8, padding: '12px 14px', textAlign: 'center' }}>
                <p style={{ fontSize: 13, color: '#FCA5A5', fontWeight: 600 }}>Accès temporairement bloqué</p>
                <p style={{ fontSize: 12, color: '#F87171', marginTop: 4 }}>Réessayez dans {getRemainingMinutes(lockedUntil)} minute(s)</p>
              </div>
            )}

            {error && !isLocked && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)', borderRadius: 8, padding: '10px 14px' }}>
                <p style={{ fontSize: 13, color: '#FCA5A5' }}>{error}</p>
              </motion.div>
            )}

            <button onClick={tab === 'signin' ? handleSignIn : handleSignUp} disabled={loading || isLocked}
              style={{ width: '100%', padding: '13px 0', background: isLocked ? '#374151' : loading ? '#3730A3' : '#4F46E5', color: isLocked ? '#6B7280' : 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: loading || isLocked ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 }}>
              {loading
                ? <><Loader size={15} style={{ animation: 'spin 0.8s linear infinite' }} /> Chargement...</>
                : isLocked ? 'Accès bloqué'
                : tab === 'signin' ? <>'Accéder à mon espace' <ArrowRight size={15} /></>
                : <>'Envoyer ma demande' <ArrowRight size={15} /></>
              }
            </button>

            <p style={{ textAlign: 'center', fontSize: 13, color: '#334155' }}>
              Exposant ?{' '}
              <button onClick={() => router.push('/auth')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4F46E5', fontSize: 13, fontWeight: 500 }}>
                Connexion exposant →
              </button>
            </p>
          </div>
        </motion.div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default function AuthOrganisateurPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, border: '2px solid #4F46E5', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    }>
      <AuthOrganisateurForm />
    </Suspense>
  )
}
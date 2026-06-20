'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from '@/components/Sidebar'
import {
  Building2, Shield, Users, Activity, FileText, CreditCard,
  Lock, Mail, MapPin, Upload, CheckCircle, XCircle, Loader,
  Save, AlertTriangle, Eye, EyeOff, RefreshCw, Clock,
  Settings, ChevronRight, Image as ImageIcon, X, Trash2,
  KeyRound, Smartphone, Globe, Phone
} from 'lucide-react'

const BRAND = '#4F46E5'

type Tab = 'organisation' | 'securite' | 'equipe' | 'audit' | 'rgpd' | 'facturation'

const TABS: { id: Tab; label: string; icon: any; available: boolean; sessionMessage?: string }[] = [
  { id: 'organisation', label: 'Organisation', icon: <Building2 size={14} />, available: true },
  { id: 'securite',     label: 'Sécurité',     icon: <Shield size={14} />,     available: true },
  { id: 'equipe', label: 'Équipe', icon: <Users size={14} />, available: true },
  { id: 'audit', label: 'Audit & Logs', icon: <Activity size={14} />, available: true },
  { id: 'rgpd',         label: 'RGPD & Légal', icon: <FileText size={14} />,   available: false, sessionMessage: 'Bientôt disponible' },
  { id: 'facturation',  label: 'Facturation',  icon: <CreditCard size={14} />, available: false, sessionMessage: 'Bientôt disponible' },
]

function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error' | 'info'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t) }, [onClose])
  const colors = { success: '#16A34A', error: '#DC2626', info: BRAND }
  const Icon = type === 'success' ? CheckCircle : type === 'error' ? XCircle : Activity
  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 2000, background: 'white', borderRadius: 12, padding: '12px 18px', boxShadow: '0 8px 32px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: 10, borderLeft: `3px solid ${colors[type]}`, minWidth: 280 }}>
      <Icon size={15} style={{ color: colors[type] }} />
      <span style={{ fontSize: 13, fontWeight: 500, color: '#0F172A' }}>{message}</span>
    </motion.div>
  )
}

// ✅ Composant Field réutilisable
function Field({ label, icon, required, children, hint, error }: any) {
  return (
    <div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
        {icon}
        {label}
        {required && <span style={{ color: '#DC2626' }}>*</span>}
      </label>
      {children}
      {hint && !error && <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>{hint}</p>}
      {error && <p style={{ fontSize: 11, color: '#DC2626', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}><AlertTriangle size={10} /> {error}</p>}
    </div>
  )
}

const inputStyle = {
  width: '100%', padding: '10px 12px', border: '1px solid #E2E8F0', borderRadius: 8,
  fontSize: 13, color: '#0F172A', outline: 'none', boxSizing: 'border-box' as const,
  fontFamily: 'inherit', background: 'white',
}

// Password strength helper
function getPasswordStrength(pwd: string): { score: number; label: string; color: string } {
  if (!pwd) return { score: 0, label: '', color: '#E2E8F0' }
  let score = 0
  if (pwd.length >= 8) score++
  if (pwd.length >= 12) score++
  if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++
  if (/\d/.test(pwd)) score++
  if (/[^a-zA-Z0-9]/.test(pwd)) score++
  if (score <= 2) return { score, label: 'Faible', color: '#DC2626' }
  if (score === 3) return { score, label: 'Moyen', color: '#F59E0B' }
  if (score === 4) return { score, label: 'Fort', color: '#16A34A' }
  return { score, label: 'Très fort', color: '#15803D' }
}

export default function ParametresMairie() {
  const [profile, setProfile] = useState<any>(null)
  const [settings, setSettings] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('organisation')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)

  // Sécurité
  const [twoFAEnabled, setTwoFAEnabled] = useState(false)
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPwd, setShowNewPwd] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [sessionTimeout, setSessionTimeout] = useState(30)
  const [recoveryEmail, setRecoveryEmail] = useState('')
  const [recoveryPhone, setRecoveryPhone] = useState('')

  const router = useRouter()
  const supabase = createClient()
  const logoInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (profileData?.role !== 'organisateur') { router.push('/dashboard'); return }
      setProfile(profileData)

      // Charger settings organisation
      const { data: settingsData } = await supabase
        .from('organisation_settings')
        .select('*')
        .eq('mairie_id', user.id)
        .maybeSingle()
      if (settingsData) {
        setSettings(settingsData)
      } else {
        // Pré-remplir avec profil de base
        setSettings({
          nom_officiel: profileData?.organisation_name || profileData?.full_name || '',
          contact_email: profileData?.email || '',
          representant_email: profileData?.email || '',
        })
      }

      // 2FA status
      setTwoFAEnabled(!!(profileData as any)?.two_fa_enabled)
      setSessionTimeout((profileData as any)?.session_timeout_minutes || 30)
      setRecoveryEmail((profileData as any)?.recovery_email || profileData?.email || '')
      setRecoveryPhone((profileData as any)?.recovery_phone || profileData?.phone || '')

      setLoading(false)
    }
    getData()
  }, [])

  const updateField = (key: string, value: any) => {
    setSettings((prev: any) => ({ ...prev, [key]: value }))
  }

  // ✅ Sauvegarder Organisation
  const handleSaveOrganisation = async () => {
    if (!profile) return
    setSaving(true)
    try {
      const payload = { ...settings, mairie_id: profile.id, updated_at: new Date().toISOString() }
      const { error } = await supabase
        .from('organisation_settings')
        .upsert(payload, { onConflict: 'mairie_id' })
      if (error) throw error
      setToast({ message: 'Organisation mise à jour', type: 'success' })
    } catch (err: any) {
      setToast({ message: 'Erreur : ' + err.message, type: 'error' })
    }
    setSaving(false)
  }

  // ✅ Upload logo
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profile) return
    if (file.size > 5 * 1024 * 1024) {
      setToast({ message: 'Logo trop volumineux (max 5MB)', type: 'error' })
      return
    }
    setUploadingLogo(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `${profile.id}/logo-${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('mairie-assets')
        .upload(path, file, { upsert: true })
      if (uploadError) throw uploadError
      const { data } = supabase.storage.from('mairie-assets').getPublicUrl(path)
      updateField('logo_url', data.publicUrl)
      // Save immédiat
      await supabase.from('organisation_settings').upsert({
        mairie_id: profile.id,
        logo_url: data.publicUrl,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'mairie_id' })
      setToast({ message: 'Logo téléversé', type: 'success' })
    } catch (err: any) {
      setToast({ message: 'Erreur upload : ' + err.message, type: 'error' })
    }
    setUploadingLogo(false)
  }

  // ✅ Changement de mot de passe
  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setToast({ message: 'Les mots de passe ne correspondent pas', type: 'error' })
      return
    }
    const strength = getPasswordStrength(newPassword)
    if (strength.score < 4) {
      setToast({ message: 'Mot de passe trop faible. Min 12 chars, majuscule, chiffre, spécial', type: 'error' })
      return
    }
    setChangingPassword(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      await supabase.from('profiles').update({
        password_changed_at: new Date().toISOString(),
      }).eq('id', profile.id)
      setToast({ message: 'Mot de passe modifié', type: 'success' })
      setNewPassword('')
      setConfirmPassword('')
      setShowPasswordChange(false)
    } catch (err: any) {
      setToast({ message: 'Erreur : ' + err.message, type: 'error' })
    }
    setChangingPassword(false)
  }

  // ✅ Toggle 2FA (placeholder pour future implémentation TOTP)
  const handleToggle2FA = async () => {
    if (twoFAEnabled) {
      setToast({ message: 'Le 2FA est obligatoire pour les mairies (conformité)', type: 'error' })
      return
    }
    setToast({ message: '2FA en cours de configuration... (Session B)', type: 'info' })
  }

  // ✅ Save sécurité
  const handleSaveSecurity = async () => {
    setSaving(true)
    try {
      await supabase.from('profiles').update({
        session_timeout_minutes: sessionTimeout,
        recovery_email: recoveryEmail,
        recovery_phone: recoveryPhone,
      } as any).eq('id', profile.id)
      setToast({ message: 'Paramètres de sécurité mis à jour', type: 'success' })
    } catch (err: any) {
      setToast({ message: 'Erreur : ' + err.message, type: 'error' })
    }
    setSaving(false)
  }

  const pwdStrength = getPasswordStrength(newPassword)

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 28, height: 28, border: `2px solid ${BRAND}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <Sidebar profile={profile} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <AnimatePresence>{toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}</AnimatePresence>

      <div style={{ marginLeft: 220, flex: 1, minWidth: 0 }}>

        {/* Header */}
        <header style={{ background: 'white', borderBottom: '1px solid #E2E8F0', padding: '0 28px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, background: '#EEF2FF', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Settings size={14} style={{ color: BRAND }} />
            </div>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>Paramètres mairie</p>
            <span style={{ background: '#0F172A', color: 'white', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, letterSpacing: '0.05em' }}>RGPD</span>
          </div>
        </header>

        <div style={{ display: 'flex' }}>

          {/* Tabs verticales */}
          <aside style={{ width: 220, background: 'white', borderRight: '1px solid #E2E8F0', minHeight: 'calc(100vh - 52px)', padding: '16px 12px' }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '0 8px 8px' }}>Configuration</p>
            {TABS.map(tab => (
                <button key={tab.id} onClick={() => {
                    if (!tab.available) return
                    if (tab.id === 'equipe') {
                        router.push('/dashboard/parametres/mairie/equipe')
                    } else if (tab.id === 'audit') {
                        router.push('/dashboard/parametres/mairie/audit')
                    } else {
                         setActiveTab(tab.id)
                     }
                }}
                disabled={!tab.available}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 9,
                  padding: '9px 10px', borderRadius: 8, marginBottom: 2,
                  background: activeTab === tab.id ? '#EEF2FF' : 'transparent',
                  border: activeTab === tab.id ? `1px solid #C7D2FE` : '1px solid transparent',
                  color: !tab.available ? '#CBD5E1' : activeTab === tab.id ? BRAND : '#475569',
                  fontSize: 12, fontWeight: activeTab === tab.id ? 600 : 500,
                  cursor: tab.available ? 'pointer' : 'not-allowed',
                  textAlign: 'left',
                  transition: 'all 0.15s',
                }}>
                {tab.icon}
                <span style={{ flex: 1 }}>{tab.label}</span>
                {!tab.available && <Clock size={10} style={{ color: '#CBD5E1' }} />}
              </button>
            ))}
          </aside>

          {/* Main content */}
          <main style={{ flex: 1, padding: '24px 28px', maxWidth: 760 }}>

            {/* ====== TAB ORGANISATION ====== */}
            {activeTab === 'organisation' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                <div>
                  <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>Identité de l'organisation</h1>
                  <p style={{ fontSize: 13, color: '#64748B' }}>Ces informations apparaissent sur les factures, QR codes et documents officiels générés.</p>
                </div>

                {/* Logo */}
                <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 12 }}>Logo officiel</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{
                      width: 100, height: 100, borderRadius: 12,
                      background: settings.logo_url ? 'white' : '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      overflow: 'hidden', flexShrink: 0,
                    }}>
                      {settings.logo_url ? (
                        <img src={settings.logo_url} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      ) : (
                        <ImageIcon size={26} style={{ color: '#CBD5E1' }} />
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
                      <button onClick={() => logoInputRef.current?.click()} disabled={uploadingLogo}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, background: BRAND, color: 'white', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', marginBottom: 8 }}>
                        {uploadingLogo ? <Loader size={12} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Upload size={12} />}
                        {uploadingLogo ? 'Téléversement...' : settings.logo_url ? 'Changer le logo' : 'Téléverser un logo'}
                      </button>
                      {settings.logo_url && (
                        <button onClick={() => updateField('logo_url', '')}
                          style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', color: '#DC2626', fontSize: 11, cursor: 'pointer', padding: 0 }}>
                          <Trash2 size={10} /> Retirer
                        </button>
                      )}
                      <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 6 }}>PNG, JPG ou SVG · Max 5MB · 200×200px recommandé</p>
                    </div>
                  </div>
                </div>

                {/* Identité */}
                <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>Identité officielle</p>

                  <Field label="Nom officiel" icon={<Building2 size={11} />} required>
                    <input type="text" value={settings.nom_officiel || ''} onChange={e => updateField('nom_officiel', e.target.value)}
                      placeholder="Mairie de Aubagne" style={inputStyle} />
                  </Field>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <Field label="SIRET" icon={<Shield size={11} />}>
                      <input type="text" value={settings.siret || ''} onChange={e => updateField('siret', e.target.value)}
                        placeholder="21130007900015" style={inputStyle} maxLength={14} />
                    </Field>
                    <Field label="Code INSEE" icon={<MapPin size={11} />}>
                      <input type="text" value={settings.code_insee || ''} onChange={e => updateField('code_insee', e.target.value)}
                        placeholder="13007" style={inputStyle} maxLength={5} />
                    </Field>
                  </div>

                  <Field label="Type de collectivité" icon={<Building2 size={11} />}>
                    <select value={settings.type_collectivite || 'commune'} onChange={e => updateField('type_collectivite', e.target.value)}
                      style={inputStyle}>
                      <option value="commune">Commune</option>
                      <option value="intercommunalite">Intercommunalité / EPCI</option>
                      <option value="departement">Département</option>
                      <option value="region">Région</option>
                    </select>
                  </Field>
                </div>

                {/* Adresse */}
                <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>Adresse officielle</p>

                  <Field label="Adresse ligne 1" icon={<MapPin size={11} />}>
                    <input type="text" value={settings.adresse_ligne1 || ''} onChange={e => updateField('adresse_ligne1', e.target.value)}
                      placeholder="Hôtel de Ville, Boulevard Jean Jaurès" style={inputStyle} />
                  </Field>

                  <Field label="Adresse ligne 2" icon={<MapPin size={11} />}>
                    <input type="text" value={settings.adresse_ligne2 || ''} onChange={e => updateField('adresse_ligne2', e.target.value)}
                      placeholder="(facultatif)" style={inputStyle} />
                  </Field>

                  <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: 12 }}>
                    <Field label="CP" icon={<MapPin size={11} />}>
                      <input type="text" value={settings.code_postal || ''} onChange={e => updateField('code_postal', e.target.value)}
                        placeholder="13400" style={inputStyle} maxLength={5} />
                    </Field>
                    <Field label="Ville" icon={<MapPin size={11} />}>
                      <input type="text" value={settings.ville || ''} onChange={e => updateField('ville', e.target.value)}
                        placeholder="Aubagne" style={inputStyle} />
                    </Field>
                  </div>
                </div>

                {/* Représentant */}
                <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>Représentant légal</p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px', gap: 12 }}>
                    <Field label="Nom complet" icon={<Building2 size={11} />}>
                      <input type="text" value={settings.representant_nom || ''} onChange={e => updateField('representant_nom', e.target.value)}
                        placeholder="Jean Dupont" style={inputStyle} />
                    </Field>
                    <Field label="Titre" icon={<Shield size={11} />}>
                      <select value={settings.representant_titre || 'Maire'} onChange={e => updateField('representant_titre', e.target.value)}
                        style={inputStyle}>
                        <option>Maire</option>
                        <option>Président</option>
                        <option>Adjoint</option>
                        <option>Directeur</option>
                        <option>Autre</option>
                      </select>
                    </Field>
                  </div>

                  <Field label="Email du représentant" icon={<Mail size={11} />}>
                    <input type="email" value={settings.representant_email || ''} onChange={e => updateField('representant_email', e.target.value)}
                      placeholder="maire@ville.fr" style={inputStyle} />
                  </Field>
                </div>

                {/* Contact officiel */}
                <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>Contact officiel</p>

                  <Field label="Email général" icon={<Mail size={11} />}>
                    <input type="email" value={settings.contact_email || ''} onChange={e => updateField('contact_email', e.target.value)}
                      placeholder="contact@ville.fr" style={inputStyle} />
                  </Field>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <Field label="Téléphone" icon={<Phone size={11} />}>
                      <input type="tel" value={settings.contact_telephone || ''} onChange={e => updateField('contact_telephone', e.target.value)}
                        placeholder="04 42 ..." style={inputStyle} />
                    </Field>
                    <Field label="Site web" icon={<Globe size={11} />}>
                      <input type="url" value={settings.site_web || ''} onChange={e => updateField('site_web', e.target.value)}
                        placeholder="https://ville.fr" style={inputStyle} />
                    </Field>
                  </div>
                </div>

                {/* Save button */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 8 }}>
                  <button onClick={handleSaveOrganisation} disabled={saving}
                    style={{ display: 'flex', alignItems: 'center', gap: 7, background: BRAND, color: 'white', border: 'none', borderRadius: 10, padding: '11px 22px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                    {saving ? <Loader size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Save size={14} />}
                    {saving ? 'Sauvegarde...' : 'Enregistrer'}
                  </button>
                </div>
              </motion.div>
            )}

            {/* ====== TAB SÉCURITÉ ====== */}
            {activeTab === 'securite' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                <div>
                  <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>Sécurité du compte</h1>
                  <p style={{ fontSize: 13, color: '#64748B' }}>Renforcez la protection de votre espace mairie. Certaines mesures sont obligatoires en conformité RGPD.</p>
                </div>

                {/* 2FA OBLIGATOIRE */}
                <div style={{ background: 'white', border: `1.5px solid ${twoFAEnabled ? '#BBF7D0' : '#FDE68A'}`, borderRadius: 12, padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
                    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flex: 1 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: twoFAEnabled ? '#F0FDF4' : '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Smartphone size={18} style={{ color: twoFAEnabled ? '#16A34A' : '#F59E0B' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <p style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Authentification à 2 facteurs</p>
                          <span style={{ background: '#DC2626', color: 'white', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, letterSpacing: '0.05em' }}>OBLIGATOIRE</span>
                        </div>
                        <p style={{ fontSize: 12, color: '#64748B', lineHeight: 1.5 }}>
                          Code à 6 chiffres envoyé par SMS ou via application (Google Authenticator). Indispensable pour la conformité RGPD.
                        </p>
                      </div>
                    </div>
                    <button onClick={handleToggle2FA}
                      style={{ background: twoFAEnabled ? '#F0FDF4' : BRAND, color: twoFAEnabled ? '#16A34A' : 'white', border: twoFAEnabled ? '1px solid #BBF7D0' : 'none', borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5 }}>
                      {twoFAEnabled ? <><CheckCircle size={12} /> Activé</> : <>Activer maintenant</>}
                    </button>
                  </div>

                  {!twoFAEnabled && (
                    <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, padding: '10px 12px', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <AlertTriangle size={13} style={{ color: '#F59E0B', flexShrink: 0, marginTop: 1 }} />
                      <p style={{ fontSize: 11, color: '#92400E', lineHeight: 1.5 }}>
                        Vous serez bientôt invité à configurer la 2FA. Sans elle, certaines fonctions sensibles (suppression de données, gestion d'équipe) seront restreintes.
                      </p>
                    </div>
                  )}
                </div>

                {/* Mot de passe */}
                <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: showPasswordChange ? 16 : 0 }}>
                    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <KeyRound size={18} style={{ color: BRAND }} />
                      </div>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>Mot de passe</p>
                        <p style={{ fontSize: 12, color: '#64748B' }}>
                          {profile?.password_changed_at
                            ? `Modifié le ${new Date(profile.password_changed_at).toLocaleDateString('fr-FR')}`
                            : 'Modifiez votre mot de passe régulièrement'
                          }
                        </p>
                      </div>
                    </div>
                    <button onClick={() => setShowPasswordChange(!showPasswordChange)}
                      style={{ background: 'white', color: BRAND, border: `1px solid ${BRAND}40`, borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      {showPasswordChange ? 'Annuler' : 'Modifier'}
                    </button>
                  </div>

                  {showPasswordChange && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                      style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 16, borderTop: '1px solid #F1F5F9' }}>

                      <div style={{ background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 8, padding: '10px 12px' }}>
                        <p style={{ fontSize: 11, color: '#4338CA', lineHeight: 1.5, fontWeight: 500 }}>
                          Pour les mairies, le mot de passe doit contenir au minimum : 12 caractères, 1 majuscule, 1 minuscule, 1 chiffre, 1 caractère spécial.
                        </p>
                      </div>

                      <Field label="Nouveau mot de passe">
                        <div style={{ position: 'relative' }}>
                          <input type={showNewPwd ? 'text' : 'password'} value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            placeholder="••••••••••••"
                            style={{ ...inputStyle, paddingRight: 36 }} />
                          <button type="button" onClick={() => setShowNewPwd(!showNewPwd)}
                            style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', color: '#94A3B8' }}>
                            {showNewPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                        {newPassword && (
                          <div style={{ marginTop: 8 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                              <span style={{ fontSize: 10, color: '#94A3B8' }}>Force</span>
                              <span style={{ fontSize: 10, fontWeight: 700, color: pwdStrength.color }}>{pwdStrength.label}</span>
                            </div>
                            <div style={{ height: 4, background: '#F1F5F9', borderRadius: 100, overflow: 'hidden' }}>
                              <div style={{
                                height: '100%',
                                width: `${(pwdStrength.score / 5) * 100}%`,
                                background: pwdStrength.color,
                                transition: 'all 0.2s',
                              }} />
                            </div>
                          </div>
                        )}
                      </Field>

                      <Field label="Confirmer le mot de passe" error={confirmPassword && newPassword !== confirmPassword ? 'Les mots de passe ne correspondent pas' : undefined}>
                        <input type="password" value={confirmPassword}
                          onChange={e => setConfirmPassword(e.target.value)}
                          placeholder="••••••••••••"
                          style={inputStyle} />
                      </Field>

                      <button onClick={handleChangePassword} disabled={changingPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                        style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6, background: BRAND, color: 'white', border: 'none', borderRadius: 8, padding: '9px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: (!newPassword || !confirmPassword || newPassword !== confirmPassword) ? 0.5 : 1 }}>
                        {changingPassword ? <Loader size={12} style={{ animation: 'spin 0.8s linear infinite' }} /> : <CheckCircle size={12} />}
                        Modifier le mot de passe
                      </button>
                    </motion.div>
                  )}
                </div>

                {/* Session timeout */}
                <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20 }}>
                  <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 14 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Clock size={18} style={{ color: '#16A34A' }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>Déconnexion automatique</p>
                      <p style={{ fontSize: 12, color: '#64748B', lineHeight: 1.5 }}>
                        Vous serez déconnecté après cette période d'inactivité. Pour les comptes mairie, 30 minutes maximum recommandé.
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {[15, 30, 60, 120].map(m => (
                      <button key={m} onClick={() => setSessionTimeout(m)}
                        style={{
                          padding: '7px 14px', borderRadius: 8,
                          border: sessionTimeout === m ? `1.5px solid ${BRAND}` : '1px solid #E2E8F0',
                          background: sessionTimeout === m ? '#EEF2FF' : 'white',
                          color: sessionTimeout === m ? BRAND : '#475569',
                          fontSize: 12, fontWeight: sessionTimeout === m ? 600 : 500,
                          cursor: 'pointer',
                        }}>
                        {m < 60 ? `${m} min` : `${m / 60}h`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Email/Tel de récupération */}
                <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <RefreshCw size={18} style={{ color: '#F59E0B' }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>Récupération de compte</p>
                      <p style={{ fontSize: 12, color: '#64748B', lineHeight: 1.5 }}>
                        Email et téléphone utilisés en cas de perte d'accès à votre compte.
                      </p>
                    </div>
                  </div>

                  <Field label="Email de récupération" icon={<Mail size={11} />}>
                    <input type="email" value={recoveryEmail} onChange={e => setRecoveryEmail(e.target.value)}
                      placeholder="recovery@ville.fr" style={inputStyle} />
                  </Field>

                  <Field label="Téléphone de récupération" icon={<Phone size={11} />}>
                    <input type="tel" value={recoveryPhone} onChange={e => setRecoveryPhone(e.target.value)}
                      placeholder="06 ..." style={inputStyle} />
                  </Field>
                </div>

                {/* Save security */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 8 }}>
                  <button onClick={handleSaveSecurity} disabled={saving}
                    style={{ display: 'flex', alignItems: 'center', gap: 7, background: BRAND, color: 'white', border: 'none', borderRadius: 10, padding: '11px 22px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                    {saving ? <Loader size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Save size={14} />}
                    {saving ? 'Sauvegarde...' : 'Enregistrer'}
                  </button>
                </div>
              </motion.div>
            )}

            {/* ====== TABS BIENTÔT DISPONIBLES ====== */}
            {!TABS.find(t => t.id === activeTab)?.available && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ width: 64, height: 64, background: '#F8FAFC', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <Clock size={28} style={{ color: '#94A3B8' }} />
                </div>
                <p style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>Bientôt disponible</p>
                <p style={{ fontSize: 13, color: '#64748B', maxWidth: 380, margin: '0 auto' }}>
                  Cette section sera disponible dans une prochaine mise à jour.
                </p>
              </motion.div>
            )}

          </main>
        </div>
      </div>
    </div>
  )
}
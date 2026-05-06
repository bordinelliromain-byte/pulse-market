'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import Sidebar from '@/components/Sidebar'
import {
  User, Bell, Shield, CreditCard, Save, CheckCircle, Eye, EyeOff, Loader
} from 'lucide-react'

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
}
const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
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

export default function Parametres() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [notifEmail, setNotifEmail] = useState(true)
  const [notifSms, setNotifSms] = useState(false)
  const [notifNewEvent, setNotifNewEvent] = useState(true)
  const [newPassword, setNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const router = useRouter()
  const supabase = createClient()
  const isMobile = useIsMobile()

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(profileData)
      setFullName(profileData?.full_name || '')
      setEmail(user.email || '')
      setPhone(profileData?.phone || '')
      setLoading(false)
    }
    getData()
  }, [])

  const handleSave = async () => {
    setSaving(true); setMessage(null)
    try {
      const { data: { user } } = await supabase.auth.getUser(); if (!user) return
      await supabase.from('profiles').update({ full_name: fullName, phone }).eq('id', user.id)
      if (newPassword) await supabase.auth.updateUser({ password: newPassword })
      setMessage({ type: 'success', text: 'Paramètres sauvegardés avec succès' })
      setNewPassword('')
    } catch (err: any) { setMessage({ type: 'error', text: err.message }) }
    setSaving(false)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 28, height: 28, border: '2px solid #4F46E5', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <Sidebar profile={profile} />

      <div style={{ marginLeft: isMobile ? 0 : 220, flex: 1, minWidth: 0 }}>
        <header style={{ background: 'white', borderBottom: '1px solid #E2E8F0', padding: isMobile ? '0 14px 0 60px' : '0 28px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>Paramètres</p>
          <button onClick={handleSave} disabled={saving}
            style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#4F46E5', color: 'white', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={14} />}
            {saving ? 'Saving...' : 'Sauvegarder'}
          </button>
        </header>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

        <main style={{ padding: isMobile ? '14px' : '28px', maxWidth: 700, margin: '0 auto' }}>
          <motion.div variants={stagger} initial="hidden" animate="visible" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {message && (
              <motion.div variants={fadeUp} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 10, background: message.type === 'success' ? '#F0FDF4' : '#FEF2F2', border: `1px solid ${message.type === 'success' ? '#BBF7D0' : '#FECACA'}`, color: message.type === 'success' ? '#15803D' : '#DC2626', fontSize: 13, fontWeight: 500 }}>
                <CheckCircle size={15} /> {message.text}
              </motion.div>
            )}

            {/* Infos personnelles */}
            <motion.div variants={fadeUp} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 30, height: 30, background: '#EEF2FF', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={15} style={{ color: '#4F46E5' }} />
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>Informations personnelles</p>
                  <p style={{ fontSize: 11, color: '#94A3B8' }}>Nom, email, téléphone</p>
                </div>
              </div>
              <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { label: 'Nom complet', val: fullName, set: setFullName, placeholder: 'Votre nom', disabled: false },
                  { label: 'Email', val: email, set: () => {}, placeholder: '', disabled: true },
                  { label: 'Téléphone', val: phone, set: setPhone, placeholder: '+33 6 00 00 00 00', disabled: false },
                ].map((f, i) => (
                  <div key={i}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>{f.label}</label>
                    <input value={f.val} onChange={e => !f.disabled && f.set(e.target.value)} placeholder={f.placeholder} disabled={f.disabled}
                      style={{ width: '100%', padding: '9px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, color: f.disabled ? '#94A3B8' : '#0F172A', background: f.disabled ? '#F8FAFC' : '#FAFAFA', outline: 'none', boxSizing: 'border-box', cursor: f.disabled ? 'not-allowed' : 'text' }}
                      onFocus={e => { if (!f.disabled) { e.target.style.borderColor = '#4F46E5'; e.target.style.background = 'white' } }}
                      onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.background = f.disabled ? '#F8FAFC' : '#FAFAFA' }} />
                    {f.disabled && <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>L'email ne peut pas être modifié</p>}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Sécurité */}
            <motion.div variants={fadeUp} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 30, height: 30, background: '#EEF2FF', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Shield size={15} style={{ color: '#4F46E5' }} />
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>Sécurité</p>
                  <p style={{ fontSize: 11, color: '#94A3B8' }}>Changer votre mot de passe</p>
                </div>
              </div>
              <div style={{ padding: '18px' }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Nouveau mot de passe</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPassword ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Laissez vide pour ne pas changer"
                    style={{ width: '100%', padding: '9px 42px 9px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, color: '#0F172A', background: '#FAFAFA', outline: 'none', boxSizing: 'border-box' }}
                    onFocus={e => { e.target.style.borderColor = '#4F46E5'; e.target.style.background = 'white' }}
                    onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.background = '#FAFAFA' }} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}>
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Notifications */}
            <motion.div variants={fadeUp} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 30, height: 30, background: '#EEF2FF', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bell size={15} style={{ color: '#4F46E5' }} />
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>Notifications</p>
                  <p style={{ fontSize: 11, color: '#94A3B8' }}>Gérer vos alertes</p>
                </div>
              </div>
              <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { label: 'Notifications par email', sub: 'Candidatures, validations, messages', val: notifEmail, set: setNotifEmail },
                  { label: 'Notifications SMS', sub: 'Alertes urgentes (Plan Pro)', val: notifSms, set: setNotifSms },
                  { label: 'Alertes nouveaux événements', sub: "Notifié dès qu'un marché est publié près de vous", val: notifNewEvent, set: setNotifNewEvent },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: i < 2 ? 14 : 0, marginBottom: i < 2 ? 14 : 0, borderBottom: i < 2 ? '1px solid #F8FAFC' : 'none', gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 500, color: '#0F172A' }}>{item.label}</p>
                      <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{item.sub}</p>
                    </div>
                    <button onClick={() => item.set(!item.val)}
                      style={{ width: 44, height: 24, borderRadius: 100, border: 'none', cursor: 'pointer', background: item.val ? '#4F46E5' : '#E2E8F0', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                      <div style={{ width: 18, height: 18, background: 'white', borderRadius: '50%', position: 'absolute', top: 3, left: item.val ? 23 : 3, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Plan exposant */}
            {profile?.role === 'exposant' && (
              <motion.div variants={fadeUp} style={{ background: '#0F172A', borderRadius: 12, padding: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 30, height: 30, background: 'rgba(79,70,229,0.2)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CreditCard size={15} style={{ color: '#818CF8' }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'white' }}>Mon abonnement</p>
                    <p style={{ fontSize: 11, color: '#475569' }}>Plan actuel et facturation</p>
                  </div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '12px 14px', marginBottom: 12 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'white', marginBottom: 3 }}>Plan Gratuit</p>
                  <p style={{ fontSize: 12, color: '#64748B' }}>1 candidature par mois · Accès limité</p>
                </div>
                <button style={{ width: '100%', background: '#4F46E5', color: 'white', border: 'none', borderRadius: 9, padding: '11px 0', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  Passer au Plan Pro — 20€/mois
                </button>
              </motion.div>
            )}

            {/* Danger zone */}
            <motion.div variants={fadeUp} style={{ background: 'white', border: '1px solid #FECACA', borderRadius: 12, padding: '18px' }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#DC2626', marginBottom: 4 }}>Zone de danger</p>
              <p style={{ fontSize: 12, color: '#94A3B8', marginBottom: 14 }}>La suppression de votre compte est irréversible.</p>
              <button onClick={() => { if (confirm('Êtes-vous sûr de vouloir supprimer votre compte ?')) supabase.auth.signOut().then(() => router.push('/')) }}
                style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: 9, padding: '9px 18px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                Supprimer mon compte
              </button>
            </motion.div>

          </motion.div>
        </main>
      </div>
    </div>
  )
}
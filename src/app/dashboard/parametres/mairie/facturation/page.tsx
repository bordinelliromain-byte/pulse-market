'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from '@/components/Sidebar'
import {
  CreditCard, Building2, Receipt, FileText, Loader,
  CheckCircle, XCircle, ArrowLeft, Save, Info, Lock,
  Sparkles, Crown, Check, Star, Zap, AlertTriangle,
  Wallet, Hash
} from 'lucide-react'

const BRAND = '#4F46E5'

function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t) }, [onClose])
  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 2000, background: 'white', borderRadius: 12, padding: '12px 18px', boxShadow: '0 8px 32px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: 10, borderLeft: `3px solid ${type === 'success' ? '#16A34A' : '#DC2626'}`, minWidth: 280 }}>
      {type === 'success' ? <CheckCircle size={15} style={{ color: '#16A34A' }} /> : <XCircle size={15} style={{ color: '#DC2626' }} />}
      <span style={{ fontSize: 13, fontWeight: 500, color: '#0F172A' }}>{message}</span>
    </motion.div>
  )
}

function Field({ label, icon, required, children, hint, error }: any) {
  return (
    <div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
        {icon} {label} {required && <span style={{ color: '#DC2626' }}>*</span>}
      </label>
      {children}
      {hint && !error && <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>{hint}</p>}
      {error && <p style={{ fontSize: 11, color: '#DC2626', marginTop: 4 }}>{error}</p>}
    </div>
  )
}

const inputStyle = {
  width: '100%', padding: '10px 12px', border: '1px solid #E2E8F0', borderRadius: 8,
  fontSize: 13, color: '#0F172A', outline: 'none', boxSizing: 'border-box' as const,
  fontFamily: 'inherit', background: 'white',
}

// Validation IBAN format français basique
function validateIBAN(iban: string): boolean {
  const clean = iban.replace(/\s/g, '').toUpperCase()
  if (clean.length < 14 || clean.length > 34) return false
  return /^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(clean)
}

// Format IBAN avec espaces tous les 4 char
function formatIBAN(iban: string): string {
  const clean = iban.replace(/\s/g, '').toUpperCase()
  return clean.match(/.{1,4}/g)?.join(' ') || clean
}

export default function FacturationPage() {
  const [profile, setProfile] = useState<any>(null)
  const [settings, setSettings] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [activeTab, setActiveTab] = useState<'banque' | 'fiscal' | 'plan'>('banque')
  const [showIban, setShowIban] = useState(false)
  const [ibanError, setIbanError] = useState<string | null>(null)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (profileData?.role !== 'organisateur') { router.push('/dashboard'); return }
      setProfile(profileData)

      const { data: settingsData } = await supabase
        .from('organisation_settings')
        .select('*')
        .eq('mairie_id', user.id)
        .maybeSingle()
      if (settingsData) setSettings(settingsData)

      setLoading(false)
    }
    getData()
  }, [])

  const updateField = (key: string, value: any) => {
    setSettings((prev: any) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    if (!profile) return
    if (settings.iban && !validateIBAN(settings.iban)) {
      setIbanError('Format IBAN invalide')
      return
    }
    setIbanError(null)
    setSaving(true)
    try {
      const payload = { ...settings, mairie_id: profile.id, updated_at: new Date().toISOString() }
      const { error } = await supabase
        .from('organisation_settings')
        .upsert(payload, { onConflict: 'mairie_id' })
      if (error) throw error

      await fetch('/api/audit-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'settings_organisation_update', details: { section: 'facturation' } })
      }).catch(() => {})

      setToast({ message: 'Paramètres de facturation enregistrés', type: 'success' })
    } catch (err: any) {
      setToast({ message: 'Erreur : ' + err.message, type: 'error' })
    }
    setSaving(false)
  }

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
        <header style={{ background: 'white', borderBottom: '1px solid #E2E8F0', padding: '0 28px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => router.push('/dashboard/parametres/mairie')}
              style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', fontSize: 12 }}>
              <ArrowLeft size={13} /> Paramètres
            </button>
            <div style={{ width: 1, height: 16, background: '#E2E8F0' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CreditCard size={14} style={{ color: BRAND }} />
              <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>Facturation</p>
            </div>
          </div>
        </header>

        <main style={{ padding: '24px 28px', maxWidth: 900 }}>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'white', border: '1px solid #E2E8F0', borderRadius: 10, padding: 4 }}>
            {[
              { id: 'banque' as const, label: 'Coordonnées bancaires', icon: <Wallet size={13} /> },
              { id: 'fiscal' as const, label: 'Fiscalité', icon: <Receipt size={13} /> },
              { id: 'plan' as const, label: 'Plan & Abonnement', icon: <Sparkles size={13} /> },
            ].map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '9px 12px', borderRadius: 7, cursor: 'pointer',
                  background: activeTab === t.id ? '#EEF2FF' : 'transparent',
                  color: activeTab === t.id ? BRAND : '#64748B',
                  border: 'none', fontSize: 12, fontWeight: activeTab === t.id ? 600 : 500,
                }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* ====== BANQUE ====== */}
          {activeTab === 'banque' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              <div>
                <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>Coordonnées bancaires</h1>
                <p style={{ fontSize: 13, color: '#64748B' }}>Compte sur lequel les redevances AOT collectées vous seront virées automatiquement (quand Stripe sera activé).</p>
              </div>

              {/* IBAN */}
              <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20 }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 16 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Wallet size={18} style={{ color: BRAND }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 3 }}>Compte de réception</p>
                    <p style={{ fontSize: 12, color: '#64748B', lineHeight: 1.5 }}>
                      Vos données bancaires sont chiffrées et sécurisées. Seuls vous et notre équipe technique habilitée pouvez y accéder.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <Field label="Titulaire du compte" icon={<Building2 size={11} />} required>
                    <input type="text" value={settings.iban_holder || ''} onChange={e => updateField('iban_holder', e.target.value)}
                      placeholder="Trésor Public - Commune de Aubagne" style={inputStyle} />
                  </Field>

                  <Field label="IBAN" icon={<Hash size={11} />} required error={ibanError || undefined} hint="Format français : FR76 XXXX XXXX XXXX XXXX XXXX XXX">
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showIban ? 'text' : 'password'}
                        value={settings.iban || ''}
                        onChange={e => {
                          updateField('iban', e.target.value.toUpperCase())
                          setIbanError(null)
                        }}
                        placeholder="FR76 XXXX XXXX XXXX XXXX XXXX XXX"
                        style={{ ...inputStyle, paddingRight: 36, fontFamily: 'monospace', letterSpacing: '0.05em' }} />
                      <button type="button" onClick={() => setShowIban(!showIban)}
                        style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', color: '#94A3B8' }}>
                        {showIban ? <Lock size={14} /> : <Lock size={14} />}
                      </button>
                    </div>
                    {settings.iban && validateIBAN(settings.iban) && (
                      <p style={{ fontSize: 11, color: '#16A34A', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <CheckCircle size={10} /> IBAN valide
                      </p>
                    )}
                  </Field>

                  <Field label="BIC / SWIFT" icon={<Hash size={11} />} hint="Code identification banque (optionnel pour IBAN français)">
                    <input type="text" value={settings.bic || ''} onChange={e => updateField('bic', e.target.value.toUpperCase())}
                      placeholder="AGRIFRPP..." style={{ ...inputStyle, fontFamily: 'monospace' }} />
                  </Field>
                </div>
              </div>

              {/* Stripe banner */}
              <div style={{ background: 'linear-gradient(135deg, #0F172A, #1E293B)', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 36, height: 36, background: 'rgba(99,102,241,0.2)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Zap size={17} style={{ color: '#818CF8' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'white', marginBottom: 2 }}>Encaissements Stripe — Q3 2026</p>
                  <p style={{ fontSize: 11, color: '#94A3B8' }}>Bientôt : les exposants payent directement via PulseMarket, et les fonds sont versés sur votre compte municipal automatiquement.</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* ====== FISCAL ====== */}
          {activeTab === 'fiscal' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              <div>
                <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>Régime fiscal</h1>
                <p style={{ fontSize: 13, color: '#64748B' }}>Informations TVA et régime fiscal appliqués sur vos factures de redevances AOT.</p>
              </div>

              <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <Field label="Numéro TVA intracommunautaire" icon={<Receipt size={11} />} hint="Format : FR + 11 chiffres - laissez vide si non assujetti">
                  <input type="text" value={settings.tva_intracom || ''} onChange={e => updateField('tva_intracom', e.target.value.toUpperCase())}
                    placeholder="FR12345678901" style={{ ...inputStyle, fontFamily: 'monospace' }} />
                </Field>

                <Field label="Régime fiscal" icon={<Building2 size={11} />}>
                  <select value={settings.regime_fiscal || ''} onChange={e => updateField('regime_fiscal', e.target.value)}
                    style={inputStyle}>
                    <option value="">Sélectionner...</option>
                    <option value="non_assujetti">Non assujetti à la TVA</option>
                    <option value="franchise_base">Franchise en base de TVA</option>
                    <option value="reel_simplifie">Réel simplifié</option>
                    <option value="reel_normal">Réel normal</option>
                    <option value="autre">Autre</option>
                  </select>
                </Field>
              </div>

              <div style={{ background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 10, padding: '12px 14px', display: 'flex', gap: 10 }}>
                <Info size={14} style={{ color: '#4338CA', flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: 12, color: '#4338CA', lineHeight: 1.5 }}>
                  La plupart des communes sont <strong>non assujetties à la TVA</strong> pour les redevances AOT.
                  En cas de doute, contactez votre Trésorerie ou votre comptable public.
                </p>
              </div>
            </motion.div>
          )}

          {/* ====== PLAN ====== */}
          {activeTab === 'plan' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              <div>
                <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>Plan & Abonnement</h1>
                <p style={{ fontSize: 13, color: '#64748B' }}>Votre plan actuel et les fonctionnalités disponibles.</p>
              </div>

              {/* Current plan */}
              <div style={{ background: 'linear-gradient(135deg, #F0FDF4, #DCFCE7)', border: '1.5px solid #BBF7D0', borderRadius: 14, padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <p style={{ fontSize: 18, fontWeight: 800, color: '#15803D' }}>Plan Découverte</p>
                      <span style={{ background: '#16A34A', color: 'white', fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 100 }}>ACTUEL</span>
                    </div>
                    <p style={{ fontSize: 13, color: '#16A34A' }}>Gratuit · Sans engagement</p>
                  </div>
                  <Check size={28} style={{ color: '#16A34A' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                  {[
                    'Événements illimités',
                    'Candidatures illimitées',
                    '5 membres équipe',
                    '3 placiers',
                    'Audit logs 60 mois',
                    'Export RGPD',
                  ].map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#15803D' }}>
                      <Check size={11} /> {f}
                    </div>
                  ))}
                </div>
              </div>

              {/* PRO upgrade */}
              <div style={{ background: 'linear-gradient(135deg, #0F172A, #1E293B)', borderRadius: 14, padding: 24, color: 'white', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, background: 'radial-gradient(circle, rgba(251,191,36,0.15), transparent)', borderRadius: '50%' }} />

                <div style={{ position: 'relative' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #FBBF24, #F59E0B)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Crown size={18} style={{ color: '#0F172A' }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 18, fontWeight: 800 }}>PulseMarket Pro</p>
                      <p style={{ fontSize: 11, color: '#94A3B8' }}>Pour les organisations qui ont besoin de plus</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 20 }}>
                    <p style={{ fontSize: 32, fontWeight: 800 }}>49€</p>
                    <p style={{ fontSize: 13, color: '#94A3B8' }}>/ mois HT</p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 20 }}>
                    {[
                      'Équipe illimitée',
                      'Placiers illimités',
                      'Audit logs 120 mois',
                      'Branding personnalisé',
                      'Support prioritaire',
                      'API d\'export',
                      'SLA garanti 99,9%',
                      'Formation incluse',
                    ].map(f => (
                      <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#CBD5E1' }}>
                        <Star size={11} style={{ color: '#FBBF24' }} /> {f}
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button
                      style={{ background: 'linear-gradient(135deg, #FBBF24, #F59E0B)', color: '#0F172A', border: 'none', borderRadius: 10, padding: '12px 22px', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}
                      onClick={() => setToast({ message: 'Bientôt disponible - Contactez romain@pulse-market.fr', type: 'success' })}>
                      <Crown size={14} /> Passer au Pro
                    </button>
                    <button
                      style={{ background: 'rgba(255,255,255,0.06)', color: 'white', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, padding: '12px 22px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                      onClick={() => setToast({ message: 'romain@pulse-market.fr - On vous répond sous 24h', type: 'success' })}>
                      Nous contacter
                    </button>
                  </div>
                </div>
              </div>

              {/* Comparison teaser */}
              <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: 16, textAlign: 'center' }}>
                <p style={{ fontSize: 12, color: '#64748B', marginBottom: 8 }}>
                  Besoin d'une offre Enterprise pour votre département ou intercommunalité ?
                </p>
                <button
                  onClick={() => setToast({ message: 'romain@pulse-market.fr', type: 'success' })}
                  style={{ background: 'none', border: 'none', color: BRAND, fontSize: 12, fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>
                  Discutons-en →
                </button>
              </div>
            </motion.div>
          )}

          {/* Save sauf dans Plan */}
          {activeTab !== 'plan' && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 20 }}>
              <button onClick={handleSave} disabled={saving}
                style={{ display: 'flex', alignItems: 'center', gap: 7, background: BRAND, color: 'white', border: 'none', borderRadius: 10, padding: '11px 22px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                {saving ? <Loader size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Save size={14} />}
                {saving ? 'Sauvegarde...' : 'Enregistrer'}
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
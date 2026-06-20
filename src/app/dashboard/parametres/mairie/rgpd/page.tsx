'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from '@/components/Sidebar'
import {
  FileText, Shield, User, Mail, Phone, Download,
  Loader, CheckCircle, XCircle, AlertTriangle, Info,
  ArrowLeft, Save, Trash2, Send, ShieldCheck, Database,
  FileDown, Lock, Globe, Archive, Clock
} from 'lucide-react'

const BRAND = '#4F46E5'

function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error' | 'info'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t) }, [onClose])
  const colors = { success: '#16A34A', error: '#DC2626', info: BRAND }
  const Icon = type === 'success' ? CheckCircle : type === 'error' ? XCircle : Info
  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 2000, background: 'white', borderRadius: 12, padding: '12px 18px', boxShadow: '0 8px 32px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: 10, borderLeft: `3px solid ${colors[type]}`, minWidth: 280 }}>
      <Icon size={15} style={{ color: colors[type] }} />
      <span style={{ fontSize: 13, fontWeight: 500, color: '#0F172A' }}>{message}</span>
    </motion.div>
  )
}

function ConfirmModal({ icon, title, description, confirmLabel, confirmColor, onCancel, onConfirm }: any) {
  const [confirming, setConfirming] = useState(false)
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)' }}
      onClick={onCancel}>
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
        style={{ background: 'white', borderRadius: 16, padding: 24, maxWidth: 440, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ width: 48, height: 48, background: `${confirmColor}15`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          {icon}
        </div>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', textAlign: 'center', marginBottom: 8 }}>{title}</h3>
        <p style={{ fontSize: 13, color: '#64748B', textAlign: 'center', marginBottom: 20, lineHeight: 1.5 }}>{description}</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onCancel}
            style={{ flex: 1, background: 'white', color: '#64748B', border: '1px solid #E2E8F0', borderRadius: 10, padding: '11px 0', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Annuler
          </button>
          <button onClick={() => { setConfirming(true); onConfirm() }} disabled={confirming}
            style={{ flex: 2, background: confirmColor, color: 'white', border: 'none', borderRadius: 10, padding: '11px 0', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            {confirming ? <Loader size={13} style={{ animation: 'spin 0.8s linear infinite' }} /> : confirmLabel}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

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
      {error && <p style={{ fontSize: 11, color: '#DC2626', marginTop: 4 }}>{error}</p>}
    </div>
  )
}

const inputStyle = {
  width: '100%', padding: '10px 12px', border: '1px solid #E2E8F0', borderRadius: 8,
  fontSize: 13, color: '#0F172A', outline: 'none', boxSizing: 'border-box' as const,
  fontFamily: 'inherit', background: 'white',
}

const textareaStyle = {
  ...inputStyle,
  resize: 'vertical' as const,
  minHeight: 100,
  fontFamily: 'inherit',
}

export default function RGPDPage() {
  const [profile, setProfile] = useState<any>(null)
  const [legal, setLegal] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [confirmAction, setConfirmAction] = useState<any>(null)
  const [exporting, setExporting] = useState(false)
  const [activeSection, setActiveSection] = useState<'dpo' | 'mentions' | 'donnees' | 'rights'>('dpo')
  const [rgpdRequests, setRgpdRequests] = useState<any[]>([])

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (profileData?.role !== 'organisateur') { router.push('/dashboard'); return }
      setProfile(profileData)

      // Charger organisation_legal
      const { data: legalData } = await supabase
        .from('organisation_legal')
        .select('*')
        .eq('mairie_id', user.id)
        .maybeSingle()
      if (legalData) setLegal(legalData)

      // Charger demandes RGPD
      const { data: requests } = await supabase
        .from('rgpd_exports')
        .select('*')
        .eq('mairie_id', user.id)
        .order('requested_at', { ascending: false })
        .limit(10)
      setRgpdRequests(requests || [])

      setLoading(false)
    }
    getData()
  }, [])

  const updateField = (key: string, value: any) => {
    setLegal((prev: any) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    if (!profile) return
    setSaving(true)
    try {
      const payload = { ...legal, mairie_id: profile.id, updated_at: new Date().toISOString() }
      const { error } = await supabase
        .from('organisation_legal')
        .upsert(payload, { onConflict: 'mairie_id' })
      if (error) throw error

      // Log RGPD update
      await fetch('/api/audit-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'settings_legal_update' })
      }).catch(() => {})

      setToast({ message: 'Données RGPD mises à jour', type: 'success' })
    } catch (err: any) {
      setToast({ message: 'Erreur : ' + err.message, type: 'error' })
    }
    setSaving(false)
  }

  // ✅ Export complet RGPD
  const handleExportData = async () => {
    setExporting(true)
    try {
      // Créer une demande
      const { data: req } = await supabase.from('rgpd_exports').insert({
        mairie_id: profile.id,
        requested_by: profile.id,
        type: 'export',
        status: 'processing',
      }).select().single()

      // Récupérer toutes les données de la mairie
      const [
        { data: events },
        { data: candidatures },
        { data: members },
        { data: placiers },
        { data: settings },
        { data: legalData },
        { data: logs },
      ] = await Promise.all([
        supabase.from('events').select('*').eq('organisateur_id', profile.id),
        supabase.from('applications').select('*, profiles:exposant_id(*)').in('event_id',
          (await supabase.from('events').select('id').eq('organisateur_id', profile.id)).data?.map(e => e.id) || []
        ),
        supabase.from('team_members').select('*, profile:user_id(*)').eq('mairie_id', profile.id),
        supabase.from('profiles').select('*').eq('mairie_id', profile.id),
        supabase.from('organisation_settings').select('*').eq('mairie_id', profile.id),
        supabase.from('organisation_legal').select('*').eq('mairie_id', profile.id),
        supabase.from('audit_logs').select('*').eq('mairie_id', profile.id).order('created_at', { ascending: false }).limit(1000),
      ])

      // Créer un objet JSON avec toutes les données
      const exportData = {
        meta: {
          generated_at: new Date().toISOString(),
          mairie_id: profile.id,
          mairie_nom: profile.organisation_name || profile.full_name,
          rgpd_compliance: 'Article 20 - Droit à la portabilité',
        },
        profile,
        organisation_settings: settings,
        organisation_legal: legalData,
        events,
        candidatures,
        team_members: members,
        placiers,
        audit_logs: logs,
      }

      // Télécharger en JSON
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `pulsemarket-export-rgpd-${new Date().toISOString().slice(0, 10)}.json`
      a.click()

      // Mettre à jour la demande
      if (req) {
        await supabase.from('rgpd_exports').update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        }).eq('id', req.id)
      }

      // Recharger
      const { data: requests } = await supabase
        .from('rgpd_exports')
        .select('*')
        .eq('mairie_id', profile.id)
        .order('requested_at', { ascending: false })
        .limit(10)
      setRgpdRequests(requests || [])

      // Log
      await fetch('/api/audit-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'rgpd_export_completed', details: { format: 'json' } })
      }).catch(() => {})

      setToast({ message: 'Export RGPD téléchargé', type: 'success' })
    } catch (err: any) {
      setToast({ message: 'Erreur : ' + err.message, type: 'error' })
    }
    setExporting(false)
  }

  // ✅ Demande suppression compte
  const handleDeletionRequest = () => {
    setConfirmAction({
      icon: <Trash2 size={22} style={{ color: '#DC2626' }} />,
      title: 'Demande de suppression complète ?',
      description: `Toutes les données de votre organisation seront supprimées définitivement sous 30 jours conformément au RGPD (Article 17). Cette action est irréversible. Vos exposants pourront récupérer leurs propres données via leur compte personnel.`,
      confirmLabel: 'Confirmer la demande',
      confirmColor: '#DC2626',
      onConfirm: async () => {
        try {
          await supabase.from('rgpd_exports').insert({
            mairie_id: profile.id,
            requested_by: profile.id,
            type: 'deletion',
            status: 'pending',
            reason: 'Demande de suppression complète RGPD',
          })

          await fetch('/api/audit-log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'rgpd_deletion_request' })
          }).catch(() => {})

          // Notifier équipe Anthropic via email
          await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'rgpd_deletion_request',
              to: 'rgpd@pulse-market.fr',
              data: { mairieNom: profile.organisation_name || profile.full_name, mairieEmail: profile.email }
            })
          }).catch(() => {})

          const { data: requests } = await supabase
            .from('rgpd_exports').select('*').eq('mairie_id', profile.id)
            .order('requested_at', { ascending: false }).limit(10)
          setRgpdRequests(requests || [])

          setToast({ message: 'Demande enregistrée. Notre équipe vous contactera sous 72h.', type: 'info' })
          setConfirmAction(null)
        } catch (err: any) {
          setToast({ message: 'Erreur : ' + err.message, type: 'error' })
          setConfirmAction(null)
        }
      }
    })
  }

  const sections = [
    { id: 'dpo' as const, label: 'DPO', icon: <ShieldCheck size={13} /> },
    { id: 'mentions' as const, label: 'Mentions légales', icon: <FileText size={13} /> },
    { id: 'donnees' as const, label: 'Mes données', icon: <Database size={13} /> },
    { id: 'rights' as const, label: 'Droits & demandes', icon: <Lock size={13} /> },
  ]

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
      <AnimatePresence>{confirmAction && <ConfirmModal {...confirmAction} onCancel={() => setConfirmAction(null)} />}</AnimatePresence>

      <div style={{ marginLeft: 220, flex: 1, minWidth: 0 }}>
        <header style={{ background: 'white', borderBottom: '1px solid #E2E8F0', padding: '0 28px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => router.push('/dashboard/parametres/mairie')}
              style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', fontSize: 12 }}>
              <ArrowLeft size={13} /> Paramètres
            </button>
            <div style={{ width: 1, height: 16, background: '#E2E8F0' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileText size={14} style={{ color: BRAND }} />
              <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>RGPD & Légal</p>
              <span style={{ background: '#0F172A', color: 'white', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>CONFORME</span>
            </div>
          </div>
        </header>

        <main style={{ padding: '24px 28px', maxWidth: 900 }}>

          {/* Banner conformité */}
          <div style={{ background: 'linear-gradient(135deg, #0F172A, #1E293B)', borderRadius: 14, padding: '18px 22px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, background: 'rgba(34,197,94,0.15)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ShieldCheck size={22} style={{ color: '#22C55E' }} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'white', marginBottom: 3 }}>Votre organisation est conforme RGPD</p>
              <p style={{ fontSize: 12, color: '#94A3B8' }}>Règlement (UE) 2016/679 · Données hébergées en UE · Audit logs 60 mois</p>
            </div>
          </div>

          {/* Section tabs */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'white', border: '1px solid #E2E8F0', borderRadius: 10, padding: 4 }}>
            {sections.map(s => (
              <button key={s.id} onClick={() => setActiveSection(s.id)}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '9px 12px', borderRadius: 7, cursor: 'pointer',
                  background: activeSection === s.id ? '#EEF2FF' : 'transparent',
                  color: activeSection === s.id ? BRAND : '#64748B',
                  border: 'none', fontSize: 12, fontWeight: activeSection === s.id ? 600 : 500,
                }}>
                {s.icon} {s.label}
              </button>
            ))}
          </div>

          {/* ====== DPO ====== */}
          {activeSection === 'dpo' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20 }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 16 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <User size={20} style={{ color: BRAND }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>Délégué à la Protection des Données</p>
                    <p style={{ fontSize: 12, color: '#64748B', lineHeight: 1.5 }}>
                      Le DPO est le contact officiel pour toute question RGPD. Pour les organisations publiques, sa désignation est obligatoire (CNIL, Article 37).
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <Field label="Nom complet du DPO" icon={<User size={11} />} required>
                    <input type="text" value={legal.dpo_nom || ''} onChange={e => updateField('dpo_nom', e.target.value)}
                      placeholder="Jean Dupont" style={inputStyle} />
                  </Field>

                  <Field label="Email du DPO" icon={<Mail size={11} />} required hint="Adresse spécifique RGPD (peut être différente de l'email général)">
                    <input type="email" value={legal.dpo_email || ''} onChange={e => updateField('dpo_email', e.target.value)}
                      placeholder="dpo@ville.fr" style={inputStyle} />
                  </Field>

                  <Field label="Téléphone du DPO" icon={<Phone size={11} />}>
                    <input type="tel" value={legal.dpo_telephone || ''} onChange={e => updateField('dpo_telephone', e.target.value)}
                      placeholder="04 ..." style={inputStyle} />
                  </Field>
                </div>
              </div>

              <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 12 }}>Déclaration CNIL</p>
                <Field label="Numéro de déclaration CNIL" icon={<Shield size={11} />} hint="Optionnel - si votre organisation a déclaré ses traitements">
                  <input type="text" value={legal.cnil_declaration_number || ''} onChange={e => updateField('cnil_declaration_number', e.target.value)}
                    placeholder="MR-XXXX-2026" style={inputStyle} />
                </Field>
              </div>

              <div style={{ background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 10, padding: '12px 14px', display: 'flex', gap: 10 }}>
                <Info size={14} style={{ color: '#4338CA', flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: 12, color: '#4338CA', lineHeight: 1.5 }}>
                  Vos DPO et déclaration CNIL apparaîtront dans les mentions légales générées automatiquement pour vos exposants et visiteurs.
                </p>
              </div>
            </motion.div>
          )}

          {/* ====== MENTIONS LÉGALES ====== */}
          {activeSection === 'mentions' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20 }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 16 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <FileText size={20} style={{ color: '#16A34A' }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>Mentions légales personnalisées</p>
                    <p style={{ fontSize: 12, color: '#64748B', lineHeight: 1.5 }}>
                      Ces textes apparaîtront sur les documents officiels générés (factures, contrats AOT, emails). Laissez vide pour utiliser les mentions par défaut.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <Field label="Mentions légales" icon={<FileText size={11} />} hint="Texte affiché en bas des documents officiels">
                    <textarea value={legal.mentions_legales || ''} onChange={e => updateField('mentions_legales', e.target.value)}
                      placeholder="La Mairie de [ville], représentée par son Maire en exercice..."
                      style={textareaStyle} />
                  </Field>

                  <Field label="Politique de confidentialité" icon={<Lock size={11} />} hint="Politique RGPD spécifique à votre organisation">
                    <textarea value={legal.politique_confidentialite || ''} onChange={e => updateField('politique_confidentialite', e.target.value)}
                      placeholder="Les données personnelles collectées sont utilisées exclusivement..."
                      style={textareaStyle} />
                  </Field>

                  <Field label="CGU personnalisées" icon={<FileText size={11} />} hint="Conditions générales d'utilisation pour les exposants">
                    <textarea value={legal.cgu_personnalisees || ''} onChange={e => updateField('cgu_personnalisees', e.target.value)}
                      placeholder="L'utilisation de la plateforme PulseMarket par les exposants implique..."
                      style={textareaStyle} />
                  </Field>

                  <Field label="Template AOT personnalisé" icon={<FileText size={11} />} hint="Modèle de contrat d'autorisation d'occupation temporaire spécifique">
                    <textarea value={legal.template_aot_custom || ''} onChange={e => updateField('template_aot_custom', e.target.value)}
                      placeholder="Article 1 - Objet : La présente autorisation a pour objet..."
                      style={{ ...textareaStyle, minHeight: 140 }} />
                  </Field>
                </div>
              </div>
            </motion.div>
          )}

          {/* ====== MES DONNÉES ====== */}
          {activeSection === 'donnees' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Rétention */}
              <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20 }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 16 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Clock size={20} style={{ color: '#F59E0B' }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>Durée de conservation</p>
                    <p style={{ fontSize: 12, color: '#64748B', lineHeight: 1.5 }}>
                      Combien de temps vos données sont conservées avant suppression automatique. Recommandé : 60 mois (5 ans) pour conformité administrative française.
                    </p>
                  </div>
                </div>

                <Field label="Durée de rétention (en mois)" icon={<Database size={11} />}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[12, 36, 60, 120].map(m => (
                      <button key={m} onClick={() => updateField('data_retention_months', m)}
                        style={{
                          flex: 1, padding: '10px 0',
                          border: legal.data_retention_months === m ? `1.5px solid ${BRAND}` : '1px solid #E2E8F0',
                          background: legal.data_retention_months === m ? '#EEF2FF' : 'white',
                          color: legal.data_retention_months === m ? BRAND : '#475569',
                          borderRadius: 8, fontSize: 12, fontWeight: legal.data_retention_months === m ? 600 : 500,
                          cursor: 'pointer',
                        }}>
                        {m === 12 ? '1 an' : m === 36 ? '3 ans' : m === 60 ? '5 ans (recommandé)' : '10 ans'}
                      </button>
                    ))}
                  </div>
                </Field>
              </div>

              {/* Notifications */}
              <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 14 }}>Notifications RGPD</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { key: 'notify_data_export', label: 'Notifier les exports de données', desc: 'Recevoir un email à chaque export RGPD complet' },
                    { key: 'notify_data_deletion', label: 'Notifier les suppressions', desc: 'Recevoir un email avant la suppression auto des données' },
                  ].map(item => (
                    <label key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: '#F8FAFC', borderRadius: 10, cursor: 'pointer' }}>
                      <input type="checkbox" checked={legal[item.key] ?? true}
                        onChange={e => updateField(item.key, e.target.checked)}
                        style={{ width: 16, height: 16, cursor: 'pointer', accentColor: BRAND }} />
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 12, fontWeight: 600, color: '#0F172A' }}>{item.label}</p>
                        <p style={{ fontSize: 11, color: '#94A3B8' }}>{item.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Export */}
              <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20 }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 16 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <FileDown size={20} style={{ color: BRAND }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>Export complet de mes données</p>
                    <p style={{ fontSize: 12, color: '#64748B', lineHeight: 1.5 }}>
                      Télécharge un fichier JSON contenant toutes les données de votre organisation (profil, événements, candidatures, équipe, audit logs).
                      Conforme au droit à la portabilité (RGPD Article 20).
                    </p>
                  </div>
                </div>

                <button onClick={handleExportData} disabled={exporting}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, background: BRAND, color: 'white', border: 'none', borderRadius: 10, padding: '11px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  {exporting ? <Loader size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Archive size={14} />}
                  {exporting ? 'Génération en cours...' : 'Télécharger mes données'}
                </button>
              </div>
            </motion.div>
          )}

          {/* ====== DROITS & DEMANDES ====== */}
          {activeSection === 'rights' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Mes droits */}
              <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 14 }}>Vos droits RGPD</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { icon: <Database size={14} />, title: 'Droit d\'accès (Art. 15)', desc: 'Consulter toutes les données vous concernant', color: BRAND },
                    { icon: <FileText size={14} />, title: 'Droit de rectification (Art. 16)', desc: 'Corriger des données inexactes via les paramètres', color: '#16A34A' },
                    { icon: <Trash2 size={14} />, title: 'Droit à l\'effacement (Art. 17)', desc: 'Supprimer définitivement vos données', color: '#DC2626' },
                    { icon: <Archive size={14} />, title: 'Droit à la portabilité (Art. 20)', desc: 'Récupérer vos données dans un format structuré', color: '#F59E0B' },
                    { icon: <Lock size={14} />, title: 'Droit d\'opposition (Art. 21)', desc: 'Refuser certains traitements', color: '#7C3AED' },
                  ].map(right => (
                    <div key={right.title} style={{ display: 'flex', gap: 12, padding: '10px 12px', background: '#F8FAFC', borderRadius: 10, alignItems: 'center' }}>
                      <div style={{ width: 32, height: 32, borderRadius: 7, background: `${right.color}15`, color: right.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {right.icon}
                      </div>
                      <div>
                        <p style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }}>{right.title}</p>
                        <p style={{ fontSize: 11, color: '#94A3B8' }}>{right.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Demande suppression */}
              <div style={{ background: 'white', border: '1px solid #FECACA', borderRadius: 12, padding: 20 }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 16 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <AlertTriangle size={20} style={{ color: '#DC2626' }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 700, color: '#DC2626', marginBottom: 4 }}>Suppression complète de l'organisation</p>
                    <p style={{ fontSize: 12, color: '#64748B', lineHeight: 1.5 }}>
                      Demande de suppression définitive de toutes vos données. Action irréversible. Délai légal : 30 jours.
                    </p>
                  </div>
                </div>

                <button onClick={handleDeletionRequest}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'white', color: '#DC2626', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  <Send size={13} /> Demander la suppression
                </button>
              </div>

              {/* Historique demandes */}
              {rgpdRequests.length > 0 && (
                <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 14 }}>Historique de mes demandes</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {rgpdRequests.map(req => (
                      <div key={req.id} style={{ display: 'flex', gap: 12, padding: '10px 12px', background: '#F8FAFC', borderRadius: 10, alignItems: 'center' }}>
                        <div style={{ width: 32, height: 32, borderRadius: 7, background: req.type === 'deletion' ? '#FEF2F2' : '#EEF2FF', color: req.type === 'deletion' ? '#DC2626' : BRAND, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {req.type === 'deletion' ? <Trash2 size={14} /> : <Archive size={14} />}
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: 12, fontWeight: 600, color: '#0F172A' }}>
                            {req.type === 'deletion' ? 'Demande de suppression' : 'Export de données'}
                          </p>
                          <p style={{ fontSize: 11, color: '#94A3B8' }}>
                            {new Date(req.requested_at).toLocaleString('fr-FR')}
                          </p>
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 100,
                          background: req.status === 'completed' ? '#F0FDF4' : req.status === 'pending' ? '#FFFBEB' : '#EEF2FF',
                          color: req.status === 'completed' ? '#16A34A' : req.status === 'pending' ? '#F59E0B' : BRAND,
                        }}>
                          {req.status === 'completed' ? 'Complété' : req.status === 'pending' ? 'En attente' : 'En cours'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Save button - visible sauf dans Rights */}
          {activeSection !== 'rights' && (
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
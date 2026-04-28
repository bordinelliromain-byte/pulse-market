'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import {
  LayoutDashboard, Map, FileText, Receipt, Settings,
  LogOut, ArrowLeft, Upload, CheckCircle, AlertCircle,
  Shield, Building2, Ruler, Zap, Camera, Save, Loader
} from 'lucide-react'

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
}

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
}

const NAV_ITEMS = [
  { icon: <LayoutDashboard size={15} />, label: 'Dashboard', path: '/dashboard' },
  { icon: <Map size={15} />, label: 'Marchés', path: '/dashboard/evenements' },
  { icon: <FileText size={15} />, label: 'Documents', path: '/dashboard/profil' },
  { icon: <Receipt size={15} />, label: 'Factures', path: '/dashboard' },
  { icon: <Settings size={15} />, label: 'Paramètres', path: '/dashboard' },
]

function SirenStatus({ status }: { status: 'idle' | 'loading' | 'valid' | 'invalid' }) {
  if (status === 'idle') return null
  if (status === 'loading') return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748B', marginTop: 8 }}>
      <Loader size={12} style={{ animation: 'spin 1s linear infinite' }} /> Vérification en cours via API INSEE...
    </div>
  )
  if (status === 'valid') return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#16A34A', marginTop: 8, background: '#F0FDF4', padding: '6px 10px', borderRadius: 7, border: '1px solid #BBF7D0' }}>
      <CheckCircle size={13} /> Entreprise active — SIREN vérifié via INSEE
    </div>
  )
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#DC2626', marginTop: 8, background: '#FEF2F2', padding: '6px 10px', borderRadius: 7, border: '1px solid #FECACA' }}>
      <AlertCircle size={13} /> SIREN invalide ou entreprise introuvable
    </div>
  )
}

export default function ProfilExposant() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [activeNav, setActiveNav] = useState('Documents')
  const [sirenStatus, setSirenStatus] = useState<'idle' | 'loading' | 'valid' | 'invalid'>('idle')

  const [businessName, setBusinessName] = useState('')
  const [siren, setSiren] = useState('')
  const [standWidth, setStandWidth] = useState('')
  const [standLength, setStandLength] = useState('')
  const [needsElectricity, setNeedsElectricity] = useState(false)
  const [description, setDescription] = useState('')
  const [kbisFile, setKbisFile] = useState<File | null>(null)
  const [assuranceFile, setAssuranceFile] = useState<File | null>(null)
  const [kbisUrl, setKbisUrl] = useState('')
  const [assuranceUrl, setAssuranceUrl] = useState('')

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (profileData?.role !== 'exposant') { router.push('/dashboard'); return }
      setProfile(profileData)
      const { data: exposantData } = await supabase.from('exposant_data').select('*').eq('user_id', user.id).single()
      if (exposantData) {
        setBusinessName(exposantData.business_name || '')
        setSiren(exposantData.siren || '')
        setStandWidth(exposantData.stand_width || '')
        setStandLength(exposantData.stand_length || '')
        setNeedsElectricity(exposantData.needs_electricity || false)
        setDescription(exposantData.description || '')
        setKbisUrl(exposantData.kbis_url || '')
        setAssuranceUrl(exposantData.assurance_url || '')
      }
      setLoading(false)
    }
    getData()
  }, [])

  const verifySiren = async () => {
    if (!siren) return
    setSirenStatus('loading')
    const timer = setTimeout(() => setSirenStatus('invalid'), 10000)
    try {
      const res = await fetch('/api/verify-siren', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siren })
      })
      const data = await res.json()
      clearTimeout(timer)
      setSirenStatus(data.valid ? 'valid' : 'invalid')
      if (data.valid) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) await supabase.from('exposant_data').upsert({ user_id: user.id, is_verified: true })
      }
    } catch {
      clearTimeout(timer)
      setSirenStatus('invalid')
    }
  }

  const uploadFile = async (file: File, path: string) => {
    const { data, error } = await supabase.storage.from('documents').upload(path, file, { upsert: true })
    if (error) throw error
    return data.path
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      let finalKbisUrl = kbisUrl
      let finalAssuranceUrl = assuranceUrl
      if (kbisFile) finalKbisUrl = await uploadFile(kbisFile, `${user.id}/kbis.pdf`)
      if (assuranceFile) finalAssuranceUrl = await uploadFile(assuranceFile, `${user.id}/assurance.pdf`)
      const { error } = await supabase.from('exposant_data').upsert({
        user_id: user.id,
        business_name: businessName,
        siren,
        stand_width: parseFloat(standWidth),
        stand_length: parseFloat(standLength),
        needs_electricity: needsElectricity,
        description,
        kbis_url: finalKbisUrl,
        assurance_url: finalAssuranceUrl,
      })
      if (error) throw error
      setMessage({ type: 'success', text: 'Dossier sauvegardé avec succès' })
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message })
    }
    setSaving(false)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#EEF2F7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 28, height: 28, border: '2px solid #4F46E5', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#EEF2F7', fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* SIDEBAR */}
      <aside style={{ width: 220, background: '#020617', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 20 }}>
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, background: '#4F46E5', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'white', fontSize: 11, fontWeight: 700 }}>PM</span>
            </div>
            <span style={{ color: 'white', fontWeight: 600, fontSize: 14 }}>PlaceMarket</span>
          </div>
        </div>
        <nav style={{ flex: 1, padding: '12px 10px' }}>
          <p style={{ fontSize: 10, fontWeight: 600, color: '#475569', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '8px 10px', marginBottom: 4 }}>Navigation</p>
          {NAV_ITEMS.map((item) => (
            <button key={item.label} onClick={() => { setActiveNav(item.label); router.push(item.path) }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: activeNav === item.label ? 'rgba(79,70,229,0.15)' : 'transparent',
                color: activeNav === item.label ? '#818CF8' : '#64748B',
                fontSize: 13, fontWeight: activeNav === item.label ? 600 : 400,
                marginBottom: 2, textAlign: 'left', transition: 'all 0.15s',
              }}>
              {item.icon}{item.label}
            </button>
          ))}
        </nav>
        <div style={{ padding: '12px 10px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ padding: '8px 10px', marginBottom: 4 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#CBD5E1' }}>{profile?.full_name}</p>
            <p style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>{profile?.email}</p>
          </div>
          <button onClick={async () => { await supabase.auth.signOut(); router.push('/') }}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'transparent', color: '#64748B', fontSize: 12 }}>
            <LogOut size={13} /> Déconnexion
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div style={{ marginLeft: 220, flex: 1 }}>

        {/* TOP BAR */}
        <header style={{ background: 'white', borderBottom: '1px solid #E2E8F0', padding: '0 28px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => router.push('/dashboard')}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', fontSize: 13 }}>
              <ArrowLeft size={14} /> Retour
            </button>
            <div style={{ width: 1, height: 16, background: '#E2E8F0' }} />
            <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>Mon dossier exposant</p>
          </div>
          <button onClick={handleSave} disabled={saving}
            style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#4F46E5', color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={14} />}
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </header>

        <main style={{ padding: '28px', maxWidth: 900, margin: '0 auto' }}>
          <motion.div variants={stagger} initial="hidden" animate="visible" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Message */}
            {message && (
              <motion.div variants={fadeUp} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 10,
                background: message.type === 'success' ? '#F0FDF4' : '#FEF2F2',
                border: `1px solid ${message.type === 'success' ? '#BBF7D0' : '#FECACA'}`,
                color: message.type === 'success' ? '#15803D' : '#DC2626',
                fontSize: 13, fontWeight: 500,
              }}>
                {message.type === 'success' ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
                {message.text}
              </motion.div>
            )}

            {/* LAYOUT 2 COLONNES */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16, alignItems: 'start' }}>

              {/* COLONNE GAUCHE */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Infos entreprise */}
                <motion.div variants={fadeUp} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
                  <div style={{ padding: '14px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 30, height: 30, background: '#EEF2FF', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Building2 size={15} style={{ color: '#4F46E5' }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>Informations entreprise</p>
                      <p style={{ fontSize: 11, color: '#94A3B8' }}>Raison sociale, SIREN, activité</p>
                    </div>
                  </div>
                  <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Nom commercial / Raison sociale</label>
                      <input value={businessName} onChange={e => setBusinessName(e.target.value)}
                        placeholder="Mon Food Truck SARL"
                        style={{ width: '100%', padding: '9px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, color: '#0F172A', background: '#FAFAFA', outline: 'none', boxSizing: 'border-box' }}
                        onFocus={e => { e.target.style.borderColor = '#4F46E5'; e.target.style.background = 'white' }}
                        onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.background = '#FAFAFA' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Numéro SIREN (9 chiffres)</label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input value={siren} onChange={e => setSiren(e.target.value)}
                          placeholder="123 456 789"
                          style={{ flex: 1, padding: '9px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, color: '#0F172A', background: '#FAFAFA', outline: 'none' }}
                          onFocus={e => { e.target.style.borderColor = '#4F46E5'; e.target.style.background = 'white' }}
                          onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.background = '#FAFAFA' }}
                        />
                        <button onClick={verifySiren} disabled={sirenStatus === 'loading'}
                          style={{ background: '#4F46E5', color: 'white', border: 'none', borderRadius: 8, padding: '9px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                          <Shield size={13} /> Vérifier INSEE
                        </button>
                      </div>
                      <SirenStatus status={sirenStatus} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Description de l'activité</label>
                      <textarea value={description} onChange={e => setDescription(e.target.value)}
                        placeholder="Burgers artisanaux, cuisine du monde, produits locaux..."
                        style={{ width: '100%', padding: '9px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, color: '#0F172A', background: '#FAFAFA', outline: 'none', resize: 'none', height: 80, boxSizing: 'border-box', fontFamily: 'inherit' }}
                        onFocus={e => { e.target.style.borderColor = '#4F46E5'; e.target.style.background = 'white' }}
                        onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.background = '#FAFAFA' }}
                      />
                    </div>
                  </div>
                </motion.div>

                {/* Caractéristiques stand */}
                <motion.div variants={fadeUp} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
                  <div style={{ padding: '14px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 30, height: 30, background: '#EEF2FF', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Ruler size={15} style={{ color: '#4F46E5' }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>Caractéristiques du stand</p>
                      <p style={{ fontSize: 11, color: '#94A3B8' }}>Surface, branchements électriques</p>
                    </div>
                  </div>
                  <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Largeur (mètres)</label>
                        <input type="number" value={standWidth} onChange={e => setStandWidth(e.target.value)} placeholder="3"
                          style={{ width: '100%', padding: '9px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, color: '#0F172A', background: '#FAFAFA', outline: 'none', boxSizing: 'border-box' }}
                          onFocus={e => { e.target.style.borderColor = '#4F46E5'; e.target.style.background = 'white' }}
                          onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.background = '#FAFAFA' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Longueur (mètres)</label>
                        <input type="number" value={standLength} onChange={e => setStandLength(e.target.value)} placeholder="6"
                          style={{ width: '100%', padding: '9px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, color: '#0F172A', background: '#FAFAFA', outline: 'none', boxSizing: 'border-box' }}
                          onFocus={e => { e.target.style.borderColor = '#4F46E5'; e.target.style.background = 'white' }}
                          onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.background = '#FAFAFA' }}
                        />
                      </div>
                    </div>
                    {standWidth && standLength && (
                      <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#64748B' }}>
                        Surface totale : <strong style={{ color: '#0F172A' }}>{(parseFloat(standWidth) * parseFloat(standLength)).toFixed(1)} m²</strong>
                        {' '}— Redevance AOT estimée : <strong style={{ color: '#4F46E5' }}>{(parseFloat(standWidth) * parseFloat(standLength) * 1.2).toFixed(2)} €/jour</strong>
                      </div>
                    )}
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>Branchement électrique</label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {[
                          { val: false, label: 'Aucun' },
                          { val: true, label: 'Requis' },
                        ].map((opt) => (
                          <button key={String(opt.val)} onClick={() => setNeedsElectricity(opt.val)}
                            style={{ flex: 1, padding: '8px 0', border: needsElectricity === opt.val ? '1.5px solid #4F46E5' : '1px solid #E2E8F0', borderRadius: 8, background: needsElectricity === opt.val ? '#EEF2FF' : 'white', color: needsElectricity === opt.val ? '#4F46E5' : '#64748B', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                            <Zap size={13} /> {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>

              </div>

              {/* COLONNE DROITE */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Statut dossier */}
                <motion.div variants={fadeUp} style={{ background: '#0F172A', borderRadius: 12, padding: '16px' }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Statut du dossier</p>
                  {[
                    { label: 'Kbis / Immatriculation', ok: !!kbisUrl },
                    { label: 'Attestation RC Pro', ok: !!assuranceUrl },
                    { label: 'SIREN vérifié INSEE', ok: sirenStatus === 'valid' },
                    { label: 'Infos stand renseignées', ok: !!(standWidth && standLength) },
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: i < 3 ? 10 : 0, marginBottom: i < 3 ? 10 : 0, borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                      <span style={{ fontSize: 12, color: '#64748B' }}>{item.label}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: item.ok ? '#4ADE80' : '#F59E0B' }}>
                        {item.ok ? '✓ OK' : '⏳ Manquant'}
                      </span>
                    </div>
                  ))}
                </motion.div>

                {/* Documents */}
                <motion.div variants={fadeUp} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
                  <div style={{ padding: '14px 20px', borderBottom: '1px solid #F1F5F9' }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>Documents légaux</p>
                    <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>Kbis certifié & attestation RC Pro</p>
                  </div>
                  <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

                    {/* Kbis */}
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>Extrait Kbis</label>
                      {kbisUrl && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#16A34A', marginBottom: 6, background: '#F0FDF4', padding: '5px 9px', borderRadius: 6 }}>
                          <CheckCircle size={11} /> Document déjà fourni
                        </div>
                      )}
                      <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '10px', border: '1.5px dashed #E2E8F0', borderRadius: 9, cursor: 'pointer', fontSize: 12, color: '#64748B', transition: 'all 0.2s' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#4F46E5'; e.currentTarget.style.color = '#4F46E5' }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.color = '#64748B' }}>
                        <Upload size={13} />
                        {kbisFile ? kbisFile.name : 'Déposer un PDF'}
                        <input type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => setKbisFile(e.target.files?.[0] || null)} />
                      </label>
                    </div>

                    {/* RC Pro */}
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>Attestation RC Pro</label>
                      {assuranceUrl && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#16A34A', marginBottom: 6, background: '#F0FDF4', padding: '5px 9px', borderRadius: 6 }}>
                          <CheckCircle size={11} /> Document déjà fourni
                        </div>
                      )}
                      <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '10px', border: '1.5px dashed #E2E8F0', borderRadius: 9, cursor: 'pointer', fontSize: 12, color: '#64748B', transition: 'all 0.2s' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#4F46E5'; e.currentTarget.style.color = '#4F46E5' }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.color = '#64748B' }}>
                        <Upload size={13} />
                        {assuranceFile ? assuranceFile.name : 'Déposer un PDF'}
                        <input type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => setAssuranceFile(e.target.files?.[0] || null)} />
                      </label>
                    </div>

                    {/* Scan mobile */}
                    <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 12 }}>
                      <p style={{ fontSize: 11, color: '#94A3B8', marginBottom: 8 }}>Depuis votre mobile</p>
                      <button style={{ width: '100%', background: '#4F46E5', color: 'white', border: 'none', borderRadius: 9, padding: '10px 0', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                        <Camera size={14} /> Numériser un document
                      </button>
                      <p style={{ fontSize: 10, color: '#CBD5E1', textAlign: 'center', marginTop: 6 }}>L'IA extrait automatiquement les informations clés</p>
                    </div>

                  </div>
                </motion.div>

              </div>
            </div>

          </motion.div>
        </main>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from '@/components/Sidebar'
import {
  Users, Plus, CheckCircle, Clock,
  Shield, X, Send, Activity,
  Loader, Search, MessageSquare, Power
} from 'lucide-react'

export default function GestionPlaciers() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [placiers, setPlaciers] = useState<any[]>([])
  const [invitations, setInvitations] = useState<any[]>([])
  const [selectedPlacer, setSelectedPlacer] = useState<any>(null)
  const [scanHistory, setScanHistory] = useState<any[]>([])
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteNom, setInviteNom] = useState('')
  const [inviteSending, setInviteSending] = useState(false)
  const [inviteSent, setInviteSent] = useState(false)
  const [note, setNote] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  const [search, setSearch] = useState('')

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (profileData?.role !== 'organisateur') { router.push('/dashboard'); return }
      setProfile(profileData)
      await loadPlaciers(user.id)
      await loadInvitations(user.id)
      setLoading(false)
    }
    getData()
  }, [])

  const loadPlaciers = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'placier')
      .eq('mairie_id', userId)
      .order('created_at', { ascending: false })
    setPlaciers(data || [])
  }

  const loadInvitations = async (userId: string) => {
    const { data } = await supabase
      .from('placier_invitations')
      .select('*')
      .eq('mairie_id', userId)
      .order('created_at', { ascending: false })
    setInvitations(data || [])
  }

  const loadScanHistory = async (placierId: string) => {
    const { data } = await supabase
      .from('applications')
      .select(`*, profiles:exposant_id(full_name, email), events:event_id(title, start_date)`)
      .eq('scanned_by', placierId)
      .order('scanned_at', { ascending: false })
      .limit(20)
    setScanHistory(data || [])
  }

  const handleSelectPlacer = async (placer: any) => {
    setSelectedPlacer(placer)
    setNote(placer.notes || '')
    await loadScanHistory(placer.id)
  }

  const handleInvite = async () => {
    if (!inviteEmail || !inviteNom) return
    setInviteSending(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const token = Math.random().toString(36).substring(2) + Date.now().toString(36)
      await supabase.from('placier_invitations').insert({ email: inviteEmail, mairie_id: user.id, token, used: false })
      const inviteUrl = `${window.location.origin}/auth/placier?token=${token}&email=${encodeURIComponent(inviteEmail)}&nom=${encodeURIComponent(inviteNom)}`
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'invitation_placier',
          to: inviteEmail,
          data: { nom: inviteNom, mairieNom: profile?.full_name || 'La mairie', inviteUrl }
        })
      })
      setInviteSent(true)
      setInviteEmail('')
      setInviteNom('')
      await loadInvitations(user.id)
      setTimeout(() => { setInviteSent(false); setShowInviteModal(false) }, 2000)
    } catch (err) { console.error(err) }
    setInviteSending(false)
  }

  const handleToggleActive = async (placer: any) => {
    await supabase.from('profiles').update({ is_active: !placer.is_active }).eq('id', placer.id)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) await loadPlaciers(user.id)
    if (selectedPlacer?.id === placer.id) setSelectedPlacer({ ...selectedPlacer, is_active: !placer.is_active })
  }

  const handleSaveNote = async () => {
    if (!selectedPlacer) return
    setSavingNote(true)
    await supabase.from('profiles').update({ notes: note }).eq('id', selectedPlacer.id)
    setSavingNote(false)
  }

  const filteredPlaciers = placiers.filter(p =>
    p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.email?.toLowerCase().includes(search.toLowerCase())
  )

  const formatDate = (d: string) => {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
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
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* MODAL INVITATION */}
      <AnimatePresence>
        {showInviteModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
            onClick={() => setShowInviteModal(false)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
              style={{ background: 'white', borderRadius: 16, padding: 28, maxWidth: 420, width: '100%' }}
              onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <p style={{ fontSize: 16, fontWeight: 700, color: '#0F172A' }}>Inviter un placier</p>
                  <p style={{ fontSize: 12, color: '#94A3B8' }}>Un lien sécurisé lui sera envoyé par email</p>
                </div>
                <button onClick={() => setShowInviteModal(false)} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 6, cursor: 'pointer' }}>
                  <X size={14} style={{ color: '#64748B' }} />
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                {[
                  { label: 'Nom complet', value: inviteNom, setter: setInviteNom, placeholder: 'Jean Martin', type: 'text' },
                  { label: 'Adresse email', value: inviteEmail, setter: setInviteEmail, placeholder: 'jean@mairie.fr', type: 'email' },
                ].map((field, i) => (
                  <div key={i}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>{field.label}</label>
                    <input type={field.type} value={field.value} onChange={e => field.setter(e.target.value)} placeholder={field.placeholder}
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, color: '#0F172A', outline: 'none', boxSizing: 'border-box' }}
                      onFocus={e => e.target.style.borderColor = '#4F46E5'}
                      onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
                  </div>
                ))}
              </div>
              <div style={{ background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 10, padding: '12px 14px', marginBottom: 20 }}>
                <p style={{ fontSize: 12, color: '#4338CA', lineHeight: 1.6 }}>
                  📱 Le placier recevra un lien pour créer son compte et se connecter directement sur son téléphone via PulseMarket.fr
                </p>
              </div>
              <button onClick={handleInvite} disabled={!inviteEmail || !inviteNom || inviteSending}
                style={{ width: '100%', background: inviteSent ? '#16A34A' : '#4F46E5', color: 'white', border: 'none', borderRadius: 10, padding: '13px', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {inviteSending ? <Loader size={15} style={{ animation: 'spin 0.8s linear infinite' }} /> : inviteSent ? <CheckCircle size={15} /> : <Send size={15} />}
                {inviteSending ? 'Envoi...' : inviteSent ? 'Invitation envoyée !' : "Envoyer l'invitation"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ marginLeft: 220, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header style={{ background: 'white', borderBottom: '1px solid #E2E8F0', padding: '0 24px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 30, height: 30, background: '#EEF2FF', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={15} style={{ color: '#4F46E5' }} />
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>Mes Placiers</p>
              <p style={{ fontSize: 11, color: '#94A3B8' }}>{placiers.length} placier{placiers.length > 1 ? 's' : ''}</p>
            </div>
          </div>
          <button onClick={() => setShowInviteModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#4F46E5', color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <Plus size={14} /> Inviter un placier
          </button>
        </header>

        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: selectedPlacer ? '340px 1fr' : '1fr', overflow: 'hidden' }}>

          {/* LISTE */}
          <div style={{ background: 'white', borderRight: '1px solid #E2E8F0', overflowY: 'auto' }}>
            <div style={{ padding: '16px', borderBottom: '1px solid #F1F5F9' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {[
                  { label: 'Placiers', value: placiers.length, color: '#4F46E5' },
                  { label: 'Actifs', value: placiers.filter(p => p.is_active !== false).length, color: '#16A34A' },
                  { label: 'En attente', value: invitations.filter(i => !i.used).length, color: '#F59E0B' },
                ].map((stat, i) => (
                  <div key={i} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: '10px', textAlign: 'center' }}>
                    <p style={{ fontSize: 20, fontWeight: 800, color: stat.color }}>{stat.value}</p>
                    <p style={{ fontSize: 10, color: '#94A3B8', textTransform: 'uppercase' }}>{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ padding: '12px 16px', borderBottom: '1px solid #F1F5F9' }}>
              <div style={{ position: 'relative' }}>
                <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un placier..."
                  style={{ width: '100%', padding: '8px 12px 8px 30px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 12, color: '#0F172A', background: '#F8FAFC', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>

            <div style={{ padding: '8px' }}>
              {filteredPlaciers.length === 0 && invitations.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <Users size={32} style={{ margin: '0 auto 12px', color: '#CBD5E1' }} />
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#64748B', marginBottom: 6 }}>Aucun placier</p>
                  <p style={{ fontSize: 12, color: '#94A3B8', marginBottom: 16 }}>Invitez votre premier placier</p>
                  <button onClick={() => setShowInviteModal(true)}
                    style={{ background: '#4F46E5', color: 'white', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    Inviter maintenant
                  </button>
                </div>
              ) : (
                <>
                  {filteredPlaciers.length > 0 && (
                    <div style={{ marginBottom: 8 }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '8px 8px 4px' }}>Comptes actifs</p>
                      {filteredPlaciers.map(placer => (
                        <div key={placer.id} onClick={() => handleSelectPlacer(placer)}
                          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 8px', borderRadius: 10, cursor: 'pointer', background: selectedPlacer?.id === placer.id ? '#EEF2FF' : 'transparent', border: selectedPlacer?.id === placer.id ? '1px solid #C7D2FE' : '1px solid transparent', marginBottom: 4, transition: 'all 0.15s' }}>
                          <div style={{ width: 38, height: 38, borderRadius: '50%', background: placer.is_active !== false ? 'linear-gradient(135deg, #4F46E5, #7C3AED)' : '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: placer.is_active !== false ? 'white' : '#94A3B8' }}>
                              {(placer.full_name || '?').charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                              <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{placer.full_name}</p>
                              <span style={{ flexShrink: 0, width: 7, height: 7, borderRadius: '50%', background: placer.is_active !== false ? '#22C55E' : '#94A3B8' }} />
                            </div>
                            <p style={{ fontSize: 11, color: '#94A3B8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {placer.last_scan_at ? `Dernier scan : ${formatDate(placer.last_scan_at)}` : 'Aucun scan'}
                            </p>
                          </div>
                          <div style={{ flexShrink: 0, textAlign: 'right' }}>
                            <p style={{ fontSize: 14, fontWeight: 800, color: '#4F46E5' }}>{placer.total_scans || 0}</p>
                            <p style={{ fontSize: 9, color: '#94A3B8' }}>scans</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {invitations.filter(i => !i.used).length > 0 && (
                    <div>
                      <p style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '8px 8px 4px' }}>Invitations en attente</p>
                      {invitations.filter(i => !i.used).map(inv => (
                        <div key={inv.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 8px', borderRadius: 10, marginBottom: 4, background: '#FFFBEB', border: '1px solid #FDE68A' }}>
                          <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Clock size={16} style={{ color: '#F59E0B' }} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 13, fontWeight: 600, color: '#92400E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inv.email}</p>
                            <p style={{ fontSize: 11, color: '#D97706' }}>En attente d'inscription</p>
                          </div>
                          <span style={{ fontSize: 10, fontWeight: 600, background: '#FDE68A', color: '#92400E', padding: '2px 8px', borderRadius: 100 }}>Invité</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* FICHE DÉTAIL */}
          {selectedPlacer && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              style={{ overflowY: 'auto', background: '#F8FAFC' }}>
              <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Hero */}
                <div style={{ background: 'linear-gradient(135deg, #0F172A, #1E293B)', borderRadius: 14, padding: '20px 24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                      <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: 20, fontWeight: 800, color: 'white' }}>{(selectedPlacer.full_name || '?').charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <p style={{ fontSize: 17, fontWeight: 800, color: 'white', marginBottom: 3 }}>{selectedPlacer.full_name}</p>
                        <p style={{ fontSize: 12, color: '#64748B' }}>{selectedPlacer.email}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 5 }}>
                          <span style={{ width: 7, height: 7, borderRadius: '50%', background: selectedPlacer.is_active !== false ? '#22C55E' : '#94A3B8' }} />
                          <span style={{ fontSize: 11, color: selectedPlacer.is_active !== false ? '#22C55E' : '#94A3B8', fontWeight: 600 }}>
                            {selectedPlacer.is_active !== false ? 'Actif' : 'Désactivé'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => handleToggleActive(selectedPlacer)}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, background: selectedPlacer.is_active !== false ? 'rgba(220,38,38,0.15)' : 'rgba(34,197,94,0.15)', color: selectedPlacer.is_active !== false ? '#DC2626' : '#22C55E', border: `1px solid ${selectedPlacer.is_active !== false ? 'rgba(220,38,38,0.3)' : 'rgba(34,197,94,0.3)'}`, borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      <Power size={13} />
                      {selectedPlacer.is_active !== false ? 'Désactiver' : 'Réactiver'}
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 20 }}>
                    {[
                      { label: 'Total scans', value: selectedPlacer.total_scans || 0 },
                      { label: 'Dernier scan', value: selectedPlacer.last_scan_at ? new Date(selectedPlacer.last_scan_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '—' },
                      { label: 'Membre depuis', value: new Date(selectedPlacer.created_at).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }) },
                    ].map((stat, i) => (
                      <div key={i} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
                        <p style={{ fontSize: 17, fontWeight: 800, color: 'white' }}>{stat.value}</p>
                        <p style={{ fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 14, padding: '16px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <MessageSquare size={15} style={{ color: '#4F46E5' }} />
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>Notes internes</p>
                  </div>
                  <textarea value={note} onChange={e => setNote(e.target.value)}
                    placeholder="Notes sur ce placier (visible uniquement par la mairie)..."
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, color: '#0F172A', outline: 'none', resize: 'none', height: 90, boxSizing: 'border-box', fontFamily: 'inherit', background: '#F8FAFC' }}
                    onFocus={e => { e.target.style.borderColor = '#4F46E5'; e.target.style.background = 'white' }}
                    onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.background = '#F8FAFC' }} />
                  <button onClick={handleSaveNote} disabled={savingNote}
                    style={{ marginTop: 8, background: '#4F46E5', color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {savingNote ? <Loader size={12} style={{ animation: 'spin 0.8s linear infinite' }} /> : <CheckCircle size={12} />}
                    {savingNote ? 'Sauvegarde...' : 'Sauvegarder'}
                  </button>
                </div>

                {/* Historique scans */}
                <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 14, overflow: 'hidden' }}>
                  <div style={{ padding: '14px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Activity size={15} style={{ color: '#4F46E5' }} />
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>Historique des scans</p>
                    <span style={{ marginLeft: 'auto', fontSize: 11, color: '#94A3B8' }}>{scanHistory.length} validations</span>
                  </div>
                  <div style={{ padding: '8px' }}>
                    {scanHistory.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '24px 0', color: '#94A3B8', fontSize: 12 }}>Aucun scan enregistré</div>
                    ) : scanHistory.map((scan, i) => (
                      <div key={scan.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 8px', borderBottom: i < scanHistory.length - 1 ? '1px solid #F8FAFC' : 'none' }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#F0FDF4', border: '1px solid #BBF7D0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <CheckCircle size={14} style={{ color: '#16A34A' }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 12, fontWeight: 600, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {scan.profiles?.full_name || 'Forain inconnu'}
                          </p>
                          <p style={{ fontSize: 11, color: '#94A3B8' }}>{scan.events?.title || '—'}</p>
                        </div>
                        <span style={{ fontSize: 11, color: '#94A3B8', flexShrink: 0 }}>
                          {scan.scanned_at ? formatDate(scan.scanned_at) : '—'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
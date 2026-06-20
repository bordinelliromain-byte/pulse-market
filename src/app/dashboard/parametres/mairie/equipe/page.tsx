'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from '@/components/Sidebar'
import {
  Users, Plus, Crown, Edit3, Eye, Shield, X, Send,
  Loader, Search, Mail, KeyRound, AlertTriangle, CheckCircle,
  XCircle, Copy, RotateCw, Trash2, ChevronDown, Sparkles,
  ArrowLeft, MoreVertical, Clock, UserPlus, Power
} from 'lucide-react'

const BRAND = '#4F46E5'
const FREE_LIMIT = 5
const INVITE_EXPIRY_DAYS = 14

type Role = 'admin' | 'editeur' | 'lecteur'

const ROLES: { id: Role; label: string; description: string; icon: any; color: string; bg: string }[] = [
  {
    id: 'admin',
    label: 'Admin',
    description: 'Tout faire : gérer équipe, paramètres, événements, candidatures, finances',
    icon: <Crown size={13} />,
    color: '#7C3AED',
    bg: '#F5F3FF',
  },
  {
    id: 'editeur',
    label: 'Éditeur',
    description: 'Créer/modifier événements, valider candidatures, gérer placiers',
    icon: <Edit3 size={13} />,
    color: BRAND,
    bg: '#EEF2FF',
  },
  {
    id: 'lecteur',
    label: 'Lecteur',
    description: 'Consultation uniquement, pas de modification possible',
    icon: <Eye size={13} />,
    color: '#16A34A',
    bg: '#F0FDF4',
  },
]

const ROLE_BY_ID: Record<Role, typeof ROLES[0]> = {
  admin: ROLES[0],
  editeur: ROLES[1],
  lecteur: ROLES[2],
}

function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error' | 'info'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t) }, [onClose])
  const colors = { success: '#16A34A', error: '#DC2626', info: BRAND }
  const Icon = type === 'success' ? CheckCircle : type === 'error' ? XCircle : Sparkles
  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 2000, background: 'white', borderRadius: 12, padding: '12px 18px', boxShadow: '0 8px 32px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: 10, borderLeft: `3px solid ${colors[type]}`, minWidth: 280 }}>
      <Icon size={15} style={{ color: colors[type] }} />
      <span style={{ fontSize: 13, fontWeight: 500, color: '#0F172A' }}>{message}</span>
    </motion.div>
  )
}

// Modal de confirmation custom
function ConfirmModal({ icon, title, description, confirmLabel, confirmColor, onCancel, onConfirm }: any) {
  const [confirming, setConfirming] = useState(false)
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)' }}
      onClick={onCancel}>
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
        style={{ background: 'white', borderRadius: 16, padding: 24, maxWidth: 420, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}
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

// Badge rôle
function RoleBadge({ role, isOwner }: { role: Role; isOwner?: boolean }) {
  if (isOwner) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'linear-gradient(135deg, #FBBF24, #F59E0B)', color: 'white', fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 100 }}>
        <Crown size={9} /> Propriétaire
      </span>
    )
  }
  const r = ROLE_BY_ID[role]
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: r.bg, color: r.color, fontSize: 10, fontWeight: 600, padding: '3px 9px', borderRadius: 100 }}>
      {r.icon} {r.label}
    </span>
  )
}

// Avatar
function Avatar({ name, size = 40, gradient }: { name: string; size?: number; gradient?: boolean }) {
  const initials = (name || '?').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '?'
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: gradient ? `linear-gradient(135deg, ${BRAND}, #7C3AED)` : '#EEF2FF',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, border: gradient ? 'none' : '1.5px solid #C7D2FE',
    }}>
      <span style={{ fontSize: size * 0.35, fontWeight: 700, color: gradient ? 'white' : BRAND }}>{initials}</span>
    </div>
  )
}

export default function EquipePage() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [members, setMembers] = useState<any[]>([])
  const [invitations, setInvitations] = useState<any[]>([])
  const [isOwner, setIsOwner] = useState(false)
  const [currentRole, setCurrentRole] = useState<Role>('lecteur')

  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteNom, setInviteNom] = useState('')
  const [inviteRole, setInviteRole] = useState<Role>('lecteur')
  const [inviteMethod, setInviteMethod] = useState<'link' | 'temp_password'>('link')
  const [inviteSending, setInviteSending] = useState(false)
  const [inviteSent, setInviteSent] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [tempPassword, setTempPassword] = useState('')

  const [search, setSearch] = useState('')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [confirmAction, setConfirmAction] = useState<any>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [changingRoleId, setChangingRoleId] = useState<string | null>(null)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (profileData?.role !== 'organisateur') { router.push('/dashboard'); return }
      setProfile(profileData)

      // Vérifier si user est le propriétaire OU un membre d'une équipe
      const { data: ownMembership } = await supabase
        .from('team_members')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      // Identifier la mairie principale
      const mairieId = ownMembership?.mairie_id || user.id
      setIsOwner(mairieId === user.id)
      setCurrentRole(ownMembership ? ownMembership.role : 'admin')

      await loadTeam(mairieId)
      setLoading(false)
    }
    getData()
  }, [])

  const loadTeam = async (mairieId: string) => {
    // Charger membres
    const { data: membersData } = await supabase
      .from('team_members')
      .select(`*, profile:user_id(id, full_name, email, avatar_url, last_login_at)`)
      .eq('mairie_id', mairieId)
      .order('added_at', { ascending: true })
    setMembers(membersData || [])

    // Charger invitations
    const { data: invitesData } = await supabase
      .from('team_invitations')
      .select('*')
      .eq('mairie_id', mairieId)
      .eq('used', false)
      .order('created_at', { ascending: false })
    setInvitations(invitesData || [])
  }

  const totalSlots = members.length + invitations.length + 1 // +1 pour le owner
  const remainingSlots = FREE_LIMIT - totalSlots
  const isFreeLimit = totalSlots >= FREE_LIMIT // Plus tard : check si plan payant

  // Génère un mot de passe temporaire fort
  const generateTempPassword = () => {
    const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
    const lower = 'abcdefghijkmnpqrstuvwxyz'
    const digits = '23456789'
    const special = '!@#$%&*'
    const all = upper + lower + digits + special
    let pwd = ''
    pwd += upper[Math.floor(Math.random() * upper.length)]
    pwd += lower[Math.floor(Math.random() * lower.length)]
    pwd += digits[Math.floor(Math.random() * digits.length)]
    pwd += special[Math.floor(Math.random() * special.length)]
    for (let i = 0; i < 8; i++) {
      pwd += all[Math.floor(Math.random() * all.length)]
    }
    return pwd.split('').sort(() => Math.random() - 0.5).join('')
  }

  const handleInvite = async () => {
    if (!inviteEmail || !inviteNom) return
    setInviteSending(true)
    setInviteError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Validation email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(inviteEmail)) {
        setInviteError('Email invalide')
        setInviteSending(false)
        return
      }

      // Limite plan gratuit
      if (totalSlots >= FREE_LIMIT) {
        setInviteError(`Limite atteinte (${FREE_LIMIT} membres en plan gratuit). Passez au plan payant pour plus de membres.`)
        setInviteSending(false)
        return
      }

      // Check email déjà membre
      const existingMember = members.find(m => m.profile?.email === inviteEmail)
      if (existingMember) {
        setInviteError('Cet email fait déjà partie de votre équipe')
        setInviteSending(false)
        return
      }

      // Check invitation pending
      const existingInvite = invitations.find(i => i.email === inviteEmail)
      if (existingInvite) {
        setInviteError('Une invitation est déjà en cours pour cet email')
        setInviteSending(false)
        return
      }

      // Token crypto-secure
      const token = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).substring(2) + Date.now().toString(36)

      // Insert invitation
      const expiresAt = new Date(Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000)
      await supabase.from('team_invitations').insert({
        mairie_id: user.id,
        email: inviteEmail,
        full_name: inviteNom,
        role: inviteRole,
        token,
        invited_by: user.id,
        expires_at: expiresAt.toISOString(),
      })

      // Méthode invitation
      let emailData: any = {
        nom: inviteNom,
        mairieNom: profile?.organisation_name || profile?.full_name || 'La mairie',
        role: ROLE_BY_ID[inviteRole].label,
        expiryDays: INVITE_EXPIRY_DAYS,
      }

      if (inviteMethod === 'link') {
        const inviteUrl = `${window.location.origin}/auth/team?token=${token}&email=${encodeURIComponent(inviteEmail)}`
        emailData.inviteUrl = inviteUrl
        emailData.method = 'link'
      } else {
        const tempPwd = generateTempPassword()
        setTempPassword(tempPwd)
        emailData.tempPassword = tempPwd
        emailData.method = 'password'
        emailData.loginUrl = `${window.location.origin}/auth`
      }

      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'invitation_team',
          to: inviteEmail,
          data: emailData,
        })
      })

      setInviteSent(true)
      await loadTeam(user.id)

      if (inviteMethod === 'link') {
        setTimeout(() => {
          setInviteSent(false)
          setShowInviteModal(false)
          setInviteEmail('')
          setInviteNom('')
          setInviteRole('lecteur')
        }, 1800)
      }
      // Si temp_password, garde la modal ouverte pour copier
    } catch (err: any) {
      setInviteError(err.message)
    }
    setInviteSending(false)
  }

  // ✅ Changer rôle d'un membre
  const handleChangeRole = async (member: any, newRole: Role) => {
    setChangingRoleId(member.id)
    try {
      await supabase.from('team_members').update({ role: newRole }).eq('id', member.id)
      const { data: { user } } = await supabase.auth.getUser()
      if (user) await loadTeam(user.id)
      setToast({ message: `${member.profile?.full_name} est maintenant ${ROLE_BY_ID[newRole].label}`, type: 'success' })
    } catch (err: any) {
      setToast({ message: 'Erreur : ' + err.message, type: 'error' })
    }
    setChangingRoleId(null)
    setOpenMenuId(null)
  }

  // ✅ Transférer la propriété
  const handleTransferOwnership = (member: any) => {
    setConfirmAction({
      icon: <Crown size={22} style={{ color: '#F59E0B' }} />,
      title: 'Transférer la propriété ?',
      description: `${member.profile?.full_name} deviendra le nouveau propriétaire de l'organisation. Vous deviendrez Admin et perdrez le droit exclusif de transférer la propriété.`,
      confirmLabel: 'Transférer',
      confirmColor: '#F59E0B',
      onConfirm: async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) return

          // 1. L'ancien owner devient admin dans team_members
          // (s'il n'y est pas déjà, on l'ajoute)
          const { data: existing } = await supabase
            .from('team_members')
            .select('*')
            .eq('mairie_id', user.id)
            .eq('user_id', user.id)
            .maybeSingle()

          if (!existing) {
            await supabase.from('team_members').insert({
              mairie_id: member.user_id, // nouveau owner
              user_id: user.id,
              role: 'admin',
              added_by: user.id,
            })
          }

          // 2. Mettre à jour mairie_id de tous les membres
          await supabase.from('team_members').update({
            mairie_id: member.user_id
          }).eq('mairie_id', user.id)

          // 3. Le nouveau owner sort de team_members (il devient le owner)
          await supabase.from('team_members').delete().eq('user_id', member.user_id)

          // 4. Transférer organisation_settings
          await supabase.from('organisation_settings').update({
            mairie_id: member.user_id
          }).eq('mairie_id', user.id)

          // 5. Transférer events
          await supabase.from('events').update({
            organisateur_id: member.user_id
          }).eq('organisateur_id', user.id)

          // 6. Transférer placiers
          await supabase.from('profiles').update({
            mairie_id: member.user_id
          }).eq('mairie_id', user.id)

          setToast({ message: 'Propriété transférée. Vous allez être déconnecté...', type: 'success' })
          setConfirmAction(null)
          setTimeout(() => router.push('/auth'), 2000)
        } catch (err: any) {
          setToast({ message: 'Erreur : ' + err.message, type: 'error' })
          setConfirmAction(null)
        }
      }
    })
    setOpenMenuId(null)
  }

  // ✅ Supprimer membre
  const handleRemoveMember = (member: any) => {
    setConfirmAction({
      icon: <Trash2 size={22} style={{ color: '#DC2626' }} />,
      title: 'Retirer ce membre ?',
      description: `${member.profile?.full_name} perdra immédiatement l'accès à l'espace mairie. Son compte personnel ne sera pas supprimé.`,
      confirmLabel: 'Retirer',
      confirmColor: '#DC2626',
      onConfirm: async () => {
        try {
          await supabase.from('team_members').delete().eq('id', member.id)
          const { data: { user } } = await supabase.auth.getUser()
          if (user) await loadTeam(user.id)
          setToast({ message: 'Membre retiré de l\'équipe', type: 'success' })
        } catch (err: any) {
          setToast({ message: 'Erreur : ' + err.message, type: 'error' })
        }
        setConfirmAction(null)
      }
    })
    setOpenMenuId(null)
  }

  // ✅ Actions invitations
  const handleCancelInvite = (inv: any) => {
    setConfirmAction({
      icon: <XCircle size={22} style={{ color: '#DC2626' }} />,
      title: 'Annuler cette invitation ?',
      description: `L'invitation envoyée à ${inv.email} sera retirée. Le lien deviendra invalide.`,
      confirmLabel: 'Annuler l\'invitation',
      confirmColor: '#DC2626',
      onConfirm: async () => {
        await supabase.from('team_invitations').delete().eq('id', inv.id)
        const { data: { user } } = await supabase.auth.getUser()
        if (user) await loadTeam(user.id)
        setToast({ message: 'Invitation annulée', type: 'success' })
        setConfirmAction(null)
      }
    })
  }

  const handleResendInvite = async (inv: any) => {
    try {
      const inviteUrl = `${window.location.origin}/auth/team?token=${inv.token}&email=${encodeURIComponent(inv.email)}`
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'invitation_team',
          to: inv.email,
          data: {
            nom: inv.full_name,
            mairieNom: profile?.organisation_name || profile?.full_name,
            role: ROLE_BY_ID[inv.role as Role].label,
            inviteUrl,
            method: 'link',
            expiryDays: INVITE_EXPIRY_DAYS,
          }
        })
      })
      setToast({ message: 'Invitation renvoyée', type: 'success' })
    } catch (err: any) {
      setToast({ message: 'Erreur : ' + err.message, type: 'error' })
    }
  }

  const handleCopyInviteLink = async (inv: any) => {
    try {
      const inviteUrl = `${window.location.origin}/auth/team?token=${inv.token}&email=${encodeURIComponent(inv.email)}`
      await navigator.clipboard.writeText(inviteUrl)
      setToast({ message: 'Lien copié', type: 'success' })
    } catch {
      setToast({ message: 'Erreur copie', type: 'error' })
    }
  }

  const handleCopyTempPassword = async () => {
    try {
      await navigator.clipboard.writeText(tempPassword)
      setToast({ message: 'Mot de passe copié', type: 'success' })
    } catch {
      setToast({ message: 'Erreur copie', type: 'error' })
    }
  }

  const filteredMembers = members.filter(m =>
    m.profile?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    m.profile?.email?.toLowerCase().includes(search.toLowerCase())
  )

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

      {/* MODAL INVITATION */}
      <AnimatePresence>
        {showInviteModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
            onClick={() => { if (!inviteSent || inviteMethod === 'link') setShowInviteModal(false); setInviteError(null); setTempPassword('') }}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
              style={{ background: 'white', borderRadius: 16, padding: 28, maxWidth: 480, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}
              onClick={e => e.stopPropagation()}>

              {inviteSent && inviteMethod === 'temp_password' ? (
                // ✅ Affichage mot de passe temporaire généré
                <div>
                  <div style={{ width: 56, height: 56, background: '#F0FDF4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <CheckCircle size={26} style={{ color: '#16A34A' }} />
                  </div>
                  <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0F172A', textAlign: 'center', marginBottom: 6 }}>Invitation envoyée !</h3>
                  <p style={{ fontSize: 12, color: '#64748B', textAlign: 'center', marginBottom: 20, lineHeight: 1.5 }}>
                    {inviteNom} a reçu un email avec ses identifiants. Copiez le mot de passe temporaire au cas où :
                  </p>
                  <div style={{ background: '#0F172A', borderRadius: 10, padding: '14px 16px', marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                      <div>
                        <p style={{ fontSize: 10, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Mot de passe temporaire</p>
                        <p style={{ fontSize: 16, fontWeight: 700, color: 'white', fontFamily: 'monospace', letterSpacing: '0.05em' }}>{tempPassword}</p>
                      </div>
                      <button onClick={handleCopyTempPassword}
                        style={{ background: BRAND, color: 'white', border: 'none', borderRadius: 8, padding: '8px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Copy size={11} /> Copier
                      </button>
                    </div>
                  </div>
                  <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, padding: '10px 12px', marginBottom: 16, display: 'flex', gap: 8 }}>
                    <AlertTriangle size={13} style={{ color: '#F59E0B', flexShrink: 0, marginTop: 1 }} />
                    <p style={{ fontSize: 11, color: '#92400E', lineHeight: 1.5 }}>
                      Le membre devra changer ce mot de passe à sa première connexion. Ne pas le transmettre par messagerie non sécurisée.
                    </p>
                  </div>
                  <button onClick={() => {
                    setInviteSent(false); setShowInviteModal(false); setTempPassword('')
                    setInviteEmail(''); setInviteNom(''); setInviteRole('lecteur')
                  }}
                    style={{ width: '100%', background: BRAND, color: 'white', border: 'none', borderRadius: 10, padding: '12px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                    J'ai noté le mot de passe
                  </button>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <div>
                      <p style={{ fontSize: 16, fontWeight: 700, color: '#0F172A' }}>Inviter un membre</p>
                      <p style={{ fontSize: 12, color: '#94A3B8' }}>{totalSlots}/{FREE_LIMIT} membres · {remainingSlots} place(s) restante(s)</p>
                    </div>
                    <button onClick={() => { setShowInviteModal(false); setInviteError(null) }}
                      style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 6, cursor: 'pointer' }}>
                      <X size={14} style={{ color: '#64748B' }} />
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 16 }}>
                    {[
                      { label: 'Nom complet', value: inviteNom, setter: setInviteNom, placeholder: 'Marie Dubois', type: 'text' },
                      { label: 'Adresse email', value: inviteEmail, setter: setInviteEmail, placeholder: 'marie@mairie.fr', type: 'email' },
                    ].map(field => (
                      <div key={field.label}>
                        <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>{field.label}</label>
                        <input type={field.type} value={field.value} onChange={e => { field.setter(e.target.value); setInviteError(null) }} placeholder={field.placeholder}
                          style={{ width: '100%', padding: '10px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, color: '#0F172A', outline: 'none', boxSizing: 'border-box' }} />
                      </div>
                    ))}

                    {/* Sélection rôle */}
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>Rôle</label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {ROLES.map(r => (
                          <button key={r.id} onClick={() => setInviteRole(r.id)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                              borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                              border: inviteRole === r.id ? `1.5px solid ${r.color}` : '1px solid #E2E8F0',
                              background: inviteRole === r.id ? r.bg : 'white',
                            }}>
                            <div style={{ width: 28, height: 28, borderRadius: 7, background: r.bg, color: r.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              {r.icon}
                            </div>
                            <div style={{ flex: 1 }}>
                              <p style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }}>{r.label}</p>
                              <p style={{ fontSize: 10, color: '#94A3B8', marginTop: 2 }}>{r.description}</p>
                            </div>
                            {inviteRole === r.id && <CheckCircle size={14} style={{ color: r.color, flexShrink: 0 }} />}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Méthode d'invitation */}
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>Méthode d'envoi</label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                        {[
                          { id: 'link' as const, icon: <Mail size={13} />, label: 'Lien d\'inscription', desc: 'Recommandé' },
                          { id: 'temp_password' as const, icon: <KeyRound size={13} />, label: 'Mot de passe temporaire', desc: 'Plus rapide' },
                        ].map(m => (
                          <button key={m.id} onClick={() => setInviteMethod(m.id)}
                            style={{
                              padding: '10px 12px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                              border: inviteMethod === m.id ? `1.5px solid ${BRAND}` : '1px solid #E2E8F0',
                              background: inviteMethod === m.id ? '#EEF2FF' : 'white',
                              display: 'flex', flexDirection: 'column', gap: 4,
                            }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: inviteMethod === m.id ? BRAND : '#475569' }}>
                              {m.icon}
                              <span style={{ fontSize: 12, fontWeight: 700 }}>{m.label}</span>
                            </div>
                            <span style={{ fontSize: 10, color: '#94A3B8' }}>{m.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {inviteError && (
                    <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '8px 12px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <AlertTriangle size={13} style={{ color: '#DC2626' }} />
                      <span style={{ fontSize: 12, color: '#DC2626', fontWeight: 500 }}>{inviteError}</span>
                    </div>
                  )}

                  <button onClick={handleInvite} disabled={!inviteEmail || !inviteNom || inviteSending}
                    style={{ width: '100%', background: inviteSent ? '#16A34A' : BRAND, color: 'white', border: 'none', borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: (!inviteEmail || !inviteNom) ? 0.5 : 1 }}>
                    {inviteSending ? <Loader size={15} style={{ animation: 'spin 0.8s linear infinite' }} /> : inviteSent ? <CheckCircle size={15} /> : <Send size={15} />}
                    {inviteSending ? 'Envoi...' : inviteSent ? 'Envoyé !' : "Envoyer l'invitation"}
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ marginLeft: 220, flex: 1, minWidth: 0 }}>
        <header style={{ background: 'white', borderBottom: '1px solid #E2E8F0', padding: '0 28px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => router.push('/dashboard/parametres/mairie')}
              style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', fontSize: 12 }}>
              <ArrowLeft size={13} /> Paramètres
            </button>
            <div style={{ width: 1, height: 16, background: '#E2E8F0' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Users size={14} style={{ color: BRAND }} />
              <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>Équipe</p>
              <span style={{ background: '#EEF2FF', color: BRAND, fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 100 }}>
                {totalSlots}/{FREE_LIMIT === Infinity ? '∞' : FREE_LIMIT}
              </span>
            </div>
          </div>
          {isOwner && (
            <button onClick={() => setShowInviteModal(true)} disabled={isFreeLimit}
              style={{ display: 'flex', alignItems: 'center', gap: 7, background: isFreeLimit ? '#F1F5F9' : BRAND, color: isFreeLimit ? '#94A3B8' : 'white', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: isFreeLimit ? 'not-allowed' : 'pointer' }}>
              <UserPlus size={14} /> Inviter
            </button>
          )}
        </header>

        <main style={{ padding: '24px 28px', maxWidth: 900 }}>

          {/* Upgrade banner si limite atteinte */}
          {isFreeLimit && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              style={{ background: 'linear-gradient(135deg, #0F172A, #1E293B)', borderRadius: 14, padding: '18px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 40, height: 40, background: 'rgba(251,191,36,0.15)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={20} style={{ color: '#FBBF24' }} />
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: 'white', marginBottom: 3 }}>Limite atteinte : {FREE_LIMIT} membres</p>
                  <p style={{ fontSize: 12, color: '#94A3B8' }}>Passez au plan PulseMarket Pro pour des membres illimités, audit logs étendus, et plus.</p>
                </div>
              </div>
              <button onClick={() => router.push('/dashboard/parametres/mairie?tab=facturation')}
                style={{ background: 'linear-gradient(135deg, #FBBF24, #F59E0B)', color: '#0F172A', border: 'none', borderRadius: 10, padding: '10px 18px', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
                Passer au Pro
              </button>
            </motion.div>
          )}

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Total membres', value: members.length + 1, color: BRAND },
              { label: 'Admins', value: 1 + members.filter(m => m.role === 'admin').length, color: '#7C3AED' },
              { label: 'Éditeurs', value: members.filter(m => m.role === 'editeur').length, color: BRAND },
              { label: 'Lecteurs', value: members.filter(m => m.role === 'lecteur').length, color: '#16A34A' },
            ].map(stat => (
              <div key={stat.label} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: '14px 16px' }}>
                <p style={{ fontSize: 10, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{stat.label}</p>
                <p style={{ fontSize: 22, fontWeight: 800, color: stat.color }}>{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Search */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ position: 'relative', maxWidth: 340 }}>
              <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un membre..."
                style={{ width: '100%', padding: '8px 12px 8px 30px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 12, color: '#0F172A', background: 'white', outline: 'none', boxSizing: 'border-box' }} />
            </div>
          </div>

          {/* Owner card */}
          <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: '14px 18px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 14 }}>
            <Avatar name={profile?.full_name || ''} gradient />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{profile?.full_name}</p>
                <RoleBadge role="admin" isOwner />
                <span style={{ fontSize: 10, color: '#94A3B8' }}>· Vous</span>
              </div>
              <p style={{ fontSize: 11, color: '#94A3B8' }}>{profile?.email}</p>
            </div>
          </div>

          {/* Membres */}
          {filteredMembers.map(member => {
            const isMenuOpen = openMenuId === member.id
            const memberRole = member.role as Role
            return (
              <div key={member.id} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: '14px 18px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 14, position: 'relative' }}>
                <Avatar name={member.profile?.full_name || ''} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{member.profile?.full_name}</p>
                    <RoleBadge role={memberRole} />
                  </div>
                  <p style={{ fontSize: 11, color: '#94A3B8' }}>
                    {member.profile?.email}
                    {member.last_login_at && ` · Vu ${new Date(member.last_login_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`}
                  </p>
                </div>
                {isOwner && (
                  <div style={{ position: 'relative' }}>
                    <button onClick={() => setOpenMenuId(isMenuOpen ? null : member.id)}
                      style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 6, cursor: 'pointer', display: 'flex' }}>
                      <MoreVertical size={14} style={{ color: '#64748B' }} />
                    </button>
                    {isMenuOpen && (
                      <>
                        <div onClick={() => setOpenMenuId(null)} style={{ position: 'fixed', inset: 0, zIndex: 998 }} />
                        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                          style={{ position: 'absolute', top: '100%', right: 0, marginTop: 6, background: 'white', borderRadius: 10, boxShadow: '0 12px 32px rgba(0,0,0,0.12)', border: '1px solid #E2E8F0', padding: 6, zIndex: 999, minWidth: 200 }}>

                          <p style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '6px 8px 4px' }}>Changer le rôle</p>
                          {ROLES.map(r => (
                            <button key={r.id} onClick={() => handleChangeRole(member, r.id)} disabled={memberRole === r.id || changingRoleId === member.id}
                              style={{
                                width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px', borderRadius: 6,
                                background: memberRole === r.id ? r.bg : 'none', border: 'none', cursor: memberRole === r.id ? 'default' : 'pointer',
                                color: memberRole === r.id ? r.color : '#475569', fontSize: 12, fontWeight: memberRole === r.id ? 600 : 500,
                                textAlign: 'left',
                              }}>
                              {r.icon} {r.label}
                              {memberRole === r.id && <CheckCircle size={11} style={{ marginLeft: 'auto', color: r.color }} />}
                            </button>
                          ))}

                          <div style={{ height: 1, background: '#F1F5F9', margin: '6px 0' }} />

                          <button onClick={() => handleTransferOwnership(member)}
                            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px', borderRadius: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#F59E0B', fontSize: 12, fontWeight: 500, textAlign: 'left' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#FFFBEB'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                            <Crown size={12} /> Transférer la propriété
                          </button>

                          <button onClick={() => handleRemoveMember(member)}
                            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px', borderRadius: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', fontSize: 12, fontWeight: 500, textAlign: 'left' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#FEF2F2'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                            <Trash2 size={12} /> Retirer de l'équipe
                          </button>
                        </motion.div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )
          })}

          {/* Invitations pending */}
          {invitations.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock size={11} /> Invitations en attente ({invitations.length})
              </p>
              {invitations.map(inv => (
                <div key={inv.id} style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 12, padding: '12px 18px', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Mail size={16} style={{ color: '#F59E0B' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#92400E' }}>{inv.full_name || inv.email}</p>
                        <RoleBadge role={inv.role as Role} />
                      </div>
                      <p style={{ fontSize: 11, color: '#D97706' }}>{inv.email} · Expire le {new Date(inv.expires_at).toLocaleDateString('fr-FR')}</p>
                    </div>
                  </div>
                  {isOwner && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => handleCopyInviteLink(inv)}
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, background: 'white', color: '#92400E', border: '1px solid #FDE68A', borderRadius: 6, padding: '6px 0', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                        <Copy size={11} /> Lien
                      </button>
                      <button onClick={() => handleResendInvite(inv)}
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, background: 'white', color: BRAND, border: `1px solid ${BRAND}40`, borderRadius: 6, padding: '6px 0', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                        <RotateCw size={11} /> Renvoyer
                      </button>
                      <button onClick={() => handleCancelInvite(inv)}
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, background: 'white', color: '#DC2626', border: '1px solid #FECACA', borderRadius: 6, padding: '6px 0', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                        <X size={11} /> Annuler
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {members.length === 0 && invitations.length === 0 && (
            <div style={{ background: 'white', border: '1px dashed #E2E8F0', borderRadius: 14, padding: '50px 24px', textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, background: '#EEF2FF', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                <Users size={24} style={{ color: BRAND }} />
              </div>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>Vous êtes seul pour l'instant</p>
              <p style={{ fontSize: 12, color: '#64748B', marginBottom: 18, maxWidth: 360, margin: '0 auto 18px' }}>
                Invitez des collègues pour vous aider à gérer les marchés, valider les candidatures ou consulter les données.
              </p>
              {isOwner && (
                <button onClick={() => setShowInviteModal(true)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: BRAND, color: 'white', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  <UserPlus size={13} /> Inviter le premier membre
                </button>
              )}
            </div>
          )}

        </main>
      </div>
    </div>
  )
}
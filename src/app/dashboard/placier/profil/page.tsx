'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User, Mail, Phone, Calendar, LogOut, TrendingUp,
  CheckCircle, XCircle, Shield, Loader, ChevronRight,
  Award, Activity, Building2, AlertTriangle
} from 'lucide-react'

const BRAND = '#4F46E5'

function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t) }, [onClose])
  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', bottom: 100, left: 20, right: 20, zIndex: 200, background: '#1E293B', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, borderLeft: `3px solid ${type === 'success' ? '#22C55E' : '#DC2626'}` }}>
      {type === 'success' ? <CheckCircle size={15} style={{ color: '#22C55E' }} /> : <XCircle size={15} style={{ color: '#DC2626' }} />}
      <span style={{ fontSize: 13, fontWeight: 500, color: 'white' }}>{message}</span>
    </motion.div>
  )
}

export default function PlacierProfil() {
  const [profile, setProfile] = useState<any>(null)
  const [mairie, setMairie] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalScans: 0,
    validScans: 0,
    invalidScans: 0,
    scansToday: 0,
    eventsCount: 0,
  })
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/placier'); return }
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (profileData?.role !== 'placier' && profileData?.role !== 'organisateur') {
        router.push('/dashboard'); return
      }
      setProfile(profileData)

      // Charger la mairie
      if (profileData.mairie_id) {
        const { data: mairieData } = await supabase
          .from('profiles')
          .select('full_name, email, organisation_name')
          .eq('id', profileData.mairie_id)
          .single()
        setMairie(mairieData)
      }

      // Stats
      const today = new Date().toISOString().split('T')[0] + 'T00:00:00'

      const [
        { data: allScans },
        { data: todayScans },
        { data: planning },
      ] = await Promise.all([
        supabase.from('scan_history').select('id, scan_result').eq('placier_id', user.id),
        supabase.from('scan_history').select('id').eq('placier_id', user.id).gte('created_at', today),
        supabase.from('placier_planning').select('id').eq('placier_id', user.id),
      ])

      const validScans = (allScans || []).filter(s => s.scan_result === 'valid').length
      const invalidScans = (allScans || []).filter(s => s.scan_result === 'invalid' || s.scan_result === 'wrong_event').length

      setStats({
        totalScans: allScans?.length || 0,
        validScans,
        invalidScans,
        scansToday: todayScans?.length || 0,
        eventsCount: planning?.length || 0,
      })

      setLoading(false)
    }
    getData()
  }, [])

  const handleLogout = async () => {
    setLoggingOut(true)
    await supabase.auth.signOut()
    router.push('/auth/placier')
  }

  const successRate = stats.totalScans > 0 ? Math.round((stats.validScans / stats.totalScans) * 100) : 0

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 28, height: 28, border: `2px solid ${BRAND}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#0F172A', fontFamily: "'Inter', system-ui, sans-serif", maxWidth: 480, margin: '0 auto', color: 'white' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <AnimatePresence>{toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}</AnimatePresence>

      {/* MODAL DECONNEXION */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowLogoutConfirm(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 50 }} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              style={{ position: 'fixed', top: '50%', left: 20, right: 20, transform: 'translateY(-50%)', background: '#1E293B', borderRadius: 16, padding: 20, zIndex: 60, maxWidth: 380, margin: '0 auto', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ width: 48, height: 48, background: 'rgba(220,38,38,0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                <LogOut size={22} style={{ color: '#DC2626' }} />
              </div>
              <p style={{ fontSize: 16, fontWeight: 800, color: 'white', textAlign: 'center', marginBottom: 6 }}>Se déconnecter ?</p>
              <p style={{ fontSize: 12, color: '#94A3B8', textAlign: 'center', marginBottom: 20, lineHeight: 1.5 }}>
                Vous devrez vous reconnecter pour scanner.
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setShowLogoutConfirm(false)}
                  style={{ flex: 1, background: 'rgba(255,255,255,0.06)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '12px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  Annuler
                </button>
                <button onClick={handleLogout} disabled={loggingOut}
                  style={{ flex: 1, background: '#DC2626', color: 'white', border: 'none', borderRadius: 10, padding: '12px', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  {loggingOut ? <Loader size={13} style={{ animation: 'spin 0.8s linear infinite' }} /> : <LogOut size={13} />}
                  Déconnexion
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* HEADER avec gradient */}
      <div style={{
        background: `linear-gradient(135deg, ${BRAND}, #7C3AED)`,
        padding: '24px 20px 60px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 2 }}>
          <div style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 14,
            border: '2px solid rgba(255,255,255,0.25)',
          }}>
            <span style={{ fontSize: 30, fontWeight: 800, color: 'white' }}>
              {(profile?.full_name || '?').charAt(0).toUpperCase()}
            </span>
          </div>
          <p style={{ fontSize: 18, fontWeight: 800, color: 'white', marginBottom: 4 }}>{profile?.full_name}</p>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 100, background: 'rgba(255,255,255,0.15)', color: 'white', letterSpacing: '0.05em' }}>
            <Shield size={10} /> PLACIER
          </span>
        </div>
      </div>

      {/* STATS CARD OVERLAP */}
      <div style={{ padding: '0 16px', marginTop: -40, position: 'relative', zIndex: 5 }}>
        <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          style={{ background: '#1E293B', borderRadius: 16, padding: '18px 16px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 14 }}>
            {[
              { label: 'Aujourd\'hui', value: stats.scansToday, color: BRAND, icon: <Activity size={12} /> },
              { label: 'Total scans', value: stats.totalScans, color: '#22C55E', icon: <TrendingUp size={12} /> },
              { label: 'Marchés', value: stats.eventsCount, color: '#F59E0B', icon: <Calendar size={12} /> },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 4, color: s.color }}>
                  {s.icon}
                </div>
                <p style={{ fontSize: 22, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</p>
                <p style={{ fontSize: 9, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 4 }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Taux succès */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: '#94A3B8', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <Award size={11} style={{ color: '#22C55E' }} /> Taux de validation
              </span>
              <span style={{ fontSize: 14, fontWeight: 800, color: '#22C55E' }}>{successRate}%</span>
            </div>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 100, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${successRate}%`, background: 'linear-gradient(90deg, #22C55E, #4ADE80)', borderRadius: 100, transition: 'width 0.5s' }} />
            </div>
          </div>
        </motion.div>
      </div>

      {/* MAIRIE INFO */}
      {mairie && (
        <div style={{ padding: '16px 16px 0' }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, paddingLeft: 4 }}>
            Organisation
          </p>
          <div style={{ background: '#1E293B', borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ width: 38, height: 38, borderRadius: 9, background: 'rgba(79,70,229,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Building2 size={18} style={{ color: BRAND }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>{mairie.organisation_name || mairie.full_name}</p>
              <p style={{ fontSize: 11, color: '#64748B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mairie.email}</p>
            </div>
          </div>
        </div>
      )}

      {/* INFOS PERSONNELLES */}
      <div style={{ padding: '16px 16px 0' }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, paddingLeft: 4 }}>
          Mes informations
        </p>
        <div style={{ background: '#1E293B', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
          {[
            { icon: <Mail size={14} />, label: 'Email', value: profile?.email },
            { icon: <Phone size={14} />, label: 'Téléphone', value: profile?.phone || 'Non renseigné' },
            { icon: <Calendar size={14} />, label: 'Compte créé', value: profile?.created_at ? new Date(profile.created_at).toLocaleDateString('fr-FR') : '—' },
            { icon: <Activity size={14} />, label: 'Dernier scan', value: profile?.last_scan_at ? new Date(profile.last_scan_at).toLocaleDateString('fr-FR') : 'Jamais' },
          ].map((item, i, arr) => (
            <div key={item.label} style={{
              padding: '12px 14px',
              borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}>
              <div style={{ color: '#64748B' }}>{item.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 10, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>{item.label}</p>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* NOTES MAIRIE (si présentes) */}
      {profile?.notes && (
        <div style={{ padding: '16px 16px 0' }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, paddingLeft: 4 }}>
            Notes de la mairie
          </p>
          <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 12, padding: '12px 14px', display: 'flex', gap: 10 }}>
            <AlertTriangle size={13} style={{ color: '#F59E0B', flexShrink: 0, marginTop: 2 }} />
            <p style={{ fontSize: 12, color: '#FCD34D', lineHeight: 1.6 }}>{profile.notes}</p>
          </div>
        </div>
      )}

      {/* APP INFO */}
      <div style={{ padding: '20px 16px 0' }}>
        <div style={{ background: '#1E293B', borderRadius: 12, padding: '12px 14px', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
          <p style={{ fontSize: 11, color: '#64748B', marginBottom: 3 }}>PulseMarket Placier</p>
          <p style={{ fontSize: 10, color: '#475569' }}>Version 1.0 · 2026</p>
        </div>
      </div>

      {/* LOGOUT */}
      <div style={{ padding: '20px 16px 110px' }}>
        <button onClick={() => setShowLogoutConfirm(true)}
          style={{ width: '100%', background: 'rgba(220,38,38,0.1)', color: '#DC2626', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 12, padding: '14px', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <LogOut size={14} /> Se déconnecter
        </button>
      </div>
    </div>
  )
}
// src/app/verif/[id]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { motion } from 'framer-motion'

type CandidatureData = {
  id: string
  status: string
  exposant_nom: string
  exposant_business: string
  exposant_siren: string
  exposant_produits: string
  event_title: string
  event_date: string
  event_location: string
  case_number: string | null
  paid_at: string | null
} | null

type VerifState = 'loading' | 'valid' | 'invalid' | 'not_paid' | 'wrong_date' | 'not_found'

export default function VerifPage() {
  const params = useParams()
  const id = params?.id as string
  const [state, setState] = useState<VerifState>('loading')
  const [data, setData] = useState<CandidatureData>(null)

  useEffect(() => {
    const verify = async () => {
      if (!id) { setState('not_found'); return }
      try {
        const supabase = createClient()
        const { data: app, error } = await supabase
          .from('applications')
          .select(`
            id, status, case_number, paid_at,
            profiles:exposant_id(full_name),
            events:event_id(title, start_date, location_name)
          `)
          .eq('id', id)
          .single()

        if (error || !app) { setState('not_found'); return }

        const { data: expData } = await supabase
          .from('exposant_data')
          .select('business_name, siren, description')
          .eq('user_id', (app as any).exposant_id)
          .single()

        const fullData: CandidatureData = {
          id: app.id,
          status: app.status,
          exposant_nom: (app as any).profiles?.full_name || '',
          exposant_business: expData?.business_name || '',
          exposant_siren: expData?.siren || '',
          exposant_produits: expData?.description || '',
          event_title: (app as any).events?.title || '',
          event_date: (app as any).events?.start_date || '',
          event_location: (app as any).events?.location_name || '',
          case_number: app.case_number,
          paid_at: app.paid_at,
        }
        setData(fullData)

        // Logique de validation
        if (app.status !== 'paid') { setState('not_paid'); return }

        // Vérification de la date du marché (tolérance 24h avant + 24h après)
        const eventDate = new Date((app as any).events?.start_date)
        const now = new Date()
        const dayBefore = new Date(eventDate.getTime() - 24 * 60 * 60 * 1000)
        const dayAfter = new Date(eventDate.getTime() + 24 * 60 * 60 * 1000)

        if (now < dayBefore || now > dayAfter) {
          setState('wrong_date')
          return
        }

        setState('valid')
      } catch (err) {
        console.error(err)
        setState('not_found')
      }
    }
    verify()
  }, [id])

  // ✅ ÉCRAN VALIDE
  if (state === 'valid' && data) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: "'Inter', system-ui, sans-serif" }}>
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.4 }}
          style={{ background: 'white', borderRadius: 24, padding: '40px 28px', maxWidth: 420, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', textAlign: 'center' }}>

          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
            style={{ width: 88, height: 88, borderRadius: '50%', background: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </motion.div>

          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', marginBottom: 6, letterSpacing: '-0.02em' }}>Accès autorisé</h1>
          <p style={{ fontSize: 14, color: '#10B981', fontWeight: 600, marginBottom: 28 }}>Autorisation valide</p>

          <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 14, padding: '18px 20px', marginBottom: 16, textAlign: 'left' }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#16A34A', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Bénéficiaire</p>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>{data.exposant_business || data.exposant_nom}</p>
            {data.exposant_siren && <p style={{ fontSize: 12, color: '#64748B' }}>SIREN : {data.exposant_siren}</p>}
            {data.exposant_produits && <p style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>{data.exposant_produits}</p>}
          </div>

          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 14, padding: '18px 20px', marginBottom: 16, textAlign: 'left' }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Marché</p>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>{data.event_title}</p>
            <p style={{ fontSize: 12, color: '#64748B' }}>{new Date(data.event_date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            <p style={{ fontSize: 12, color: '#64748B' }}>{data.event_location}</p>
          </div>

          {data.case_number && (
            <div style={{ background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', borderRadius: 14, padding: '16px 20px', marginBottom: 16 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Emplacement</p>
              <p style={{ fontSize: 32, fontWeight: 800, color: 'white', letterSpacing: '-0.02em' }}>{data.case_number}</p>
            </div>
          )}

          {data.paid_at && (
            <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 12 }}>
              Payé le {new Date(data.paid_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          )}
        </motion.div>
      </div>
    )
  }

  // ❌ ÉCRAN NON PAYÉ
  if (state === 'not_paid' && data) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: "'Inter', system-ui, sans-serif" }}>
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          style={{ background: 'white', borderRadius: 24, padding: '40px 28px', maxWidth: 420, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', textAlign: 'center' }}>

          <div style={{ width: 88, height: 88, borderRadius: '50%', background: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </div>

          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', marginBottom: 6 }}>Accès refusé</h1>
          <p style={{ fontSize: 14, color: '#DC2626', fontWeight: 600, marginBottom: 28 }}>Paiement non confirmé</p>

          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 14, padding: '18px 20px', marginBottom: 16, textAlign: 'left' }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>{data.exposant_business || data.exposant_nom}</p>
            <p style={{ fontSize: 12, color: '#64748B' }}>{data.event_title}</p>
          </div>

          <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 12, padding: '14px 16px', marginTop: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#92400E', textAlign: 'left' }}>
              ⚠️ Cette autorisation n'est pas valide.<br/>
              L'exposant doit régulariser son paiement auprès de la mairie.
            </p>
          </div>
        </motion.div>
      </div>
    )
  }

  // ⚠️ ÉCRAN MAUVAISE DATE
  if (state === 'wrong_date' && data) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: "'Inter', system-ui, sans-serif" }}>
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          style={{ background: 'white', borderRadius: 24, padding: '40px 28px', maxWidth: 420, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', textAlign: 'center' }}>

          <div style={{ width: 88, height: 88, borderRadius: '50%', background: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>

          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0F172A', marginBottom: 6 }}>Autorisation non valide aujourd'hui</h1>
          <p style={{ fontSize: 13, color: '#D97706', fontWeight: 600, marginBottom: 24 }}>L'autorisation ne correspond pas à la date d'aujourd'hui</p>

          <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 14, padding: '18px 20px', textAlign: 'left' }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>{data.event_title}</p>
            <p style={{ fontSize: 12, color: '#92400E' }}>Date prévue : {new Date(data.event_date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
        </motion.div>
      </div>
    )
  }

  // 🔍 NON TROUVÉ
  if (state === 'not_found') {
    return (
      <div style={{ minHeight: '100vh', background: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: "'Inter', system-ui, sans-serif" }}>
        <div style={{ background: 'white', borderRadius: 24, padding: '40px 28px', maxWidth: 420, width: '100%', textAlign: 'center' }}>
          <div style={{ width: 88, height: 88, borderRadius: '50%', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', marginBottom: 6 }}>Autorisation introuvable</h1>
          <p style={{ fontSize: 13, color: '#64748B' }}>Ce QR code ne correspond à aucune autorisation valide dans notre système.</p>
        </div>
      </div>
    )
  }

  // LOADING
  return (
    <div style={{ minHeight: '100vh', background: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 40, height: 40, border: '3px solid rgba(255,255,255,0.2)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { openFacturePDF } from '@/lib/generateFacture'
import { CheckCircle, FileText, ArrowLeft, Loader } from 'lucide-react'

function PaiementSuccessContent() {
  const [loading, setLoading] = useState(true)
  const [candidature, setCandidature] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [updateError, setUpdateError] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()

  const candidatureId = searchParams.get('candidature_id')

  useEffect(() => {
    const getData = async () => {
      console.log('✅ candidatureId reçu:', candidatureId)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }

      const { data: profileData } = await supabase
        .from('profiles').select('*').eq('id', user.id).single()
      setProfile(profileData)

      if (candidatureId) {
        const { error: updateErr } = await supabase
          .from('applications')
          .update({ status: 'paid' })
          .eq('id', candidatureId)

        if (updateErr) {
          console.error('❌ Erreur update statut:', updateErr)
          setUpdateError(updateErr.message)
        } else {
          console.log('✅ Statut mis à jour en paid')
        }

        const { data: app } = await supabase
          .from('applications')
          .select(`*, profiles:exposant_id(full_name, email), events:event_id(title, start_date, location_name, price_per_spot)`)
          .eq('id', candidatureId)
          .single()

        if (app) {
          const { data: expData } = await supabase
            .from('exposant_data').select('*').eq('user_id', user.id).single()
          setCandidature({ ...app, exposant_data: expData })
        }
      } else {
        console.error('❌ candidature_id manquant dans l\'URL')
      }

      setLoading(false)
    }
    getData()
  }, [candidatureId])

  const handleVoirFacture = () => {
    if (!candidature) return
    openFacturePDF({
      candidatureId: candidature.id,
      exposantNom: profile?.full_name || '',
      exposantEmail: profile?.email || '',
      exposantSiren: candidature.exposant_data?.siren,
      exposantBusinessName: candidature.exposant_data?.business_name,
      eventTitle: candidature.events?.title || '',
      eventDate: candidature.events?.start_date
        ? new Date(candidature.events.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
        : '',
      eventLocation: candidature.events?.location_name || '',
      redevanceAOT: candidature.events?.price_per_spot || 0,
      fraisPlateforme: 2,
    })
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <Loader size={28} style={{ color: '#4F46E5', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ fontSize: 13, color: '#64748B', fontFamily: 'Inter, system-ui, sans-serif' }}>Confirmation du paiement...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', system-ui, sans-serif", padding: 24 }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.4, type: 'spring' }}
        style={{ background: 'white', borderRadius: 20, padding: '48px 40px', maxWidth: 480, width: '100%', textAlign: 'center', boxShadow: '0 8px 60px rgba(0,0,0,0.08)' }}>

        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          style={{ width: 72, height: 72, background: '#F0FDF4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', border: '2px solid #BBF7D0' }}>
          <CheckCircle size={36} style={{ color: '#16A34A' }} />
        </motion.div>

        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', marginBottom: 8, letterSpacing: '-0.02em' }}>
          Paiement confirmé !
        </h1>
        <p style={{ fontSize: 14, color: '#64748B', marginBottom: 28, lineHeight: 1.6 }}>
          Votre place est réservée pour{' '}
          <strong style={{ color: '#0F172A' }}>{candidature?.events?.title || 'l\'événement'}</strong>.
          Votre facture est disponible ci-dessous.
        </p>

        {updateError && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#DC2626' }}>
            Erreur : {updateError}
          </div>
        )}

        {candidature && (
          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: '16px 20px', marginBottom: 28, textAlign: 'left' }}>
            {[
              { label: 'Événement', value: candidature.events?.title },
              { label: 'Date', value: candidature.events?.start_date ? new Date(candidature.events.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—' },
              { label: 'Lieu', value: candidature.events?.location_name },
              { label: 'Redevance AOT', value: `${candidature.events?.price_per_spot || 0} €` },
              { label: 'Frais de service', value: '2 €' },
              { label: 'Total TTC', value: `${(candidature.events?.price_per_spot || 0) + 2} €` },
            ].map((item, i, arr) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, paddingBottom: i < arr.length - 1 ? 8 : 0, marginBottom: i < arr.length - 1 ? 8 : 0, borderBottom: i < arr.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                <span style={{ color: '#64748B' }}>{item.label}</span>
                <span style={{ fontWeight: i === arr.length - 1 ? 700 : 500, color: i === arr.length - 1 ? '#4F46E5' : '#0F172A' }}>{item.value}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button onClick={handleVoirFacture}
            style={{ width: '100%', background: '#4F46E5', color: 'white', border: 'none', borderRadius: 12, padding: '13px 0', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <FileText size={16} /> Voir ma facture PDF
          </button>
          <button onClick={() => window.location.href = '/dashboard'}
            style={{ width: '100%', background: '#F8FAFC', color: '#64748B', border: '1px solid #E2E8F0', borderRadius: 12, padding: '12px 0', fontSize: 14, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <ArrowLeft size={15} /> Retour au dashboard
          </button>
        </div>

        <p style={{ fontSize: 11, color: '#CBD5E1', marginTop: 20, lineHeight: 1.6 }}>
          Un email de confirmation vous a été envoyé à <strong>{profile?.email}</strong>
        </p>
      </motion.div>
    </div>
  )
}

export default function PaiementSuccess() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 28, height: 28, border: '2px solid #4F46E5', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    }>
      <PaiementSuccessContent />
    </Suspense>
  )
}
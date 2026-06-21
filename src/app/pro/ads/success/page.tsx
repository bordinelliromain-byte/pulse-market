'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase'

function BoostSuccessContent() {
  const searchParams = useSearchParams()
  const nom = searchParams.get('nom') || 'votre commerce'
  const event = searchParams.get('event') || 'le marché'
  const eventId = searchParams.get('eventId') || ''
  const offre = searchParams.get('offre') || 'Boost Whatmarket'
  const amount = parseInt(searchParams.get('amount') || '20', 10)
  const sessionId = searchParams.get('session_id')
  const [emailSent, setEmailSent] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (!sessionId || emailSent) return

    // Envoyer l'email de confirmation via notre API
    const sendEmail = async () => {
      try {
        // ✅ Récupérer l'email de l'utilisateur connecté
        const { data: { user } } = await supabase.auth.getUser()

        if (!user?.email) {
          console.error('[boost-success] Pas d\'email utilisateur trouvé')
          return
        }

        const res = await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'boost_confirmation',
            to: user.email,
            data: {
              nom: nom || user.user_metadata?.full_name || 'Forain',
              offre,
              eventTitle: event,
              eventId,
              amount,
              stripeSessionId: sessionId,
            }
          })
        })

        if (res.ok) {
          setEmailSent(true)
        } else {
          console.error('[boost-success] Erreur envoi email:', await res.text())
        }
      } catch (err) {
        console.error('[boost-success] Email error:', err)
      }
    }
    sendEmail()
  }, [sessionId, emailSent, nom, event, eventId, offre, amount, supabase])

  return (
    <div style={{ minHeight: '100vh', background: '#F9F8F6', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: '"DM Sans", system-ui, sans-serif' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:opsz,wght@9..40,400;9..40,600;9..40,700&display=swap');`}</style>

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{ maxWidth: 440, width: '100%', textAlign: 'center' }}>

        {/* Icône succès */}
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring', damping: 20 }}
          style={{ width: 80, height: 80, background: '#F0FDF4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', border: '2px solid #BBF7D0' }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </motion.div>

        {/* Titre */}
        <p style={{ fontFamily: '"Playfair Display", serif', fontSize: 28, fontWeight: 900, color: '#111827', lineHeight: 1.2, marginBottom: 10 }}>
          Vous êtes en tête d'affiche ! 🚀
        </p>
        <p style={{ fontSize: 15, color: '#6B7280', lineHeight: 1.7, marginBottom: 28 }}>
          Votre pub pour <strong style={{ color: '#111827' }}>{nom}</strong> est maintenant visible dans Whatmarket pour <strong style={{ color: '#111827' }}>{event}</strong>.
        </p>

        {/* Récap */}
        <div style={{ background: 'white', borderRadius: 20, padding: '20px 24px', boxShadow: '0 2px 20px rgba(0,0,0,0.06)', marginBottom: 24, textAlign: 'left' }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>Récapitulatif</p>
          {[
            ['Commerce', nom],
            ['Marché', event],
            ['Type', 'Publication sponsorisée'],
            ['Montant payé', `${amount.toFixed(2)} €`],
            ['Statut', '✅ Confirmé'],
          ].map(([label, value], i, arr) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, paddingBottom: i < arr.length - 1 ? 10 : 0, marginBottom: i < arr.length - 1 ? 10 : 0, borderBottom: i < arr.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
              <span style={{ color: '#9CA3AF' }}>{label}</span>
              <span style={{ fontWeight: 600, color: '#111827' }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Info email */}
        <div style={{ background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 14, padding: '12px 16px', marginBottom: 28, display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          <p style={{ fontSize: 12, color: '#4338CA' }}>Un email de confirmation avec votre facture a été envoyé à votre adresse.</p>
        </div>

        {/* Partage */}
        <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 14, padding: '14px 16px', marginBottom: 24 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#065F46', marginBottom: 4 }}>📣 Partagez sur vos réseaux !</p>
          <p style={{ fontSize: 12, color: '#6EE7B7', marginBottom: 12 }}>Montrez à vos clients que vous êtes présents aujourd'hui</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <a href={`https://wa.me/?text=${encodeURIComponent(`Je suis en tête d'affiche au ${event} aujourd'hui ! Venez me retrouver 🎉`)}`}
              target="_blank" rel="noopener noreferrer"
              style={{ flex: 1, background: '#25D366', color: 'white', textDecoration: 'none', borderRadius: 10, padding: '10px', fontSize: 12, fontWeight: 700, textAlign: 'center', display: 'block' }}>
              WhatsApp
            </a>
            <a href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer"
              style={{ flex: 1, background: 'linear-gradient(135deg,#F58529,#DD2A7B,#8134AF)', color: 'white', textDecoration: 'none', borderRadius: 10, padding: '10px', fontSize: 12, fontWeight: 700, textAlign: 'center', display: 'block' }}>
              Instagram
            </a>
          </div>
        </div>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: 10 }}>
          <a href="/whatmarket" style={{ flex: 1, background: '#111827', color: 'white', textDecoration: 'none', borderRadius: 14, padding: '14px', fontSize: 14, fontWeight: 700, textAlign: 'center', display: 'block' }}>
            Voir sur Whatmarket
          </a>
          <a href="/pro/ads/new" style={{ flex: 1, background: '#F3F4F6', color: '#374151', textDecoration: 'none', borderRadius: 14, padding: '14px', fontSize: 14, fontWeight: 600, textAlign: 'center', display: 'block' }}>
            Nouvelle pub
          </a>
        </div>
      </motion.div>
    </div>
  )
}

export default function BoostSuccessPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#F9F8F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, border: '3px solid #E5E7EB', borderTopColor: '#4F46E5', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    }>
      <BoostSuccessContent />
    </Suspense>
  )
}
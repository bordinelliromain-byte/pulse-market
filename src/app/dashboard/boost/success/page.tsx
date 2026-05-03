'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'

function BoostExposantSuccessContent() {
  const searchParams = useSearchParams()
  const nom = searchParams.get('nom') || 'votre stand'
  const event = searchParams.get('event') || 'le marché'

  return (
    <div style={{ minHeight: '100vh', background: '#F9F8F6', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: '"DM Sans", system-ui, sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:opsz,wght@9..40,400;9..40,600;9..40,700&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{ maxWidth: 440, width: '100%', textAlign: 'center' }}>

        {/* Icône succès */}
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring', damping: 20 }}
          style={{ width: 80, height: 80, background: '#ECFDF5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', border: '2px solid #BBF7D0' }}>
          <span style={{ fontSize: 36 }}>⭐</span>
        </motion.div>

        <p style={{ fontFamily: '"Playfair Display", serif', fontSize: 26, fontWeight: 900, color: '#111827', lineHeight: 1.2, marginBottom: 10 }}>
          Vous êtes à ne pas manquer !
        </p>
        <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.7, marginBottom: 28 }}>
          Votre stand <strong style={{ color: '#111827' }}>{nom}</strong> est maintenant mis en avant dans Whatmarket pour <strong style={{ color: '#111827' }}>{event}</strong>.
        </p>

        {/* Récap */}
        <div style={{ background: 'white', borderRadius: 20, padding: '20px 24px', boxShadow: '0 2px 20px rgba(0,0,0,0.06)', marginBottom: 20, textAlign: 'left' }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>Récapitulatif</p>
          {[
            ['Stand', nom],
            ['Marché', event],
            ['Position', '⭐ À ne pas manquer'],
            ['Montant payé', '15,00 €'],
            ['Statut', '✅ Confirmé'],
          ].map(([label, value], i, arr) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, paddingBottom: i < arr.length - 1 ? 10 : 0, marginBottom: i < arr.length - 1 ? 10 : 0, borderBottom: i < arr.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
              <span style={{ color: '#9CA3AF' }}>{label}</span>
              <span style={{ fontWeight: 600, color: '#111827' }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Info email */}
        <div style={{ background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 14, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          <p style={{ fontSize: 12, color: '#4338CA' }}>Un email de confirmation avec votre facture a été envoyé.</p>
        </div>

        {/* Partage */}
        <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 14, padding: '14px 16px', marginBottom: 24 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#065F46', marginBottom: 4 }}>📣 Dites-le à vos clients !</p>
          <p style={{ fontSize: 12, color: '#10B981', marginBottom: 12 }}>Partagez que vous êtes la vedette de ce marché</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <a href={`https://wa.me/?text=${encodeURIComponent(`Je suis à ne pas manquer au ${event} ! Venez me retrouver ⭐`)}`}
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
          <a href="/dashboard" style={{ flex: 1, background: '#F3F4F6', color: '#374151', textDecoration: 'none', borderRadius: 14, padding: '14px', fontSize: 14, fontWeight: 600, textAlign: 'center', display: 'block' }}>
            Mon dashboard
          </a>
        </div>
      </motion.div>
    </div>
  )
}

export default function DashboardBoostSuccessPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#F9F8F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 28, height: 28, border: '3px solid #E5E7EB', borderTopColor: '#10B981', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    }>
      <BoostExposantSuccessContent />
    </Suspense>
  )
}
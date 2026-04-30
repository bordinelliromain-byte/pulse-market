'use client'

import { Suspense, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle, FileText } from 'lucide-react'
import { openFacturePDF } from '@/lib/generateFacture'

function ExpressSuccessContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''
  const nom = searchParams.get('nom') || ''
  const eventTitle = searchParams.get('event') || ''
  const montant = parseFloat(searchParams.get('montant') || '0')

  useEffect(() => {
    // Envoyer email de confirmation au forain
    if (email && nom) {
      fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'paiement_confirme',
          to: email,
          data: {
            exposantNom: nom,
            eventTitle,
            eventDate: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
            eventLocation: '',
            redevanceAOT: montant,
            fraisPlateforme: 0,
          }
        })
      }).catch(err => console.error('Email error:', err))
    }
  }, [])

  const handleFacture = () => {
    openFacturePDF({
      candidatureId: `EXPRESS-${Date.now()}`,
      exposantNom: nom,
      exposantEmail: email,
      eventTitle,
      eventDate: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
      eventLocation: '',
      redevanceAOT: montant,
      fraisPlateforme: 0,
    })
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ background: '#1E293B', border: '2px solid #22C55E', borderRadius: 20, padding: '48px 36px', maxWidth: 420, width: '100%', textAlign: 'center' }}>
        <div style={{ width: 72, height: 72, background: 'rgba(34,197,94,0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: '2px solid rgba(34,197,94,0.3)' }}>
          <CheckCircle size={36} style={{ color: '#22C55E' }} />
        </div>
        <p style={{ fontSize: 22, fontWeight: 800, color: 'white', marginBottom: 6 }}>Paiement confirmé ! 🎉</p>
        <p style={{ fontSize: 14, color: '#64748B', marginBottom: 24, lineHeight: 1.6 }}>
          Votre place pour <strong style={{ color: 'white' }}>{eventTitle}</strong> est confirmée.<br />
          Une confirmation a été envoyée à <strong style={{ color: '#4F46E5' }}>{email}</strong>
        </p>

        <div style={{ background: '#0F172A', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '16px', marginBottom: 24, textAlign: 'left' }}>
          {[
            { label: 'Forain', value: nom },
            { label: 'Événement', value: eventTitle },
            { label: 'Montant payé', value: `${montant} €` },
            { label: 'Date', value: new Date().toLocaleDateString('fr-FR') },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, paddingBottom: i < 3 ? 10 : 0, marginBottom: i < 3 ? 10 : 0, borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
              <span style={{ color: '#475569' }}>{item.label}</span>
              <span style={{ color: 'white', fontWeight: 600 }}>{item.value}</span>
            </div>
          ))}
        </div>

        <button onClick={handleFacture}
          style={{ width: '100%', background: '#4F46E5', color: 'white', border: 'none', borderRadius: 12, padding: '14px', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <FileText size={16} /> Télécharger ma facture
        </button>
      </div>
    </div>
  )
}

export default function ExpressSuccess() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 28, height: 28, border: '2px solid #4F46E5', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    }>
      <ExpressSuccessContent />
    </Suspense>
  )
}
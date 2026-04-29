'use client'

import { useEffect, useRef, useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Download, Copy, CheckCircle, ArrowLeft,
  MapPin, Calendar, Share2
} from 'lucide-react'

function PartageContent() {
  const searchParams = useSearchParams()
  const eventName = searchParams.get('eventName') || 'Événement'
  const eventDate = searchParams.get('eventDate') || ''
  const eventLocation = searchParams.get('eventLocation') || ''
  const eventImage = searchParams.get('eventImage') || ''

  const [profile, setProfile] = useState<any>(null)
  const [exposantData, setExposantData] = useState<any>(null)
  const [copied, setCopied] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()

  const legende = `🎪 Je serai présent(e) au ${eventName} !\n📅 ${eventDate}\n📍 ${eventLocation}\n\nVenez me rendre visite et découvrir mes produits !\n\n#PlaceMarket #Marché #${eventLocation?.split(',')[0]?.trim() || 'PACA'} #Artisan #Local`

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(profileData)
      const { data: expData } = await supabase.from('exposant_data').select('*').eq('user_id', user.id).single()
      setExposantData(expData)
    }
    getData()
  }, [])

  const handleCopy = () => {
    navigator.clipboard.writeText(legende)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = async () => {
    if (!cardRef.current) return
    setDownloading(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: null,
        useCORS: true,
      })
      const link = document.createElement('a')
      link.download = `placemarket-${eventName.replace(/\s+/g, '-').toLowerCase()}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (err) {
      console.error(err)
    }
    setDownloading(false)
  }

  const gradients = [
    'linear-gradient(135deg, #4F46E5, #7C3AED)',
    'linear-gradient(135deg, #0EA5E9, #4F46E5)',
    'linear-gradient(135deg, #16A34A, #0EA5E9)',
    'linear-gradient(135deg, #EA580C, #DC2626)',
  ]
  const gradient = gradients[eventName.length % gradients.length]

  return (
    <div style={{ minHeight: '100vh', background: '#EEF2F7', fontFamily: "'Inter', system-ui, sans-serif", padding: '32px 24px' }}>

      {/* Header */}
      <div style={{ maxWidth: 600, margin: '0 auto 24px' }}>
        <button onClick={() => router.push('/dashboard')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', fontSize: 13, marginBottom: 16 }}>
          <ArrowLeft size={14} /> Retour au dashboard
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div style={{ width: 32, height: 32, background: '#4F46E5', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Share2 size={16} style={{ color: 'white' }} />
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', letterSpacing: '-0.02em' }}>
            Partagez votre participation !
          </h1>
        </div>
        <p style={{ fontSize: 13, color: '#64748B', marginLeft: 42 }}>
          Votre candidature a été validée 🎉 Téléchargez le visuel et partagez-le sur vos réseaux.
        </p>
      </div>

      <div style={{ maxWidth: 600, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* CARTE PARTAGEABLE */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div
            ref={cardRef}
            style={{
              borderRadius: 16,
              overflow: 'hidden',
              position: 'relative',
              aspectRatio: '1 / 1',
              background: gradient,
              boxShadow: '0 8px 40px rgba(0,0,0,0.15)',
            }}
          >
            {/* Image de fond si disponible */}
            {eventImage && (
              <img src={eventImage} alt={eventName}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.3 }} />
            )}

            {/* Overlay gradient */}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.6) 100%)' }} />

            {/* Contenu */}
            <div style={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 32 }}>

              {/* Top — Logo PlaceMarket */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', borderRadius: 10, padding: '6px 12px' }}>
                  <div style={{ width: 20, height: 20, background: 'white', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 9, fontWeight: 800, color: '#4F46E5' }}>PM</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'white' }}>PlaceMarket</span>
                </div>
                <div style={{ background: '#16A34A', borderRadius: 100, padding: '4px 12px', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <CheckCircle size={11} style={{ color: 'white' }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'white' }}>Validé</span>
                </div>
              </div>

              {/* Middle — Nom du stand */}
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 8, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Je serai présent(e) au
                </p>
                <h2 style={{ fontSize: 28, fontWeight: 800, color: 'white', lineHeight: 1.2, letterSpacing: '-0.02em', marginBottom: 16, textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
                  {eventName}
                </h2>
                {exposantData?.business_name && (
                  <div style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', borderRadius: 10, padding: '8px 20px', display: 'inline-block' }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>{exposantData.business_name}</p>
                  </div>
                )}
              </div>

              {/* Bottom — Infos */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {eventDate && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 28, height: 28, background: 'rgba(255,255,255,0.15)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Calendar size={13} style={{ color: 'white' }} />
                    </div>
                    <span style={{ fontSize: 13, color: 'white', fontWeight: 500 }}>{eventDate}</span>
                  </div>
                )}
                {eventLocation && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 28, height: 28, background: 'rgba(255,255,255,0.15)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <MapPin size={13} style={{ color: 'white' }} />
                    </div>
                    <span style={{ fontSize: 13, color: 'white', fontWeight: 500 }}>{eventLocation}</span>
                  </div>
                )}
                <div style={{ marginTop: 4, display: 'flex', gap: 6 }}>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.1)', padding: '3px 8px', borderRadius: 100 }}>#PlaceMarket</span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.1)', padding: '3px 8px', borderRadius: 100 }}>#Marché</span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.1)', padding: '3px 8px', borderRadius: 100 }}>#Local</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* BOUTONS DE TÉLÉCHARGEMENT */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
          <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: '20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Télécharger & Partager</p>

            <button onClick={handleDownload} disabled={downloading}
              style={{ width: '100%', background: '#4F46E5', color: 'white', border: 'none', borderRadius: 10, padding: '13px 0', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Download size={16} />
              {downloading ? 'Génération en cours...' : 'Télécharger le visuel'}
            </button>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <a
                href={`https://www.instagram.com/`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'linear-gradient(135deg, #E1306C, #833AB4)', color: 'white', border: 'none', borderRadius: 10, padding: '11px 0', fontSize: 13, fontWeight: 600, cursor: 'pointer', textDecoration: 'none' }}>
                <span style={{ fontSize: 15 }}>📸</span>
              </a>
              <a
                href={`https://www.tiktok.com/`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#0F172A', color: 'white', border: 'none', borderRadius: 10, padding: '11px 0', fontSize: 13, fontWeight: 600, cursor: 'pointer', textDecoration: 'none' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="white">
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.79 1.53V6.78a4.85 4.85 0 01-1.02-.09z"/>
                </svg>
                TikTok
              </a>
            </div>
          </div>
        </motion.div>

        {/* LÉGENDE */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
          <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Légende prête à copier</p>
              <button onClick={handleCopy}
                style={{ display: 'flex', alignItems: 'center', gap: 5, background: copied ? '#F0FDF4' : '#F8FAFC', border: `1px solid ${copied ? '#BBF7D0' : '#E2E8F0'}`, borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 500, color: copied ? '#16A34A' : '#64748B', transition: 'all 0.2s' }}>
                {copied ? <CheckCircle size={12} /> : <Copy size={12} />}
                {copied ? 'Copié !' : 'Copier'}
              </button>
            </div>
            <div style={{ background: '#F8FAFC', border: '1px solid #F1F5F9', borderRadius: 8, padding: '12px 14px' }}>
              <pre style={{ fontSize: 13, color: '#475569', lineHeight: 1.7, margin: 0, fontFamily: 'inherit', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {legende}
              </pre>
            </div>
          </div>
        </motion.div>

        {/* TIPS */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }}>
          <div style={{ background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 12, padding: '16px 20px' }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#4338CA', marginBottom: 8 }}>💡 Conseils pour maximiser votre visibilité</p>
            <ul style={{ fontSize: 12, color: '#4F46E5', lineHeight: 1.8, margin: 0, paddingLeft: 16 }}>
              <li>Postez le visuel en Story ET en publication</li>
              <li>Ajoutez la localisation de l'événement sur Instagram</li>
              <li>Invitez vos abonnés à partager pour toucher plus de monde</li>
              <li>Postez 2-3 jours avant le marché pour créer l'anticipation</li>
            </ul>
          </div>
        </motion.div>

      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default function PartagePage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#EEF2F7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 28, height: 28, border: '2px solid #4F46E5', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    }>
      <PartageContent />
    </Suspense>
  )
}
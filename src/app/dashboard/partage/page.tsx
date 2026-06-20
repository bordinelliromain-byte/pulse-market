'use client'

import { useEffect, useRef, useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import Sidebar from '@/components/Sidebar'
import {
  Download, Copy, CheckCircle, ArrowLeft,
  MapPin, Calendar, Share2, Sparkles,
  MessageCircle, Send, Lightbulb, Square,
  RectangleVertical, ExternalLink
} from 'lucide-react'

const BRAND = '#4F46E5'

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])
  return isMobile
}

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
  const [format, setFormat] = useState<'square' | 'story'>('square')
  const cardRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()
  const isMobile = useIsMobile()

  const legende = `Je serai présent(e) au ${eventName} !\n\nDate : ${eventDate}\nLieu : ${eventLocation}\n\nVenez me rendre visite et découvrir mes produits !\n\n#PulseMarket #Marché #${eventLocation?.split(',')[0]?.trim().replace(/\s+/g, '') || 'PACA'} #Artisan #Local #FaitMaison`

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
      link.download = `PulseMarket-${eventName.replace(/\s+/g, '-').toLowerCase()}-${format}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (err) {
      console.error(err)
    }
    setDownloading(false)
  }

  // ✅ Web Share API (mobile natif)
  const handleNativeShare = async () => {
    if (!cardRef.current) return
    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(cardRef.current, { scale: 2, backgroundColor: null, useCORS: true })
      canvas.toBlob(async (blob) => {
        if (!blob) return
        const file = new File([blob], `pulsemarket-${eventName}.png`, { type: 'image/png' })
        if (navigator.share && navigator.canShare?.({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: `Je serai au ${eventName} !`,
            text: legende,
          })
        } else {
          // Fallback download
          handleDownload()
        }
      })
    } catch (err) {
      console.error(err)
    }
  }

  const gradients = [
    'linear-gradient(135deg, #4F46E5, #7C3AED)',
    'linear-gradient(135deg, #0EA5E9, #4F46E5)',
    'linear-gradient(135deg, #16A34A, #0EA5E9)',
    'linear-gradient(135deg, #EA580C, #DC2626)',
    'linear-gradient(135deg, #7C3AED, #EC4899)',
  ]
  const gradient = gradients[eventName.length % gradients.length]

  // ✅ Dimensions selon format
  const cardStyle = format === 'square'
    ? { aspectRatio: '1 / 1' as any }
    : { aspectRatio: '9 / 16' as any, maxWidth: 360, margin: '0 auto' }

  const whatsappLink = `https://wa.me/?text=${encodeURIComponent(legende)}`

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#EEF2F7', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <Sidebar profile={profile} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ marginLeft: isMobile ? 0 : 220, flex: 1, minWidth: 0 }}>

        <header style={{ background: 'white', borderBottom: '1px solid #E2E8F0', padding: isMobile ? '0 14px 0 60px' : '0 28px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <button onClick={() => router.push('/dashboard')}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', fontSize: 13, flexShrink: 0 }}>
              <ArrowLeft size={14} /> {!isMobile && 'Retour'}
            </button>
            <div style={{ width: 1, height: 16, background: '#E2E8F0', flexShrink: 0 }} />
            <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Share2 size={13} style={{ color: BRAND }} /> Partager
            </p>
          </div>
        </header>

        <main style={{ maxWidth: 600, margin: '0 auto', padding: isMobile ? '20px 14px' : '28px 24px' }}>

          {/* Intro */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{ width: 36, height: 36, background: BRAND, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={17} style={{ color: 'white' }} />
              </div>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', letterSpacing: '-0.02em' }}>
                Partagez votre participation
              </h1>
            </div>
            <p style={{ fontSize: 13, color: '#64748B', marginLeft: 46, lineHeight: 1.5 }}>
              Votre candidature est validée. Téléchargez le visuel et partagez-le sur vos réseaux.
            </p>
          </motion.div>

          {/* ✅ Switch format Post / Story */}
          <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 10, padding: 4, display: 'flex', marginBottom: 16 }}>
            <button onClick={() => setFormat('square')}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 0', background: format === 'square' ? BRAND : 'transparent', color: format === 'square' ? 'white' : '#64748B', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
              <Square size={12} /> Post carré
            </button>
            <button onClick={() => setFormat('story')}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 0', background: format === 'story' ? BRAND : 'transparent', color: format === 'story' ? 'white' : '#64748B', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
              <RectangleVertical size={12} /> Story 9:16
            </button>
          </div>

          {/* ✅ CARTE PARTAGEABLE */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} key={format}>
            <div ref={cardRef}
              style={{
                borderRadius: 16,
                overflow: 'hidden',
                position: 'relative',
                background: gradient,
                boxShadow: '0 8px 40px rgba(0,0,0,0.15)',
                ...cardStyle,
              }}>
              {eventImage && (
                <img src={eventImage} alt={eventName}
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.3 }} />
              )}

              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.65) 100%)' }} />

              <div style={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: format === 'square' ? 32 : 36 }}>

                {/* Top */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', borderRadius: 10, padding: '6px 12px' }}>
                    <img src="/logo-pulsemarket.svg" alt="PulseMarket" style={{ width: 18, height: 18 }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'white' }}>PulseMarket</span>
                  </div>
                  <div style={{ background: '#16A34A', borderRadius: 100, padding: '4px 12px', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <CheckCircle size={11} style={{ color: 'white' }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'white' }}>Validé</span>
                  </div>
                </div>

                {/* Middle */}
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 8, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    Je serai présent(e) au
                  </p>
                  <h2 style={{ fontSize: format === 'story' ? 32 : 28, fontWeight: 800, color: 'white', lineHeight: 1.2, letterSpacing: '-0.02em', marginBottom: 16, textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
                    {eventName}
                  </h2>
                  {exposantData?.business_name && (
                    <div style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', borderRadius: 10, padding: '8px 20px', display: 'inline-block' }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>{exposantData.business_name}</p>
                    </div>
                  )}
                </div>

                {/* Bottom */}
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
                  <div style={{ marginTop: 4, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.1)', padding: '3px 8px', borderRadius: 100 }}>#PulseMarket</span>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.1)', padding: '3px 8px', borderRadius: 100 }}>#Marché</span>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.1)', padding: '3px 8px', borderRadius: 100 }}>#Local</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ✅ BOUTONS DE PARTAGE */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} style={{ marginTop: 16 }}>
            <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: '20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Partager</p>

              {/* Web Share API (mobile) */}
              {isMobile && (
                <button onClick={handleNativeShare}
                  style={{ width: '100%', background: BRAND, color: 'white', border: 'none', borderRadius: 10, padding: '13px 0', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <Share2 size={16} />
                  Partager (Instagram, WhatsApp, ...)
                </button>
              )}

              {/* Download */}
              <button onClick={handleDownload} disabled={downloading}
                style={{ width: '100%', background: isMobile ? 'white' : BRAND, color: isMobile ? '#0F172A' : 'white', border: isMobile ? '1px solid #E2E8F0' : 'none', borderRadius: 10, padding: '13px 0', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Download size={16} />
                {downloading ? 'Génération...' : 'Télécharger le visuel'}
              </button>

              {/* WhatsApp + Instagram */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#25D366', color: 'white', border: 'none', borderRadius: 10, padding: '11px 0', fontSize: 13, fontWeight: 600, cursor: 'pointer', textDecoration: 'none' }}>
                  <MessageCircle size={14} /> WhatsApp
                </a>
                <a href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'linear-gradient(135deg, #E1306C, #833AB4)', color: 'white', border: 'none', borderRadius: 10, padding: '11px 0', fontSize: 13, fontWeight: 600, cursor: 'pointer', textDecoration: 'none' }}>
                  <ExternalLink size={13} /> Instagram
                </a>
              </div>
              <p style={{ fontSize: 10, color: '#94A3B8', textAlign: 'center', marginTop: 2 }}>
                Téléchargez le visuel puis collez-le dans votre application
              </p>
            </div>
          </motion.div>

          {/* LÉGENDE */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }} style={{ marginTop: 16 }}>
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
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }} style={{ marginTop: 16 }}>
            <div style={{ background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 12, padding: '16px 20px' }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#4338CA', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Lightbulb size={13} /> Conseils pour maximiser votre visibilité
              </p>
              <ul style={{ fontSize: 12, color: BRAND, lineHeight: 1.8, margin: 0, paddingLeft: 16 }}>
                <li>Postez le visuel en Story <strong>ET</strong> en publication</li>
                <li>Ajoutez la localisation de l'événement sur Instagram</li>
                <li>Invitez vos abonnés à partager pour toucher plus de monde</li>
                <li>Postez <strong>2-3 jours avant</strong> le marché pour créer l'anticipation</li>
                <li>WhatsApp à vos clients fidèles = trafic garanti</li>
              </ul>
            </div>
          </motion.div>

        </main>
      </div>
    </div>
  )
}

export default function PartagePage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#EEF2F7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 28, height: 28, border: `2px solid ${BRAND}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    }>
      <PartageContent />
    </Suspense>
  )
}
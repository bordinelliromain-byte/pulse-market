'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion'

type Market = {
  id: string; title: string; description: string | null; location_name: string
  start_date: string; cover_image: string | null; latitude: number | null; longitude: number | null
  total_spots: number; available_spots: number; exposants_count?: number; distance?: number; sponsored?: boolean
}
type GeoStatus = 'idle' | 'requesting' | 'ok' | 'denied'
type VedetteData = { nom: string; offre: string; stand: string } | null
type BonPlan = { nom: string; offre: string; detail: string; adresse: string; photo_url: string; emoji: string; couleur: string; textColor: string }

const MOCK_SPONSORED_MARKET: Market = {
  id: 'sponsored-1', title: "Marché Provençal d'Aubagne",
  description: "Le plus beau marché de la région — saveurs authentiques et producteurs locaux.",
  location_name: "Place de l'Hôtel de Ville, Aubagne",
  start_date: new Date(Date.now() + 86400000).toISOString(),
  cover_image: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=800&q=80',
  latitude: 43.2965, longitude: 5.5756, total_spots: 48, available_spots: 6,
  exposants_count: 42, distance: 0.8, sponsored: true,
}

const EMOJIS = ['☕', '🍽️', '🍷', '🥖', '🧀', '🌸', '🎨', '🍦']
const COLORS = [
  { couleur: '#FEF3C7', textColor: '#92400E' },
  { couleur: '#EFF6FF', textColor: '#1E40AF' },
  { couleur: '#FDF2F8', textColor: '#831843' },
  { couleur: '#F0FDF4', textColor: '#065F46' },
]

function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371, dLat = (lat2-lat1)*Math.PI/180, dLon = (lon2-lon1)*Math.PI/180
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2
  return R*2*Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}
function fmt_dist(km: number) { return km < 1 ? `${Math.round(km*1000)} m` : `${km.toFixed(1)} km` }
function fmt_countdown(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now()
  if (diff < 0) return { text: 'Terminé', color: '#9CA3AF', dot: false }
  const h = Math.floor(diff/3600000), d = Math.floor(h/24)
  if (d > 1) return { text: `Dans ${d} jours`, color: '#6B7280', dot: false }
  if (d === 1) return { text: 'Demain', color: '#D97706', dot: true }
  if (h > 0) return { text: `Ferme dans ${h}h`, color: '#EF4444', dot: true }
  return { text: 'En cours', color: '#10B981', dot: true }
}
const COVERS = [
  'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=800&q=80',
  'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80',
  'https://images.unsplash.com/photo-1556742044-3c52d6e88c62?w=800&q=80',
]
const NAV = [
  { label: 'Accueil', href: '/whatmarket', path: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10' },
  { label: 'Carte', href: '/whatmarket/carte', path: 'M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4zM8 2v16M16 6v16' },
  { label: 'Pro', href: '/pro/ads/new', path: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z' },
]

function VedetteSlot({ marketId }: { marketId: string }) {
  const [vedette, setVedette] = useState<VedetteData>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const load = async () => {
      try {
        const { createClient } = await import('@/lib/supabase')
        const supabase = createClient()
        const { data } = await supabase.from('exposant_boosts').select('nom, offre, stand')
          .eq('event_id', marketId).eq('status', 'active').order('created_at', { ascending: false }).limit(1).single()
        if (data) setVedette(data)
      } catch (err) {}
      setLoading(false)
    }
    load()
  }, [marketId])

  if (loading || !vedette) return null
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }} style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <p style={{ fontFamily: '"Playfair Display",Georgia,serif', fontSize: 16, fontWeight: 700, color: '#111827' }}>À ne pas manquer</p>
        <span style={{ fontSize: 9, color: '#9CA3AF', letterSpacing: '0.06em', fontWeight: 500 }}>PARTENAIRE</span>
      </div>
      <div style={{ borderRadius: 18, overflow: 'hidden', background: 'linear-gradient(135deg,#1A1A2E 0%,#16213E 100%)', display: 'flex', alignItems: 'stretch', minHeight: 72 }}>
        <div style={{ flex: 1, padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <span style={{ fontSize: 18 }}>⭐</span>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>{vedette.nom}</p>
          </div>
          <p style={{ fontSize: 11, color: '#C7C5C0', lineHeight: 1.5, marginBottom: vedette.stand ? 10 : 0 }}>{vedette.offre}</p>
          {vedette.stand && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.1)', borderRadius: 100, padding: '4px 10px' }}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>{vedette.stand}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

function DriveToStoreSlot({ marketId }: { marketId: string }) {
  const [bonsPlans, setBonsPlans] = useState<BonPlan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const { createClient } = await import('@/lib/supabase')
        const supabase = createClient()
        const { data } = await supabase.from('boost_ads')
          .select('nom, offre, detail, adresse, photo_url')
          .eq('event_id', marketId).eq('status', 'active')
          .order('created_at', { ascending: false }).limit(3)
        if (data && data.length > 0) {
          setBonsPlans(data.map((item: any, i: number) => ({
            nom: item.nom, offre: item.offre, detail: item.detail || '',
            adresse: item.adresse || '', photo_url: item.photo_url || '',
            emoji: EMOJIS[i % EMOJIS.length], ...COLORS[i % COLORS.length],
          })))
        }
      } catch (err) {}
      setLoading(false)
    }
    load()
  }, [marketId])

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: "Bons plans du marché — Whatmarket", text: "Découvrez les bons plans des commerçants locaux au marché aujourd'hui !", url: window.location.href })
    } else { navigator.clipboard?.writeText(window.location.href); alert('Lien copié !') }
  }

  if (loading || bonsPlans.length === 0) return null

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }} style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <p style={{ fontFamily: '"Playfair Display",Georgia,serif', fontSize: 16, fontWeight: 700, color: '#111827' }}>Expérience prolongée</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 9, color: '#9CA3AF', letterSpacing: '0.06em', fontWeight: 500 }}>SPONSORISÉ</span>
          <button onClick={handleShare} style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#F3F4F6', border: 'none', borderRadius: 100, padding: '4px 10px', cursor: 'pointer' }}
            onMouseEnter={e => (e.currentTarget.style.background='#E5E7EB')} onMouseLeave={e => (e.currentTarget.style.background='#F3F4F6')}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            <span style={{ fontSize: 10, fontWeight: 600, color: '#374151' }}>Partager</span>
          </button>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {bonsPlans.map((plan, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35, delay: 0.35+i*0.08 }}
            style={{ background: plan.couleur, borderRadius: 16, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
            {plan.photo_url
              ? <img src={plan.photo_url} alt={plan.nom} style={{ width: 52, height: 52, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }} />
              : <span style={{ fontSize: 26, flexShrink: 0, lineHeight: 1 }}>{plan.emoji}</span>
            }
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: plan.textColor }}>{plan.nom}</p>
              <p style={{ fontSize: 12, fontWeight: 600, color: plan.textColor, opacity: 0.9 }}>{plan.offre}</p>
              {plan.detail && <p style={{ fontSize: 11, color: plan.textColor, opacity: 0.65 }}>{plan.detail}</p>}
            </div>
            <a href={plan.adresse ? `https://www.google.com/maps/search/${encodeURIComponent(plan.adresse)}` : '#'}
              target="_blank" rel="noopener noreferrer"
              style={{ flexShrink: 0, background: 'rgba(0,0,0,0.08)', borderRadius: 10, padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: plan.textColor }}>Voir</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={plan.textColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </a>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

function SponsoredMarketCard({ market, onClick }: { market: Market; onClick: () => void }) {
  const cd = fmt_countdown(market.start_date)
  const occupied = market.total_spots - market.available_spots
  const pct = (occupied / market.total_spots) * 100
  return (
    <motion.article initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22,1,0.36,1] }} onClick={onClick} style={{ cursor: 'pointer', marginBottom: 14 }}>
      <div style={{ background: 'linear-gradient(135deg,#4F46E5 0%,#7C3AED 40%,#D97706 100%)', borderRadius: 26, padding: 1.5 }}>
        <div style={{ borderRadius: 24.5, overflow: 'hidden', background: 'white' }}>
          <div style={{ position: 'relative', height: 220 }}>
            <img src={market.cover_image || COVERS[0]} alt={market.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(0,0,0,0.65) 0%,transparent 55%)' }} />
            <div style={{ position: 'absolute', top: 14, left: 14, right: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'linear-gradient(135deg,#4F46E5,#D97706)', borderRadius: 100, padding: '5px 12px' }}>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="white"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                <span style={{ color: 'white', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em' }}>SÉLECTION</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'flex-end' }}>
                {market.distance !== undefined && (
                  <div style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)', borderRadius: 100, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
                    <span style={{ color: 'white', fontSize: 11, fontWeight: 600 }}>{fmt_dist(market.distance)}</span>
                  </div>
                )}
                <div style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)', borderRadius: 100, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 4 }}>
                  {cd.dot && <span style={{ width: 5, height: 5, borderRadius: '50%', background: cd.color, display: 'block' }} />}
                  <span style={{ color: cd.color, fontSize: 11, fontWeight: 600 }}>{cd.text}</span>
                </div>
              </div>
            </div>
            <div style={{ position: 'absolute', bottom: 14, left: 16 }}>
              <p style={{ fontFamily: '"Playfair Display",Georgia,serif', fontSize: 22, fontWeight: 700, color: 'white', lineHeight: 1.2, marginBottom: 4 }}>{market.title}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>{market.location_name}</span>
              </div>
            </div>
          </div>
          <div style={{ padding: '12px 16px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#F5F4F1', borderRadius: 8, padding: '5px 10px' }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                <span style={{ fontSize: 12, color: '#374151', fontWeight: 600 }}>{new Date(market.start_date).toLocaleDateString('fr-FR',{day:'numeric',month:'short'})}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#F5F4F1', borderRadius: 8, padding: '5px 10px' }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                <span style={{ fontSize: 12, color: '#374151', fontWeight: 600 }}>{occupied} stands</span>
              </div>
            </div>
            <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg,#4F46E5,#7C3AED)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          </div>
          <div style={{ padding: '0 16px 10px' }}><span style={{ fontSize: 9, color: '#9CA3AF', letterSpacing: '0.06em', fontWeight: 500 }}>SPONSORISÉ</span></div>
          <div style={{ height: 3, background: '#F0EDE8' }}>
            <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, delay: 0.4 }} style={{ height: '100%', background: 'linear-gradient(90deg,#4F46E5,#D97706)', borderRadius: '0 4px 4px 0' }} />
          </div>
        </div>
      </div>
    </motion.article>
  )
}

function MarketCard({ market, index, onClick }: { market: Market; index: number; onClick: () => void }) {
  const cd = fmt_countdown(market.start_date)
  const cover = market.cover_image || COVERS[index % COVERS.length]
  const occupied = market.total_spots - market.available_spots
  const pct = market.total_spots > 0 ? (occupied/market.total_spots)*100 : 0
  return (
    <motion.article initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: index*0.08, ease: [0.22,1,0.36,1] }} onClick={onClick} style={{ cursor: 'pointer', marginBottom: 14 }}>
      <div style={{ borderRadius: 24, overflow: 'hidden', background: 'white', boxShadow: '0 2px 20px rgba(0,0,0,0.05)', transition: 'transform 0.25s ease,box-shadow 0.25s ease' }}
        onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow='0 12px 40px rgba(0,0,0,0.10)' }}
        onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 2px 20px rgba(0,0,0,0.05)' }}>
        <div style={{ position: 'relative', height: 210, overflow: 'hidden' }}>
          <img src={cover} alt={market.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(0,0,0,0.62) 0%,rgba(0,0,0,0.08) 55%,transparent 100%)' }} />
          <div style={{ position: 'absolute', top: 14, left: 14, right: 14, display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(15,15,15,0.55)', backdropFilter: 'blur(12px)', borderRadius: 100, padding: '5px 11px', border: '0.5px solid rgba(255,255,255,0.12)' }}>
              {cd.dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: cd.color, display: 'block' }} />}
              <span style={{ color: cd.color, fontSize: 11, fontWeight: 600 }}>{cd.text}</span>
            </div>
            {market.distance !== undefined && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(15,15,15,0.55)', backdropFilter: 'blur(12px)', borderRadius: 100, padding: '5px 11px', border: '0.5px solid rgba(255,255,255,0.12)' }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
                <span style={{ color: 'white', fontSize: 11, fontWeight: 600 }}>{fmt_dist(market.distance)}</span>
              </div>
            )}
          </div>
          <div style={{ position: 'absolute', bottom: 14, left: 16, right: 16 }}>
            <p style={{ fontFamily: '"Playfair Display",Georgia,serif', fontSize: 21, fontWeight: 700, color: 'white', lineHeight: 1.2, marginBottom: 4 }}>{market.title}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>{market.location_name}</span>
            </div>
          </div>
        </div>
        <div style={{ padding: '13px 16px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#F5F4F1', borderRadius: 8, padding: '5px 10px' }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              <span style={{ fontSize: 12, color: '#374151', fontWeight: 600 }}>{new Date(market.start_date).toLocaleDateString('fr-FR',{day:'numeric',month:'short'})}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#F5F4F1', borderRadius: 8, padding: '5px 10px' }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
              <span style={{ fontSize: 12, color: '#374151', fontWeight: 600 }}>{market.total_spots - market.available_spots} stands</span>
            </div>
          </div>
          <div style={{ width: 32, height: 32, background: '#111827', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        </div>
        <div style={{ height: 3, background: '#F0EDE8' }}>
          <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.9, delay: 0.3+index*0.07 }}
            style={{ height: '100%', background: pct>80?'#EF4444':'#10B981', borderRadius: '0 4px 4px 0' }} />
        </div>
      </div>
    </motion.article>
  )
}

function MarketDrawer({ market, onClose }: { market: Market; onClose: () => void }) {
  const cd = fmt_countdown(market.start_date)
  const cover = market.cover_image || COVERS[0]
  const occupied = market.total_spots - market.available_spots
  const mapsUrl = market.latitude && market.longitude
    ? `https://www.google.com/maps/dir/?api=1&destination=${market.latitude},${market.longitude}`
    : `https://www.google.com/maps/search/${encodeURIComponent(market.location_name)}`
  const y = useMotionValue(0)
  const opacity = useTransform(y, [0, 200], [1, 0])
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
      onClick={onClose}>
      <motion.div drag="y" dragConstraints={{ top: 0, bottom: 400 }} dragElastic={{ top: 0, bottom: 0.3 }}
        onDragEnd={(_, info) => { if (info.offset.y > 120) onClose() }}
        style={{ y, opacity, position: 'absolute', bottom: 0, left: 0, right: 0, background: '#F9F8F6', borderRadius: '28px 28px 0 0', maxHeight: '93vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 32, stiffness: 320 }}
        onClick={e => e.stopPropagation()}>
        <div style={{ padding: '12px 0 8px', display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, borderRadius: 100, background: '#D1CFC9' }} />
        </div>
        <div style={{ overflowY: 'auto', flex: 1, padding: '8px 20px 52px' }}>
          <div style={{ height: 200, borderRadius: 20, overflow: 'hidden', marginBottom: 16, position: 'relative' }}>
            <img src={cover} alt={market.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(0,0,0,0.55) 0%,transparent 60%)' }} />
            <div style={{ position: 'absolute', top: 14, left: 14, display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)', borderRadius: 100, padding: '5px 12px' }}>
              {cd.dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: cd.color, display: 'block' }} />}
              <span style={{ color: cd.color, fontSize: 11, fontWeight: 600 }}>{cd.text}</span>
            </div>
            {market.sponsored && (
              <div style={{ position: 'absolute', top: 14, right: 14, display: 'flex', alignItems: 'center', gap: 4, background: 'linear-gradient(135deg,#4F46E5,#D97706)', borderRadius: 100, padding: '4px 10px' }}>
                <svg width="8" height="8" viewBox="0 0 24 24" fill="white"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                <span style={{ color: 'white', fontSize: 9, fontWeight: 700, letterSpacing: '0.06em' }}>SÉLECTION</span>
              </div>
            )}
            <div style={{ position: 'absolute', bottom: 14, left: 16 }}>
              <p style={{ fontFamily: '"Playfair Display",Georgia,serif', fontSize: 22, fontWeight: 700, color: 'white', lineHeight: 1.2 }}>{market.title}</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            <span style={{ fontSize: 13, color: '#6B7280' }}>{market.location_name}</span>
            {market.distance !== undefined && (
              <span style={{ fontSize: 12, color: '#10B981', fontWeight: 600, background: '#ECFDF5', padding: '2px 8px', borderRadius: 100 }}>{fmt_dist(market.distance)}</span>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 20 }}>
            {[
              { emoji: '📅', label: 'Date', value: new Date(market.start_date).toLocaleDateString('fr-FR',{day:'numeric',month:'long'}) },
              { emoji: '⏰', label: 'Heure', value: new Date(market.start_date).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}) },
              { emoji: '🏪', label: 'Stands', value: `${occupied}/${market.total_spots}` },
            ].map((s,i) => (
              <div key={i} style={{ background: 'white', borderRadius: 16, padding: '12px 10px', textAlign: 'center', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
                <span style={{ fontSize: 20, display: 'block', marginBottom: 4 }}>{s.emoji}</span>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#111827', marginBottom: 2 }}>{s.value}</p>
                <p style={{ fontSize: 10, color: '#9CA3AF' }}>{s.label}</p>
              </div>
            ))}
          </div>
          <VedetteSlot marketId={market.id} />
          {market.description && <p style={{ fontSize: 14, color: '#4B5563', lineHeight: 1.75, marginBottom: 20 }}>{market.description}</p>}
          <DriveToStoreSlot marketId={market.id} />
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, background: '#111827', color: 'white', borderRadius: 18, padding: '19px', fontSize: 16, fontWeight: 700, textDecoration: 'none', letterSpacing: '-0.01em', fontFamily: '"DM Sans",sans-serif' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
            Y ALLER
          </a>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function WhatmarketHome() {
  const [markets, setMarkets] = useState<Market[]>([])
  const [loading, setLoading] = useState(true)
  const [geoStatus, setGeoStatus] = useState<GeoStatus>('idle')
  const [selected, setSelected] = useState<Market | null>(null)
  const [filter, setFilter] = useState<'bientot'|'proche'|'tous'>('bientot')
  const [sponsoredMarket, setSponsoredMarket] = useState<Market | null>(null)

  const loadMarkets = useCallback(async (lat?: number, lng?: number) => {
    setLoading(true)
    try {
      const { createClient } = await import('@/lib/supabase')
      const supabase = createClient()
      const today = new Date().toISOString().split('T')[0]
      const { data: events } = await supabase.from('events').select('*').eq('status','published')
        .gte('start_date',today).order('start_date',{ascending:true}).limit(20)
      if (!events) { setLoading(false); return }
      const enriched = await Promise.all(events.map(async (ev: any) => {
        const { count } = await supabase.from('applications').select('*',{count:'exact',head:true}).eq('event_id',ev.id).in('status',['paid','present'])
        return { ...ev, exposants_count: count||0, distance: lat&&lng&&ev.latitude&&ev.longitude?haversine(lat,lng,ev.latitude,ev.longitude):undefined }
      }))
      setMarkets(enriched)
      try {
        const now = new Date().toISOString()
        const { data: boostData } = await supabase
          .from('mairie_boosts').select('event_id').eq('status', 'active').gt('expires_at', now)
          .order('created_at', { ascending: false }).limit(1).single()
        if (boostData?.event_id) {
          const boosted = enriched.find((m: any) => m.id === boostData.event_id)
          if (boosted) setSponsoredMarket({ ...boosted, sponsored: true })
        }
      } catch (err) {}
    } catch(err) { console.error(err) }
    setLoading(false)
  }, [])

  useEffect(() => { loadMarkets() }, [loadMarkets])

  const requestGeo = () => {
    if (!navigator.geolocation) { setGeoStatus('denied'); return }
    setGeoStatus('requesting')
    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude: lat, longitude: lng } }) => { setGeoStatus('ok'); loadMarkets(lat,lng) },
      () => { setGeoStatus('denied') }, { timeout: 8000 }
    )
  }

  const sorted = [...markets].sort((a,b) => {
    if (filter==='proche'&&a.distance!==undefined&&b.distance!==undefined) return a.distance-b.distance
    if (filter==='bientot') return new Date(a.start_date).getTime()-new Date(b.start_date).getTime()
    return 0
  })

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;}
        html,body{font-family:'DM Sans',system-ui,sans-serif;background:#F9F8F6;}
        ::-webkit-scrollbar{display:none;}*{scrollbar-width:none;}
        @keyframes shimmer{0%{background-position:-300px 0}100%{background-position:300px 0}}
        @keyframes pulse-ring{0%,100%{box-shadow:0 0 0 0 rgba(14,165,233,0.35)}50%{box-shadow:0 0 0 10px rgba(14,165,233,0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .pulse-ring{animation:pulse-ring 1.8s ease infinite}
      `}</style>
      <div style={{ maxWidth: 430, margin: '0 auto', minHeight: '100vh', background: '#F9F8F6', position: 'relative', fontFamily: '"DM Sans",system-ui,sans-serif' }}>

        {/* ✅ HEADER AVEC LOGO WHATMARKET */}
        <div style={{ position: 'sticky', top: 0, zIndex: 20, background: 'rgba(249,248,246,0.94)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', padding: '52px 20px 14px', borderBottom: '0.5px solid rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>

            {/* ✅ Logo Whatmarket SVG */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 3 }}>
                <svg width="30" height="30" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="20" cy="20" r="20" fill="#0EA5E9"/>
                  <path d="M8 13L13 27L20 17L27 27L32 13" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 0 }}>
                  <span style={{ fontFamily: '"DM Sans",system-ui,sans-serif', fontSize: 22, fontWeight: 700, color: '#111827', letterSpacing: '-0.03em' }}>What</span>
                  <span style={{ fontFamily: '"DM Sans",system-ui,sans-serif', fontSize: 22, fontWeight: 400, color: '#0EA5E9', letterSpacing: '-0.03em' }}>market</span>
                </div>
              </div>
              <p style={{ fontSize: 12, color: '#9CA3AF', marginLeft: 40 }}>
                {geoStatus==='ok' ? 'Marchés près de vous' : 'Découvrez les marchés locaux'}
              </p>
            </div>

            <button onClick={geoStatus==='idle'||geoStatus==='denied'?requestGeo:undefined}
              className={geoStatus==='requesting'?'pulse-ring':''}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: geoStatus==='ok'?'#ECFDF5':'#0EA5E9', border: 'none', borderRadius: 100, padding: '9px 14px', cursor: geoStatus==='requesting'?'default':'pointer', transition: 'all 0.3s' }}>
              {geoStatus==='requesting'
                ? <div style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={geoStatus==='ok'?'#10B981':'white'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
              }
              <span style={{ fontSize: 12, fontWeight: 600, color: geoStatus==='ok'?'#10B981':'white' }}>
                {geoStatus==='ok'?'Localisé':geoStatus==='requesting'?'Recherche...':'Autour de moi'}
              </span>
            </button>
          </div>

          <div style={{ display: 'flex', gap: 7 }}>
            {(['bientot','proche','tous'] as const).map((f,i) => (
              <button key={f} onClick={() => setFilter(f)}
                style={{ padding: '7px 14px', borderRadius: 100, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: filter===f?'#111827':'white', color: filter===f?'white':'#6B7280', boxShadow: filter===f?'0 3px 12px rgba(0,0,0,0.18)':'0 1px 4px rgba(0,0,0,0.06)', transition: 'all 0.22s', fontFamily: '"DM Sans",sans-serif' }}>
                {['Bientôt','Le plus proche','Tous'][i]}
              </button>
            ))}
          </div>
        </div>

          <div style={{ padding: '16px 16px 100px', overflowY: 'auto' }}>
          <AnimatePresence>
            {geoStatus==='idle' && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}
                style={{ background: '#111827', borderRadius: 20, padding: '14px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.08)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'white', marginBottom: 1 }}>Marchés près de chez vous</p>
                  <p style={{ fontSize: 11, color: '#6B7280' }}>Activez la géolocalisation pour les distances</p>
                </div>
                <button onClick={requestGeo} style={{ background: 'white', color: '#111827', border: 'none', borderRadius: 10, padding: '8px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0, fontFamily: '"DM Sans",sans-serif' }}>Activer</button>
              </motion.div>
            )}
          </AnimatePresence>

          {loading && [1,2,3].map(i => (
            <div key={i} style={{ height: 252, borderRadius: 24, marginBottom: 14, background: 'linear-gradient(90deg,#EFEDE8 0%,#E5E3DE 40%,#EFEDE8 100%)', backgroundSize: '300% 100%', animation: 'shimmer 1.5s ease infinite' }} />
          ))}

          <AnimatePresence>
            {!loading && sponsoredMarket && <SponsoredMarketCard market={sponsoredMarket} onClick={() => setSelected(sponsoredMarket)} />}
          </AnimatePresence>

          {!loading && sorted.map((m,i) => <MarketCard key={m.id} market={m} index={i} onClick={() => setSelected(m)} />)}
        </div>

        <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 430, zIndex: 30, background: 'rgba(249,248,246,0.94)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderTop: '0.5px solid rgba(0,0,0,0.07)', padding: '10px 32px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-around' }}>
            {NAV.map((item, i) => {
              const isActive = i === 0
              return (
                <a key={i} href={item.href}
                  style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, color: isActive ? '#111827' : '#C4C2BC', transition: 'color 0.2s', padding: '2px 16px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={item.path} /></svg>
                  <span style={{ fontSize: 10, fontWeight: isActive ? 600 : 400, fontFamily: '"DM Sans",sans-serif' }}>{item.label}</span>
                  {isActive && <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#111827' }} />}
                </a>
              )
            })}
          </div>
        </div>

        <AnimatePresence>
          {selected && <MarketDrawer market={selected} onClose={() => setSelected(null)} />}
        </AnimatePresence>
      </div>
    </>
  )
}
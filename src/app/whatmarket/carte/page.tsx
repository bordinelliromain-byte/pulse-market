'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion'

type Market = {
  id: string
  title: string
  description: string | null
  location_name: string
  start_date: string
  cover_image: string | null
  latitude: number | null
  longitude: number | null
  total_spots: number
  available_spots: number
  distance?: number
}

type GeoStatus = 'idle' | 'requesting' | 'ok' | 'denied'

const COVERS = [
  'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=800&q=80',
  'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80',
  'https://images.unsplash.com/photo-1556742044-3c52d6e88c62?w=800&q=80',
]

function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function fmt_dist(km: number) { return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km` }

function fmt_countdown(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now()
  if (diff < 0) return { text: 'Terminé', color: '#9CA3AF', dot: false, pin: '#9CA3AF' }
  const h = Math.floor(diff / 3600000), d = Math.floor(h / 24)
  if (d > 1) return { text: `Dans ${d} jours`, color: '#6B7280', dot: false, pin: '#6B7280' }
  if (d === 1) return { text: 'Demain', color: '#D97706', dot: true, pin: '#F59E0B' }
  if (h > 0) return { text: `Ferme dans ${h}h`, color: '#EF4444', dot: true, pin: '#EF4444' }
  return { text: 'En cours', color: '#10B981', dot: true, pin: '#10B981' }
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
      style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}>
      <motion.div drag="y" dragConstraints={{ top: 0, bottom: 400 }} dragElastic={{ top: 0, bottom: 0.3 }}
        onDragEnd={(_, info) => { if (info.offset.y > 120) onClose() }}
        style={{ y, opacity, position: 'absolute', bottom: 0, left: 0, right: 0, background: '#F9F8F6', borderRadius: '28px 28px 0 0', maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 32, stiffness: 320 }}
        onClick={e => e.stopPropagation()}>
        <div style={{ padding: '12px 0 8px', display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, borderRadius: 100, background: '#D1CFC9' }} />
        </div>
        <div style={{ overflowY: 'auto', flex: 1, padding: '8px 20px 40px' }}>
          <div style={{ height: 180, borderRadius: 20, overflow: 'hidden', marginBottom: 16, position: 'relative' }}>
            <img src={cover} alt={market.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 60%)' }} />
            <div style={{ position: 'absolute', top: 14, left: 14, display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)', borderRadius: 100, padding: '5px 12px' }}>
              {cd.dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: cd.color, display: 'block' }} />}
              <span style={{ color: cd.color, fontSize: 11, fontWeight: 600 }}>{cd.text}</span>
            </div>
            <div style={{ position: 'absolute', bottom: 14, left: 16 }}>
              <p style={{ fontFamily: '"Playfair Display",Georgia,serif', fontSize: 20, fontWeight: 700, color: 'white', lineHeight: 1.2 }}>{market.title}</p>
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
              { emoji: '📅', label: 'Date', value: new Date(market.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }) },
              { emoji: '⏰', label: 'Heure', value: new Date(market.start_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) },
              { emoji: '🏪', label: 'Stands', value: `${occupied}/${market.total_spots}` },
            ].map((s, i) => (
              <div key={i} style={{ background: 'white', borderRadius: 16, padding: '12px 10px', textAlign: 'center', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
                <span style={{ fontSize: 20, display: 'block', marginBottom: 4 }}>{s.emoji}</span>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#111827', marginBottom: 2 }}>{s.value}</p>
                <p style={{ fontSize: 10, color: '#9CA3AF' }}>{s.label}</p>
              </div>
            ))}
          </div>
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, background: '#111827', color: 'white', borderRadius: 18, padding: '17px', fontSize: 15, fontWeight: 700, textDecoration: 'none', fontFamily: '"DM Sans",sans-serif' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
            Y ALLER
          </a>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function WhatmarketCarte() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const userMarkerRef = useRef<any>(null)
  const [markets, setMarkets] = useState<Market[]>([])
  const [selected, setSelected] = useState<Market | null>(null)
  const [geoStatus, setGeoStatus] = useState<GeoStatus>('idle')
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null)
  const [loading, setLoading] = useState(true)

  const loadMarkets = useCallback(async (lat?: number, lng?: number) => {
    try {
      const { createClient } = await import('@/lib/supabase')
      const supabase = createClient()
      const today = new Date().toISOString().split('T')[0]
      const { data: events } = await supabase.from('events').select('*')
        .eq('status', 'published').gte('start_date', today)
        .order('start_date', { ascending: true }).limit(50)
      if (!events) return []
      const enriched = events
        .filter((ev: any) => ev.latitude && ev.longitude)
        .map((ev: any) => ({
          ...ev,
          distance: lat && lng ? haversine(lat, lng, ev.latitude, ev.longitude) : undefined
        }))
      setMarkets(enriched)
      return enriched
    } catch (err) { console.error(err) }
    return []
  }, [])

  const addMarkers = useCallback((map: any, L: any, marketsData: Market[]) => {
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []
    marketsData.forEach(market => {
      if (!market.latitude || !market.longitude) return
      const cd = fmt_countdown(market.start_date)
      const icon = L.divIcon({
        className: '',
        html: `<div style="width:36px;height:36px;cursor:pointer;">
          <div style="width:36px;height:36px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${cd.pin};border:2.5px solid white;box-shadow:0 4px 12px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;">
            <span style="transform:rotate(45deg);font-size:14px;line-height:1;">🏪</span>
          </div>
        </div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
      })
      const marker = L.marker([market.latitude, market.longitude], { icon })
        .addTo(map)
        .on('click', () => setSelected(market))
      markersRef.current.push(marker)
    })
  }, [])

  // ✅ Init Leaflet — avec hauteur explicite sur le container
  useEffect(() => {
    if (mapInstanceRef.current || !mapRef.current) return

    const initMap = async () => {
      const L = (await import('leaflet')).default
      await import('leaflet/dist/leaflet.css')

      // ✅ Force la hauteur avant d'initialiser
      mapRef.current!.style.width = '100%'
      mapRef.current!.style.height = '100%'
      mapRef.current!.style.position = 'absolute'
      mapRef.current!.style.top = '0'
      mapRef.current!.style.left = '0'
      mapRef.current!.style.right = '0'
      mapRef.current!.style.bottom = '0'

      const map = L.map(mapRef.current!, {
        center: [43.7, 5.1],
        zoom: 10,
        zoomControl: false,
        attributionControl: false,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 18,
      }).addTo(map)

      L.control.attribution({ position: 'bottomleft', prefix: '© OpenStreetMap' }).addTo(map)

      mapInstanceRef.current = map

      // ✅ Force recalcul de la taille après mount
      setTimeout(() => {
        map.invalidateSize()
        setLoading(false)
      }, 200)

      const marketsData: any = await loadMarkets()
      if (marketsData?.length) addMarkers(map, L, marketsData)
    }

    initMap()
  }, [loadMarkets, addMarkers])

  const requestGeo = async () => {
    if (!navigator.geolocation) return
    setGeoStatus('requesting')
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude: lat, longitude: lng } }) => {
        setUserPos({ lat, lng })
        setGeoStatus('ok')
        const map = mapInstanceRef.current
        if (!map) return
        const L = (await import('leaflet')).default
        if (userMarkerRef.current) userMarkerRef.current.remove()
        const userIcon = L.divIcon({
          className: '',
          html: `<div style="position:relative;width:20px;height:20px;">
            <div style="position:absolute;inset:0;border-radius:50%;background:rgba(79,70,229,0.2);animation:userPulse 2s ease infinite;"></div>
            <div style="position:absolute;inset:4px;border-radius:50%;background:#4F46E5;border:2px solid white;box-shadow:0 2px 8px rgba(79,70,229,0.5);"></div>
          </div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        })
        userMarkerRef.current = L.marker([lat, lng], { icon: userIcon }).addTo(map)
        map.flyTo([lat, lng], 13, { duration: 1.2 })
        const marketsData = await loadMarkets(lat, lng)
        if (marketsData?.length) addMarkers(map, L, marketsData)
      },
      () => setGeoStatus('denied'),
      { timeout: 8000 }
    )
  }

  const centerOnUser = () => {
    if (userPos && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([userPos.lat, userPos.lng], 13, { duration: 1 })
    } else {
      requestGeo()
    }
  }

  const NAV = [
    { label: 'Accueil', href: '/whatmarket', path: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10' },
    { label: 'Carte', href: '/whatmarket/carte', path: 'M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4zM8 2v16M16 6v16' },
    { label: 'Pro', href: '/pro/ads/new', path: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z' },
  ]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
        html, body { height: 100%; overflow: hidden; font-family: 'DM Sans', system-ui, sans-serif; background: #111827; }
        ::-webkit-scrollbar { display: none; }
        .leaflet-container { background: #F9F8F6 !important; }
        .leaflet-control-attribution { font-size: 9px !important; background: rgba(255,255,255,0.7) !important; }
        @keyframes userPulse { 0%, 100% { transform: scale(1); opacity: 0.6; } 50% { transform: scale(1.8); opacity: 0; } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* ✅ Container fixé avec dimensions explicites */}
      <div style={{
        position: 'fixed',
        top: 0, bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 430,
        height: '100dvh',
        overflow: 'hidden',
        fontFamily: '"DM Sans",system-ui,sans-serif',
      }}>

        {/* ✅ Map div avec dimensions absolues explicites */}
        <div
          ref={mapRef}
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            width: '100%',
            height: '100%',
            zIndex: 0,
          }}
        />

        {/* Loading */}
        {loading && (
          <div style={{ position: 'absolute', inset: 0, background: '#F9F8F6', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 32, height: 32, border: '3px solid #E5E7EB', borderTopColor: '#4F46E5', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
              <p style={{ fontSize: 13, color: '#6B7280' }}>Chargement de la carte...</p>
            </div>
          </div>
        )}

        {/* TOP BAR */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20, padding: '52px 16px 12px', background: 'linear-gradient(to bottom, rgba(249,248,246,0.96) 60%, transparent)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontFamily: '"Playfair Display",Georgia,serif', fontSize: 22, fontWeight: 900, color: '#111827', letterSpacing: '-0.02em', lineHeight: 1 }}>Carte</p>
              <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
                {markets.length > 0 ? `${markets.length} marché${markets.length > 1 ? 's' : ''} sur la carte` : 'Chargement...'}
              </p>
            </div>
            <button onClick={requestGeo}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: geoStatus === 'ok' ? '#ECFDF5' : '#4F46E5', border: 'none', borderRadius: 100, padding: '8px 14px', cursor: 'pointer', transition: 'all 0.3s' }}>
              {geoStatus === 'requesting'
                ? <div style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={geoStatus === 'ok' ? '#10B981' : 'white'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
              }
              <span style={{ fontSize: 12, fontWeight: 600, color: geoStatus === 'ok' ? '#10B981' : 'white' }}>
                {geoStatus === 'ok' ? 'Localisé' : geoStatus === 'requesting' ? 'Recherche...' : 'Me localiser'}
              </span>
            </button>
          </div>
        </div>

        {/* LÉGENDE */}
        <div style={{ position: 'absolute', top: 130, left: 16, zIndex: 20, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)', borderRadius: 12, padding: '8px 12px', boxShadow: '0 2px 12px rgba(0,0,0,0.1)' }}>
          {[
            { color: '#10B981', label: 'En cours' },
            { color: '#F59E0B', label: 'Demain' },
            { color: '#6B7280', label: 'Bientôt' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: i < 2 ? 4 : 0 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: item.color }} />
              <span style={{ fontSize: 10, color: '#374151', fontWeight: 500 }}>{item.label}</span>
            </div>
          ))}
        </div>

        {/* CENTRER */}
        <button onClick={centerOnUser}
          style={{ position: 'absolute', bottom: 100, right: 16, zIndex: 20, width: 48, height: 48, borderRadius: '50%', background: 'white', border: 'none', cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={geoStatus === 'ok' ? '#4F46E5' : '#6B7280'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M1 12h4M19 12h4"/>
          </svg>
        </button>

        {/* ZOOM */}
        <div style={{ position: 'absolute', bottom: 160, right: 16, zIndex: 20, display: 'flex', flexDirection: 'column', gap: 1, borderRadius: 12, overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}>
          {['+', '−'].map((label, i) => (
            <button key={i}
              onClick={() => { const map = mapInstanceRef.current; if (map) i === 0 ? map.zoomIn() : map.zoomOut() }}
              style={{ width: 40, height: 40, background: 'white', border: 'none', cursor: 'pointer', fontSize: 18, fontWeight: 400, color: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: i === 0 ? '0.5px solid #E5E7EB' : 'none' }}>
              {label}
            </button>
          ))}
        </div>

        {/* BOTTOM NAV */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 30, background: 'rgba(249,248,246,0.96)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderTop: '0.5px solid rgba(0,0,0,0.07)', padding: '10px 32px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-around' }}>
            {NAV.map((item, i) => (
              <a key={i} href={item.href}
                style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, color: i === 1 ? '#111827' : '#C4C2BC', transition: 'color 0.2s', padding: '2px 16px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d={item.path} />
                </svg>
                <span style={{ fontSize: 10, fontWeight: i === 1 ? 600 : 400, fontFamily: '"DM Sans",sans-serif' }}>{item.label}</span>
                {i === 1 && <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#111827' }} />}
              </a>
            ))}
          </div>
        </div>

        <AnimatePresence>
          {selected && <MarketDrawer market={selected} onClose={() => setSelected(null)} />}
        </AnimatePresence>
      </div>
    </>
  )
}
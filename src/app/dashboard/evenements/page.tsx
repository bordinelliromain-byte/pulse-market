'use client'

import { useEffect, useState, useRef, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import Sidebar from '@/components/Sidebar'
import dynamic from 'next/dynamic'
import {
  Search, MapPin, Calendar, CheckCircle,
  Bell, SlidersHorizontal, Utensils, Brush,
  ShoppingBag, Leaf, Moon, Euro, ArrowUpRight,
  Shield, Navigation, Clock, Trophy, Lock,
  List, Map as MapIcon, Heart, X, ArrowUpDown,
  Zap, AlertCircle
} from 'lucide-react'

const BRAND = '#4F46E5'
const FAVORITES_KEY = 'pulsemarket_favorites'

// ✅ Map dynamique (côté client uniquement)
const MapView = dynamic(() => import('@/components/EventsMap'), {
  ssr: false,
  loading: () => (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC' }}>
      <div style={{ width: 28, height: 28, border: `2px solid ${BRAND}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )
})

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

function AnimatedCard({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      transition={{ duration: 0.4, delay }}>
      {children}
    </motion.div>
  )
}

function AvailabilityBar({ available, total }: { available: number; total: number }) {
  const used = total - available
  const pct = total > 0 ? (used / total) * 100 : 0
  const color = available <= 5 ? '#F97316' : BRAND
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 4 }}>
          {available <= 5 ? <><Zap size={10} style={{ color: '#F97316' }} /> Plus que quelques places</> : 'Places disponibles'}
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, color }}>{available} / {total}</span>
      </div>
      <div style={{ height: 3, background: '#F1F5F9', borderRadius: 100, overflow: 'hidden' }}>
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: 0.3 }}
          style={{ height: '100%', background: color, borderRadius: 100 }} />
      </div>
    </div>
  )
}

// ✅ Skeleton de card
function CardSkeleton() {
  return (
    <div style={{ background: 'white', borderRadius: 14, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
      <div style={{ height: 150, background: 'linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
      <div style={{ padding: 14 }}>
        <div style={{ height: 14, width: '70%', background: '#F1F5F9', borderRadius: 4, marginBottom: 8 }} />
        <div style={{ height: 10, width: '50%', background: '#F1F5F9', borderRadius: 4, marginBottom: 12 }} />
        <div style={{ height: 6, width: '100%', background: '#F1F5F9', borderRadius: 100 }} />
      </div>
    </div>
  )
}

function EventCoverImage({ title, location, exclusive, isNew, imageUrl }: {
  title: string; location?: string; exclusive?: boolean; isNew?: boolean; imageUrl?: string
}) {
  const gradients = [
    'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
    'linear-gradient(135deg, #0EA5E9 0%, #4F46E5 100%)',
    'linear-gradient(135deg, #16A34A 0%, #0EA5E9 100%)',
    'linear-gradient(135deg, #EA580C 0%, #DC2626 100%)',
    'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)',
    'linear-gradient(135deg, #0F172A 0%, #4F46E5 100%)',
  ]
  const gradient = gradients[title.length % gradients.length]
  return (
    <div style={{ position: 'relative', height: 150, overflow: 'hidden' }}>
      {imageUrl ? (
        <img src={imageUrl} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <div style={{ height: '100%', background: gradient }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.08) 0%, transparent 50%)' }} />
        </div>
      )}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 60%)' }} />
      {location && (
        <div style={{ position: 'absolute', bottom: 10, left: 10, display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)', borderRadius: 8, padding: '4px 9px' }}>
          <MapPin size={10} style={{ color: 'white', opacity: 0.8 }} />
          <span style={{ fontSize: 10, color: 'white', fontWeight: 500 }}>{location}</span>
        </div>
      )}
      <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 6 }}>
        {exclusive && <span style={{ background: '#FBBF24', color: '#92400E', fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 100 }}>EXCLUSIF PRO</span>}
        {isNew && <span style={{ background: 'rgba(79,70,229,0.9)', color: 'white', fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 100 }}>NOUVEAU</span>}
      </div>
      <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(22,163,74,0.9)', borderRadius: 100, padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 4 }}>
        <Shield size={9} style={{ color: 'white' }} />
        <span style={{ fontSize: 9, color: 'white', fontWeight: 700 }}>VÉRIFIÉ</span>
      </div>
    </div>
  )
}

const TYPE_FILTERS = [
  { label: 'Tous', value: null, icon: null },
  { label: 'Alimentaire', value: 'alimentaire', icon: <Utensils size={11} /> },
  { label: 'Artisanat', value: 'artisanat', icon: <Brush size={11} /> },
  { label: 'Brocante', value: 'brocante', icon: <ShoppingBag size={11} /> },
  { label: 'Bio', value: 'bio', icon: <Leaf size={11} /> },
  { label: 'Nocturne', value: 'nocturne', icon: <Moon size={11} /> },
]

const SORT_OPTIONS = [
  { value: 'date_asc', label: 'Date (plus tôt)' },
  { value: 'date_desc', label: 'Date (plus tard)' },
  { value: 'price_asc', label: 'Prix croissant' },
  { value: 'price_desc', label: 'Prix décroissant' },
  { value: 'spots_desc', label: 'Plus de places' },
]

// ✅ Distance haversine entre 2 points
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat/2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

export default function Evenements() {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userApplications, setUserApplications] = useState<{ event_id: string, status: string, created_at: string }[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [search, setSearch] = useState('')
  const [activeType, setActiveType] = useState<string | null>(null)
  const [maxPrice, setMaxPrice] = useState(200)
  const [maxDistance, setMaxDistance] = useState(50) // km
  const [needsElectricity, setNeedsElectricity] = useState<boolean | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false)
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false)
  const [sortBy, setSortBy] = useState('date_asc')
  const [view, setView] = useState<'list' | 'map'>('list')
  const [favorites, setFavorites] = useState<string[]>([])
  const [upgradingPro, setUpgradingPro] = useState(false)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const isMobile = useIsMobile()

  const router = useRouter()
  const supabase = createClient()

  // ✅ Charger favoris du localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(FAVORITES_KEY)
      if (saved) setFavorites(JSON.parse(saved))
    } catch (e) {}
  }, [])

  // ✅ Geolocation utilisateur
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {
          // Fallback : centre Bouches-du-Rhône (Aubagne)
          setUserLocation({ lat: 43.2925, lng: 5.5705 })
        }
      )
    } else {
      setUserLocation({ lat: 43.2925, lng: 5.5705 })
    }
  }, [])

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(profileData)
      const { data: eventsData } = await supabase.from('events').select('*').eq('status', 'published').order('start_date', { ascending: true })
      setEvents(eventsData || [])
      const { data: apps } = await supabase.from('applications').select('event_id, status, created_at').eq('exposant_id', user.id)
      setUserApplications(apps || [])
      setLoading(false)
    }
    getData()
  }, [])

  const toggleFavorite = (eventId: string) => {
    const newFavorites = favorites.includes(eventId)
      ? favorites.filter(id => id !== eventId)
      : [...favorites, eventId]
    setFavorites(newFavorites)
    try { localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites)) } catch (e) {}
  }

  // ✅ FILTRES ET TRI — useMemo pour optimisation
  const filteredAndSortedEvents = useMemo(() => {
    let result = [...events]

    // Search
    if (search) {
      const s = search.toLowerCase()
      result = result.filter(e =>
        e.title?.toLowerCase().includes(s) ||
        e.location_name?.toLowerCase().includes(s) ||
        e.city?.toLowerCase().includes(s)
      )
    }

    // Type
    if (activeType) {
      result = result.filter(e => {
        const desc = (e.description || '').toLowerCase()
        const title = (e.title || '').toLowerCase()
        return desc.includes(activeType) || title.includes(activeType)
      })
    }

    // Prix
    if (maxPrice < 200) {
      result = result.filter(e => (e.price_per_spot || 0) <= maxPrice)
    }

    // Distance
    if (userLocation && maxDistance < 100) {
      result = result.filter(e => {
        if (!e.latitude || !e.longitude) return true
        const dist = getDistance(userLocation.lat, userLocation.lng, e.latitude, e.longitude)
        return dist <= maxDistance
      })
    }

    // Électricité
    if (needsElectricity !== null) {
      result = result.filter(e => e.needs_electricity === needsElectricity)
    }

    // Disponible seulement
    if (showOnlyAvailable) {
      result = result.filter(e => e.available_spots > 0)
    }

    // Favoris seulement
    if (showOnlyFavorites) {
      result = result.filter(e => favorites.includes(e.id))
    }

    // Dates
    if (dateFrom) {
      const from = new Date(dateFrom)
      result = result.filter(e => new Date(e.start_date) >= from)
    }
    if (dateTo) {
      const to = new Date(dateTo)
      result = result.filter(e => new Date(e.start_date) <= to)
    }

    // TRI
    switch (sortBy) {
      case 'date_asc':
        result.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
        break
      case 'date_desc':
        result.sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())
        break
      case 'price_asc':
        result.sort((a, b) => (a.price_per_spot || 0) - (b.price_per_spot || 0))
        break
      case 'price_desc':
        result.sort((a, b) => (b.price_per_spot || 0) - (a.price_per_spot || 0))
        break
      case 'spots_desc':
        result.sort((a, b) => (b.available_spots || 0) - (a.available_spots || 0))
        break
    }

    return result
  }, [events, search, activeType, maxPrice, maxDistance, needsElectricity, showOnlyAvailable, showOnlyFavorites, dateFrom, dateTo, sortBy, favorites, userLocation])

  const isPro = profile?.plan === 'pro'
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const candidaturesCeMois = userApplications.filter(a => new Date(a.created_at) >= monthStart).length
  const isBlocked = !isPro && candidaturesCeMois >= 1

  const handleUpgradePro = async () => {
    setUpgradingPro(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const res = await fetch('/api/create-pro-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, email: profile?.email || '' })
      })
      const { url, error } = await res.json()
      if (error) throw new Error(error)
      if (url) window.location.href = url
    } catch (err: any) { alert('Erreur : ' + err.message) }
    setUpgradingPro(false)
  }

  const getAppStatus = (eventId: string) => {
    const app = userApplications.find(a => a.event_id === eventId)
    return app?.status || null
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  const formatShort = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })

  const resetFilters = () => {
    setSearch('')
    setActiveType(null)
    setMaxPrice(200)
    setMaxDistance(50)
    setNeedsElectricity(null)
    setShowOnlyAvailable(false)
    setShowOnlyFavorites(false)
    setDateFrom('')
    setDateTo('')
    setSortBy('date_asc')
  }

  const activeFiltersCount = [
    search,
    activeType,
    maxPrice < 200,
    maxDistance < 100,
    needsElectricity !== null,
    showOnlyAvailable,
    showOnlyFavorites,
    dateFrom,
    dateTo,
  ].filter(Boolean).length

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#EEF2F7', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <Sidebar profile={profile} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }`}</style>

      <div style={{ marginLeft: isMobile ? 0 : 220, flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>

        <header style={{ background: 'white', borderBottom: '1px solid #E2E8F0', padding: isMobile ? '0 14px 0 60px' : '0 28px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>
            Marchés <span style={{ color: '#64748B', fontWeight: 400 }}>({filteredAndSortedEvents.length})</span>
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* ✅ Toggle Liste / Carte */}
            <div style={{ display: 'flex', background: '#F1F5F9', borderRadius: 8, padding: 3 }}>
              <button onClick={() => setView('list')}
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', border: 'none', borderRadius: 6, background: view === 'list' ? 'white' : 'transparent', color: view === 'list' ? '#0F172A' : '#94A3B8', fontSize: 11, fontWeight: 600, cursor: 'pointer', boxShadow: view === 'list' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none' }}>
                <List size={12} /> {!isMobile && 'Liste'}
              </button>
              <button onClick={() => setView('map')}
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', border: 'none', borderRadius: 6, background: view === 'map' ? 'white' : 'transparent', color: view === 'map' ? '#0F172A' : '#94A3B8', fontSize: 11, fontWeight: 600, cursor: 'pointer', boxShadow: view === 'map' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none' }}>
                <MapIcon size={12} /> {!isMobile && 'Carte'}
              </button>
            </div>
            {!isMobile && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#64748B' }}>
                <MapPin size={12} style={{ color: BRAND }} /> Bouches-du-Rhône
              </div>
            )}
          </div>
        </header>

        {/* ✅ Search + Filtres */}
        <div style={{ background: 'white', borderBottom: '1px solid #E2E8F0', padding: isMobile ? '10px 14px' : '10px 28px', position: 'sticky', top: 52, zIndex: 9 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Ville, marché, lieu..."
                style={{ width: '100%', padding: '7px 12px 7px 30px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 12, color: '#0F172A', background: '#F8FAFC', outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => { e.target.style.borderColor = BRAND; e.target.style.background = 'white' }}
                onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.background = '#F8FAFC' }} />
            </div>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}
              style={{ padding: '7px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 11, color: '#64748B', background: 'white', cursor: 'pointer', outline: 'none' }}>
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <button onClick={() => setShowFilters(!showFilters)}
              style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 5, padding: '7px 11px', border: showFilters || activeFiltersCount > 0 ? `1.5px solid ${BRAND}` : '1px solid #E2E8F0', borderRadius: 8, background: showFilters || activeFiltersCount > 0 ? '#EEF2FF' : 'white', color: showFilters || activeFiltersCount > 0 ? BRAND : '#64748B', fontSize: 11, fontWeight: 500, cursor: 'pointer', flexShrink: 0 }}>
              <SlidersHorizontal size={12} />
              {!isMobile && 'Filtres'}
              {activeFiltersCount > 0 && (
                <span style={{ background: BRAND, color: 'white', borderRadius: 100, width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700 }}>
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>

          {/* Filtres types - chips */}
          <div style={{ display: 'flex', gap: 6, marginTop: 8, overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', paddingBottom: 2 }}>
            <button onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 8, border: showOnlyFavorites ? `1.5px solid #EC4899` : '1px solid #E2E8F0', background: showOnlyFavorites ? '#FDF2F8' : 'white', color: showOnlyFavorites ? '#EC4899' : '#64748B', fontSize: 11, fontWeight: showOnlyFavorites ? 600 : 400, cursor: 'pointer', flexShrink: 0 }}>
              <Heart size={11} fill={showOnlyFavorites ? '#EC4899' : 'none'} /> Favoris ({favorites.length})
            </button>
            {TYPE_FILTERS.map(type => (
              <button key={type.label} onClick={() => setActiveType(type.value)}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 8, border: activeType === type.value ? `1.5px solid ${BRAND}` : '1px solid #E2E8F0', background: activeType === type.value ? '#EEF2FF' : 'white', color: activeType === type.value ? BRAND : '#64748B', fontSize: 11, fontWeight: activeType === type.value ? 600 : 400, cursor: 'pointer', flexShrink: 0 }}>
                {type.icon}{type.label}
              </button>
            ))}
          </div>

          {/* ✅ Panneau filtres avancés */}
          <AnimatePresence>
            {showFilters && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                style={{ marginTop: 10, padding: '14px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 14 }}>
                  
                  {/* Prix */}
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                      <Euro size={11} /> Prix max : <span style={{ color: BRAND, fontWeight: 700 }}>{maxPrice === 200 ? 'Illimité' : `${maxPrice}€`}</span>
                    </label>
                    <input type="range" min={10} max={200} step={5} value={maxPrice} onChange={e => setMaxPrice(+e.target.value)} style={{ width: '100%', accentColor: BRAND }} />
                  </div>

                  {/* Distance */}
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                      <Navigation size={11} /> Distance max : <span style={{ color: BRAND, fontWeight: 700 }}>{maxDistance === 100 ? 'Illimité' : `${maxDistance} km`}</span>
                    </label>
                    <input type="range" min={5} max={100} step={5} value={maxDistance} onChange={e => setMaxDistance(+e.target.value)} style={{ width: '100%', accentColor: BRAND }} />
                  </div>

                  {/* Date de */}
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>À partir du</label>
                    <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                      style={{ width: '100%', padding: '7px 10px', border: '1px solid #E2E8F0', borderRadius: 7, fontSize: 12, color: '#0F172A', background: 'white', outline: 'none', boxSizing: 'border-box' }} />
                  </div>

                  {/* Date jusqu'à */}
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Jusqu'au</label>
                    <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                      style={{ width: '100%', padding: '7px 10px', border: '1px solid #E2E8F0', borderRadius: 7, fontSize: 12, color: '#0F172A', background: 'white', outline: 'none', boxSizing: 'border-box' }} />
                  </div>

                  {/* Électricité */}
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>Électricité</label>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {[{ val: null, label: 'Indifférent' }, { val: true, label: 'Requise' }, { val: false, label: 'Pas besoin' }].map(opt => (
                        <button key={String(opt.val)} onClick={() => setNeedsElectricity(opt.val)}
                          style={{ flex: 1, padding: '6px 0', border: needsElectricity === opt.val ? `1.5px solid ${BRAND}` : '1px solid #E2E8F0', borderRadius: 7, background: needsElectricity === opt.val ? '#EEF2FF' : 'white', color: needsElectricity === opt.val ? BRAND : '#64748B', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Disponible seulement */}
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>Disponibilité</label>
                    <button onClick={() => setShowOnlyAvailable(!showOnlyAvailable)}
                      style={{ width: '100%', padding: '7px 10px', border: showOnlyAvailable ? `1.5px solid ${BRAND}` : '1px solid #E2E8F0', borderRadius: 7, background: showOnlyAvailable ? '#EEF2FF' : 'white', color: showOnlyAvailable ? BRAND : '#64748B', fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                      <CheckCircle size={12} /> {showOnlyAvailable ? 'Places dispos uniquement' : 'Tout afficher'}
                    </button>
                  </div>
                </div>

                {/* Reset */}
                {activeFiltersCount > 0 && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: '#64748B' }}>{activeFiltersCount} filtre(s) actif(s)</span>
                    <button onClick={resetFilters}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', color: BRAND, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      <X size={12} /> Réinitialiser
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ✅ Bannière blocage Pro */}
        {isBlocked && (
          <div style={{ padding: isMobile ? '14px 14px 0' : '24px 28px 0' }}>
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              style={{ background: 'linear-gradient(135deg, #0F172A, #1E293B)', borderRadius: 14, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, background: 'rgba(251,191,36,0.15)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Lock size={16} style={{ color: '#FBBF24' }} />
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'white', marginBottom: 2 }}>Limite mensuelle atteinte</p>
                  <p style={{ fontSize: 11, color: '#64748B', lineHeight: 1.4 }}>Passez Pro pour candidater sans limite</p>
                </div>
              </div>
              <button onClick={handleUpgradePro} disabled={upgradingPro}
                style={{ background: BRAND, color: 'white', border: 'none', borderRadius: 9, padding: '9px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 5 }}>
                <Zap size={12} /> Passer Pro
              </button>
            </motion.div>
          </div>
        )}

        {/* ✅ VUE LISTE ou CARTE */}
        {view === 'list' ? (
          <main style={{ padding: isMobile ? '14px' : '24px 28px', flex: 1 }}>
            {loading ? (
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: isMobile ? 12 : 20 }}>
                {[...Array(6)].map((_, i) => <CardSkeleton key={i} />)}
              </div>
            ) : filteredAndSortedEvents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ width: 56, height: 56, background: '#EEF2FF', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <Search size={24} style={{ color: BRAND }} />
                </div>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>Aucun marché trouvé</p>
                <p style={{ fontSize: 13, color: '#64748B', marginBottom: 16 }}>Essayez d'ajuster vos filtres</p>
                {activeFiltersCount > 0 && (
                  <button onClick={resetFilters}
                    style={{ background: BRAND, color: 'white', border: 'none', borderRadius: 9, padding: '9px 18px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    Réinitialiser les filtres
                  </button>
                )}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: isMobile ? 12 : 20 }}>
                {filteredAndSortedEvents.map((event, i) => {
                  const appStatus = getAppStatus(event.id)
                  const isPaid = appStatus === 'paid' || appStatus === 'present'
                  const isPending = appStatus === 'pending' || appStatus === 'validated'
                  const isNew = i < 2
                  const cardBlocked = isBlocked && !appStatus
                  const isFavorite = favorites.includes(event.id)
                  const distance = userLocation && event.latitude && event.longitude
                    ? getDistance(userLocation.lat, userLocation.lng, event.latitude, event.longitude)
                    : null

                  return (
                    <AnimatedCard key={event.id} delay={i * 0.04}>
                      <div style={{ background: 'white', borderRadius: 14, border: `1px solid ${isPaid ? '#BBF7D0' : '#E2E8F0'}`, overflow: 'hidden', cursor: cardBlocked ? 'not-allowed' : 'pointer', opacity: cardBlocked ? 0.55 : 1, position: 'relative', transition: 'transform 0.2s, box-shadow 0.2s' }}
                        onMouseEnter={e => { if (!isMobile && !cardBlocked) { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(79,70,229,0.14)' } }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}>

                        {cardBlocked && (
                          <div style={{ position: 'absolute', inset: 0, zIndex: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onClick={() => alert('Limite mensuelle atteinte — passez en Pro pour candidater sans limite.')}>
                            <div style={{ background: 'white', borderRadius: 10, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 6, border: '1px solid #E2E8F0', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
                              <Lock size={13} style={{ color: BRAND }} />
                              <span style={{ fontSize: 12, fontWeight: 700, color: BRAND }}>Pro requis</span>
                            </div>
                          </div>
                        )}

                        <div style={{ position: 'relative' }}>
                          <EventCoverImage title={event.title} location={event.location_name} exclusive={event.is_exclusive} isNew={isNew} imageUrl={event.image_url} />
                          
                          {/* ✅ Bouton favoris */}
                          <button onClick={(e) => { e.stopPropagation(); toggleFavorite(event.id) }}
                            style={{ position: 'absolute', top: 10, right: 70, background: 'rgba(255,255,255,0.95)', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 2, boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}>
                            <Heart size={14} style={{ color: isFavorite ? '#EC4899' : '#94A3B8' }} fill={isFavorite ? '#EC4899' : 'none'} />
                          </button>

                          {isPaid && (
                            <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.75)', backdropFilter: 'blur(2px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                              <div style={{ width: 48, height: 48, background: 'rgba(34,197,94,0.2)', borderRadius: '50%', border: '2px solid #22C55E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Trophy size={22} style={{ color: '#22C55E' }} />
                              </div>
                              <p style={{ fontSize: 13, fontWeight: 800, color: 'white', textAlign: 'center' }}>Place confirmée !</p>
                              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', textAlign: 'center', padding: '0 16px' }}>Rendez-vous le {formatShort(event.start_date)}</p>
                            </div>
                          )}
                        </div>

                        <div style={{ padding: '12px 14px' }}>
                          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 4, lineHeight: 1.3 }}>{event.title}</h3>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#64748B', marginBottom: 6 }}>
                            <MapPin size={11} style={{ color: BRAND, flexShrink: 0 }} />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{event.location_name}</span>
                            {distance !== null && (
                              <span style={{ fontSize: 10, color: '#94A3B8', flexShrink: 0 }}>· {distance.toFixed(1)} km</span>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#94A3B8', marginBottom: 10 }}>
                            <Calendar size={10} />{formatDate(event.start_date)}
                          </div>

                          {!isPaid && (
                            <div style={{ marginBottom: 12 }}>
                              <AvailabilityBar available={event.available_spots} total={event.total_spots} />
                            </div>
                          )}

                          {isPaid && (
                            <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: '8px 10px', marginBottom: 10 }}>
                              <p style={{ fontSize: 11, fontWeight: 700, color: '#15803D', display: 'flex', alignItems: 'center', gap: 5 }}>
                                <CheckCircle size={11} /> Votre place est réservée
                              </p>
                            </div>
                          )}

                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid #F8FAFC' }}>
                            <p style={{ fontSize: 18, fontWeight: 800, color: '#0F172A' }}>
                              {event.price_per_spot === 0 ? 'Gratuit' : `${event.price_per_spot}€`}
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              {event.latitude && event.longitude && !isMobile && !cardBlocked && (
                                <a href={`https://www.google.com/maps/dir/?api=1&destination=${event.latitude},${event.longitude}`}
                                  target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                                  style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#64748B', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '7px 10px', textDecoration: 'none', fontWeight: 500 }}>
                                  <Navigation size={11} /> Itinéraire
                                </a>
                              )}
                              {isPaid ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, padding: '7px 11px', fontSize: 11, color: '#16A34A', fontWeight: 700 }}>
                                  <CheckCircle size={12} /> Inscrit
                                </div>
                              ) : isPending ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 8, padding: '7px 11px', fontSize: 11, color: BRAND, fontWeight: 600 }}>
                                  <Clock size={12} /> En cours
                                </div>
                              ) : event.available_spots === 0 ? (
                                <span style={{ fontSize: 11, color: '#94A3B8', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '7px 11px', fontWeight: 500 }}>Complet</span>
                              ) : cardBlocked ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '7px 11px', fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>
                                  <Lock size={11} /> Pro
                                </div>
                              ) : (
                                <button onClick={() => router.push(`/dashboard/candidature?eventId=${event.id}&eventName=${encodeURIComponent(event.title)}&eventDate=${encodeURIComponent(formatDate(event.start_date))}&eventLocation=${encodeURIComponent(event.location_name || '')}`)}
                                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: BRAND, color: 'white', border: 'none', borderRadius: 9, padding: '8px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                                  Postuler <ArrowUpRight size={13} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </AnimatedCard>
                  )
                })}
              </div>
            )}
          </main>
        ) : (
          /* ✅ VUE CARTE */
          <main style={{ flex: 1, position: 'relative', minHeight: 'calc(100vh - 200px)' }}>
            <MapView 
              events={filteredAndSortedEvents}
              userLocation={userLocation}
              userApplications={userApplications}
              favorites={favorites}
              isBlocked={isBlocked}
              onPostuler={(event) => router.push(`/dashboard/candidature?eventId=${event.id}&eventName=${encodeURIComponent(event.title)}&eventDate=${encodeURIComponent(formatDate(event.start_date))}&eventLocation=${encodeURIComponent(event.location_name || '')}`)}
              onToggleFavorite={toggleFavorite}
            />
          </main>
        )}
      </div>
    </div>
  )
}
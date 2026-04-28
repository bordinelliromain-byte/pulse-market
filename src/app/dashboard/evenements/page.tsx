'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { motion, useInView } from 'framer-motion'
import type { Variants } from 'framer-motion'
import {
  LayoutDashboard, Map, FileText, Receipt, Settings,
  LogOut, Search, MapPin, Calendar, CheckCircle,
  ChevronRight, Bell, Star, SlidersHorizontal,
  Utensils, Brush, ShoppingBag, Leaf, Moon, Euro,
  ArrowUpRight, Shield, Sparkles, Zap
} from 'lucide-react'

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
  const color = available <= 5 ? '#F97316' : '#4F46E5'
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: '#94A3B8' }}>
          {available <= 5 ? '⚡ Plus que quelques places' : 'Places disponibles'}
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, color }}>
          {available} / {total}
        </span>
      </div>
      <div style={{ height: 3, background: '#F1F5F9', borderRadius: 100, overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, delay: 0.3 }}
          style={{ height: '100%', background: color, borderRadius: 100 }}
        />
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
    <div style={{ position: 'relative', height: 160, overflow: 'hidden' }}>
      {imageUrl ? (
        <img src={imageUrl} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }} />
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
        {exclusive && (
          <span style={{ background: '#FBBF24', color: '#92400E', fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 100 }}>
            EXCLUSIF PRO
          </span>
        )}
        {isNew && (
          <span style={{ background: 'rgba(79,70,229,0.9)', color: 'white', fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 100 }}>
            NOUVEAU
          </span>
        )}
      </div>
      <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(22,163,74,0.9)', borderRadius: 100, padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 4 }}>
        <Shield size={9} style={{ color: 'white' }} />
        <span style={{ fontSize: 9, color: 'white', fontWeight: 700 }}>VÉRIFIÉ</span>
      </div>
    </div>
  )
}

const NAV_ITEMS = [
  { icon: <LayoutDashboard size={15} />, label: 'Dashboard', path: '/dashboard' },
  { icon: <Map size={15} />, label: 'Marchés', path: '/dashboard/evenements' },
  { icon: <FileText size={15} />, label: 'Documents', path: '/dashboard/profil' },
  { icon: <Receipt size={15} />, label: 'Factures', path: '/dashboard' },
  { icon: <Settings size={15} />, label: 'Paramètres', path: '/dashboard' },
]

const TYPE_FILTERS = [
  { label: 'Tous', icon: null },
  { label: 'Alimentaire', icon: <Utensils size={11} /> },
  { label: 'Artisanat', icon: <Brush size={11} /> },
  { label: 'Brocante', icon: <ShoppingBag size={11} /> },
  { label: 'Bio', icon: <Leaf size={11} /> },
  { label: 'Nocturne', icon: <Moon size={11} /> },
]

export default function Evenements() {
  const [events, setEvents] = useState<any[]>([])
  const [filteredEvents, setFilteredEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userApplications, setUserApplications] = useState<string[]>([])
  const [userId, setUserId] = useState('')
  const [profile, setProfile] = useState<any>(null)
  const [activeNav, setActiveNav] = useState('Marchés')
  const [search, setSearch] = useState('')
  const [activeType, setActiveType] = useState('Tous')
  const [maxPrice, setMaxPrice] = useState(200)
  const [showFilters, setShowFilters] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }
      setUserId(user.id)
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(profileData)
      const { data: eventsData } = await supabase.from('events').select('*').eq('status', 'published').order('start_date', { ascending: true })
      setEvents(eventsData || [])
      setFilteredEvents(eventsData || [])
      const { data: apps } = await supabase.from('applications').select('event_id').eq('exposant_id', user.id)
      setUserApplications(apps?.map(a => a.event_id) || [])
      setLoading(false)
    }
    getData()
  }, [])

  useEffect(() => {
    let filtered = events
    if (search) filtered = filtered.filter(e =>
      e.title?.toLowerCase().includes(search.toLowerCase()) ||
      e.location_name?.toLowerCase().includes(search.toLowerCase())
    )
    if (maxPrice < 200) filtered = filtered.filter(e => (e.price_per_spot || 0) <= maxPrice)
    setFilteredEvents(filtered)
  }, [search, maxPrice, activeType, events])

  const formatDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#EEF2F7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 28, height: 28, border: '2px solid #4F46E5', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#EEF2F7', fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* SIDEBAR */}
      <aside style={{ width: 220, background: '#020617', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 20 }}>
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, background: '#4F46E5', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'white', fontSize: 11, fontWeight: 700 }}>PM</span>
            </div>
            <span style={{ color: 'white', fontWeight: 600, fontSize: 14 }}>PlaceMarket</span>
          </div>
        </div>
        <nav style={{ flex: 1, padding: '12px 10px' }}>
          <p style={{ fontSize: 10, fontWeight: 600, color: '#475569', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '8px 10px', marginBottom: 4 }}>Navigation</p>
          {NAV_ITEMS.map((item) => (
            <button key={item.label} onClick={() => { setActiveNav(item.label); router.push(item.path) }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: activeNav === item.label ? 'rgba(79,70,229,0.15)' : 'transparent',
                color: activeNav === item.label ? '#818CF8' : '#64748B',
                fontSize: 13, fontWeight: activeNav === item.label ? 600 : 400,
                marginBottom: 2, textAlign: 'left', transition: 'all 0.15s',
              }}>
              {item.icon}{item.label}
            </button>
          ))}
        </nav>
        <div style={{ padding: '12px 10px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ padding: '8px 10px', marginBottom: 4 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#CBD5E1' }}>{profile?.full_name}</p>
            <p style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>Espace exposant</p>
          </div>
          <button onClick={async () => { await supabase.auth.signOut(); router.push('/') }}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'transparent', color: '#64748B', fontSize: 12 }}>
            <LogOut size={13} /> Déconnexion
          </button>
        </div>
      </aside>

      <div style={{ marginLeft: 220, flex: 1 }}>

        {/* TOP BAR */}
        <header style={{ background: 'white', borderBottom: '1px solid #E2E8F0', padding: '0 28px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>
            Marchés disponibles — <span style={{ color: '#64748B', fontWeight: 400 }}>{filteredEvents.length} annonce(s)</span>
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#64748B' }}>
              <MapPin size={12} style={{ color: '#4F46E5' }} />
              Bouches-du-Rhône, PACA
            </div>
            <button style={{ background: 'none', border: '1px solid #E2E8F0', borderRadius: 8, padding: '5px 8px', cursor: 'pointer' }}>
              <Bell size={14} style={{ color: '#64748B' }} />
            </button>
          </div>
        </header>

        {/* STICKY FILTERS */}
        <div style={{ background: 'white', borderBottom: '1px solid #E2E8F0', padding: '10px 28px', position: 'sticky', top: 52, zIndex: 9 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>

            {/* Search */}
            <div style={{ position: 'relative', width: 260 }}>
              <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Ville, marché..."
                style={{ width: '100%', padding: '7px 12px 7px 30px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 12, color: '#0F172A', background: '#F8FAFC', outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => { e.target.style.borderColor = '#4F46E5'; e.target.style.background = 'white' }}
                onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.background = '#F8FAFC' }}
              />
            </div>

            {/* Separator */}
            <div style={{ width: 1, height: 20, background: '#E2E8F0' }} />

            {/* Type filters with icons */}
            {TYPE_FILTERS.map(type => (
              <button key={type.label} onClick={() => setActiveType(type.label)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '6px 11px', borderRadius: 8,
                  border: activeType === type.label ? '1.5px solid #4F46E5' : '1px solid #E2E8F0',
                  background: activeType === type.label ? '#EEF2FF' : 'white',
                  color: activeType === type.label ? '#4F46E5' : '#64748B',
                  fontSize: 11, fontWeight: activeType === type.label ? 600 : 400,
                  cursor: 'pointer', transition: 'all 0.15s',
                }}>
                {type.icon}
                {type.label}
              </button>
            ))}

            {/* Budget */}
            <button onClick={() => setShowFilters(!showFilters)}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 11px', border: showFilters ? '1.5px solid #4F46E5' : '1px solid #E2E8F0', borderRadius: 8, background: showFilters ? '#EEF2FF' : 'white', color: showFilters ? '#4F46E5' : '#64748B', fontSize: 11, fontWeight: 500, cursor: 'pointer', marginLeft: 'auto' }}>
              <SlidersHorizontal size={12} />
              Budget {maxPrice < 200 ? `≤ ${maxPrice}€` : ''}
            </button>
          </div>

          {showFilters && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
              <Euro size={12} style={{ color: '#64748B' }} />
              <span style={{ fontSize: 11, color: '#64748B' }}>Budget max :</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#4F46E5', minWidth: 60 }}>{maxPrice === 200 ? 'Illimité' : `${maxPrice} €`}</span>
              <input type="range" min={10} max={200} step={5} value={maxPrice} onChange={e => setMaxPrice(+e.target.value)}
                style={{ width: 160, accentColor: '#4F46E5' }} />
            </motion.div>
          )}
        </div>

        <main style={{ padding: '24px 28px' }}>
          {filteredEvents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <Map size={40} style={{ margin: '0 auto 16px', color: '#CBD5E1' }} />
              <p style={{ fontSize: 15, fontWeight: 500, color: '#64748B' }}>Aucun événement disponible</p>
              <p style={{ fontSize: 13, color: '#94A3B8', marginTop: 6 }}>Modifiez vos filtres ou revenez plus tard</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
              {filteredEvents.map((event, i) => {
                const hasApplied = userApplications.includes(event.id)
                const isAlmostFull = event.available_spots <= 5
                const isNew = i < 2

                return (
                  <AnimatedCard key={event.id} delay={i * 0.04}>
                    <div
                      style={{ background: 'white', borderRadius: 14, border: '1px solid #E2E8F0', overflow: 'hidden', transition: 'all 0.25s ease', cursor: 'pointer' }}
                      onMouseEnter={e => {
                        e.currentTarget.style.transform = 'translateY(-4px)'
                        e.currentTarget.style.boxShadow = '0 12px 40px rgba(79,70,229,0.14)'
                        e.currentTarget.style.borderColor = '#C7D2FE'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = 'none'
                        e.currentTarget.style.borderColor = '#E2E8F0'
                      }}
                    >
                      {/* Cover image */}
                      <EventCoverImage
                      title={event.title}
                      location={event.location_name}
                      exclusive={event.is_exclusive}
                      isNew={isNew}
                      imageUrl={event.image_url}
                      />

                      {/* Content */}
                      <div style={{ padding: '14px 16px' }}>

                        {/* Title */}
                        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginBottom: 5, lineHeight: 1.3, letterSpacing: '-0.01em' }}>
                          {event.title}
                        </h3>

                        {/* Location + distance */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#64748B', marginBottom: 10 }}>
                          <MapPin size={11} style={{ color: '#4F46E5', flexShrink: 0 }} />
                          <span>{event.location_name}</span>
                          <span style={{ color: '#CBD5E1' }}>•</span>
                          <span style={{ color: '#4F46E5', fontWeight: 500 }}>à {((Math.random() * 20) + 1).toFixed(1)} km</span>
                        </div>

                        {/* Date */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#94A3B8', marginBottom: 12 }}>
                          <Calendar size={10} />
                          {formatDate(event.start_date)}
                        </div>

                        {/* Availability bar */}
                        <div style={{ marginBottom: 14 }}>
                          <AvailabilityBar available={event.available_spots} total={event.total_spots} />
                        </div>

                        {/* Description */}
                        {event.description && (
                          <p style={{ fontSize: 12, color: '#64748B', lineHeight: 1.6, marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {event.description}
                          </p>
                        )}

                        {/* Footer */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid #F8FAFC' }}>
                          <div>
                            <p style={{ fontSize: 10, color: '#94A3B8', marginBottom: 1, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Prix de départ</p>
                            <p style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
                              {event.price_per_spot === 0 ? 'Gratuit' : `Dès ${event.price_per_spot}€`}
                            </p>
                          </div>

                          {hasApplied ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, padding: '7px 11px', fontSize: 11, color: '#16A34A', fontWeight: 600 }}>
                              <CheckCircle size={12} /> Envoyée
                            </div>
                          ) : event.available_spots === 0 ? (
                            <span style={{ fontSize: 11, color: '#94A3B8', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '7px 11px', fontWeight: 500 }}>
                              Complet
                            </span>
                          ) : (
                            <button
                              onClick={() => router.push(`/dashboard/candidature?eventId=${event.id}&eventName=${encodeURIComponent(event.title)}&eventDate=${encodeURIComponent(formatDate(event.start_date))}&eventLocation=${encodeURIComponent(event.location_name || '')}`)}
                              style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#4F46E5', color: 'white', border: 'none', borderRadius: 9, padding: '8px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                              onMouseEnter={e => { e.currentTarget.style.background = '#4338CA'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(79,70,229,0.4)' }}
                              onMouseLeave={e => { e.currentTarget.style.background = '#4F46E5'; e.currentTarget.style.boxShadow = 'none' }}
                            >
                              Postuler <ArrowUpRight size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </AnimatedCard>
                )
              })}
            </div>
          )}
        </main>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
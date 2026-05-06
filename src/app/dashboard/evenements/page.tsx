'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { motion, useInView } from 'framer-motion'
import type { Variants } from 'framer-motion'
import Sidebar from '@/components/Sidebar'
import {
  Search, MapPin, Calendar, CheckCircle,
  Bell, SlidersHorizontal, Utensils, Brush,
  ShoppingBag, Leaf, Moon, Euro, ArrowUpRight,
  Shield, Navigation, Clock, CreditCard, Trophy
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
  const [userApplications, setUserApplications] = useState<{ event_id: string, status: string }[]>([])
  const [profile, setProfile] = useState<any>(null)
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
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(profileData)
      const { data: eventsData } = await supabase.from('events').select('*').eq('status', 'published').order('start_date', { ascending: true })
      setEvents(eventsData || [])
      setFilteredEvents(eventsData || [])

      // Charger toutes les candidatures avec leur statut
      const { data: apps } = await supabase
        .from('applications')
        .select('event_id, status')
        .eq('exposant_id', user.id)
      setUserApplications(apps || [])
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

  const getAppStatus = (eventId: string) => {
    const app = userApplications.find(a => a.event_id === eventId)
    return app?.status || null
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  const formatShort = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#EEF2F7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 28, height: 28, border: '2px solid #4F46E5', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#EEF2F7', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <Sidebar profile={profile} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div className="dash-wrap" style={{ marginLeft: 220, flex: 1 }}>

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

        {/* FILTERS */}
        <div style={{ background: 'white', borderBottom: '1px solid #E2E8F0', padding: '10px 28px', position: 'sticky', top: 52, zIndex: 9 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', width: 260 }}>
              <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Ville, marché..."
                style={{ width: '100%', padding: '7px 12px 7px 30px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 12, color: '#0F172A', background: '#F8FAFC', outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => { e.target.style.borderColor = '#4F46E5'; e.target.style.background = 'white' }}
                onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.background = '#F8FAFC' }} />
            </div>
            <div style={{ width: 1, height: 20, background: '#E2E8F0' }} />
            {TYPE_FILTERS.map(type => (
              <button key={type.label} onClick={() => setActiveType(type.label)}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 11px', borderRadius: 8, border: activeType === type.label ? '1.5px solid #4F46E5' : '1px solid #E2E8F0', background: activeType === type.label ? '#EEF2FF' : 'white', color: activeType === type.label ? '#4F46E5' : '#64748B', fontSize: 11, fontWeight: activeType === type.label ? 600 : 400, cursor: 'pointer', transition: 'all 0.15s' }}>
                {type.icon}{type.label}
              </button>
            ))}
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
              <input type="range" min={10} max={200} step={5} value={maxPrice} onChange={e => setMaxPrice(+e.target.value)} style={{ width: 160, accentColor: '#4F46E5' }} />
            </motion.div>
          )}
        </div>

        <main className="dash-main" style={{ padding: "24px 28px" }}>
          {filteredEvents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <p style={{ fontSize: 15, fontWeight: 500, color: '#64748B' }}>Aucun événement disponible</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
              {filteredEvents.map((event, i) => {
                const appStatus = getAppStatus(event.id)
                const isPaid = appStatus === 'paid' || appStatus === 'present'
                const isPending = appStatus === 'pending' || appStatus === 'validated'
                const isNew = i < 2

                return (
                  <AnimatedCard key={event.id} delay={i * 0.04}>
                    <div style={{ background: 'white', borderRadius: 14, border: `1px solid ${isPaid ? '#BBF7D0' : '#E2E8F0'}`, overflow: 'hidden', transition: 'all 0.25s ease', cursor: 'pointer', position: 'relative' }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(79,70,229,0.14)' }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}>

                      {/* IMAGE */}
                      <div style={{ position: 'relative' }}>
                        <EventCoverImage title={event.title} location={event.location_name} exclusive={event.is_exclusive} isNew={isNew} imageUrl={event.image_url} />

                        {/* OVERLAY PLACE CONFIRMÉE */}
                        {isPaid && (
                          <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.75)', backdropFilter: 'blur(2px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                            <div style={{ width: 48, height: 48, background: 'rgba(34,197,94,0.2)', borderRadius: '50%', border: '2px solid #22C55E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Trophy size={22} style={{ color: '#22C55E' }} />
                            </div>
                            <p style={{ fontSize: 13, fontWeight: 800, color: 'white', textAlign: 'center' }}>Place confirmée ! 🎉</p>
                            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', textAlign: 'center', padding: '0 16px' }}>
                              Rendez-vous le {formatShort(event.start_date)}
                            </p>
                          </div>
                        )}
                      </div>

                      <div style={{ padding: '14px 16px' }}>
                        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginBottom: 5, lineHeight: 1.3 }}>{event.title}</h3>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#64748B', marginBottom: 10 }}>
                          <MapPin size={11} style={{ color: '#4F46E5', flexShrink: 0 }} />
                          <span>{event.location_name}</span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#94A3B8', marginBottom: 12 }}>
                          <Calendar size={10} />
                          {formatDate(event.start_date)}
                        </div>

                        {!isPaid && (
                          <div style={{ marginBottom: 14 }}>
                            <AvailabilityBar available={event.available_spots} total={event.total_spots} />
                          </div>
                        )}

                        {/* MESSAGE PLACE CONFIRMÉE */}
                        {isPaid && (
                          <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: '10px 12px', marginBottom: 12 }}>
                            <p style={{ fontSize: 12, fontWeight: 700, color: '#15803D', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 5 }}>
                              <CheckCircle size={12} /> Votre place est réservée
                            </p>
                            <p style={{ fontSize: 11, color: '#16A34A' }}>
                              Rendez-vous le <strong>{formatShort(event.start_date)}</strong> à {event.location_name?.split(',')[0]}
                            </p>
                          </div>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid #F8FAFC' }}>
                          <div>
                            <p style={{ fontSize: 10, color: '#94A3B8', marginBottom: 1, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Prix</p>
                            <p style={{ fontSize: 18, fontWeight: 800, color: '#0F172A' }}>
                              {event.price_per_spot === 0 ? 'Gratuit' : `${event.price_per_spot}€`}
                            </p>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {event.latitude && event.longitude && (
                              <a href={`https://www.google.com/maps/dir/?api=1&destination=${event.latitude},${event.longitude}`}
                                target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                                style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#64748B', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '7px 10px', textDecoration: 'none', fontWeight: 500 }}
                                onMouseEnter={e => e.currentTarget.style.borderColor = '#4F46E5'}
                                onMouseLeave={e => e.currentTarget.style.borderColor = '#E2E8F0'}>
                                <Navigation size={11} /> Itinéraire
                              </a>
                            )}

                            {/* BOUTON SELON STATUT */}
                            {isPaid ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, padding: '7px 11px', fontSize: 11, color: '#16A34A', fontWeight: 700 }}>
                                <CheckCircle size={12} /> Inscrit ✓
                              </div>
                            ) : isPending ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 8, padding: '7px 11px', fontSize: 11, color: '#4F46E5', fontWeight: 600 }}>
                                <Clock size={12} /> En cours
                              </div>
                            ) : event.available_spots === 0 ? (
                              <span style={{ fontSize: 11, color: '#94A3B8', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '7px 11px', fontWeight: 500 }}>
                                Complet
                              </span>
                            ) : (
                              <button onClick={() => router.push(`/dashboard/candidature?eventId=${event.id}&eventName=${encodeURIComponent(event.title)}&eventDate=${encodeURIComponent(formatDate(event.start_date))}&eventLocation=${encodeURIComponent(event.location_name || '')}`)}
                                style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#4F46E5', color: 'white', border: 'none', borderRadius: 9, padding: '8px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                                onMouseEnter={e => { e.currentTarget.style.background = '#4338CA'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(79,70,229,0.4)' }}
                                onMouseLeave={e => { e.currentTarget.style.background = '#4F46E5'; e.currentTarget.style.boxShadow = 'none' }}>
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
      </div>
    </div>
  )
}
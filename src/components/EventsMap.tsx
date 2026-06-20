'use client'

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect } from 'react'
import { MapPin, Heart, Calendar, ArrowUpRight, Lock, CheckCircle, Clock, Navigation } from 'lucide-react'
import { renderToStaticMarkup } from 'react-dom/server'

const BRAND = '#4F46E5'

// ✅ Fix icons Leaflet (sinon les markers ne s'affichent pas)
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/[email protected]/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/[email protected]/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/[email protected]/dist/images/marker-shadow.png',
})

// ✅ Markers custom selon statut
const createCustomIcon = (color: string, isFavorite: boolean, isPaid: boolean) => {
  const svg = `
    <svg width="40" height="50" viewBox="0 0 40 50" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 0C8.95 0 0 8.95 0 20c0 15 20 30 20 30s20-15 20-30C40 8.95 31.05 0 20 0z" fill="${color}"/>
      <circle cx="20" cy="20" r="10" fill="white"/>
      ${isPaid ? `<circle cx="20" cy="20" r="6" fill="${color}"/>` : ''}
      ${isFavorite ? `<circle cx="30" cy="8" r="6" fill="#EC4899" stroke="white" stroke-width="2"/>` : ''}
    </svg>
  `
  return L.divIcon({
    html: svg,
    className: 'custom-marker',
    iconSize: [40, 50],
    iconAnchor: [20, 50],
    popupAnchor: [0, -50],
  })
}

function FitBoundsToEvents({ events, userLocation }: { events: any[]; userLocation: any }) {
  const map = useMap()
  
  useEffect(() => {
    if (events.length === 0 && !userLocation) return
    
    const bounds = L.latLngBounds([])
    events.forEach(e => {
      if (e.latitude && e.longitude) {
        bounds.extend([e.latitude, e.longitude])
      }
    })
    if (userLocation) {
      bounds.extend([userLocation.lat, userLocation.lng])
    }
    
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 })
    }
  }, [events, userLocation, map])
  
  return null
}

interface EventsMapProps {
  events: any[]
  userLocation: { lat: number; lng: number } | null
  userApplications: { event_id: string; status: string }[]
  favorites: string[]
  isBlocked: boolean
  onPostuler: (event: any) => void
  onToggleFavorite: (eventId: string) => void
}

export default function EventsMap({ events, userLocation, userApplications, favorites, isBlocked, onPostuler, onToggleFavorite }: EventsMapProps) {
  const validEvents = events.filter(e => e.latitude && e.longitude)
  
  const getAppStatus = (eventId: string) => {
    const app = userApplications.find(a => a.event_id === eventId)
    return app?.status || null
  }
  
  const formatDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  
  const center = userLocation || { lat: 43.2925, lng: 5.5705 }
  
  return (
    <div style={{ height: '100%', width: '100%', position: 'relative' }}>
      <style>{`
        .leaflet-container { font-family: 'Inter', system-ui, sans-serif; }
        .custom-popup .leaflet-popup-content-wrapper { 
          border-radius: 12px; 
          padding: 0; 
          box-shadow: 0 12px 32px rgba(0,0,0,0.16);
          overflow: hidden;
        }
        .custom-popup .leaflet-popup-content { 
          margin: 0; 
          width: 260px !important;
        }
        .custom-popup .leaflet-popup-tip { background: white; }
        .custom-marker { background: transparent; border: none; }
      `}</style>
      
      <MapContainer 
        center={[center.lat, center.lng]} 
        zoom={11} 
        style={{ height: '100%', width: '100%', minHeight: 500 }}
        scrollWheelZoom={true}>
        
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        
        <FitBoundsToEvents events={validEvents} userLocation={userLocation} />
        
        {/* ✅ Marker user */}
        {userLocation && (
          <Marker 
            position={[userLocation.lat, userLocation.lng]}
            icon={L.divIcon({
              html: `<div style="width:16px;height:16px;background:#4F46E5;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(79,70,229,0.5);"></div>`,
              className: 'custom-marker',
              iconSize: [16, 16],
              iconAnchor: [8, 8],
            })}>
            <Popup>
              <div style={{ padding: 8, fontSize: 12, fontWeight: 600 }}>📍 Vous êtes ici</div>
            </Popup>
          </Marker>
        )}
        
        {/* ✅ Markers events */}
        {validEvents.map((event) => {
          const appStatus = getAppStatus(event.id)
          const isPaid = appStatus === 'paid' || appStatus === 'present'
          const isPending = appStatus === 'pending' || appStatus === 'validated'
          const isFavorite = favorites.includes(event.id)
          const cardBlocked = isBlocked && !appStatus
          
          const markerColor = isPaid ? '#16A34A' : isPending ? '#F59E0B' : event.is_exclusive ? '#FBBF24' : BRAND
          
          return (
            <Marker
              key={event.id}
              position={[event.latitude, event.longitude]}
              icon={createCustomIcon(markerColor, isFavorite, isPaid)}>
              <Popup className="custom-popup">
                <div>
                  {/* Image */}
                  <div style={{ position: 'relative', height: 100, background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', overflow: 'hidden' }}>
                    {event.image_url ? (
                      <img src={event.image_url} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : null}
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.3), transparent)' }} />
                    <button onClick={() => onToggleFavorite(event.id)}
                      style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(255,255,255,0.95)', border: 'none', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <Heart size={13} style={{ color: isFavorite ? '#EC4899' : '#94A3B8' }} fill={isFavorite ? '#EC4899' : 'none'} />
                    </button>
                    {event.is_exclusive && (
                      <span style={{ position: 'absolute', top: 8, left: 8, background: '#FBBF24', color: '#92400E', fontSize: 8, fontWeight: 800, padding: '2px 6px', borderRadius: 100 }}>EXCLUSIF PRO</span>
                    )}
                  </div>
                  
                  {/* Contenu */}
                  <div style={{ padding: 12 }}>
                    <h3 style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 4, lineHeight: 1.3 }}>{event.title}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#64748B', marginBottom: 3 }}>
                      <MapPin size={10} style={{ color: BRAND, flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{event.location_name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#94A3B8', marginBottom: 8 }}>
                      <Calendar size={9} />{formatDate(event.start_date)}
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: '1px solid #F1F5F9' }}>
                      <p style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>
                        {event.price_per_spot === 0 ? 'Gratuit' : `${event.price_per_spot}€`}
                      </p>
                      {isPaid ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 7, padding: '5px 9px', fontSize: 10, color: '#16A34A', fontWeight: 700 }}>
                          <CheckCircle size={11} /> Inscrit
                        </div>
                      ) : isPending ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 7, padding: '5px 9px', fontSize: 10, color: BRAND, fontWeight: 600 }}>
                          <Clock size={11} /> En cours
                        </div>
                      ) : cardBlocked ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 7, padding: '5px 9px', fontSize: 10, color: '#94A3B8', fontWeight: 600 }}>
                          <Lock size={10} /> Pro requis
                        </div>
                      ) : event.available_spots === 0 ? (
                        <span style={{ fontSize: 10, color: '#94A3B8', background: '#F8FAFC', borderRadius: 7, padding: '5px 9px', fontWeight: 500 }}>Complet</span>
                      ) : (
                        <button onClick={() => onPostuler(event)}
                          style={{ display: 'flex', alignItems: 'center', gap: 4, background: BRAND, color: 'white', border: 'none', borderRadius: 7, padding: '6px 11px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                          Postuler <ArrowUpRight size={11} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
      
      {/* ✅ Légende */}
      <div style={{ position: 'absolute', bottom: 16, right: 16, background: 'white', border: '1px solid #E2E8F0', borderRadius: 10, padding: '10px 12px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', zIndex: 1000 }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Légende</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {[
            { color: BRAND, label: 'Disponible' },
            { color: '#F59E0B', label: 'En cours' },
            { color: '#16A34A', label: 'Inscrit' },
            { color: '#FBBF24', label: 'Exclusif Pro' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: item.color }} />
              <span style={{ fontSize: 11, color: '#475569' }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
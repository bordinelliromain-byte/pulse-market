'use client'

import { useEffect, useState } from 'react'
import { MapPin } from 'lucide-react'

interface Address {
  label: string
  city: string
  postcode: string
  lat: number
  lng: number
}

interface AddressMapProps {
  value: string
  onChange: (address: Address) => void
}

export default function AddressMap({ value, onChange }: AddressMapProps) {
  const [query, setQuery] = useState(value || '')
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [selected, setSelected] = useState<Address | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (query.length < 3) { setSuggestions([]); return }
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=5`)
        const data = await res.json()
        setSuggestions(data.features || [])
        setShowSuggestions(true)
      } catch { setSuggestions([]) }
      setLoading(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  const handleSelect = (feature: any) => {
    const [lng, lat] = feature.geometry.coordinates
    const props = feature.properties
    const address: Address = {
      label: props.label,
      city: props.city || '',
      postcode: props.postcode || '',
      lat,
      lng,
    }
    setSelected(address)
    setQuery(props.label)
    setShowSuggestions(false)
    onChange(address)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

      {/* Input autocomplete */}
      <div style={{ position: 'relative' }}>
        <MapPin size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', zIndex: 1 }} />
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setShowSuggestions(true) }}
          placeholder="Ex: Place de la Mairie, Aubagne"
          style={{ width: '100%', padding: '9px 12px 9px 30px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, color: '#0F172A', background: '#FAFAFA', outline: 'none', boxSizing: 'border-box' }}
          onFocus={e => { e.target.style.borderColor = '#4F46E5'; e.target.style.background = 'white' }}
          onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.background = '#FAFAFA'; setTimeout(() => setShowSuggestions(false), 200) }}
        />
        {loading && (
          <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, border: '2px solid #4F46E5', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        )}

        {/* Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #E2E8F0', borderRadius: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.1)', zIndex: 100, overflow: 'hidden', marginTop: 4 }}>
            {suggestions.map((s, i) => (
              <div key={i} onMouseDown={() => handleSelect(s)}
                style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: i < suggestions.length - 1 ? '1px solid #F8FAFC' : 'none' }}
                onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                <p style={{ fontSize: 13, color: '#0F172A', fontWeight: 500 }}>{s.properties.label}</p>
                <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{s.properties.city} {s.properties.postcode}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Badges infos */}
      {selected && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 11, background: '#EEF2FF', color: '#4F46E5', padding: '3px 9px', borderRadius: 100, fontWeight: 500 }}>
            {selected.city}
          </span>
          <span style={{ fontSize: 11, background: '#F1F5F9', color: '#64748B', padding: '3px 9px', borderRadius: 100 }}>
            {selected.postcode}
          </span>
          <span style={{ fontSize: 11, background: '#F1F5F9', color: '#64748B', padding: '3px 9px', borderRadius: 100 }}>
            GPS : {selected.lat.toFixed(5)}, {selected.lng.toFixed(5)}
          </span>
          <a
            href={`https://www.google.com/maps?q=${selected.lat},${selected.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 11, background: '#F0FDF4', color: '#16A34A', padding: '3px 9px', borderRadius: 100, textDecoration: 'none', fontWeight: 500 }}>
            Voir sur Maps →
          </a>
        </div>
      )}

      {/* Mini carte OpenStreetMap */}
      {selected && (
        <iframe
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${selected.lng - 0.005},${selected.lat - 0.003},${selected.lng + 0.005},${selected.lat + 0.003}&layer=mapnik&marker=${selected.lat},${selected.lng}`}
          style={{ width: '100%', height: 200, border: '1px solid #E2E8F0', borderRadius: 10 }}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
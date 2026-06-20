'use client'

import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import {
  Layers, X, Eye, EyeOff, Move, Zap, Square
} from 'lucide-react'

const BRAND = '#4F46E5'

// Types
export type SpotType = 'emplacement' | 'allee' | 'bloque' | 'arbre' | 'voiture'

export interface Spot {
  id: string
  label: string
  lat: number
  lng: number
  width_m: number
  length_m: number
  rotation: number
  type: SpotType
  application_id: string | null
  application?: any
}

export interface Exposant {
  id: string
  profiles: { full_name: string; email: string; phone?: string }
  exposant_data?: {
    siren?: string
    business_name?: string
    stand_width?: number
    stand_length?: number
    category?: string
  }
  spot_id?: string | null
}

// Couleurs par catégorie
export const CATEGORY_COLORS: Record<string, { bg: string; border: string; label: string }> = {
  alimentaire:  { bg: '#EA580C', border: '#C2410C', label: 'Alimentaire' },
  artisanat:    { bg: '#7C3AED', border: '#6D28D9', label: 'Artisanat' },
  bio:          { bg: '#16A34A', border: '#15803D', label: 'Bio' },
  brocante:     { bg: '#92400E', border: '#78350F', label: 'Brocante' },
  animation:    { bg: '#EC4899', border: '#DB2777', label: 'Animation' },
  nocturne:     { bg: '#4F46E5', border: '#4338CA', label: 'Nocturne' },
  default:      { bg: '#64748B', border: '#475569', label: 'Autre' },
}

export const getCategoryColor = (category?: string) => {
  if (!category) return CATEGORY_COLORS.default
  const key = category.toLowerCase()
  return CATEGORY_COLORS[key] || CATEGORY_COLORS.default
}

// Templates
export const TEMPLATES = [
  {
    id: 'place_village', name: 'Place de village', desc: '6×5 cases · 3m × 3m', icon: '🏛',
    generate: (centerLat: number, centerLng: number): Omit<Spot, 'id'>[] => {
      const spots: Omit<Spot, 'id'>[] = []
      const offset = 0.000027
      for (let r = 0; r < 5; r++) for (let c = 0; c < 6; c++) {
        spots.push({
          label: `${String.fromCharCode(65 + r)}${c + 1}`,
          lat: centerLat + (r - 2) * offset,
          lng: centerLng + (c - 2.5) * offset,
          width_m: 3, length_m: 3, rotation: 0,
          type: 'emplacement', application_id: null,
        })
      }
      return spots
    }
  },
  {
    id: 'parking', name: 'Parking', desc: '4×5 cases · 3m × 3m', icon: '🅿',
    generate: (centerLat: number, centerLng: number): Omit<Spot, 'id'>[] => {
      const spots: Omit<Spot, 'id'>[] = []
      const offset = 0.000027
      for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) {
        spots.push({
          label: `P${r * 5 + c + 1}`,
          lat: centerLat + (r - 1.5) * offset,
          lng: centerLng + (c - 2) * offset,
          width_m: 3, length_m: 3, rotation: 0,
          type: 'emplacement', application_id: null,
        })
      }
      return spots
    }
  },
  {
    id: 'rue_pietonne', name: 'Rue piétonne', desc: '2×10 cases linéaires', icon: '🚶',
    generate: (centerLat: number, centerLng: number): Omit<Spot, 'id'>[] => {
      const spots: Omit<Spot, 'id'>[] = []
      const offset = 0.000027
      for (let r = 0; r < 2; r++) for (let c = 0; c < 10; c++) {
        spots.push({
          label: `${r === 0 ? 'N' : 'S'}${c + 1}`,
          lat: centerLat + (r === 0 ? -0.5 : 0.5) * offset,
          lng: centerLng + (c - 4.5) * offset,
          width_m: 3, length_m: 3, rotation: 0,
          type: 'emplacement', application_id: null,
        })
      }
      return spots
    }
  },
  {
    id: 'halle', name: 'Halle couverte', desc: '3×6 cases · 4m × 3m', icon: '🏟',
    generate: (centerLat: number, centerLng: number): Omit<Spot, 'id'>[] => {
      const spots: Omit<Spot, 'id'>[] = []
      const offset = 0.000036
      const offsetL = 0.000027
      for (let r = 0; r < 3; r++) for (let c = 0; c < 6; c++) {
        spots.push({
          label: `H${String.fromCharCode(65 + r)}${c + 1}`,
          lat: centerLat + (r - 1) * offsetL,
          lng: centerLng + (c - 2.5) * offset,
          width_m: 4, length_m: 3, rotation: 0,
          type: 'emplacement', application_id: null,
        })
      }
      return spots
    }
  },
  {
    id: 'parc', name: 'Parc circulaire', desc: '24 cases en cercle', icon: '🌳',
    generate: (centerLat: number, centerLng: number): Omit<Spot, 'id'>[] => {
      const spots: Omit<Spot, 'id'>[] = []
      const radius = 0.00009
      const count = 24
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2
        spots.push({
          label: `C${i + 1}`,
          lat: centerLat + Math.cos(angle) * radius,
          lng: centerLng + Math.sin(angle) * radius,
          width_m: 3, length_m: 3, rotation: (angle * 180) / Math.PI,
          type: 'emplacement', application_id: null,
        })
      }
      return spots
    }
  },
]

// Outils
export const TOOLS = [
  { id: 'select', label: 'Sélectionner', icon: <Move size={14} /> },
  { id: 'emplacement', label: 'Emplacement', icon: <Square size={14} />, color: BRAND },
  { id: 'bloque', label: 'Zone bloquée', icon: <X size={14} />, color: '#DC2626' },
  { id: 'arbre', label: 'Arbre', icon: <span style={{ fontSize: 13 }}>🌳</span> },
  { id: 'voiture', label: 'Véhicule', icon: <span style={{ fontSize: 13 }}>🚗</span> },
]

export interface TerrainEditorHandle {
  exportPNG: () => Promise<string | null>
  exportPDF: () => Promise<void>
  fitBounds: () => void
}

interface TerrainEditorProps {
  spots: Spot[]
  setSpots: (spots: Spot[] | ((prev: Spot[]) => Spot[])) => void
  exposants: Exposant[]
  centerLat: number
  centerLng: number
  eventTitle: string
  onAssign: (spotId: string, exposantId: string) => void
  onUnassign: (spotId: string) => void
  readOnly?: boolean
}

// ✅ FIX : Import dynamique sans forwardRef pour éviter les bugs TS
const MapClient = dynamic(() => import('./TerrainMapClient'), {
  ssr: false,
  loading: () => (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC' }}>
      <div style={{ width: 28, height: 28, border: `2px solid ${BRAND}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )
})

const TerrainEditor = forwardRef<TerrainEditorHandle, TerrainEditorProps>(({
  spots, setSpots, exposants, centerLat, centerLng, eventTitle,
  onAssign, onUnassign, readOnly = false
}, ref) => {
  const [activeTool, setActiveTool] = useState<string>('select')
  const [selectedSpot, setSelectedSpot] = useState<string | null>(null)
  const [showLegend, setShowLegend] = useState(true)
  const [mapType, setMapType] = useState<'satellite' | 'osm'>('satellite')

  useImperativeHandle(ref, () => ({
    exportPNG: async () => {
      const html2canvas = (await import('html2canvas')).default
      const mapEl = document.getElementById('terrain-map-container')
      if (!mapEl) return null
      const canvas = await html2canvas(mapEl, {
        useCORS: true,
        allowTaint: true,
        scale: 2,
        backgroundColor: '#ffffff',
      })
      return canvas.toDataURL('image/png')
    },
    exportPDF: async () => {
      const { exportToPDF } = await import('@/lib/terrainExports')
      const mapEl = document.getElementById('terrain-map-container')
      if (!mapEl) return
      await exportToPDF({
        eventTitle,
        spots,
        exposants,
        mapElement: mapEl,
      })
    },
    fitBounds: () => {}
  }))

  const handleAddSpot = (lat: number, lng: number) => {
    if (readOnly || activeTool === 'select') return
    const newSpot: Spot = {
      id: `spot-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      label: activeTool === 'emplacement'
        ? `${String.fromCharCode(65 + Math.floor(spots.filter(s => s.type === 'emplacement').length / 10))}${(spots.filter(s => s.type === 'emplacement').length % 10) + 1}`
        : '',
      lat, lng,
      width_m: activeTool === 'voiture' ? 5 : 3,
      length_m: activeTool === 'voiture' ? 2 : 3,
      rotation: 0,
      type: activeTool as SpotType,
      application_id: null,
    }
    setSpots(prev => [...prev, newSpot])
  }

  const handleMoveSpot = (id: string, lat: number, lng: number) => {
    setSpots(prev => prev.map(s => s.id === id ? { ...s, lat, lng } : s))
  }

  return (
    <div style={{ display: 'flex', height: '100%', position: 'relative', background: '#F8FAFC' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div id="terrain-map-container" style={{ flex: 1, position: 'relative' }}>
        {/* @ts-ignore - dynamic import perd les types du forwardRef */}
        <MapClient
          spots={spots}
          centerLat={centerLat}
          centerLng={centerLng}
          mapType={mapType}
          activeTool={activeTool}
          selectedSpot={selectedSpot}
          onAddSpot={handleAddSpot}
          onSelectSpot={setSelectedSpot}
          onMoveSpot={handleMoveSpot}
          onUnassign={onUnassign}
          onAssign={onAssign}
          exposants={exposants}
          readOnly={readOnly}
        />

        {/* Floating controls top-right */}
        <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 1000, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <button onClick={() => setMapType(mapType === 'satellite' ? 'osm' : 'satellite')}
            style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 8, padding: '7px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#0F172A', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <Layers size={12} /> {mapType === 'satellite' ? 'Satellite' : 'Plan'}
          </button>
          <button onClick={() => setShowLegend(!showLegend)}
            style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 8, padding: '7px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#0F172A', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            {showLegend ? <EyeOff size={12} /> : <Eye size={12} />} Légende
          </button>
        </div>

        {/* Légende */}
        {showLegend && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            style={{ position: 'absolute', bottom: 12, right: 12, zIndex: 1000, background: 'white', borderRadius: 10, padding: '10px 12px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', maxWidth: 200 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Catégories</p>
            {Object.entries(CATEGORY_COLORS).filter(([k]) => k !== 'default').map(([key, c]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <div style={{ width: 12, height: 12, background: c.bg, borderRadius: 3, border: `1px solid ${c.border}` }} />
                <span style={{ fontSize: 11, color: '#475569' }}>{c.label}</span>
              </div>
            ))}
          </motion.div>
        )}

        {/* Indicateur outil */}
        {!readOnly && activeTool !== 'select' && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            style={{ position: 'absolute', top: 12, left: 12, zIndex: 1000, background: BRAND, color: 'white', borderRadius: 8, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 16px rgba(79,70,229,0.3)' }}>
            <Zap size={12} />
            <span style={{ fontSize: 12, fontWeight: 600 }}>Cliquez sur la carte pour placer {TOOLS.find(t => t.id === activeTool)?.label}</span>
            <button onClick={() => setActiveTool('select')} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 6, padding: 4, cursor: 'pointer', color: 'white' }}>
              <X size={10} />
            </button>
          </motion.div>
        )}
      </div>
    </div>
  )
})

TerrainEditor.displayName = 'TerrainEditor'

export default TerrainEditor
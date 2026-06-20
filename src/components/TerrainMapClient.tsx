'use client'

import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, useMapEvents, useMap, Polygon, Tooltip } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Spot, Exposant } from './TerrainEditor'
import { getCategoryColor } from './TerrainEditor'

const BRAND = '#4F46E5'

const metersToLat = (m: number) => m / 111320
const metersToLng = (m: number, lat: number) => m / (111320 * Math.cos((lat * Math.PI) / 180))

const getSpotPolygon = (spot: Spot): [number, number][] => {
  const halfW = metersToLng(spot.width_m / 2, spot.lat)
  const halfL = metersToLat(spot.length_m / 2)
  const corners: [number, number][] = [
    [spot.lat - halfL, spot.lng - halfW],
    [spot.lat - halfL, spot.lng + halfW],
    [spot.lat + halfL, spot.lng + halfW],
    [spot.lat + halfL, spot.lng - halfW],
  ]
  if (spot.rotation) {
    const rad = (spot.rotation * Math.PI) / 180
    return corners.map(([lat, lng]) => {
      const dlat = lat - spot.lat
      const dlng = lng - spot.lng
      const newLat = spot.lat + dlat * Math.cos(rad) - dlng * Math.sin(rad)
      const newLng = spot.lng + dlat * Math.sin(rad) + dlng * Math.cos(rad)
      return [newLat, newLng] as [number, number]
    })
  }
  return corners
}

const getSpotColor = (spot: Spot): { fill: string; stroke: string; fillOpacity: number } => {
  if (spot.type === 'bloque') return { fill: '#DC2626', stroke: '#991B1B', fillOpacity: 0.4 }
  if (spot.type === 'arbre') return { fill: '#16A34A', stroke: '#15803D', fillOpacity: 0.6 }
  if (spot.type === 'voiture') return { fill: '#64748B', stroke: '#475569', fillOpacity: 0.5 }
  if (spot.type === 'allee') return { fill: '#CBD5E1', stroke: '#94A3B8', fillOpacity: 0.3 }
  if (spot.application_id && spot.application) {
    const c = getCategoryColor(spot.application.exposant_data?.category)
    return { fill: c.bg, stroke: c.border, fillOpacity: 0.75 }
  }
  return { fill: '#FFFFFF', stroke: BRAND, fillOpacity: 0.4 }
}

function MapClickHandler({ activeTool, onAddSpot, readOnly }: { activeTool: string; onAddSpot: (lat: number, lng: number) => void; readOnly: boolean }) {
  useMapEvents({
    click: (e) => {
      if (readOnly) return
      if (activeTool !== 'select') {
        onAddSpot(e.latlng.lat, e.latlng.lng)
      }
    },
  })
  return null
}

function MapController({ centerLat, centerLng, mapRef }: { centerLat: number; centerLng: number; mapRef: any }) {
  const map = useMap()
  useEffect(() => {
    mapRef.current = map
    map.setView([centerLat, centerLng], 19)
  }, [centerLat, centerLng, map, mapRef])
  return null
}

interface TerrainMapClientProps {
  spots: Spot[]
  centerLat: number
  centerLng: number
  mapType: 'satellite' | 'osm'
  activeTool: string
  selectedSpot: string | null
  onAddSpot: (lat: number, lng: number) => void
  onSelectSpot: (id: string | null) => void
  onMoveSpot: (id: string, lat: number, lng: number) => void
  onUnassign: (spotId: string) => void
  onAssign: (spotId: string, exposantId: string) => void
  exposants: Exposant[]
  readOnly?: boolean
}

export default function TerrainMapClient({
  spots, centerLat, centerLng, mapType, activeTool, selectedSpot,
  onAddSpot, onSelectSpot, onMoveSpot, onUnassign, onAssign, exposants, readOnly = false
}: TerrainMapClientProps) {
  const mapRef = useRef<any>(null)

  useEffect(() => {
    const container = document.getElementById('terrain-map-container')
    if (!container || readOnly) return

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault()
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
    }

    const handleDrop = (e: DragEvent) => {
      e.preventDefault()
      const exposantId = e.dataTransfer?.getData('exposant-id')
      if (!exposantId || !mapRef.current) return

      const rect = container.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const latlng = mapRef.current.containerPointToLatLng([x, y])

      // ✅ FIX TS : typage explicite
      let closestSpot: Spot | null = null
      let minDist = Infinity
      spots.forEach((s: Spot) => {
        if (s.type !== 'emplacement' || s.application_id) return
        const d = Math.sqrt(Math.pow(s.lat - latlng.lat, 2) + Math.pow(s.lng - latlng.lng, 2))
        if (d < minDist && d < 0.0001) {
          minDist = d
          closestSpot = s
        }
      })

      if (closestSpot !== null) {
        // ✅ FIX : assertion type pour TS
        const spot = closestSpot as Spot
        onAssign(spot.id, exposantId)
      }
    }

    container.addEventListener('dragover', handleDragOver)
    container.addEventListener('drop', handleDrop)
    return () => {
      container.removeEventListener('dragover', handleDragOver)
      container.removeEventListener('drop', handleDrop)
    }
  }, [spots, onAssign, readOnly])

  return (
    <MapContainer
      center={[centerLat, centerLng]}
      zoom={19}
      maxZoom={22}
      style={{ height: '100%', width: '100%', cursor: activeTool !== 'select' ? 'crosshair' : 'grab' }}
      attributionControl={false}
    >
      <MapController centerLat={centerLat} centerLng={centerLng} mapRef={mapRef} />
      <MapClickHandler activeTool={activeTool} onAddSpot={onAddSpot} readOnly={readOnly} />

      {mapType === 'satellite' ? (
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          maxZoom={22}
          maxNativeZoom={19}
          attribution='Esri'
        />
      ) : (
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{y}/{x}.png"
          maxZoom={22}
          maxNativeZoom={19}
          attribution='© OpenStreetMap'
        />
      )}

      {spots.map(spot => {
        const polygon = getSpotPolygon(spot)
        const colors = getSpotColor(spot)
        const isSelected = selectedSpot === spot.id
        const isAssigned = !!spot.application_id

        return (
          <Polygon
            key={spot.id}
            positions={polygon}
            pathOptions={{
              fillColor: colors.fill,
              color: isSelected ? '#0F172A' : colors.stroke,
              fillOpacity: colors.fillOpacity,
              weight: isSelected ? 3 : 2,
              dashArray: spot.type === 'bloque' ? '4 4' : undefined,
            }}
            eventHandlers={{
              click: () => {
                if (readOnly) return
                if (isAssigned) {
                  if (window.confirm(`Retirer ${spot.application?.exposant_data?.business_name || spot.application?.profiles?.full_name} de ${spot.label} ?`)) {
                    onUnassign(spot.id)
                  }
                } else {
                  onSelectSpot(spot.id)
                }
              },
            }}
          >
            {spot.label && (
              <Tooltip permanent direction="center" className="terrain-tooltip">
                <div style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: isAssigned ? 'white' : '#0F172A',
                  textShadow: isAssigned ? '0 1px 2px rgba(0,0,0,0.5)' : 'none',
                  textAlign: 'center',
                  lineHeight: 1.2,
                  padding: '2px 4px',
                }}>
                  {isAssigned ? (
                    <>
                      <div style={{ fontSize: 9, opacity: 0.9 }}>{spot.label}</div>
                      <div style={{ fontSize: 10 }}>
                        {(spot.application?.exposant_data?.business_name || spot.application?.profiles?.full_name || '').substring(0, 14)}
                      </div>
                    </>
                  ) : (
                    spot.label
                  )}
                </div>
              </Tooltip>
            )}
          </Polygon>
        )
      })}

      <style>{`
        .terrain-tooltip {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .terrain-tooltip::before {
          display: none !important;
        }
        .leaflet-container {
          font-family: 'Inter', system-ui, sans-serif;
        }
      `}</style>
    </MapContainer>
  )
}
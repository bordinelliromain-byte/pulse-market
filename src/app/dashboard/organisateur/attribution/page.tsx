'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from '@/components/Sidebar'
import {
  DndContext, DragOverlay, useDraggable, useDroppable,
  PointerSensor, useSensor, useSensors
} from '@dnd-kit/core'
import {
  Users, MapPin, AlertTriangle, CheckCircle,
  X, Shield, Phone, Mail, Zap,
  RotateCcw, Save, Eye
} from 'lucide-react'

type Spot = {
  id: string; label: string; row_index: number; col_index: number
  width_m: number; length_m: number
  type: 'libre' | 'bloque' | 'allee' | 'attribue'
  application_id: string | null; application?: any
}

type Exposant = {
  id: string
  profiles: { full_name: string; email: string; phone?: string }
  exposant_data?: { siren?: string; business_name?: string; stand_width?: number; stand_length?: number }
  events: { title: string; price_per_spot: number }
  spot_label?: string
}

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

function DraggableExposant({ exposant, isPlaced }: { exposant: Exposant; isPlaced: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: exposant.id, disabled: isPlaced })
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 999 } : {}
  const initials = (exposant.exposant_data?.business_name || exposant.profiles?.full_name || '?').split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <div style={{ background: isPlaced ? '#F0FDF4' : 'white', border: `1px solid ${isPlaced ? '#BBF7D0' : '#E2E8F0'}`, borderRadius: 10, padding: '10px 12px', cursor: isPlaced ? 'default' : 'grab', opacity: isDragging ? 0.5 : 1, userSelect: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: isPlaced ? '#16A34A' : 'linear-gradient(135deg, #4F46E5, #7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {isPlaced ? <CheckCircle size={14} style={{ color: 'white' }} /> : <span style={{ fontSize: 11, fontWeight: 700, color: 'white' }}>{initials}</span>}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{exposant.exposant_data?.business_name || exposant.profiles?.full_name}</p>
            <p style={{ fontSize: 10, color: '#94A3B8' }}>{exposant.exposant_data?.stand_width || '?'}m × {exposant.exposant_data?.stand_length || '?'}m{isPlaced && exposant.spot_label && ` · ${exposant.spot_label}`}</p>
          </div>
          {isPlaced && <span style={{ fontSize: 10, fontWeight: 700, background: '#16A34A', color: 'white', padding: '2px 6px', borderRadius: 100 }}>{exposant.spot_label}</span>}
        </div>
      </div>
    </div>
  )
}

function DroppableSpot({ spot, onSpotClick, activeExposant }: { spot: Spot; onSpotClick: (spot: Spot) => void; activeExposant: Exposant | null }) {
  const { setNodeRef, isOver } = useDroppable({ id: spot.id, disabled: spot.type === 'bloque' || spot.type === 'allee' })
  const sizeWarning = isOver && activeExposant && ((activeExposant.exposant_data?.stand_width || 0) > spot.width_m || (activeExposant.exposant_data?.stand_length || 0) > spot.length_m)
  const getBg = () => {
    if (spot.type === 'bloque') return 'repeating-linear-gradient(45deg, #FEE2E2, #FEE2E2 4px, #FEF2F2 4px, #FEF2F2 10px)'
    if (spot.type === 'allee') return '#F1F5F9'
    if (spot.type === 'attribue') return '#EEF2FF'
    if (isOver && sizeWarning) return '#FEF2F2'
    if (isOver) return '#F0FDF4'
    return 'white'
  }
  const getBorder = () => {
    if (spot.type === 'bloque') return '1px solid #FECACA'
    if (spot.type === 'allee') return '1px dashed #CBD5E1'
    if (spot.type === 'attribue') return '1.5px solid #4F46E5'
    if (isOver && sizeWarning) return '2px solid #DC2626'
    if (isOver) return '2px solid #22C55E'
    return '1px solid #E2E8F0'
  }
  const initials = spot.application?.profiles?.full_name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
  return (
    <div ref={setNodeRef} onClick={() => spot.type === 'attribue' && onSpotClick(spot)}
      style={{ background: getBg(), border: getBorder(), borderRadius: 8, minHeight: 64, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 4, cursor: spot.type === 'attribue' ? 'pointer' : 'default', transition: 'all 0.15s', position: 'relative', overflow: 'hidden' }}>
      <span style={{ fontSize: 9, fontWeight: 700, color: '#CBD5E1', position: 'absolute', top: 3, left: 4 }}>{spot.label}</span>
      {spot.type === 'bloque' && <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}><Zap size={12} style={{ color: '#DC2626', opacity: 0.6 }} /><span style={{ fontSize: 8, color: '#DC2626', fontWeight: 600 }}>BLOQUÉ</span></div>}
      {spot.type === 'allee' && <span style={{ fontSize: 8, color: '#94A3B8', fontWeight: 500 }}>ALLÉE</span>}
      {spot.type === 'attribue' && spot.application && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, paddingTop: 8 }}>
          <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 8, fontWeight: 700, color: 'white' }}>{initials}</span>
          </div>
          <p style={{ fontSize: 8, fontWeight: 600, color: '#4F46E5', textAlign: 'center', maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {spot.application.exposant_data?.business_name || spot.application.profiles?.full_name}
          </p>
        </div>
      )}
      {spot.type === 'libre' && isOver && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          {sizeWarning ? <AlertTriangle size={14} style={{ color: '#DC2626' }} /> : <CheckCircle size={14} style={{ color: '#16A34A' }} />}
          <span style={{ fontSize: 8, color: sizeWarning ? '#DC2626' : '#16A34A', fontWeight: 600 }}>{sizeWarning ? 'TROP GRAND' : 'DÉPOSER'}</span>
        </div>
      )}
      {spot.type === 'libre' && !isOver && <span style={{ fontSize: 9, color: '#CBD5E1' }}>{spot.width_m}×{spot.length_m}m</span>}
    </div>
  )
}

function ExposantModal({ spot, onClose, onUnassign }: { spot: Spot; onClose: () => void; onUnassign: () => void }) {
  const app = spot.application; if (!app) return null
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={onClose}>
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
        style={{ background: 'white', borderRadius: 16, padding: '20px', maxWidth: 400, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ background: '#4F46E5', color: 'white', fontSize: 12, fontWeight: 800, padding: '3px 10px', borderRadius: 100 }}>Case {spot.label}</span>
              <span style={{ fontSize: 11, color: '#64748B' }}>{spot.width_m}m × {spot.length_m}m</span>
            </div>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#0F172A' }}>{app.exposant_data?.business_name || app.profiles?.full_name}</p>
          </div>
          <button onClick={onClose} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 6, cursor: 'pointer' }}><X size={14} style={{ color: '#64748B' }} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          {[{ icon: <Mail size={13} />, label: 'Email', value: app.profiles?.email }, { icon: <Phone size={13} />, label: 'Tél', value: app.profiles?.phone || '—' }, { icon: <Shield size={13} />, label: 'SIREN', value: app.exposant_data?.siren || '—' }, { icon: <MapPin size={13} />, label: 'Stand', value: `${app.exposant_data?.stand_width || '?'}m × ${app.exposant_data?.stand_length || '?'}m` }].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
              <div style={{ color: '#4F46E5', width: 20 }}>{item.icon}</div>
              <span style={{ color: '#64748B', width: 60 }}>{item.label}</span>
              <span style={{ color: '#0F172A', fontWeight: 500 }}>{item.value}</span>
            </div>
          ))}
        </div>
        <button onClick={onUnassign}
          style={{ width: '100%', background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: 10, padding: '10px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
          <RotateCcw size={13} /> Retirer de cette case
        </button>
      </motion.div>
    </motion.div>
  )
}

export default function Attribution() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState<any[]>([])
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [exposants, setExposants] = useState<Exposant[]>([])
  const [spots, setSpots] = useState<Spot[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [gridCols, setGridCols] = useState(8)
  const [gridRows, setGridRows] = useState(6)

  const router = useRouter()
  const supabase = createClient()
  const isMobile = useIsMobile()
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (profileData?.role !== 'organisateur') { router.push('/dashboard'); return }
      setProfile(profileData)
      const { data: eventsData } = await supabase.from('events').select('*').eq('organisateur_id', user.id).order('start_date', { ascending: true })
      setEvents(eventsData || [])
      if (eventsData && eventsData.length > 0) await loadEventData(eventsData[0])
      setLoading(false)
    }
    getData()
  }, [])

  const loadEventData = async (event: any) => {
    setSelectedEvent(event)
    const { data: apps } = await supabase.from('applications')
      .select(`*, profiles:exposant_id(full_name, email, phone), exposant_data:exposant_id(siren, business_name, stand_width, stand_length)`)
      .eq('event_id', event.id).in('status', ['paid', 'present'])
    setExposants(apps || [])
    const { data: spotsData } = await supabase.from('terrain_spots')
      .select(`*, application:application_id(*, profiles:exposant_id(full_name, email, phone), exposant_data:exposant_id(siren, business_name, stand_width, stand_length))`)
      .eq('event_id', event.id).order('row_index').order('col_index')
    if (spotsData && spotsData.length > 0) {
      setSpots(spotsData)
      setGridRows(Math.max(...spotsData.map(s => s.row_index)) + 1)
      setGridCols(Math.max(...spotsData.map(s => s.col_index)) + 1)
    } else { generateGrid(6, 8, event.id) }
  }

  const generateGrid = (rows: number, cols: number, eventId: string) => {
    const newSpots: Spot[] = []
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      newSpots.push({ id: `${eventId}-${r}-${c}`, label: `${String.fromCharCode(65 + r)}${c + 1}`, row_index: r, col_index: c, width_m: 3, length_m: 3, type: 'libre', application_id: null })
    }
    setSpots(newSpots); setGridRows(rows); setGridCols(cols)
  }

  const handleDragStart = ({ active }: any) => setActiveId(active.id)
  const handleDragEnd = ({ active, over }: any) => {
    setActiveId(null); if (!over) return
    const spot = spots.find(s => s.id === over.id)
    const exposant = exposants.find(e => e.id === active.id)
    if (!spot || !exposant || spot.type === 'bloque' || spot.type === 'allee' || spot.type === 'attribue') return
    const standW = exposant.exposant_data?.stand_width || 0
    const standL = exposant.exposant_data?.stand_length || 0
    if (standW > spot.width_m || standL > spot.length_m) {
      const ok = window.confirm(`⚠️ Stand ${standW}×${standL}m > case ${spot.label} ${spot.width_m}×${spot.length_m}m. Continuer ?`)
      if (!ok) return
    }
    setSpots(prev => prev.map(s => s.id === over.id ? { ...s, type: 'attribue', application_id: active.id, application: exposant } : s))
    setExposants(prev => prev.map(e => e.id === active.id ? { ...e, spot_label: spot.label } : e))
  }

  const handleUnassign = (spot: Spot) => {
    setSpots(prev => prev.map(s => s.id === spot.id ? { ...s, type: 'libre', application_id: null, application: undefined } : s))
    setExposants(prev => prev.map(e => e.id === spot.application_id ? { ...e, spot_label: undefined } : e))
    setSelectedSpot(null)
  }

  const toggleSpotType = (spotId: string) => {
    setSpots(prev => prev.map(s => {
      if (s.id !== spotId || s.type === 'attribue') return s
      const cycle: any[] = ['libre', 'bloque', 'allee']
      return { ...s, type: cycle[(cycle.indexOf(s.type) + 1) % cycle.length] }
    }))
  }

  const handleSave = async () => {
    if (!selectedEvent) return; setSaving(true)
    try {
      await supabase.from('terrain_spots').delete().eq('event_id', selectedEvent.id)
      await supabase.from('terrain_spots').insert(spots.map(s => ({ event_id: selectedEvent.id, label: s.label, row_index: s.row_index, col_index: s.col_index, width_m: s.width_m, length_m: s.length_m, type: s.type, application_id: s.application_id || null })))
      for (const spot of spots.filter(s => s.type === 'attribue' && s.application_id)) {
        await supabase.from('applications').update({ spot_label: spot.label }).eq('id', spot.application_id!)
      }
      setSaved(true); setTimeout(() => setSaved(false), 2000)
    } catch (err) { console.error(err) }
    setSaving(false)
  }

  const activeExposant = activeId ? exposants.find(e => e.id === activeId) || null : null
  const placedIds = spots.filter(s => s.type === 'attribue').map(s => s.application_id)
  const unplacedExposants = exposants.filter(e => !placedIds.includes(e.id))
  const placedExposants = exposants.filter(e => placedIds.includes(e.id))
  const grid: Spot[][] = []
  for (let r = 0; r < gridRows; r++) {
    grid[r] = []
    for (let c = 0; c < gridCols; c++) {
      const spot = spots.find(s => s.row_index === r && s.col_index === c)
      if (spot) grid[r][c] = spot
    }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 28, height: 28, border: '2px solid #4F46E5', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <Sidebar profile={profile} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <AnimatePresence>
        {selectedSpot && <ExposantModal spot={selectedSpot} onClose={() => setSelectedSpot(null)} onUnassign={() => handleUnassign(selectedSpot)} />}
      </AnimatePresence>

      <div style={{ marginLeft: isMobile ? 0 : 220, flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Header */}
        <header style={{ background: 'white', borderBottom: '1px solid #E2E8F0', padding: isMobile ? '0 14px 0 60px' : '0 24px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, background: '#EEF2FF', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MapPin size={13} style={{ color: '#4F46E5' }} />
            </div>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>Attribution</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <select value={selectedEvent?.id || ''} onChange={e => { const ev = events.find(ev => ev.id === e.target.value); if (ev) loadEventData(ev) }}
              style={{ padding: '5px 8px', border: '1px solid #E2E8F0', borderRadius: 7, fontSize: 11, color: '#0F172A', background: 'white', outline: 'none', maxWidth: isMobile ? 120 : 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {events.map(ev => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
            </select>
            <button onClick={handleSave} disabled={saving}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: saved ? '#16A34A' : '#4F46E5', color: 'white', border: 'none', borderRadius: 7, padding: '7px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'background 0.3s' }}>
              {saving ? <div style={{ width: 11, height: 11, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                : saved ? <CheckCircle size={12} /> : <Save size={12} />}
              {isMobile ? (saved ? '✓' : '💾') : (saving ? '...' : saved ? 'Sauvegardé' : 'Sauvegarder')}
            </button>
          </div>
        </header>

        {/* Mobile : message d'info */}
        {isMobile && (
          <div style={{ background: '#EEF2FF', borderBottom: '1px solid #C7D2FE', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Eye size={13} style={{ color: '#4F46E5', flexShrink: 0 }} />
            <p style={{ fontSize: 12, color: '#4F46E5' }}>Plan en lecture seule sur mobile. Utilisez un ordinateur pour attribuer les emplacements.</p>
          </div>
        )}

        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '260px 1fr', overflow: 'hidden' }}>

            {/* Colonne exposants — cachée sur mobile */}
            {!isMobile && (
              <div style={{ background: 'white', borderRight: '1px solid #E2E8F0', overflowY: 'auto', padding: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
                    <p style={{ fontSize: 20, fontWeight: 800, color: '#4F46E5' }}>{placedExposants.length}</p>
                    <p style={{ fontSize: 10, color: '#94A3B8', textTransform: 'uppercase' }}>Placés</p>
                  </div>
                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
                    <p style={{ fontSize: 20, fontWeight: 800, color: '#F59E0B' }}>{unplacedExposants.length}</p>
                    <p style={{ fontSize: 10, color: '#94A3B8', textTransform: 'uppercase' }}>À placer</p>
                  </div>
                </div>
                {unplacedExposants.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>À placer</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {unplacedExposants.map(e => <DraggableExposant key={e.id} exposant={e} isPlaced={false} />)}
                    </div>
                  </div>
                )}
                {placedExposants.length > 0 && (
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Placés</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {placedExposants.map(e => <DraggableExposant key={e.id} exposant={e} isPlaced={true} />)}
                    </div>
                  </div>
                )}
                {exposants.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '32px 0', color: '#94A3B8' }}>
                    <Users size={28} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
                    <p style={{ fontSize: 12 }}>Aucun exposant payé</p>
                  </div>
                )}
              </div>
            )}

            {/* Plan du terrain */}
            <div style={{ overflow: 'auto', padding: isMobile ? '14px' : '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {!isMobile && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 10, padding: '10px 14px' }}>
                  <Eye size={13} style={{ color: '#4F46E5', flexShrink: 0 }} />
                  <p style={{ fontSize: 12, color: '#4F46E5' }}>
                    <strong>Glissez</strong> un exposant sur une case · <strong>Cliquez</strong> sur une case attribuée · <strong>Double-cliquez</strong> pour changer le type
                  </p>
                </div>
              )}
              <div style={{ overflowX: 'auto' }}>
                <div style={{ display: 'inline-grid', gridTemplateColumns: `repeat(${gridCols}, minmax(${isMobile ? '56px' : '72px'}, ${isMobile ? '60px' : '80px'}))`, gap: 4, minWidth: 'fit-content' }}>
                  {grid.map((row, r) =>
                    row.map((spot, c) => spot ? (
                      <div key={spot.id} onDoubleClick={() => !isMobile && toggleSpotType(spot.id)}>
                        <DroppableSpot spot={spot} onSpotClick={setSelectedSpot} activeExposant={activeExposant} />
                      </div>
                    ) : (
                      <div key={`empty-${r}-${c}`} style={{ minHeight: isMobile ? 50 : 64, background: '#F8FAFC', borderRadius: 8, border: '1px dashed #E2E8F0', opacity: 0.3 }} />
                    ))
                  )}
                </div>
              </div>
              {/* Stats mobile */}
              {isMobile && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 4 }}>
                  <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 10, padding: '12px', textAlign: 'center' }}>
                    <p style={{ fontSize: 22, fontWeight: 800, color: '#4F46E5' }}>{placedExposants.length}</p>
                    <p style={{ fontSize: 11, color: '#94A3B8' }}>Placés</p>
                  </div>
                  <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 10, padding: '12px', textAlign: 'center' }}>
                    <p style={{ fontSize: 22, fontWeight: 800, color: '#F59E0B' }}>{unplacedExposants.length}</p>
                    <p style={{ fontSize: 11, color: '#94A3B8' }}>À placer</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <DragOverlay>
            {activeExposant && (
              <div style={{ background: 'white', border: '2px solid #4F46E5', borderRadius: 10, padding: '10px 12px', boxShadow: '0 8px 24px rgba(79,70,229,0.25)', cursor: 'grabbing' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'white' }}>{(activeExposant.exposant_data?.business_name || activeExposant.profiles?.full_name || '?').substring(0, 2).toUpperCase()}</span>
                  </div>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#0F172A' }}>{activeExposant.exposant_data?.business_name || activeExposant.profiles?.full_name}</p>
                    <p style={{ fontSize: 10, color: '#94A3B8' }}>{activeExposant.exposant_data?.stand_width}m × {activeExposant.exposant_data?.stand_length}m</p>
                  </div>
                </div>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  )
}
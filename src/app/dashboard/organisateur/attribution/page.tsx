'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from '@/components/Sidebar'
import TerrainEditor, { TOOLS, TEMPLATES, getCategoryColor, type Spot, type Exposant, type TerrainEditorHandle } from '@/components/TerrainEditor'
import { exportToPNG, exportToExcel } from '@/lib/terrainExports'
import {
  MapPin, Save, CheckCircle, Users, ChevronRight, ChevronDown,
  X, Layout, Wand2, Loader, Download, FileText, FileSpreadsheet,
  Image as ImageIcon, Trash2, AlertTriangle, ArrowLeft, Search,
  Move, Square, Eye
} from 'lucide-react'

const BRAND = '#4F46E5'

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

function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t) }, [onClose])
  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 2000, background: 'white', borderRadius: 12, padding: '12px 18px', boxShadow: '0 8px 32px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: 10, borderLeft: `3px solid ${type === 'success' ? '#16A34A' : '#DC2626'}` }}>
      <CheckCircle size={15} style={{ color: type === 'success' ? '#16A34A' : '#DC2626' }} />
      <span style={{ fontSize: 13, fontWeight: 500, color: '#0F172A' }}>{message}</span>
    </motion.div>
  )
}

function ExposantDraggable({ exposant, isPlaced }: { exposant: Exposant; isPlaced: boolean }) {
  const cat = getCategoryColor(exposant.exposant_data?.category)
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('exposant-id', exposant.id)
    e.dataTransfer.effectAllowed = 'move'
  }
  return (
    <div
      draggable={!isPlaced}
      onDragStart={handleDragStart}
      style={{
        background: isPlaced ? '#F0FDF4' : 'white',
        border: `1px solid ${isPlaced ? '#BBF7D0' : '#E2E8F0'}`,
        borderLeft: `4px solid ${cat.bg}`,
        borderRadius: 8,
        padding: '9px 10px',
        cursor: isPlaced ? 'default' : 'grab',
        userSelect: 'none',
        opacity: isPlaced ? 0.7 : 1,
        transition: 'all 0.15s',
      }}
      onMouseEnter={e => { if (!isPlaced) e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)' }}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 26, height: 26, borderRadius: 6, background: cat.bg, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 10, fontWeight: 700 }}>
          {(exposant.exposant_data?.business_name || exposant.profiles?.full_name || '?').substring(0, 2).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {exposant.exposant_data?.business_name || exposant.profiles?.full_name}
          </p>
          <p style={{ fontSize: 10, color: '#94A3B8' }}>
            {exposant.exposant_data?.stand_width || 3}m × {exposant.exposant_data?.stand_length || 3}m
            {isPlaced && ' · ✓ Placé'}
          </p>
        </div>
      </div>
    </div>
  )
}

export default function AttributionPage() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState<any[]>([])
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [exposants, setExposants] = useState<Exposant[]>([])
  const [spots, setSpots] = useState<Spot[]>([])
  const [saving, setSaving] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [showExports, setShowExports] = useState(false)
  const [exporting, setExporting] = useState<string | null>(null)
  const [searchExposant, setSearchExposant] = useState('')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [activeTool, setActiveTool] = useState<string>('select')
  const [showSidebar, setShowSidebar] = useState(true)

  const router = useRouter()
  const supabase = createClient()
  const isMobile = useIsMobile()
  const terrainRef = useRef<TerrainEditorHandle>(null)

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (profileData?.role !== 'organisateur') { router.push('/dashboard'); return }
      setProfile(profileData)
      const { data: eventsData } = await supabase.from('events').select('*').eq('organisateur_id', user.id).eq('status', 'published').order('start_date', { ascending: true })
      setEvents(eventsData || [])
      if (eventsData && eventsData.length > 0) await loadEventData(eventsData[0])
      setLoading(false)
    }
    getData()
  }, [])

  const loadEventData = async (event: any) => {
    setSelectedEvent(event)
    // Exposants validés
    const { data: apps } = await supabase.from('applications')
      .select(`*, profiles:exposant_id(full_name, email, phone), exposant_data:exposant_id(siren, business_name, stand_width, stand_length, category)`)
      .eq('event_id', event.id).in('status', ['paid', 'present', 'validated'])
    setExposants(apps || [])

    // Spots existants
    const { data: spotsData } = await supabase.from('terrain_spots_v2')
      .select(`*, application:application_id(*, profiles:exposant_id(full_name, email, phone), exposant_data:exposant_id(siren, business_name, stand_width, stand_length, category))`)
      .eq('event_id', event.id)

    if (spotsData && spotsData.length > 0) {
      setSpots(spotsData.map((s: any) => ({
        id: s.id,
        label: s.label,
        lat: parseFloat(s.lat),
        lng: parseFloat(s.lng),
        width_m: s.width_m,
        length_m: s.length_m,
        rotation: s.rotation || 0,
        type: s.type,
        application_id: s.application_id,
        application: s.application,
      })))
    } else {
      setSpots([])
    }
  }

  const handleAssign = useCallback((spotId: string, exposantId: string) => {
    const exposant = exposants.find(e => e.id === exposantId)
    if (!exposant) return
    setSpots(prev => prev.map(s =>
      s.id === spotId ? { ...s, application_id: exposantId, application: exposant } : s
    ))
    setToast({ message: `${exposant.exposant_data?.business_name || exposant.profiles?.full_name} placé`, type: 'success' })
  }, [exposants])

  const handleUnassign = useCallback((spotId: string) => {
    setSpots(prev => prev.map(s =>
      s.id === spotId ? { ...s, application_id: null, application: undefined } : s
    ))
  }, [])

  const handleSave = async () => {
    if (!selectedEvent) return
    setSaving(true)
    try {
      // Delete + insert
      await supabase.from('terrain_spots_v2').delete().eq('event_id', selectedEvent.id)
      if (spots.length > 0) {
        await supabase.from('terrain_spots_v2').insert(spots.map(s => ({
          event_id: selectedEvent.id,
          label: s.label,
          lat: s.lat,
          lng: s.lng,
          width_m: s.width_m,
          length_m: s.length_m,
          rotation: s.rotation,
          type: s.type,
          application_id: s.application_id || null,
        })))
      }
      // Mettre à jour les applications avec spot_label
      for (const spot of spots.filter(s => s.application_id)) {
        await supabase.from('applications').update({ spot_label: spot.label }).eq('id', spot.application_id!)
      }
      setToast({ message: 'Plan sauvegardé', type: 'success' })
    } catch (err: any) {
      setToast({ message: 'Erreur : ' + err.message, type: 'error' })
    }
    setSaving(false)
  }

  const handleExportPDF = async () => {
    setExporting('pdf'); setShowExports(false)
    try {
      await terrainRef.current?.exportPDF()
      setToast({ message: 'PDF généré', type: 'success' })
    } catch (err: any) {
      setToast({ message: 'Erreur export PDF', type: 'error' })
    }
    setExporting(null)
  }

  const handleExportPNG = async () => {
    setExporting('png'); setShowExports(false)
    try {
      const mapEl = document.getElementById('terrain-map-container')
      if (mapEl) {
        await exportToPNG({ eventTitle: selectedEvent.title, mapElement: mapEl })
        setToast({ message: 'Image téléchargée', type: 'success' })
      }
    } catch (err) {
      setToast({ message: 'Erreur export PNG', type: 'error' })
    }
    setExporting(null)
  }

  const handleExportExcel = async () => {
    setExporting('excel'); setShowExports(false)
    try {
      await exportToExcel({ eventTitle: selectedEvent.title, spots })
      setToast({ message: 'Excel téléchargé', type: 'success' })
    } catch (err) {
      setToast({ message: 'Erreur export Excel', type: 'error' })
    }
    setExporting(null)
  }

  const handlePrint = () => {
    window.print()
  }

  const placedExposantIds = spots.filter(s => s.application_id).map(s => s.application_id)
  const unplacedExposants = exposants
    .filter(e => !placedExposantIds.includes(e.id))
    .filter(e => !searchExposant ||
      e.profiles?.full_name?.toLowerCase().includes(searchExposant.toLowerCase()) ||
      e.exposant_data?.business_name?.toLowerCase().includes(searchExposant.toLowerCase())
    )
  const placedExposants = exposants.filter(e => placedExposantIds.includes(e.id))
  const emplacementCount = spots.filter(s => s.type === 'emplacement').length
  const placedCount = spots.filter(s => s.application_id).length

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 28, height: 28, border: `2px solid ${BRAND}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  if (!selectedEvent) return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <Sidebar profile={profile} />
      <div style={{ marginLeft: isMobile ? 0 : 220, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ textAlign: 'center' }}>
          <MapPin size={48} style={{ color: '#CBD5E1', marginBottom: 16 }} />
          <p style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>Aucun événement publié</p>
          <p style={{ fontSize: 13, color: '#64748B', marginBottom: 20 }}>Créez un événement pour commencer l'attribution</p>
          <button onClick={() => router.push('/dashboard/creer-evenement')}
            style={{ background: BRAND, color: 'white', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Créer un événement
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <AnimatePresence>{toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}</AnimatePresence>
      <Sidebar profile={profile} />
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media print {
          aside, header, .no-print { display: none !important; }
          #terrain-map-container { width: 100vw !important; height: 100vh !important; }
        }
      `}</style>

      <div style={{ marginLeft: isMobile ? 0 : 220, flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100vh' }}>

        {/* Header */}
        <header className="no-print" style={{ background: 'white', borderBottom: '1px solid #E2E8F0', padding: isMobile ? '0 14px 0 60px' : '0 20px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
            <div style={{ width: 30, height: 30, background: '#EEF2FF', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <MapPin size={14} style={{ color: BRAND }} />
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>Attribution</p>
              {!isMobile && <p style={{ fontSize: 10, color: '#94A3B8' }}>Plan satellite interactif</p>}
            </div>
            <div style={{ width: 1, height: 20, background: '#E2E8F0', marginLeft: 4 }} />
            <select value={selectedEvent.id} onChange={e => { const ev = events.find(ev => ev.id === e.target.value); if (ev) loadEventData(ev) }}
              style={{ padding: '6px 28px 6px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 12, color: '#0F172A', background: 'white', outline: 'none', maxWidth: isMobile ? 140 : 240, fontWeight: 500, cursor: 'pointer' }}>
              {events.map(ev => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {/* Templates */}
            <div style={{ position: 'relative' }}>
              <button onClick={() => setShowTemplates(!showTemplates)}
                style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#F8FAFC', color: '#475569', border: '1px solid #E2E8F0', borderRadius: 8, padding: '7px 11px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                <Wand2 size={12} /> {!isMobile && 'Templates'} <ChevronDown size={10} />
              </button>
              {showTemplates && (
                <>
                  <div onClick={() => setShowTemplates(false)} style={{ position: 'fixed', inset: 0, zIndex: 998 }} />
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                    style={{ position: 'absolute', top: '100%', right: 0, marginTop: 6, background: 'white', borderRadius: 12, boxShadow: '0 12px 32px rgba(0,0,0,0.12)', border: '1px solid #E2E8F0', padding: 8, zIndex: 999, minWidth: 280 }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '4px 8px 8px' }}>Templates pré-faits</p>
                    {TEMPLATES.map(t => (
                      <button key={t.id} onClick={() => {
                        const template = TEMPLATES.find(tt => tt.id === t.id)
                        if (!template || !selectedEvent.latitude) return
                        const newSpots = template.generate(selectedEvent.latitude, selectedEvent.longitude).map(s => ({
                          ...s,
                          id: `spot-${Date.now()}-${Math.random().toString(36).substring(2, 8)}-${s.label}`,
                        }))
                        setSpots(prev => [...prev, ...newSpots])
                        setShowTemplates(false)
                        setToast({ message: `${t.name} ajouté (${newSpots.length} emplacements)`, type: 'success' })
                      }}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 8px', borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <span style={{ fontSize: 20 }}>{t.icon}</span>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: 12, fontWeight: 600, color: '#0F172A' }}>{t.name}</p>
                          <p style={{ fontSize: 10, color: '#94A3B8' }}>{t.desc}</p>
                        </div>
                        <ChevronRight size={12} style={{ color: '#CBD5E1' }} />
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </div>

            {/* Save */}
            <button onClick={handleSave} disabled={saving}
              style={{ display: 'flex', alignItems: 'center', gap: 5, background: BRAND, color: 'white', border: 'none', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
              {saving ? <Loader size={12} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Save size={12} />}
              {!isMobile && (saving ? 'Sauvegarde...' : 'Sauvegarder')}
            </button>

            {/* Exports */}
            <div style={{ position: 'relative' }}>
              <button onClick={() => setShowExports(!showExports)}
                style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#0F172A', color: 'white', border: 'none', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                <Download size={12} /> {!isMobile && 'Exporter'} <ChevronDown size={10} />
              </button>
              {showExports && (
                <>
                  <div onClick={() => setShowExports(false)} style={{ position: 'fixed', inset: 0, zIndex: 998 }} />
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                    style={{ position: 'absolute', top: '100%', right: 0, marginTop: 6, background: 'white', borderRadius: 12, boxShadow: '0 12px 32px rgba(0,0,0,0.12)', border: '1px solid #E2E8F0', padding: 8, zIndex: 999, minWidth: 240 }}>
                    {[
                      { icon: <FileText size={14} />, label: 'Télécharger PDF', desc: 'Plan + liste exposants', action: handleExportPDF, key: 'pdf', color: '#DC2626' },
                      { icon: <ImageIcon size={14} />, label: 'Télécharger PNG', desc: 'Image haute résolution', action: handleExportPNG, key: 'png', color: BRAND },
                      { icon: <FileSpreadsheet size={14} />, label: 'Export Excel', desc: 'Tableau des attributions', action: handleExportExcel, key: 'excel', color: '#16A34A' },
                    ].map(item => (
                      <button key={item.key} onClick={item.action} disabled={exporting !== null}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 8px', borderRadius: 8, background: 'none', border: 'none', cursor: exporting ? 'not-allowed' : 'pointer', textAlign: 'left', opacity: exporting && exporting !== item.key ? 0.5 : 1 }}
                        onMouseEnter={e => { if (!exporting) e.currentTarget.style.background = '#F8FAFC' }}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <div style={{ width: 28, height: 28, background: `${item.color}15`, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.color, flexShrink: 0 }}>
                          {exporting === item.key ? <Loader size={12} style={{ animation: 'spin 0.8s linear infinite' }} /> : item.icon}
                        </div>
                        <div>
                          <p style={{ fontSize: 12, fontWeight: 600, color: '#0F172A' }}>{item.label}</p>
                          <p style={{ fontSize: 10, color: '#94A3B8' }}>{item.desc}</p>
                        </div>
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Body */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>

          {/* Sidebar exposants */}
          {!isMobile && showSidebar && (
            <aside className="no-print" style={{ width: 280, background: 'white', borderRight: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
              {/* Toolbar */}
              <div style={{ padding: '12px', borderBottom: '1px solid #F1F5F9' }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Outils</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4 }}>
                  {TOOLS.map(tool => (
                    <button key={tool.id} onClick={() => setActiveTool(tool.id)} title={tool.label}
                      style={{ padding: '8px 0', background: activeTool === tool.id ? `${BRAND}15` : 'white', border: `1px solid ${activeTool === tool.id ? BRAND : '#E2E8F0'}`, borderRadius: 7, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: activeTool === tool.id ? BRAND : '#64748B' }}>
                      {tool.icon}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div style={{ padding: '12px', borderBottom: '1px solid #F1F5F9', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                <div style={{ background: '#F8FAFC', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                  <p style={{ fontSize: 18, fontWeight: 800, color: BRAND, lineHeight: 1 }}>{placedCount}</p>
                  <p style={{ fontSize: 9, color: '#94A3B8', marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Placés</p>
                </div>
                <div style={{ background: '#F8FAFC', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                  <p style={{ fontSize: 18, fontWeight: 800, color: '#F59E0B', lineHeight: 1 }}>{unplacedExposants.length}</p>
                  <p style={{ fontSize: 9, color: '#94A3B8', marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>À placer</p>
                </div>
              </div>

              {/* Search */}
              <div style={{ padding: '10px 12px', borderBottom: '1px solid #F1F5F9' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={11} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                  <input value={searchExposant} onChange={e => setSearchExposant(e.target.value)} placeholder="Rechercher un exposant..."
                    style={{ width: '100%', padding: '6px 10px 6px 26px', border: '1px solid #E2E8F0', borderRadius: 7, fontSize: 11, color: '#0F172A', background: '#F8FAFC', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>

              {/* Exposants à placer */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px' }}>
                {unplacedExposants.length > 0 && (
                  <>
                    <p style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Move size={9} /> À glisser sur la carte ({unplacedExposants.length})
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 14 }}>
                      {unplacedExposants.map(e => <ExposantDraggable key={e.id} exposant={e} isPlaced={false} />)}
                    </div>
                  </>
                )}

                {placedExposants.length > 0 && (
                  <>
                    <p style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <CheckCircle size={9} /> Placés ({placedExposants.length})
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {placedExposants.map(e => <ExposantDraggable key={e.id} exposant={e} isPlaced={true} />)}
                    </div>
                  </>
                )}

                {exposants.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '32px 0', color: '#94A3B8' }}>
                    <Users size={28} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
                    <p style={{ fontSize: 12 }}>Aucun exposant validé</p>
                    <p style={{ fontSize: 10, marginTop: 4 }}>Validez des candidatures d'abord</p>
                  </div>
                )}
              </div>

              {/* Footer info */}
              <div style={{ padding: '10px 12px', borderTop: '1px solid #F1F5F9', background: '#F8FAFC' }}>
                <p style={{ fontSize: 10, color: '#94A3B8', lineHeight: 1.5 }}>
                  <strong style={{ color: '#475569' }}>{emplacementCount} emplacements</strong> sur le terrain<br />
                  Sélectionnez un outil et cliquez sur la carte
                </p>
              </div>
            </aside>
          )}

          {/* Carte */}
          <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
            {!isMobile && (
              <button onClick={() => setShowSidebar(!showSidebar)} className="no-print"
                style={{ position: 'absolute', top: 12, left: showSidebar ? 12 : 12, zIndex: 1001, background: 'white', border: '1px solid #E2E8F0', borderRadius: 8, padding: '6px 8px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: '#475569' }}>
                {showSidebar ? <ArrowLeft size={11} /> : <Users size={11} />}
                {showSidebar ? 'Masquer' : 'Exposants'}
              </button>
            )}

            {selectedEvent.latitude && selectedEvent.longitude ? (
              <TerrainEditor
                ref={terrainRef}
                spots={spots}
                setSpots={setSpots}
                exposants={exposants}
                centerLat={parseFloat(selectedEvent.latitude)}
                centerLng={parseFloat(selectedEvent.longitude)}
                eventTitle={selectedEvent.title}
                onAssign={handleAssign}
                onUnassign={handleUnassign}
                readOnly={isMobile}
              />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#F8FAFC' }}>
                <div style={{ textAlign: 'center', maxWidth: 360, padding: 20 }}>
                  <AlertTriangle size={36} style={{ color: '#F59E0B', marginBottom: 14 }} />
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>Adresse manquante</p>
                  <p style={{ fontSize: 12, color: '#64748B', marginBottom: 16 }}>
                    Cet événement n'a pas de coordonnées GPS. Modifiez-le pour ajouter une adresse précise.
                  </p>
                  <button onClick={() => router.push('/dashboard/creer-evenement')}
                    style={{ background: BRAND, color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    Modifier l'événement
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
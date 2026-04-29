'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from '@/components/Sidebar'
import {
  Grid, Save, Plus, Trash2, CheckCircle,
  Pencil, X, RotateCcw, Download, Zap, Info
} from 'lucide-react'

// ─── TYPES ──────────────────────────────────────────────────────────────────

interface Zone {
  id: string
  name: string
  color: string
  description: string
}

interface Cell {
  id: string
  allee: number
  num: number
  label: string
  zoneId: string | null
  status: 'libre' | 'reserve'
}

// ─── CONSTANTES ─────────────────────────────────────────────────────────────

const ZONE_COLORS = [
  '#4F46E5', '#16A34A', '#EA580C', '#0EA5E9',
  '#7C3AED', '#DC2626', '#F59E0B', '#0D9488'
]

const ZONE_PRESETS = [
  { name: 'Fruits & Légumes', color: '#16A34A', description: 'Producteurs locaux' },
  { name: 'Vêtements', color: '#4F46E5', description: 'Textiles et accessoires' },
  { name: 'Alimentation', color: '#EA580C', description: 'Épicerie fine, traiteur' },
  { name: 'Artisanat', color: '#7C3AED', description: 'Créateurs et artisans' },
  { name: 'Brocante', color: '#F59E0B', description: 'Antiquités et occasion' },
  { name: 'Bio', color: '#0D9488', description: 'Produits biologiques' },
]

// ─── COMPOSANTS ─────────────────────────────────────────────────────────────

function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t) }, [])
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
      style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 100, background: 'white', borderRadius: 12, padding: '14px 18px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', display: 'flex', alignItems: 'center', gap: 10, borderLeft: `3px solid ${type === 'success' ? '#16A34A' : '#DC2626'}` }}>
      <CheckCircle size={15} style={{ color: type === 'success' ? '#16A34A' : '#DC2626' }} />
      <span style={{ fontSize: 13, fontWeight: 500, color: '#0F172A' }}>{message}</span>
    </motion.div>
  )
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

export default function TerrainBuilder() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [templateId, setTemplateId] = useState<string | null>(null)

  // Config
  const [templateName, setTemplateName] = useState('Plan du marché')
  const [allees, setAllees] = useState(3)
  const [emplacementsParAllee, setEmplacementsParAllee] = useState(8)
  const [generated, setGenerated] = useState(false)

  // Grid
  const [grid, setGrid] = useState<Cell[]>([])
  const [zones, setZones] = useState<Zone[]>([])
  const [selectedZone, setSelectedZone] = useState<string | null>(null)
  const [selectedCells, setSelectedCells] = useState<string[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [editingZone, setEditingZone] = useState<string | null>(null)

  // Zone form
  const [newZoneName, setNewZoneName] = useState('')
  const [newZoneColor, setNewZoneColor] = useState(ZONE_COLORS[0])
  const [newZoneDesc, setNewZoneDesc] = useState('')
  const [showZoneForm, setShowZoneForm] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (profileData?.role !== 'organisateur') { router.push('/dashboard'); return }
      setProfile(profileData)

      // Load existing template
      const { data: template } = await supabase
        .from('terrain_templates')
        .select('*')
        .eq('organisateur_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single()

      if (template) {
        setTemplateId(template.id)
        setTemplateName(template.name)
        setAllees(template.allees)
        setEmplacementsParAllee(template.emplacements_par_allee)
        setGrid(template.grid || [])
        setZones(template.zones || [])
        if ((template.grid || []).length > 0) setGenerated(true)
      }
      setLoading(false)
    }
    getData()
  }, [])

  // Generate grid
  const generateGrid = useCallback(() => {
    const newGrid: Cell[] = []
    for (let a = 0; a < allees; a++) {
      for (let n = 0; n < emplacementsParAllee; n++) {
        const allee = a + 1
        const label = `${String.fromCharCode(65 + a)}${n + 1}`
        newGrid.push({
          id: label,
          allee,
          num: n + 1,
          label,
          zoneId: null,
          status: 'libre',
        })
      }
    }
    setGrid(newGrid)
    setSelectedCells([])
    setGenerated(true)
    setToast({ message: `Grille générée : ${allees} allées × ${emplacementsParAllee} emplacements`, type: 'success' })
  }, [allees, emplacementsParAllee])

  // Cell click — assign zone
  const handleCellClick = (cellId: string) => {
    if (!selectedZone) return
    setGrid(prev => prev.map(c =>
      c.id === cellId ? { ...c, zoneId: c.zoneId === selectedZone ? null : selectedZone } : c
    ))
  }

  // Cell drag
  const handleCellEnter = (cellId: string) => {
    if (!isDragging || !selectedZone) return
    setGrid(prev => prev.map(c => c.id === cellId ? { ...c, zoneId: selectedZone } : c))
  }

  // Add zone
  const addZone = () => {
    if (!newZoneName.trim()) return
    const zone: Zone = {
      id: Math.random().toString(36).slice(2),
      name: newZoneName.trim(),
      color: newZoneColor,
      description: newZoneDesc.trim(),
    }
    setZones(prev => [...prev, zone])
    setSelectedZone(zone.id)
    setNewZoneName('')
    setNewZoneDesc('')
    setShowZoneForm(false)
    setToast({ message: `Zone "${zone.name}" créée`, type: 'success' })
  }

  const addPreset = (preset: typeof ZONE_PRESETS[0]) => {
    const zone: Zone = {
      id: Math.random().toString(36).slice(2),
      name: preset.name,
      color: preset.color,
      description: preset.description,
    }
    setZones(prev => [...prev, zone])
    setSelectedZone(zone.id)
    setToast({ message: `Zone "${zone.name}" ajoutée`, type: 'success' })
  }

  const removeZone = (zoneId: string) => {
    setZones(prev => prev.filter(z => z.id !== zoneId))
    setGrid(prev => prev.map(c => c.zoneId === zoneId ? { ...c, zoneId: null } : c))
    if (selectedZone === zoneId) setSelectedZone(null)
  }

  const resetGrid = () => {
    setGrid(prev => prev.map(c => ({ ...c, zoneId: null })))
    setToast({ message: 'Grille réinitialisée', type: 'success' })
  }

  // Save
  const handleSave = async () => {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const payload = {
        organisateur_id: user.id,
        name: templateName,
        allees,
        emplacements_par_allee: emplacementsParAllee,
        zones,
        grid,
        updated_at: new Date().toISOString(),
      }

      if (templateId) {
        await supabase.from('terrain_templates').update(payload).eq('id', templateId)
      } else {
        const { data } = await supabase.from('terrain_templates').insert(payload).select().single()
        if (data) setTemplateId(data.id)
      }
      setToast({ message: 'Template sauvegardé avec succès', type: 'success' })
    } catch (err) {
      setToast({ message: 'Erreur lors de la sauvegarde', type: 'error' })
    }
    setSaving(false)
  }

  // Stats
  const totalCells = grid.length
  const assignedCells = grid.filter(c => c.zoneId).length
  const pctAssigned = totalCells > 0 ? Math.round((assignedCells / totalCells) * 100) : 0

  const alleeGroups = Array.from({ length: allees }, (_, i) => ({
    letter: String.fromCharCode(65 + i),
    cells: grid.filter(c => c.allee === i + 1),
  }))

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 28, height: 28, border: '2px solid #4F46E5', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <Sidebar profile={profile} />

      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </AnimatePresence>

      <div style={{ marginLeft: 220, flex: 1 }}>

        {/* TOP BAR */}
        <header style={{ background: 'white', borderBottom: '1px solid #E2E8F0', padding: '0 32px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 32, height: 32, background: '#EEF2FF', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Grid size={16} style={{ color: '#4F46E5' }} />
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Configuration du terrain</p>
              <p style={{ fontSize: 11, color: '#94A3B8' }}>Créez le plan de votre marché · Template réutilisable</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {generated && (
              <button onClick={resetGrid}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F8FAFC', color: '#64748B', border: '1px solid #E2E8F0', borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
                <RotateCcw size={13} /> Réinitialiser
              </button>
            )}
            <button onClick={handleSave} disabled={saving || !generated}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: generated ? '#4F46E5' : '#E2E8F0', color: generated ? 'white' : '#94A3B8', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: generated ? 'pointer' : 'not-allowed', opacity: saving ? 0.7 : 1 }}>
              <Save size={14} /> {saving ? 'Sauvegarde...' : 'Sauvegarder le template'}
            </button>
          </div>
        </header>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

        <main style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* ÉTAPE 1 — CONFIG */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ padding: '16px 24px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 24, height: 24, background: '#4F46E5', borderRadius: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'white' }}>1</span>
                </div>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Dimensions du terrain</p>
              </div>
              <div style={{ padding: '24px', display: 'flex', gap: 24, alignItems: 'flex-end' }}>

                {/* Nom */}
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>Nom du plan</label>
                  <input value={templateName} onChange={e => setTemplateName(e.target.value)}
                    placeholder="Plan du Marché de Noël 2026"
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #E2E8F0', borderRadius: 9, fontSize: 13, color: '#0F172A', outline: 'none', boxSizing: 'border-box' }}
                    onFocus={e => e.target.style.borderColor = '#4F46E5'}
                    onBlur={e => e.target.style.borderColor = '#E2E8F0'}
                  />
                </div>

                {/* Allées */}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>Nombre d'allées</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 0, border: '1px solid #E2E8F0', borderRadius: 9, overflow: 'hidden' }}>
                    <button onClick={() => setAllees(Math.max(1, allees - 1))}
                      style={{ width: 40, height: 42, background: '#F8FAFC', border: 'none', cursor: 'pointer', fontSize: 18, color: '#64748B', fontWeight: 300 }}>−</button>
                    <span style={{ width: 50, textAlign: 'center', fontSize: 16, fontWeight: 700, color: '#0F172A' }}>{allees}</span>
                    <button onClick={() => setAllees(Math.min(10, allees + 1))}
                      style={{ width: 40, height: 42, background: '#F8FAFC', border: 'none', cursor: 'pointer', fontSize: 18, color: '#64748B', fontWeight: 300 }}>+</button>
                  </div>
                </div>

                {/* Emplacements */}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>Emplacements par allée</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 0, border: '1px solid #E2E8F0', borderRadius: 9, overflow: 'hidden' }}>
                    <button onClick={() => setEmplacementsParAllee(Math.max(1, emplacementsParAllee - 1))}
                      style={{ width: 40, height: 42, background: '#F8FAFC', border: 'none', cursor: 'pointer', fontSize: 18, color: '#64748B', fontWeight: 300 }}>−</button>
                    <span style={{ width: 50, textAlign: 'center', fontSize: 16, fontWeight: 700, color: '#0F172A' }}>{emplacementsParAllee}</span>
                    <button onClick={() => setEmplacementsParAllee(Math.min(20, emplacementsParAllee + 1))}
                      style={{ width: 40, height: 42, background: '#F8FAFC', border: 'none', cursor: 'pointer', fontSize: 18, color: '#64748B', fontWeight: 300 }}>+</button>
                  </div>
                </div>

                {/* Preview */}
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 9, padding: '10px 16px', textAlign: 'center' }}>
                  <p style={{ fontSize: 22, fontWeight: 800, color: '#4F46E5' }}>{allees * emplacementsParAllee}</p>
                  <p style={{ fontSize: 11, color: '#94A3B8' }}>emplacements total</p>
                </div>

                {/* Generate */}
                <button onClick={generateGrid}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#4F46E5', color: 'white', border: 'none', borderRadius: 9, padding: '11px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  <Zap size={14} /> Générer la grille
                </button>
              </div>

              {/* Info */}
              <div style={{ padding: '12px 24px', background: '#EEF2FF', borderTop: '1px solid #C7D2FE', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Info size={13} style={{ color: '#4F46E5', flexShrink: 0 }} />
                <p style={{ fontSize: 12, color: '#4338CA' }}>Ce plan sera automatiquement utilisé comme template lors de la création de vos prochains événements. Glissez sur les cellules pour assigner une zone.</p>
              </div>
            </div>
          </motion.div>

          {generated && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24 }}>

              {/* GRILLE INTERACTIVE */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 14, overflow: 'hidden' }}>
                  <div style={{ padding: '16px 24px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 24, height: 24, background: '#4F46E5', borderRadius: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'white' }}>2</span>
                      </div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Plan interactif — {templateName}</p>
                    </div>
                    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ height: 4, width: 60, background: '#E2E8F0', borderRadius: 100, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pctAssigned}%`, background: '#4F46E5', borderRadius: 100 }} />
                        </div>
                        <span style={{ fontSize: 11, color: '#94A3B8' }}>{assignedCells}/{totalCells} assignés</span>
                      </div>
                      {!selectedZone && (
                        <span style={{ fontSize: 11, color: '#F59E0B', background: '#FFFBEB', padding: '3px 9px', borderRadius: 100, border: '1px solid #FDE68A', fontWeight: 500 }}>
                          Sélectionnez une zone pour peindre
                        </span>
                      )}
                      {selectedZone && (
                        <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 100, background: `${zones.find(z => z.id === selectedZone)?.color}20`, color: zones.find(z => z.id === selectedZone)?.color, border: `1px solid ${zones.find(z => z.id === selectedZone)?.color}40` }}>
                          Zone active : {zones.find(z => z.id === selectedZone)?.name}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ padding: '24px', overflowX: 'auto' }}
                    onMouseUp={() => setIsDragging(false)}>

                    {/* Légende allées */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                      {alleeGroups.map(group => (
                        <div key={group.letter} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '4px 10px' }}>
                          <div style={{ width: 20, height: 20, background: '#0F172A', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: 10, fontWeight: 800, color: 'white' }}>{group.letter}</span>
                          </div>
                          <span style={{ fontSize: 11, color: '#475569', fontWeight: 500 }}>Allée {group.letter}</span>
                        </div>
                      ))}
                    </div>

                    {/* Grid */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
                      onMouseLeave={() => setIsDragging(false)}>
                      {alleeGroups.map(group => (
                        <div key={group.letter} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {/* Label allée */}
                          <div style={{ width: 32, height: 32, background: '#0F172A', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <span style={{ fontSize: 12, fontWeight: 800, color: 'white' }}>{group.letter}</span>
                          </div>

                          {/* Cellules */}
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {group.cells.map(cell => {
                              const zone = zones.find(z => z.id === cell.zoneId)
                              const isAssigned = !!cell.zoneId
                              return (
                                <div
                                  key={cell.id}
                                  onMouseDown={() => { setIsDragging(true); handleCellClick(cell.id) }}
                                  onMouseEnter={() => handleCellEnter(cell.id)}
                                  onMouseUp={() => setIsDragging(false)}
                                  style={{
                                    width: 46, height: 46, borderRadius: 8, cursor: selectedZone ? 'crosshair' : 'default',
                                    background: zone ? `${zone.color}20` : '#F8FAFC',
                                    border: `2px solid ${zone ? zone.color : '#E2E8F0'}`,
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                    transition: 'all 0.1s', userSelect: 'none',
                                    boxShadow: zone ? `0 0 0 0 ${zone.color}30` : 'none',
                                  }}
                                  onMouseOver={e => {
                                    if (selectedZone) e.currentTarget.style.transform = 'scale(1.08)'
                                  }}
                                  onMouseOut={e => { e.currentTarget.style.transform = 'scale(1)' }}
                                >
                                  <span style={{ fontSize: 11, fontWeight: 700, color: zone ? zone.color : '#94A3B8' }}>{cell.label}</span>
                                  {zone && <span style={{ fontSize: 8, color: zone.color, opacity: 0.8, fontWeight: 600, marginTop: 1 }}>{zone.name.substring(0, 4)}</span>}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Légende */}
                    {zones.length > 0 && (
                      <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #F1F5F9', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, color: '#94A3B8', alignSelf: 'center' }}>Légende :</span>
                        {zones.map(zone => (
                          <div key={zone.id} style={{ display: 'flex', alignItems: 'center', gap: 5, background: `${zone.color}12`, border: `1px solid ${zone.color}30`, borderRadius: 100, padding: '3px 10px' }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: zone.color, flexShrink: 0 }} />
                            <span style={{ fontSize: 11, color: zone.color, fontWeight: 600 }}>{zone.name}</span>
                            <span style={{ fontSize: 10, color: '#94A3B8' }}>({grid.filter(c => c.zoneId === zone.id).length})</span>
                          </div>
                        ))}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 100, padding: '3px 10px' }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#E2E8F0', flexShrink: 0 }} />
                          <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>Non assigné</span>
                          <span style={{ fontSize: 10, color: '#94A3B8' }}>({grid.filter(c => !c.zoneId).length})</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* PANNEAU ZONES */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Zones créées */}
                <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 14, overflow: 'hidden' }}>
                  <div style={{ padding: '14px 18px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 24, height: 24, background: '#4F46E5', borderRadius: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'white' }}>3</span>
                    </div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>Zones commerciales</p>
                  </div>

                  <div style={{ padding: '14px' }}>
                    {zones.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '20px 0', color: '#94A3B8', fontSize: 12 }}>
                        Ajoutez des zones pour organiser votre marché
                      </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: zones.length > 0 ? 12 : 0 }}>
                      {zones.map(zone => (
                        <div key={zone.id}
                          onClick={() => setSelectedZone(selectedZone === zone.id ? null : zone.id)}
                          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, cursor: 'pointer', border: `2px solid ${selectedZone === zone.id ? zone.color : '#E2E8F0'}`, background: selectedZone === zone.id ? `${zone.color}10` : '#F8FAFC', transition: 'all 0.15s' }}>
                          <div style={{ width: 28, height: 28, borderRadius: 7, background: zone.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Pencil size={12} style={{ color: 'white' }} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }}>{zone.name}</p>
                            {zone.description && <p style={{ fontSize: 11, color: '#94A3B8' }}>{zone.description}</p>}
                            <p style={{ fontSize: 10, color: zone.color, fontWeight: 600, marginTop: 2 }}>
                              {grid.filter(c => c.zoneId === zone.id).length} emplacement(s)
                            </p>
                          </div>
                          {selectedZone === zone.id && (
                            <span style={{ fontSize: 10, background: zone.color, color: 'white', padding: '2px 7px', borderRadius: 100, fontWeight: 700 }}>ACTIF</span>
                          )}
                          <button onClick={e => { e.stopPropagation(); removeZone(zone.id) }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#CBD5E1', padding: 2 }}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Presets */}
                    <div style={{ marginBottom: 10 }}>
                      <p style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, marginBottom: 8 }}>Zones prédéfinies :</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {ZONE_PRESETS.filter(p => !zones.find(z => z.name === p.name)).map((preset, i) => (
                          <button key={i} onClick={() => addPreset(preset)}
                            style={{ display: 'flex', alignItems: 'center', gap: 5, background: `${preset.color}12`, border: `1px solid ${preset.color}30`, borderRadius: 100, padding: '4px 10px', cursor: 'pointer', fontSize: 11, color: preset.color, fontWeight: 600 }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: preset.color }} />
                            {preset.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Formulaire nouvelle zone */}
                    {showZoneForm ? (
                      <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: '14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <input value={newZoneName} onChange={e => setNewZoneName(e.target.value)} placeholder="Nom de la zone (ex: Alimentation)"
                          style={{ width: '100%', padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 12, outline: 'none', boxSizing: 'border-box' }}
                          onFocus={e => e.target.style.borderColor = '#4F46E5'}
                          onBlur={e => e.target.style.borderColor = '#E2E8F0'}
                          onKeyDown={e => e.key === 'Enter' && addZone()}
                        />
                        <input value={newZoneDesc} onChange={e => setNewZoneDesc(e.target.value)} placeholder="Description (optionnel)"
                          style={{ width: '100%', padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 12, outline: 'none', boxSizing: 'border-box' }}
                          onFocus={e => e.target.style.borderColor = '#4F46E5'}
                          onBlur={e => e.target.style.borderColor = '#E2E8F0'}
                        />
                        <div>
                          <p style={{ fontSize: 11, color: '#64748B', marginBottom: 6 }}>Couleur :</p>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {ZONE_COLORS.map(c => (
                              <button key={c} onClick={() => setNewZoneColor(c)}
                                style={{ width: 24, height: 24, borderRadius: 6, background: c, border: newZoneColor === c ? '3px solid #0F172A' : '2px solid transparent', cursor: 'pointer', transition: 'border 0.1s' }} />
                            ))}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={addZone}
                            style={{ flex: 1, background: '#4F46E5', color: 'white', border: 'none', borderRadius: 8, padding: '8px 0', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                            Créer la zone
                          </button>
                          <button onClick={() => setShowZoneForm(false)}
                            style={{ background: '#F8FAFC', color: '#64748B', border: '1px solid #E2E8F0', borderRadius: 8, padding: '8px 12px', fontSize: 12, cursor: 'pointer' }}>
                            <X size={13} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setShowZoneForm(true)}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, background: 'white', color: '#4F46E5', border: '1.5px dashed #C7D2FE', borderRadius: 10, padding: '10px 0', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                        <Plus size={14} /> Créer une zone personnalisée
                      </button>
                    )}
                  </div>
                </div>

                {/* Infos template */}
                <div style={{ background: '#0F172A', borderRadius: 14, padding: '18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <Zap size={14} style={{ color: '#FBBF24' }} />
                    <p style={{ fontSize: 12, fontWeight: 700, color: 'white' }}>Template intelligent</p>
                  </div>
                  <p style={{ fontSize: 12, color: '#64748B', lineHeight: 1.7, marginBottom: 14 }}>
                    Ce plan sera automatiquement proposé lors de la création de vos prochains événements. Vous pourrez l'ajuster à chaque fois.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[
                      { label: 'Allées configurées', value: `${allees} allée${allees > 1 ? 's' : ''}` },
                      { label: 'Total emplacements', value: `${totalCells} places` },
                      { label: 'Zones définies', value: `${zones.length} zone${zones.length > 1 ? 's' : ''}` },
                      { label: 'Taux de configuration', value: `${pctAssigned}%` },
                    ].map((item, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, paddingBottom: i < 3 ? 8 : 0, marginBottom: i < 3 ? 8 : 0, borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                        <span style={{ color: '#64748B' }}>{item.label}</span>
                        <span style={{ color: 'white', fontWeight: 600 }}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </motion.div>
            </div>
          )}

          {!generated && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
              style={{ textAlign: 'center', padding: '60px 0' }}>
              <div style={{ width: 64, height: 64, background: '#EEF2FF', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Grid size={28} style={{ color: '#4F46E5' }} />
              </div>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>Configurez votre terrain</p>
              <p style={{ fontSize: 13, color: '#94A3B8', maxWidth: 400, margin: '0 auto' }}>
                Définissez le nombre d'allées et d'emplacements, puis cliquez sur "Générer la grille" pour créer le plan interactif de votre marché.
              </p>
            </motion.div>
          )}

        </main>
      </div>
    </div>
  )
}
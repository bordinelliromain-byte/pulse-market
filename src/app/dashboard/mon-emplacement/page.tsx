'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Sidebar from '@/components/Sidebar'
import { MapPin, CheckCircle, Navigation, Users, ArrowLeft, Trophy } from 'lucide-react'

export default function MonEmplacement() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [attributions, setAttributions] = useState<any[]>([])
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(profileData)

      // Récupérer toutes les candidatures payées avec emplacement
      const { data: apps } = await supabase
        .from('applications')
        .select(`*, events:event_id(id, title, start_date, location_name, latitude, longitude)`)
        .eq('exposant_id', user.id)
        .eq('status', 'paid')
        .not('spot_label', 'is', null)

      if (apps && apps.length > 0) {
        // Pour chaque app, récupérer les voisins
        const appsWithNeighbors = await Promise.all(apps.map(async (app) => {
          const { data: spots } = await supabase
            .from('terrain_spots')
            .select(`*, application:application_id(*, profiles:exposant_id(full_name), exposant_data:exposant_id(business_name))`)
            .eq('event_id', app.event_id)
            .eq('type', 'attribue')

          const mySpot = spots?.find(s => s.application_id === app.id)
          if (!mySpot) return { ...app, mySpot: null, neighbors: [] }

          // Trouver voisins gauche/droite (même ligne)
          const leftSpot = spots?.find(s => s.row_index === mySpot.row_index && s.col_index === mySpot.col_index - 1)
          const rightSpot = spots?.find(s => s.row_index === mySpot.row_index && s.col_index === mySpot.col_index + 1)
          const frontSpot = spots?.find(s => s.row_index === mySpot.row_index - 1 && s.col_index === mySpot.col_index)

          return {
            ...app,
            mySpot,
            neighbors: {
              left: leftSpot?.application,
              right: rightSpot?.application,
              front: frontSpot?.application,
            }
          }
        }))
        setAttributions(appsWithNeighbors)
      }
      setLoading(false)
    }
    getData()
  }, [])

  const formatDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

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

      <div style={{ marginLeft: 220, flex: 1 }}>
        <header style={{ background: 'white', borderBottom: '1px solid #E2E8F0', padding: '0 28px', height: 52, display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 10 }}>
          <button onClick={() => router.push('/dashboard')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', fontSize: 13 }}>
            <ArrowLeft size={14} /> Retour
          </button>
          <div style={{ width: 1, height: 16, background: '#E2E8F0' }} />
          <p style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>Mon emplacement</p>
        </header>

        <main style={{ padding: '28px', maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {attributions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0', background: 'white', borderRadius: 16, border: '1px solid #E2E8F0' }}>
              <MapPin size={40} style={{ margin: '0 auto 16px', color: '#CBD5E1' }} />
              <p style={{ fontSize: 15, fontWeight: 600, color: '#64748B', marginBottom: 8 }}>Aucun emplacement attribué</p>
              <p style={{ fontSize: 13, color: '#94A3B8' }}>La mairie n'a pas encore attribué votre emplacement</p>
            </div>
          ) : attributions.map((app) => (
            <motion.div key={app.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>

              {/* Header événement */}
              <div style={{ background: 'linear-gradient(135deg, #0F172A, #1E293B)', borderRadius: 16, padding: '24px', marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ fontSize: 18, fontWeight: 800, color: 'white', marginBottom: 4 }}>{app.events?.title}</p>
                    <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#64748B' }}>
                      <span>📅 {formatDate(app.events?.start_date)}</span>
                      <span>📍 {app.events?.location_name}</span>
                    </div>
                  </div>
                  {app.mySpot && (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ width: 56, height: 56, background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
                        <span style={{ fontSize: 20, fontWeight: 800, color: 'white' }}>{app.spot_label}</span>
                      </div>
                      <p style={{ fontSize: 10, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Votre case</p>
                    </div>
                  )}
                </div>
              </div>

              {app.mySpot ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                  {/* Infos case */}
                  <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 14, padding: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                      <Trophy size={16} style={{ color: '#4F46E5' }} />
                      <p style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Votre emplacement</p>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      {[
                        { label: 'Case', value: app.spot_label },
                        { label: 'Dimensions', value: `${app.mySpot.width_m}m × ${app.mySpot.length_m}m` },
                        { label: 'Surface', value: `${app.mySpot.width_m * app.mySpot.length_m} m²` },
                        { label: 'Électricité', value: app.mySpot.needs_electricity ? '✓ Oui' : '✗ Non' },
                      ].map((item, i) => (
                        <div key={i} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: '12px 14px' }}>
                          <p style={{ fontSize: 11, color: '#94A3B8', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{item.label}</p>
                          <p style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Voisins */}
                  {(app.neighbors?.left || app.neighbors?.right || app.neighbors?.front) && (
                    <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 14, padding: '20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                        <Users size={16} style={{ color: '#4F46E5' }} />
                        <p style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Vos voisins</p>
                      </div>

                      {/* Plan simplifié */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
                        {/* Devant */}
                        <div style={{ gridColumn: '1 / -1', background: '#F8FAFC', border: '1px dashed #CBD5E1', borderRadius: 8, padding: '8px', textAlign: 'center', fontSize: 11, color: '#94A3B8' }}>
                          {app.neighbors?.front
                            ? `↑ ${app.neighbors.front.exposant_data?.business_name || app.neighbors.front.profiles?.full_name}`
                            : '↑ Entrée / Allée'}
                        </div>

                        {/* Gauche */}
                        <div style={{ background: app.neighbors?.left ? '#EEF2FF' : '#F8FAFC', border: `1px solid ${app.neighbors?.left ? '#C7D2FE' : '#E2E8F0'}`, borderRadius: 8, padding: '8px', textAlign: 'center', fontSize: 11, color: app.neighbors?.left ? '#4F46E5' : '#94A3B8' }}>
                          {app.neighbors?.left
                            ? `← ${app.neighbors.left.exposant_data?.business_name || app.neighbors.left.profiles?.full_name}`
                            : '← Libre'}
                        </div>

                        {/* Vous */}
                        <div style={{ background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', borderRadius: 8, padding: '8px', textAlign: 'center' }}>
                          <p style={{ fontSize: 13, fontWeight: 800, color: 'white' }}>{app.spot_label}</p>
                          <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)' }}>VOUS</p>
                        </div>

                        {/* Droite */}
                        <div style={{ background: app.neighbors?.right ? '#EEF2FF' : '#F8FAFC', border: `1px solid ${app.neighbors?.right ? '#C7D2FE' : '#E2E8F0'}`, borderRadius: 8, padding: '8px', textAlign: 'center', fontSize: 11, color: app.neighbors?.right ? '#4F46E5' : '#94A3B8' }}>
                          {app.neighbors?.right
                            ? `${app.neighbors.right.exposant_data?.business_name || app.neighbors.right.profiles?.full_name} →`
                            : 'Libre →'}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* GPS */}
                  {app.events?.latitude && app.events?.longitude && (
                    <a href={`https://www.google.com/maps/dir/?api=1&destination=${app.events.latitude},${app.events.longitude}`}
                      target="_blank" rel="noopener noreferrer"
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, background: '#4F46E5', color: 'white', borderRadius: 12, padding: '14px', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
                      <Navigation size={16} /> Itinéraire vers le marché
                    </a>
                  )}
                </div>
              ) : (
                <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 14, padding: '20px', textAlign: 'center' }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#92400E', marginBottom: 6 }}>⏳ Emplacement en cours d'attribution</p>
                  <p style={{ fontSize: 13, color: '#D97706' }}>La mairie va bientôt vous attribuer votre case. Vous recevrez une notification.</p>
                </div>
              )}
            </motion.div>
          ))}
        </main>
      </div>
    </div>
  )
}
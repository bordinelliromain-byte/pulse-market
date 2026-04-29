'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import Sidebar from '@/components/Sidebar'
import {
  Euro, TrendingUp, CheckCircle, Clock,
  Download, Calendar, CreditCard, BarChart3
} from 'lucide-react'

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
}

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
}

export default function Tresorerie() {
  const [profile, setProfile] = useState<any>(null)
  const [events, setEvents] = useState<any[]>([])
  const [candidatures, setCandidatures] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (profileData?.role !== 'organisateur') { router.push('/dashboard'); return }
      setProfile(profileData)

      const { data: eventsData } = await supabase.from('events').select('*').eq('organisateur_id', user.id)
      setEvents(eventsData || [])

      const eventIds = eventsData?.map((e: any) => e.id) || []
      if (eventIds.length > 0) {
        const { data: apps } = await supabase
          .from('applications')
          .select('*, events:event_id(title, price_per_spot, start_date)')
          .in('event_id', eventIds)
          .order('created_at', { ascending: false })
        setCandidatures(apps || [])
      }
      setLoading(false)
    }
    getData()
  }, [])

  const validated = candidatures.filter(c => c.status === 'validated' || c.status === 'paid')
  const paid = candidatures.filter(c => c.status === 'paid')
  const pending = candidatures.filter(c => c.status === 'pending')

  const revenueValidated = validated.reduce((acc, c) => acc + (c.events?.price_per_spot || 0), 0)
  const revenuePaid = paid.reduce((acc, c) => acc + (c.events?.price_per_spot || 0), 0)

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

      <div style={{ marginLeft: 220, flex: 1 }}>
        <header style={{ background: 'white', borderBottom: '1px solid #E2E8F0', padding: '0 28px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>Trésorerie</p>
          <button
            onClick={() => {
              const csv = candidatures.map(c => `${c.id};${c.events?.title};${c.status};${c.events?.price_per_spot || 0}€`).join('\n')
              const blob = new Blob([`ID;Événement;Statut;Montant\n${csv}`], { type: 'text/csv' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = 'tresorerie-placemarket.csv'
              a.click()
            }}
            style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#F8FAFC', color: '#475569', border: '1px solid #E2E8F0', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
            <Download size={13} /> Exporter CSV
          </button>
        </header>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

        <main style={{ padding: '24px 28px' }}>
          <motion.div variants={stagger} initial="hidden" animate="visible" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* STATS */}
            <motion.div variants={fadeUp} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
              {[
                { label: 'Recettes encaissées', value: `${revenuePaid} €`, icon: <CheckCircle size={15} style={{ color: '#16A34A' }} />, color: '#16A34A' },
                { label: 'Recettes validées', value: `${revenueValidated} €`, icon: <TrendingUp size={15} style={{ color: '#4F46E5' }} />, color: '#4F46E5' },
                { label: 'Dossiers en attente', value: pending.length, icon: <Clock size={15} style={{ color: '#F59E0B' }} />, color: '#F59E0B' },
                { label: 'Événements actifs', value: events.length, icon: <BarChart3 size={15} style={{ color: '#0EA5E9' }} />, color: '#0EA5E9' },
              ].map((s, i) => (
                <div key={i} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</span>
                    {s.icon}
                  </div>
                  <p style={{ fontSize: 26, fontWeight: 700, color: s.color }}>{s.value}</p>
                </div>
              ))}
            </motion.div>

            {/* STRIPE BANNER */}
            <motion.div variants={fadeUp} style={{ background: '#0F172A', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, background: 'rgba(79,70,229,0.2)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CreditCard size={18} style={{ color: '#818CF8' }} />
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'white', marginBottom: 2 }}>Paiements Stripe — Bientôt disponible</p>
                  <p style={{ fontSize: 11, color: '#64748B' }}>Les redevances AOT seront collectées automatiquement et virées sur votre compte municipal</p>
                </div>
              </div>
              <span style={{ fontSize: 11, background: '#1E293B', color: '#64748B', padding: '4px 10px', borderRadius: 100, whiteSpace: 'nowrap' }}>
                Q3 2026
              </span>
            </motion.div>

            {/* TABLEAU PAR ÉVÉNEMENT */}
            <motion.div variants={fadeUp} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #F1F5F9' }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>Détail par événement</p>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #F1F5F9', background: '#FAFAFA' }}>
                    {['Événement', 'Date', 'Exposants validés', 'Prix/emplacement', 'Total estimé', 'Statut'].map((h, i) => (
                      <th key={i} style={{ padding: '11px 18px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {events.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>
                        Aucun événement créé pour le moment
                      </td>
                    </tr>
                  ) : events.map((event, i) => {
                    const eventApps = candidatures.filter(c => c.event_id === event.id && (c.status === 'validated' || c.status === 'paid'))
                    const total = eventApps.length * (event.price_per_spot || 0)
                    return (
                      <tr key={event.id}
                        style={{ borderBottom: i < events.length - 1 ? '1px solid #F8FAFC' : 'none', transition: 'background 0.1s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <td style={{ padding: '14px 18px' }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{event.title}</p>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#64748B' }}>
                            <Calendar size={11} />
                            {formatDate(event.start_date)}
                          </div>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{eventApps.length}</p>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <p style={{ fontSize: 13, color: '#475569' }}>{event.price_per_spot || 0} €</p>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <p style={{ fontSize: 13, fontWeight: 700, color: '#4F46E5' }}>{total} €</p>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <span style={{ fontSize: 11, fontWeight: 600, background: event.status === 'published' ? '#F0FDF4' : '#F8FAFC', color: event.status === 'published' ? '#16A34A' : '#94A3B8', padding: '3px 9px', borderRadius: 100, border: `1px solid ${event.status === 'published' ? '#BBF7D0' : '#E2E8F0'}` }}>
                            {event.status === 'published' ? 'Actif' : 'Fermé'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </motion.div>

          </motion.div>
        </main>
      </div>
    </div>
  )
}
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import Sidebar from '@/components/Sidebar'
import { Download, CheckCircle, Clock, FileText, Zap, MapPin } from 'lucide-react'

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
}
const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
}

type FacturePlace = {
  id: string
  event_title: string
  event_date: string
  event_location: string
  montant: number
  statut: string
  stripe_session_id: string
  created_at: string
}

type FacturePub = {
  id: string
  nom: string
  offre: string
  event_title: string
  montant: number
  type: 'boost' | 'exposant_boost'
  stripe_session_id: string
  created_at: string
}

export default function Factures() {
  const [profile, setProfile] = useState<any>(null)
  const [facturesPlace, setFacturesPlace] = useState<FacturePlace[]>([])
  const [facturesPub, setFacturesPub] = useState<FacturePub[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'place' | 'pub'>('place')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }

      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(profileData)

      // ── Droits de place (candidatures payées) ──────────────────────────
      const { data: apps } = await supabase
        .from('applications')
        .select(`*, events:event_id(title, start_date, location_name, price_per_spot)`)
        .eq('exposant_id', user.id)
        .eq('status', 'paid')
        .order('created_at', { ascending: false })

      if (apps) {
        setFacturesPlace(apps.map((a: any) => ({
          id: a.id,
          event_title: a.events?.title || 'Événement',
          event_date: a.events?.start_date || a.created_at,
          event_location: a.events?.location_name || '',
          montant: (a.events?.price_per_spot || 0) + 2,
          statut: 'paid',
          stripe_session_id: a.stripe_session_id || '',
          created_at: a.created_at,
        })))
      }

      // ── Pubs Boost commerçant ──────────────────────────────────────────
      const { data: boosts } = await supabase
        .from('boost_ads')
        .select('*')
        .eq('email', profileData?.email || '')
        .order('created_at', { ascending: false })

      // ── Pubs Boost exposant ───────────────────────────────────────────
      const { data: expBoosts } = await supabase
        .from('exposant_boosts')
        .select('*')
        .eq('exposant_id', user.id)
        .order('created_at', { ascending: false })

      const pubs: FacturePub[] = [
        ...(boosts || []).map((b: any) => ({
          id: b.id,
          nom: b.nom,
          offre: b.offre,
          event_title: b.event_id,
          montant: b.amount || 20,
          type: 'boost' as const,
          stripe_session_id: b.stripe_session_id || '',
          created_at: b.created_at,
        })),
        ...(expBoosts || []).map((b: any) => ({
          id: b.id,
          nom: b.nom,
          offre: b.offre,
          event_title: b.event_id,
          montant: b.amount || 15,
          type: 'exposant_boost' as const,
          stripe_session_id: b.stripe_session_id || '',
          created_at: b.created_at,
        })),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      // Enrichir avec les titres des events
      const eventIds = [...new Set(pubs.map(p => p.event_title).filter(Boolean))]
      if (eventIds.length > 0) {
        const { data: events } = await supabase.from('events').select('id, title').in('id', eventIds)
        const eventMap = Object.fromEntries((events || []).map((e: any) => [e.id, e.title]))
        setFacturesPub(pubs.map(p => ({ ...p, event_title: eventMap[p.event_title] || p.event_title })))
      } else {
        setFacturesPub(pubs)
      }

      setLoading(false)
    }
    getData()
  }, [])

  const totalPlace = facturesPlace.reduce((acc, f) => acc + f.montant, 0)
  const totalPub = facturesPub.reduce((acc, f) => acc + f.montant, 0)
  const formatDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  const formatRef = (id: string) => `FAC-${id.slice(0, 8).toUpperCase()}`

  const exportCSV = () => {
    const rows = [
      ['Référence', 'Type', 'Description', 'Date', 'Montant', 'Statut'],
      ...facturesPlace.map(f => [formatRef(f.id), 'Droit de place', f.event_title, formatDate(f.event_date), `${f.montant}€`, 'Payé']),
      ...facturesPub.map(f => [formatRef(f.id), f.type === 'boost' ? 'Pub commerçant' : 'Pub exposant', `${f.nom} — ${f.offre}`, formatDate(f.created_at), `${f.montant}€`, 'Payé']),
    ]
    const csv = rows.map(r => r.join(';')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'factures-PulseMarket.csv'; a.click()
  }

  const openFacture = (type: string, data: any) => {
    // Ouvre la facture PDF en utilisant la lib existante si dispo
    try {
      if (type === 'place') {
        const { openFacturePDF } = require('@/lib/generateFacture')
        openFacturePDF({
          candidatureId: formatRef(data.id),
          exposantNom: profile?.full_name || '',
          exposantEmail: profile?.email || '',
          exposantBusinessName: profile?.full_name,
          eventTitle: data.event_title,
          eventDate: formatDate(data.event_date),
          eventLocation: data.event_location,
          redevanceAOT: data.montant - 2,
          fraisPlateforme: 2,
        })
      } else {
        // Pour les pubs : ouvrir la facture boost PDF
        alert(`Facture ${formatRef(data.id)} — ${data.nom}\nMontant : ${data.montant}€\nVotre facture a été envoyée par email lors du paiement.`)
      }
    } catch (err) {
      alert('Facture envoyée par email lors du paiement.')
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
      <div className="dash-wrap" style={{ marginLeft: 220, flex: 1 }}>
        <header style={{ background: 'white', borderBottom: '1px solid #E2E8F0', padding: '0 28px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>Mes factures</p>
          <button onClick={exportCSV}
            style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#F8FAFC', color: '#475569', border: '1px solid #E2E8F0', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
            <Download size={13} /> Exporter CSV
          </button>
        </header>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

        <main className="dash-main" style={{ padding: "24px 28px" }}>
          <motion.div variants={stagger} initial="hidden" animate="visible" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* KPIs */}
            <motion.div variants={fadeUp} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
              {[
                { label: 'Droits de place payés', value: `${totalPlace} €`, color: '#16A34A', bg: '#F0FDF4', icon: <MapPin size={14} style={{ color: '#16A34A' }} /> },
                { label: 'Pubs Whatmarket', value: `${totalPub} €`, color: '#4F46E5', bg: '#EEF2FF', icon: <Zap size={14} style={{ color: '#4F46E5' }} /> },
                { label: 'Total dépensé', value: `${totalPlace + totalPub} €`, color: '#0F172A', bg: '#F1F5F9', icon: <CheckCircle size={14} style={{ color: '#64748B' }} /> },
                { label: 'Factures totales', value: `${facturesPlace.length + facturesPub.length}`, color: '#0F172A', bg: '#F1F5F9', icon: <FileText size={14} style={{ color: '#64748B' }} /> },
              ].map((s, i) => (
                <div key={i} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: '16px 18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <span style={{ fontSize: 10, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</span>
                    <div style={{ width: 28, height: 28, background: s.bg, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{s.icon}</div>
                  </div>
                  <p style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</p>
                </div>
              ))}
            </motion.div>

            {/* Tabs */}
            <motion.div variants={fadeUp} style={{ display: 'flex', gap: 8 }}>
              {[
                { key: 'place', label: `Droits de place (${facturesPlace.length})`, icon: <MapPin size={13} /> },
                { key: 'pub', label: `Publicités Whatmarket (${facturesPub.length})`, icon: <Zap size={13} /> },
              ].map(tab => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: "'Inter', sans-serif", background: activeTab === tab.key ? '#111827' : 'white', color: activeTab === tab.key ? 'white' : '#64748B', boxShadow: activeTab === tab.key ? '0 2px 8px rgba(0,0,0,0.12)' : '0 1px 4px rgba(0,0,0,0.06)' }}>
                  {tab.icon} {tab.label}
                </button>
              ))}
            </motion.div>

            {/* Table droits de place */}
            {activeTab === 'place' && (
              <motion.div variants={fadeUp} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>Droits de place payés</p>
                  <span style={{ fontSize: 11, color: '#94A3B8' }}>{facturesPlace.length} paiement(s)</span>
                </div>
                {facturesPlace.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>
                    Aucun droit de place payé pour le moment
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #F1F5F9', background: '#FAFAFA' }}>
                        {['Référence', 'Marché', 'Date', 'Lieu', 'Montant', 'Statut', ''].map((h, i) => (
                          <th key={i} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {facturesPlace.map((f, i) => (
                        <tr key={f.id}
                          style={{ borderBottom: i < facturesPlace.length - 1 ? '1px solid #F8FAFC' : 'none', transition: 'background 0.1s' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <td style={{ padding: '13px 16px' }}>
                            <p style={{ fontSize: 11, fontWeight: 600, color: '#0F172A', fontFamily: 'monospace' }}>{formatRef(f.id)}</p>
                          </td>
                          <td style={{ padding: '13px 16px' }}>
                            <p style={{ fontSize: 12, color: '#475569', maxWidth: 180 }}>{f.event_title}</p>
                          </td>
                          <td style={{ padding: '13px 16px', fontSize: 11, color: '#64748B', whiteSpace: 'nowrap' }}>{formatDate(f.event_date)}</td>
                          <td style={{ padding: '13px 16px', fontSize: 11, color: '#94A3B8', maxWidth: 140 }}>{f.event_location}</td>
                          <td style={{ padding: '13px 16px' }}>
                            <p style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{f.montant} €</p>
                          </td>
                          <td style={{ padding: '13px 16px' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#F0FDF4', color: '#16A34A', fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 100, border: '1px solid #BBF7D0' }}>
                              <CheckCircle size={9} /> Payé
                            </span>
                          </td>
                          <td style={{ padding: '13px 16px' }}>
                            <button onClick={() => openFacture('place', f)}
                              style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 7, padding: '5px 10px', cursor: 'pointer', fontSize: 11, color: '#4F46E5', fontWeight: 600, whiteSpace: 'nowrap' }}>
                              <FileText size={10} /> Facture
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </motion.div>
            )}

            {/* Table pubs */}
            {activeTab === 'pub' && (
              <motion.div variants={fadeUp} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>Publicités Whatmarket</p>
                  <span style={{ fontSize: 11, color: '#94A3B8' }}>{facturesPub.length} publication(s)</span>
                </div>
                {facturesPub.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center' }}>
                    <p style={{ color: '#94A3B8', fontSize: 13, marginBottom: 12 }}>Aucune pub Whatmarket pour le moment</p>
                    <button onClick={() => router.push('/pro/ads/new')}
                      style={{ background: '#4F46E5', color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      🚀 Booster ma visibilité
                    </button>
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #F1F5F9', background: '#FAFAFA' }}>
                        {['Référence', 'Commerce', 'Offre', 'Type', 'Date', 'Montant', ''].map((h, i) => (
                          <th key={i} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {facturesPub.map((f, i) => (
                        <tr key={f.id}
                          style={{ borderBottom: i < facturesPub.length - 1 ? '1px solid #F8FAFC' : 'none', transition: 'background 0.1s' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <td style={{ padding: '13px 16px' }}>
                            <p style={{ fontSize: 11, fontWeight: 600, color: '#0F172A', fontFamily: 'monospace' }}>{formatRef(f.id)}</p>
                          </td>
                          <td style={{ padding: '13px 16px' }}>
                            <p style={{ fontSize: 12, fontWeight: 600, color: '#0F172A' }}>{f.nom}</p>
                          </td>
                          <td style={{ padding: '13px 16px' }}>
                            <p style={{ fontSize: 11, color: '#64748B', maxWidth: 160 }}>{f.offre}</p>
                          </td>
                          <td style={{ padding: '13px 16px' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: f.type === 'boost' ? '#EEF2FF' : '#F0FDF4', color: f.type === 'boost' ? '#4F46E5' : '#16A34A', fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 100 }}>
                              {f.type === 'boost' ? '🛍️ Commerçant' : '⭐ Exposant'}
                            </span>
                          </td>
                          <td style={{ padding: '13px 16px', fontSize: 11, color: '#64748B', whiteSpace: 'nowrap' }}>{formatDate(f.created_at)}</td>
                          <td style={{ padding: '13px 16px' }}>
                            <p style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{f.montant} €</p>
                          </td>
                          <td style={{ padding: '13px 16px' }}>
                            <button onClick={() => openFacture('pub', f)}
                              style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 7, padding: '5px 10px', cursor: 'pointer', fontSize: 11, color: '#4F46E5', fontWeight: 600, whiteSpace: 'nowrap' }}>
                              <FileText size={10} /> Facture
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </motion.div>
            )}

            {/* Info comptabilité */}
            <motion.div variants={fadeUp} style={{ background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <FileText size={14} style={{ color: '#4F46E5', flexShrink: 0, marginTop: 1 }} />
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#4338CA', marginBottom: 3 }}>Pour votre comptabilité</p>
                <p style={{ fontSize: 12, color: '#4F46E5', lineHeight: 1.6 }}>
                  Les factures PDF ont été envoyées par email lors de chaque paiement. 
                  Cliquez sur "Facture" pour ouvrir le PDF officiel. 
                  Utilisez "Exporter CSV" pour l'intégration dans votre logiciel comptable.
                </p>
              </div>
            </motion.div>

          </motion.div>
        </main>
      </div>
    </div>
  )
}
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import Sidebar from '@/components/Sidebar'
import { Download, CheckCircle, FileText, Zap, MapPin, Star, ExternalLink } from 'lucide-react'

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
}
const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
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

type FacturePlace = {
  id: string; event_title: string; event_date: string; event_location: string
  montant: number; statut: string; stripe_session_id: string; created_at: string
}
type FacturePub = {
  id: string; nom: string; offre: string; event_title: string
  montant: number; type: 'boost' | 'exposant_boost'; stripe_session_id: string; created_at: string
}
type FacturePro = {
  id: string; periode: string; montant: number; stripe_invoice_url: string; created_at: string
}

export default function Factures() {
  const [profile, setProfile] = useState<any>(null)
  const [facturesPlace, setFacturesPlace] = useState<FacturePlace[]>([])
  const [facturesPub, setFacturesPub] = useState<FacturePub[]>([])
  const [facturesPro, setFacturesPro] = useState<FacturePro[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'place' | 'pub' | 'pro'>('place')
  const router = useRouter()
  const supabase = createClient()
  const isMobile = useIsMobile()

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(profileData)

      // ── Droits de place
      const { data: apps } = await supabase.from('applications')
        .select(`*, events:event_id(title, start_date, location_name, price_per_spot)`)
        .eq('exposant_id', user.id).eq('status', 'paid').order('created_at', { ascending: false })

      if (apps) {
        setFacturesPlace(apps.map((a: any) => ({
          id: a.id, event_title: a.events?.title || 'Événement',
          event_date: a.events?.start_date || a.created_at,
          event_location: a.events?.location_name || '',
          montant: (a.events?.price_per_spot || 0) + 2, statut: 'paid',
          stripe_session_id: a.stripe_session_id || '', created_at: a.created_at,
        })))
      }

      // ── Pubs Whatmarket
      const { data: boosts } = await supabase.from('boost_ads').select('*')
        .eq('email', profileData?.email || '').order('created_at', { ascending: false })
      const { data: expBoosts } = await supabase.from('exposant_boosts').select('*')
        .eq('exposant_id', user.id).order('created_at', { ascending: false })

      const pubs: FacturePub[] = [
        ...(boosts || []).map((b: any) => ({ id: b.id, nom: b.nom, offre: b.offre, event_title: b.event_id, montant: b.amount || 20, type: 'boost' as const, stripe_session_id: b.stripe_session_id || '', created_at: b.created_at })),
        ...(expBoosts || []).map((b: any) => ({ id: b.id, nom: b.nom, offre: b.offre, event_title: b.event_id, montant: b.amount || 15, type: 'exposant_boost' as const, stripe_session_id: b.stripe_session_id || '', created_at: b.created_at })),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      const eventIds = [...new Set(pubs.map(p => p.event_title).filter(Boolean))]
      if (eventIds.length > 0) {
        const { data: events } = await supabase.from('events').select('id, title').in('id', eventIds)
        const eventMap = Object.fromEntries((events || []).map((e: any) => [e.id, e.title]))
        setFacturesPub(pubs.map(p => ({ ...p, event_title: eventMap[p.event_title] || p.event_title })))
      } else { setFacturesPub(pubs) }

      // ── Abonnement Pro — depuis stripe_invoices ou construit depuis pro_expires_at
      const { data: invoices } = await supabase.from('stripe_invoices')
        .select('*').eq('user_id', user.id).order('created_at', { ascending: false })

      if (invoices && invoices.length > 0) {
        setFacturesPro(invoices.map((inv: any) => ({
          id: inv.id,
          periode: new Date(inv.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
          montant: inv.amount || 20,
          stripe_invoice_url: inv.hosted_invoice_url || '',
          created_at: inv.created_at,
        })))
      } else if (profileData?.plan === 'pro' && profileData?.stripe_subscription_id) {
        // Fallback : on sait qu'il est Pro mais pas d'historique
        setFacturesPro([{
          id: profileData.stripe_subscription_id,
          periode: new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
          montant: 20,
          stripe_invoice_url: '',
          created_at: new Date().toISOString(),
        }])
      }

      setLoading(false)
    }
    getData()
  }, [])

  const totalPlace = facturesPlace.reduce((acc, f) => acc + f.montant, 0)
  const totalPub = facturesPub.reduce((acc, f) => acc + f.montant, 0)
  const totalPro = facturesPro.reduce((acc, f) => acc + f.montant, 0)
  const formatDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  const formatDateShort = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  const formatRef = (id: string) => `FAC-${id.slice(0, 8).toUpperCase()}`

  const exportCSV = () => {
    const rows = [
      ['Référence', 'Type', 'Description', 'Date', 'Montant', 'Statut'],
      ...facturesPlace.map(f => [formatRef(f.id), 'Droit de place', f.event_title, formatDate(f.event_date), `${f.montant}€`, 'Payé']),
      ...facturesPub.map(f => [formatRef(f.id), f.type === 'boost' ? 'Pub commerçant' : 'Pub exposant', `${f.nom} — ${f.offre}`, formatDate(f.created_at), `${f.montant}€`, 'Payé']),
      ...facturesPro.map(f => [formatRef(f.id), 'Abonnement Pro', `PulseMarket Pro — ${f.periode}`, formatDate(f.created_at), `${f.montant}€`, 'Payé']),
    ]
    const blob = new Blob([rows.map(r => r.join(';')).join('\n')], { type: 'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'factures-PulseMarket.csv'; a.click()
  }

  const openFacture = (type: string, data: any) => {
    try {
      if (type === 'place') {
        const { openFacturePDF } = require('@/lib/generateFacture')
        openFacturePDF({ candidatureId: formatRef(data.id), exposantNom: profile?.full_name || '', exposantEmail: profile?.email || '', exposantBusinessName: profile?.full_name, eventTitle: data.event_title, eventDate: formatDate(data.event_date), eventLocation: data.event_location, redevanceAOT: data.montant - 2, fraisPlateforme: 2 })
      } else if (type === 'pro' && data.stripe_invoice_url) {
        window.open(data.stripe_invoice_url, '_blank')
      } else {
        alert(`Facture ${formatRef(data.id)}\nMontant : ${data.montant}€\nEnvoyée par email lors du paiement.`)
      }
    } catch { alert('Facture envoyée par email lors du paiement.') }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 28, height: 28, border: '2px solid #4F46E5', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  const FactureCardMobile = ({ f, type }: { f: any; type: 'place' | 'pub' | 'pro' }) => (
    <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: type === 'pro' ? '#FEF3C7' : '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {type === 'pro' ? <Star size={17} style={{ color: '#D97706' }} /> : <FileText size={17} style={{ color: '#4F46E5' }} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {type === 'place' ? f.event_title : type === 'pro' ? `PulseMarket Pro — ${f.periode}` : f.nom}
        </p>
        <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
          {type === 'place' ? formatDateShort(f.event_date) : type === 'pro' ? 'Abonnement mensuel' : f.offre}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
          <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#64748B' }}>{formatRef(f.id)}</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: '#F0FDF4', color: '#16A34A', fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 100 }}>
            <CheckCircle size={8} /> Payé
          </span>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
        <p style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>{f.montant} €</p>
        <button onClick={() => openFacture(type, f)}
          style={{ display: 'flex', alignItems: 'center', gap: 4, background: type === 'pro' ? '#FEF3C7' : '#4F46E5', color: type === 'pro' ? '#D97706' : 'white', border: type === 'pro' ? '1px solid #FDE68A' : 'none', borderRadius: 7, padding: '5px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
          <FileText size={10} /> {type === 'pro' && f.stripe_invoice_url ? 'Stripe' : 'PDF'}
        </button>
      </div>
    </div>
  )

  const tabs = [
    { key: 'place', label: `Droits de place (${facturesPlace.length})`, icon: <MapPin size={13} /> },
    { key: 'pub', label: `Pubs Whatmarket (${facturesPub.length})`, icon: <Zap size={13} /> },
    { key: 'pro', label: `Abonnement Pro (${facturesPro.length})`, icon: <Star size={13} /> },
  ]

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <Sidebar profile={profile} />
      <div style={{ marginLeft: isMobile ? 0 : 220, flex: 1, minWidth: 0 }}>

        <header style={{ background: 'white', borderBottom: '1px solid #E2E8F0', padding: isMobile ? '0 14px 0 60px' : '0 28px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>Mes factures</p>
          <button onClick={exportCSV}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F8FAFC', color: '#475569', border: '1px solid #E2E8F0', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
            <Download size={13} /> {!isMobile && 'Exporter'} CSV
          </button>
        </header>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

        <main style={{ padding: isMobile ? '14px' : '24px 28px' }}>
          <motion.div variants={stagger} initial="hidden" animate="visible" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* KPIs */}
            <motion.div variants={fadeUp} style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 10 }}>
              {[
                { label: 'Droits de place', value: `${totalPlace} €`, color: '#16A34A', bg: '#F0FDF4', icon: <MapPin size={13} style={{ color: '#16A34A' }} /> },
                { label: 'Pubs Whatmarket', value: `${totalPub} €`, color: '#4F46E5', bg: '#EEF2FF', icon: <Zap size={13} style={{ color: '#4F46E5' }} /> },
                { label: 'Abonnement Pro', value: `${totalPro} €`, color: '#D97706', bg: '#FEF3C7', icon: <Star size={13} style={{ color: '#D97706' }} /> },
                { label: 'Total dépensé', value: `${totalPlace + totalPub + totalPro} €`, color: '#0F172A', bg: '#F1F5F9', icon: <CheckCircle size={13} style={{ color: '#64748B' }} /> },
              ].map((s, i) => (
                <div key={i} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: '14px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <span style={{ fontSize: 10, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</span>
                    <div style={{ width: 26, height: 26, background: s.bg, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{s.icon}</div>
                  </div>
                  <p style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</p>
                </div>
              ))}
            </motion.div>

            {/* Tabs */}
            <motion.div variants={fadeUp} style={{ display: 'flex', gap: 8, overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', paddingBottom: 2 }}>
              {tabs.map(tab => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: "'Inter', sans-serif", background: activeTab === tab.key ? '#111827' : 'white', color: activeTab === tab.key ? 'white' : '#64748B', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {tab.icon} {tab.label}
                </button>
              ))}
            </motion.div>

            {/* MOBILE */}
            {isMobile && (
              <motion.div variants={fadeUp}>
                {(activeTab === 'place' ? facturesPlace : activeTab === 'pub' ? facturesPub : facturesPro).length === 0 ? (
                  <div style={{ padding: '40px 0', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>
                    {activeTab === 'place' ? 'Aucun droit de place payé' : activeTab === 'pub' ? 'Aucune pub Whatmarket' : 'Aucune facture Pro'}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {(activeTab === 'place' ? facturesPlace : activeTab === 'pub' ? facturesPub : facturesPro).map((f: any) => (
                      <FactureCardMobile key={f.id} f={f} type={activeTab} />
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* DESKTOP — Droits de place */}
            {!isMobile && activeTab === 'place' && (
              <motion.div variants={fadeUp} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>Droits de place payés</p>
                  <span style={{ fontSize: 11, color: '#94A3B8' }}>{facturesPlace.length} paiement(s)</span>
                </div>
                {facturesPlace.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>Aucun droit de place payé</div>
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
                        <tr key={f.id} style={{ borderBottom: i < facturesPlace.length - 1 ? '1px solid #F8FAFC' : 'none' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <td style={{ padding: '13px 16px' }}><p style={{ fontSize: 11, fontWeight: 600, color: '#0F172A', fontFamily: 'monospace' }}>{formatRef(f.id)}</p></td>
                          <td style={{ padding: '13px 16px' }}><p style={{ fontSize: 12, color: '#475569', maxWidth: 180 }}>{f.event_title}</p></td>
                          <td style={{ padding: '13px 16px', fontSize: 11, color: '#64748B', whiteSpace: 'nowrap' }}>{formatDate(f.event_date)}</td>
                          <td style={{ padding: '13px 16px', fontSize: 11, color: '#94A3B8', maxWidth: 140 }}>{f.event_location}</td>
                          <td style={{ padding: '13px 16px' }}><p style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{f.montant} €</p></td>
                          <td style={{ padding: '13px 16px' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#F0FDF4', color: '#16A34A', fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 100, border: '1px solid #BBF7D0' }}>
                              <CheckCircle size={9} /> Payé
                            </span>
                          </td>
                          <td style={{ padding: '13px 16px' }}>
                            <button onClick={() => openFacture('place', f)}
                              style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 7, padding: '5px 10px', cursor: 'pointer', fontSize: 11, color: '#4F46E5', fontWeight: 600 }}>
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

            {/* DESKTOP — Pubs */}
            {!isMobile && activeTab === 'pub' && (
              <motion.div variants={fadeUp} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>Publicités Whatmarket</p>
                  <span style={{ fontSize: 11, color: '#94A3B8' }}>{facturesPub.length} publication(s)</span>
                </div>
                {facturesPub.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center' }}>
                    <p style={{ color: '#94A3B8', fontSize: 13, marginBottom: 12 }}>Aucune pub Whatmarket</p>
                    <button onClick={() => router.push('/pro/ads/new')} style={{ background: '#4F46E5', color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
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
                        <tr key={f.id} style={{ borderBottom: i < facturesPub.length - 1 ? '1px solid #F8FAFC' : 'none' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <td style={{ padding: '13px 16px' }}><p style={{ fontSize: 11, fontWeight: 600, color: '#0F172A', fontFamily: 'monospace' }}>{formatRef(f.id)}</p></td>
                          <td style={{ padding: '13px 16px' }}><p style={{ fontSize: 12, fontWeight: 600, color: '#0F172A' }}>{f.nom}</p></td>
                          <td style={{ padding: '13px 16px' }}><p style={{ fontSize: 11, color: '#64748B', maxWidth: 160 }}>{f.offre}</p></td>
                          <td style={{ padding: '13px 16px' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: f.type === 'boost' ? '#EEF2FF' : '#F0FDF4', color: f.type === 'boost' ? '#4F46E5' : '#16A34A', fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 100 }}>
                              {f.type === 'boost' ? '🛍️ Commerçant' : '⭐ Exposant'}
                            </span>
                          </td>
                          <td style={{ padding: '13px 16px', fontSize: 11, color: '#64748B', whiteSpace: 'nowrap' }}>{formatDate(f.created_at)}</td>
                          <td style={{ padding: '13px 16px' }}><p style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{f.montant} €</p></td>
                          <td style={{ padding: '13px 16px' }}>
                            <button onClick={() => openFacture('pub', f)}
                              style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 7, padding: '5px 10px', cursor: 'pointer', fontSize: 11, color: '#4F46E5', fontWeight: 600 }}>
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

            {/* DESKTOP — Abonnement Pro */}
            {!isMobile && activeTab === 'pro' && (
              <motion.div variants={fadeUp} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Star size={14} style={{ color: '#D97706' }} />
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>Abonnement Pro mensuel</p>
                  </div>
                  <span style={{ fontSize: 11, color: '#94A3B8' }}>{facturesPro.length} paiement(s)</span>
                </div>
                {facturesPro.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center' }}>
                    <p style={{ color: '#94A3B8', fontSize: 13, marginBottom: 12 }}>Pas encore d'abonnement Pro</p>
                    <button onClick={() => router.push('/dashboard/parametres')} style={{ background: '#4F46E5', color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      ⚡ Passer Pro — 20€/mois
                    </button>
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #F1F5F9', background: '#FAFAFA' }}>
                        {['Référence', 'Période', 'Date', 'Montant', 'Statut', ''].map((h, i) => (
                          <th key={i} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {facturesPro.map((f, i) => (
                        <tr key={f.id} style={{ borderBottom: i < facturesPro.length - 1 ? '1px solid #F8FAFC' : 'none' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <td style={{ padding: '13px 16px' }}><p style={{ fontSize: 11, fontWeight: 600, color: '#0F172A', fontFamily: 'monospace' }}>{formatRef(f.id)}</p></td>
                          <td style={{ padding: '13px 16px' }}><p style={{ fontSize: 12, fontWeight: 600, color: '#0F172A' }}>PulseMarket Pro — {f.periode}</p></td>
                          <td style={{ padding: '13px 16px', fontSize: 11, color: '#64748B', whiteSpace: 'nowrap' }}>{formatDate(f.created_at)}</td>
                          <td style={{ padding: '13px 16px' }}><p style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{f.montant} €</p></td>
                          <td style={{ padding: '13px 16px' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#F0FDF4', color: '#16A34A', fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 100, border: '1px solid #BBF7D0' }}>
                              <CheckCircle size={9} /> Payé
                            </span>
                          </td>
                          <td style={{ padding: '13px 16px' }}>
                            {f.stripe_invoice_url ? (
                              <button onClick={() => window.open(f.stripe_invoice_url, '_blank')}
                                style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 7, padding: '5px 10px', cursor: 'pointer', fontSize: 11, color: '#D97706', fontWeight: 600 }}>
                                <ExternalLink size={10} /> Stripe
                              </button>
                            ) : (
                              <span style={{ fontSize: 11, color: '#94A3B8' }}>Envoyée par email</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </motion.div>
            )}

            {/* Info */}
            <motion.div variants={fadeUp} style={{ background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <FileText size={14} style={{ color: '#4F46E5', flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 12, color: '#4F46E5', lineHeight: 1.6 }}>
                <strong style={{ color: '#4338CA' }}>Pour votre comptabilité —</strong> Les factures PDF ont été envoyées par email lors de chaque paiement. Utilisez "Exporter CSV" pour votre logiciel comptable.
              </p>
            </motion.div>

          </motion.div>
        </main>
      </div>
    </div>
  )
}
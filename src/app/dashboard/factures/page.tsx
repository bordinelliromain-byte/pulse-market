'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import Sidebar from '@/components/Sidebar'
import {
  Download, CheckCircle, Clock, CreditCard,
  Euro, TrendingUp, Calendar
} from 'lucide-react'

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
}

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
}

const MOCK_FACTURES = [
  { id: 'FAC-2026-004', date: '2026-04-15', event: 'Marché de Printemps — Aubagne', montant: 42, statut: 'paid' },
  { id: 'FAC-2026-003', date: '2026-03-28', event: 'Foire Artisanale — Gémenos', montant: 60, statut: 'paid' },
  { id: 'FAC-2026-002', date: '2026-03-10', event: 'Marché Bio — Cassis', montant: 35, statut: 'pending' },
  { id: 'FAC-2026-001', date: '2026-02-20', event: 'Marché de Noël — Roquevaire', montant: 50, statut: 'paid' },
]

export default function Factures() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(profileData)
      setLoading(false)
    }
    getData()
  }, [])

  const totalPaid = MOCK_FACTURES.filter(f => f.statut === 'paid').reduce((acc, f) => acc + f.montant, 0)
  const totalPending = MOCK_FACTURES.filter(f => f.statut === 'pending').reduce((acc, f) => acc + f.montant, 0)
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
          <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>Mes factures</p>
          <button
            onClick={() => {
              const csv = MOCK_FACTURES.map(f => `${f.id};${f.date};${f.event};${f.montant}€;${f.statut}`).join('\n')
              const blob = new Blob([`ID;Date;Événement;Montant;Statut\n${csv}`], { type: 'text/csv' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = 'factures-placemarket.csv'
              a.click()
            }}
            style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#F8FAFC', color: '#475569', border: '1px solid #E2E8F0', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
            <Download size={13} /> Exporter CSV
          </button>
        </header>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

        <main style={{ padding: '24px 28px' }}>
          <motion.div variants={stagger} initial="hidden" animate="visible" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            <motion.div variants={fadeUp} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
              {[
                { label: 'Total réglé', value: `${totalPaid} €`, icon: <CheckCircle size={15} style={{ color: '#16A34A' }} />, color: '#16A34A', bg: '#F0FDF4' },
                { label: 'En attente', value: `${totalPending} €`, icon: <Clock size={15} style={{ color: '#F59E0B' }} />, color: '#F59E0B', bg: '#FFFBEB' },
                { label: 'Total annuel', value: `${totalPaid + totalPending} €`, icon: <TrendingUp size={15} style={{ color: '#4F46E5' }} />, color: '#4F46E5', bg: '#EEF2FF' },
              ].map((s, i) => (
                <div key={i} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</span>
                    <div style={{ width: 30, height: 30, background: s.bg, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{s.icon}</div>
                  </div>
                  <p style={{ fontSize: 26, fontWeight: 700, color: s.color }}>{s.value}</p>
                </div>
              ))}
            </motion.div>

            <motion.div variants={fadeUp} style={{ background: '#0F172A', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, background: 'rgba(79,70,229,0.2)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CreditCard size={18} style={{ color: '#818CF8' }} />
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'white', marginBottom: 2 }}>Paiements sécurisés via Stripe</p>
                  <p style={{ fontSize: 11, color: '#64748B' }}>Les factures seront générées automatiquement dès qu'un paiement est effectué</p>
                </div>
              </div>
              <span style={{ fontSize: 11, background: '#1E293B', color: '#64748B', padding: '4px 10px', borderRadius: 100, whiteSpace: 'nowrap' }}>Bientôt disponible</span>
            </motion.div>

            <motion.div variants={fadeUp} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>Historique des paiements</p>
                <span style={{ fontSize: 11, color: '#94A3B8' }}>{MOCK_FACTURES.length} facture(s)</span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #F1F5F9', background: '#FAFAFA' }}>
                    {['Référence', 'Événement', 'Date', 'Montant', 'Statut', ''].map((h, i) => (
                      <th key={i} style={{ padding: '11px 18px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MOCK_FACTURES.map((f, i) => (
                    <tr key={f.id}
                      style={{ borderBottom: i < MOCK_FACTURES.length - 1 ? '1px solid #F8FAFC' : 'none', transition: 'background 0.1s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '14px 18px' }}>
                        <p style={{ fontSize: 12, fontWeight: 600, color: '#0F172A', fontFamily: 'monospace' }}>{f.id}</p>
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <p style={{ fontSize: 12, color: '#475569', maxWidth: 220 }}>{f.event}</p>
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#64748B' }}>
                          <Calendar size={11} /> {formatDate(f.date)}
                        </div>
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{f.montant} €</p>
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: f.statut === 'paid' ? '#F0FDF4' : '#FFFBEB', color: f.statut === 'paid' ? '#16A34A' : '#F59E0B', fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 100, border: `1px solid ${f.statut === 'paid' ? '#BBF7D0' : '#FDE68A'}` }}>
                          {f.statut === 'paid' ? <CheckCircle size={10} /> : <Clock size={10} />}
                          {f.statut === 'paid' ? 'Payé' : 'En attente'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <button
                          onClick={() => {
                            const content = `FACTURE ${f.id}\nDate: ${formatDate(f.date)}\nÉvénement: ${f.event}\nMontant: ${f.montant} €\nStatut: ${f.statut === 'paid' ? 'Payé' : 'En attente'}\n\nPlaceMarket — placemarket.fr`
                            const blob = new Blob([content], { type: 'text/plain' })
                            const url = URL.createObjectURL(blob)
                            const a = document.createElement('a')
                            a.href = url
                            a.download = `${f.id}.txt`
                            a.click()
                          }}
                          style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 7, padding: '5px 10px', cursor: 'pointer', fontSize: 11, color: '#64748B', fontWeight: 500 }}>
                          <Download size={11} /> Télécharger
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>

            <motion.div variants={fadeUp} style={{ background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <Euro size={15} style={{ color: '#4F46E5', flexShrink: 0, marginTop: 1 }} />
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#4338CA', marginBottom: 3 }}>Pour votre comptabilité</p>
                <p style={{ fontSize: 12, color: '#4F46E5', lineHeight: 1.6 }}>Exportez vos factures en CSV pour les intégrer dans votre logiciel comptable. Les factures PDF seront disponibles dès l'intégration de Stripe.</p>
              </div>
            </motion.div>

          </motion.div>
        </main>
      </div>
    </div>
  )
}
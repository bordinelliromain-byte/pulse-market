'use client'

import { useRouter, usePathname } from 'next/navigation'
import {
  LayoutDashboard, Map, FileText, Receipt, Settings, LogOut, Grid, CalendarCheck, QrCode, Users, MapPin
} from 'lucide-react'
import { createClient } from '@/lib/supabase'

const NAV_EXPOSANT = [
  { icon: <LayoutDashboard size={15} />, label: 'Dashboard', path: '/dashboard' },
  { icon: <CalendarCheck size={15} />, label: 'Mes marchés', path: '/dashboard/mes-marches' },
  { icon: <Map size={15} />, label: 'Marchés', path: '/dashboard/evenements' },
  { icon: <MapPin size={15} />, label: 'Mon emplacement', path: '/dashboard/mon-emplacement' },
  { icon: <FileText size={15} />, label: 'Documents', path: '/dashboard/profil' },
  { icon: <Receipt size={15} />, label: 'Factures', path: '/dashboard/factures' },
  { icon: <Settings size={15} />, label: 'Paramètres', path: '/dashboard/parametres' },
]

const NAV_ORGANISATEUR = [
  { icon: <LayoutDashboard size={15} />, label: 'Dashboard', path: '/dashboard' },
  { icon: <Map size={15} />, label: 'Marchés', path: '/dashboard/creer-evenement' },
  { icon: <FileText size={15} />, label: 'Candidatures', path: '/dashboard/candidatures' },
  { icon: <MapPin size={15} />, label: 'Attribution', path: '/dashboard/organisateur/attribution' },
  { icon: <Grid size={15} />, label: 'Terrain', path: '/dashboard/terrain' },
  { icon: <QrCode size={15} />, label: 'Scanner', path: '/dashboard/organisateur/scanner' },
  { icon: <Receipt size={15} />, label: 'Trésorerie', path: '/dashboard/tresorerie' },
  { icon: <Users size={15} />, label: 'Placiers', path: '/dashboard/organisateur/placiers' },
  { icon: <Settings size={15} />, label: 'Paramètres', path: '/dashboard/parametres' },
]

interface SidebarProps {
  profile: any
}

export default function Sidebar({ profile }: SidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  const NAV_ITEMS = profile?.role === 'organisateur' ? NAV_ORGANISATEUR : NAV_EXPOSANT

  const isActive = (path: string) => {
    if (path === '/dashboard') return pathname === '/dashboard' || pathname === '/dashboard/organisateur'
    return pathname.startsWith(path)
  }

  return (
    <aside style={{ width: 220, background: '#020617', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 20 }}>
      {/* Logo */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, background: '#4F46E5', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'white', fontSize: 11, fontWeight: 700 }}>PM</span>
          </div>
          <span style={{ color: 'white', fontWeight: 600, fontSize: 14 }}>PlaceMarket</span>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 10px' }}>
        <p style={{ fontSize: 10, fontWeight: 600, color: '#475569', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '8px 10px', marginBottom: 4 }}>Navigation</p>
        {NAV_ITEMS.map((item) => (
          <button key={item.label} onClick={() => router.push(item.path)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: isActive(item.path) ? 'rgba(79,70,229,0.15)' : 'transparent',
              color: isActive(item.path) ? '#818CF8' : '#64748B',
              fontSize: 13, fontWeight: isActive(item.path) ? 600 : 400,
              marginBottom: 2, textAlign: 'left', transition: 'all 0.15s',
            }}>
            {item.icon}{item.label}
          </button>
        ))}
      </nav>

      {/* User */}
      <div style={{ padding: '12px 10px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ padding: '8px 10px', marginBottom: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#CBD5E1' }}>{profile?.full_name}</p>
            {profile?.role === 'organisateur' && (
              <span style={{ fontSize: 9, fontWeight: 700, background: '#4F46E5', color: 'white', padding: '1px 6px', borderRadius: 100 }}>VÉRIFIÉ</span>
            )}
          </div>
          <p style={{ fontSize: 11, color: '#475569' }}>
            {profile?.role === 'organisateur' ? 'Administration municipale' : 'Espace exposant'}
          </p>
        </div>
        <button onClick={async () => { await supabase.auth.signOut(); router.push('/') }}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'transparent', color: '#64748B', fontSize: 12 }}>
          <LogOut size={13} /> Déconnexion
        </button>
      </div>
    </aside>
  )
}
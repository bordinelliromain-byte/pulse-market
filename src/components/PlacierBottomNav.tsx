'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Users, ScanLine, Plus, History, User } from 'lucide-react'

const BRAND = '#4F46E5'

const NAV_PLACIER = [
  { icon: Users,     label: 'Émargement', path: '/dashboard/placier' },
  { icon: History,   label: 'Historique', path: '/dashboard/placier/scans' },
  { icon: ScanLine,  label: 'Scanner',    path: '/dashboard/placier/scanner', main: true },
  { icon: Plus,      label: 'Express',    path: '/dashboard/placier/express' },
  { icon: User,      label: 'Profil',     path: '/dashboard/placier/profil' },
]

export default function PlacierBottomNav() {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: '#1E293B',
      borderTop: '1px solid rgba(255,255,255,0.08)',
      padding: '6px 10px calc(6px + env(safe-area-inset-bottom))',
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      zIndex: 100,
      boxShadow: '0 -4px 20px rgba(0,0,0,0.3)',
      fontFamily: "'Inter', system-ui, sans-serif",
      maxWidth: 480,
      margin: '0 auto',
    }}>
      {NAV_PLACIER.map(item => {
        const isActive = pathname === item.path
        const Icon = item.icon

        // ✅ Bouton SCANNER central
        if (item.main) {
          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              style={{
                background: `linear-gradient(135deg, ${BRAND}, #7C3AED)`,
                border: 'none',
                borderRadius: '50%',
                width: 56,
                height: 56,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                marginTop: -22,
                boxShadow: `0 4px 16px ${BRAND}77`,
                color: 'white',
                flexShrink: 0,
              }}
            >
              <Icon size={26} strokeWidth={2.2} />
            </button>
          )
        }

        return (
          <button
            key={item.path}
            onClick={() => router.push(item.path)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              padding: '6px 4px',
              color: isActive ? BRAND : '#64748B',
              transition: 'color 0.15s',
              minWidth: 56,
              flex: 1,
            }}
          >
            <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
            <span style={{
              fontSize: 9,
              fontWeight: isActive ? 700 : 500,
              letterSpacing: '0.02em',
            }}>
              {item.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
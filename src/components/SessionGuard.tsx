'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, usePathname } from 'next/navigation'

const SESSION_TIMEOUT = 24 * 60 * 60 * 1000 // 24h en ms
const LAST_ACTIVITY_KEY = 'pm_last_activity'

const PUBLIC_PATHS = ['/', '/auth', '/auth/mairie', '/whatmarket', '/paiement-express', '/pro']

export default function SessionGuard() {
  const supabase = createClient()
  const router = useRouter()
  const pathname = usePathname()

  const isPublic = PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))

  useEffect(() => {
    if (isPublic) return

    // Mettre à jour le timestamp d'activité à chaque interaction
    const updateActivity = () => {
      localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString())
    }

    // Vérifier si la session a expiré
    const checkExpiry = async () => {
      const lastActivity = localStorage.getItem(LAST_ACTIVITY_KEY)

      if (lastActivity) {
        const elapsed = Date.now() - parseInt(lastActivity)
        if (elapsed > SESSION_TIMEOUT) {
          // Session expirée → déconnexion
          await supabase.auth.signOut()
          localStorage.removeItem(LAST_ACTIVITY_KEY)
          router.push('/auth')
          return
        }
      } else {
        // Première visite — initialiser
        updateActivity()
      }
    }

    // Vérifier à l'ouverture de la page
    checkExpiry()

    // Écouter les interactions utilisateur
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart']
    events.forEach(e => window.addEventListener(e, updateActivity, { passive: true }))

    // Vérifier toutes les 5 minutes en arrière-plan
    const interval = setInterval(checkExpiry, 5 * 60 * 1000)

    return () => {
      events.forEach(e => window.removeEventListener(e, updateActivity))
      clearInterval(interval)
    }
  }, [pathname, isPublic])

  return null
}
'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase'

declare global {
  interface Window {
    $crisp: any[]
    CRISP_WEBSITE_ID: string
  }
}

export default function CrispChat() {
  const supabase = createClient()

  useEffect(() => {
    // Init Crisp
    window.$crisp = []
    window.CRISP_WEBSITE_ID = 'abfa2981-fd76-4828-a049-f6b02eac86fb'
    const script = document.createElement('script')
    script.src = 'https://client.crisp.chat/l.js'
    script.async = true
    document.head.appendChild(script)

    // Attendre que Crisp soit chargé puis injecter les infos user
    const injectUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email, role')
        .eq('id', user.id)
        .single()

      if (!profile) return

      // Attendre que $crisp soit prêt
      const waitForCrisp = setInterval(() => {
        if (window.$crisp && typeof window.$crisp.push === 'function') {
          clearInterval(waitForCrisp)
          window.$crisp.push(['set', 'user:email', [profile.email]])
          window.$crisp.push(['set', 'user:nickname', [profile.full_name || 'Utilisateur']])
          window.$crisp.push(['set', 'session:data', [[
            ['role', profile.role === 'organisateur' ? 'Organisateur' : 'Exposant'],
            ['user_id', user.id],
          ]]])
        }
      }, 500)

      // Stop après 10s si Crisp charge pas
      setTimeout(() => clearInterval(waitForCrisp), 10000)
    }

    injectUser()
  }, [])

  return null
}
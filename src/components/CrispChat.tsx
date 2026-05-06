'use client'

import { useEffect } from 'react'

declare global {
  interface Window {
    $crisp: any[]
    CRISP_WEBSITE_ID: string
  }
}

export default function CrispChat() {
  useEffect(() => {
    window.$crisp = []
    window.CRISP_WEBSITE_ID = 'abfa2981-fd76-4828-a049-f6b02eac86fb'
    const script = document.createElement('script')
    script.src = 'https://client.crisp.chat/l.js'
    script.async = true
    document.head.appendChild(script)
  }, [])

  return null
}
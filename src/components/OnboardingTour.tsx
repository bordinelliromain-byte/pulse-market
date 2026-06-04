// src/components/OnboardingTour.tsx
'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase'
import { X, ArrowRight, Sparkles } from 'lucide-react'

type Step = {
  target: string // selector CSS de l'élément à highlight
  title: string
  description: string
  emoji: string
  position: 'top' | 'bottom' | 'left' | 'right' | 'center'
  cta?: string
}

const STEPS: Step[] = [
  {
    target: 'BODY',
    title: 'Bienvenue sur PulseMarket',
    description: "Faisons un tour rapide en 30 secondes pour t'aider à bien démarrer.",
    emoji: '👋',
    position: 'center',
    cta: "C'est parti",
  },
  {
    target: '[data-tour="dossier"]',
    title: 'Complète ton dossier exposant',
    description: "Ajoute ton Kbis et ton attestation RC Pro. Sans ces documents, tu ne peux pas candidater aux marchés.",
    emoji: '📋',
    position: 'left',
    cta: 'Suivant',
  },
  {
    target: '[data-tour="marches"]',
    title: 'Découvre les marchés près de chez toi',
    description: "Explore les marchés disponibles en PACA. Ta première candidature est gratuite !",
    emoji: '🗺️',
    position: 'bottom',
    cta: 'Suivant',
  },
  {
    target: '[data-tour="suivi"]',
    title: 'Suis l\'évolution de tes candidatures',
    description: "Envoyé → Lu → Validation → Payé. Tu vois en temps réel où en est chacun de tes dossiers.",
    emoji: '📊',
    position: 'top',
    cta: 'Suivant',
  },
  {
    target: '[data-tour="pro"]',
    title: 'Passe en Pro pour candidater sans limite',
    description: "Avec le plan gratuit, tu as 1 candidature par mois. Pour 20€/mois, candidate à volonté.",
    emoji: '⭐',
    position: 'left',
    cta: 'Tout compris 🚀',
  },
]

type Box = { top: number; left: number; width: number; height: number }

export default function OnboardingTour({ onComplete }: { onComplete: () => void }) {
  const [stepIndex, setStepIndex] = useState(0)
  const [box, setBox] = useState<Box | null>(null)
  const [visible, setVisible] = useState(true)
  const supabase = createClient()
  const step = STEPS[stepIndex]
  const isCenter = step.position === 'center'

  // Calcule la position de l'élément à highlight
  useEffect(() => {
    if (isCenter) { setBox(null); return }
    const computeBox = () => {
      const el = document.querySelector(step.target) as HTMLElement | null
      if (!el) { setBox(null); return }
      const r = el.getBoundingClientRect()
      setBox({ top: r.top, left: r.left, width: r.width, height: r.height })
      // Scroll vers l'élément si hors écran
      if (r.top < 50 || r.bottom > window.innerHeight - 50) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
    // Petit délai pour laisser le scroll se faire avant le calcul
    const t1 = setTimeout(computeBox, 50)
    const t2 = setTimeout(computeBox, 400)
    window.addEventListener('resize', computeBox)
    window.addEventListener('scroll', computeBox, true)
    return () => {
      clearTimeout(t1); clearTimeout(t2)
      window.removeEventListener('resize', computeBox)
      window.removeEventListener('scroll', computeBox, true)
    }
  }, [stepIndex, isCenter, step.target])

  // Bloque le scroll du body
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const finish = async () => {
    setVisible(false)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('profiles').update({ onboarding_completed: true }).eq('id', user.id)
      }
    } catch (err) { console.error(err) }
    setTimeout(onComplete, 250)
  }

  const next = () => {
    if (stepIndex < STEPS.length - 1) setStepIndex(stepIndex + 1)
    else finish()
  }

  // Position du tooltip selon la box
  const getTooltipPosition = () => {
    if (!box) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
    const padding = 16
    const tooltipWidth = 340
    const tooltipHeight = 200
    const vh = window.innerHeight
    const vw = window.innerWidth

    switch (step.position) {
      case 'top':
        return { top: Math.max(20, box.top - tooltipHeight - padding), left: Math.max(16, Math.min(vw - tooltipWidth - 16, box.left + box.width / 2 - tooltipWidth / 2)) }
      case 'bottom':
        return { top: Math.min(vh - tooltipHeight - 20, box.top + box.height + padding), left: Math.max(16, Math.min(vw - tooltipWidth - 16, box.left + box.width / 2 - tooltipWidth / 2)) }
      case 'left':
        return { top: Math.max(20, Math.min(vh - tooltipHeight - 20, box.top + box.height / 2 - tooltipHeight / 2)), left: Math.max(16, box.left - tooltipWidth - padding) }
      case 'right':
        return { top: Math.max(20, Math.min(vh - tooltipHeight - 20, box.top + box.height / 2 - tooltipHeight / 2)), left: Math.min(vw - tooltipWidth - 16, box.left + box.width + padding) }
      default:
        return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
    }
  }

  const tooltipPos = getTooltipPosition()
  const progress = ((stepIndex + 1) / STEPS.length) * 100

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Overlay sombre avec trou sur l'élément */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            style={{ position: 'fixed', inset: 0, zIndex: 9998, pointerEvents: 'auto', background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(2px)' }}
          />

          {/* Hole / spotlight sur l'élément */}
          {box && !isCenter && (
            <motion.div
              key={`spot-${stepIndex}`}
              initial={{ opacity: 0, scale: 1.06 }}
              animate={{ opacity: 1, scale: 1, top: box.top - 8, left: box.left - 8, width: box.width + 16, height: box.height + 16 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              style={{
                position: 'fixed',
                borderRadius: 14,
                border: '2px solid #818CF8',
                boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.65), 0 0 30px rgba(129, 140, 248, 0.5)',
                zIndex: 9999,
                pointerEvents: 'none',
              }}
            />
          )}

          {/* Tooltip */}
          <motion.div
            key={`tooltip-${stepIndex}`}
            initial={{ opacity: 0, scale: 0.92, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: 'fixed',
              ...tooltipPos,
              width: 340,
              background: 'white',
              borderRadius: 18,
              padding: '24px 22px 20px',
              boxShadow: '0 20px 60px rgba(15, 23, 42, 0.35)',
              zIndex: 10000,
              fontFamily: "'Inter', system-ui, sans-serif",
            }}
          >
            {/* Bouton skip */}
            <button onClick={finish}
              style={{ position: 'absolute', top: 12, right: 12, background: '#F1F5F9', border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={13} style={{ color: '#64748B' }} />
            </button>

            {/* Emoji + indicateur */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #EEF2FF, #E0E7FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                {step.emoji}
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#4F46E5', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Étape {stepIndex + 1}/{STEPS.length}
              </div>
            </div>

            {/* Texte */}
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 6, letterSpacing: '-0.01em', lineHeight: 1.3 }}>
              {step.title}
            </h3>
            <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, marginBottom: 18 }}>
              {step.description}
            </p>

            {/* Barre de progression */}
            <div style={{ height: 3, background: '#F1F5F9', borderRadius: 10, marginBottom: 14, overflow: 'hidden' }}>
              <motion.div
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                style={{ height: '100%', background: 'linear-gradient(90deg, #4F46E5, #7C3AED)', borderRadius: 10 }}
              />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8 }}>
              {!isCenter && (
                <button onClick={finish}
                  style={{ background: 'transparent', color: '#64748B', border: 'none', padding: '10px 12px', fontSize: 12, fontWeight: 500, cursor: 'pointer', borderRadius: 8 }}>
                  Passer
                </button>
              )}
              <button onClick={next}
                style={{ flex: 1, background: '#0F172A', color: 'white', border: 'none', borderRadius: 10, padding: '11px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                {stepIndex === 0 && <Sparkles size={13} />}
                {step.cta || 'Suivant'}
                {stepIndex > 0 && stepIndex < STEPS.length - 1 && <ArrowRight size={13} />}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
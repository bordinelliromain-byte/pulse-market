// src/app/api/verify-siren/route.ts
// ═════════════════════════════════════════════════════════════
// PULSEMARKET — API Verify SIREN
// Vérifie l'existence d'un SIREN via l'API gouv (annuaire-entreprises)
// ═════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  validateBody,
  checkRateLimit,
  RATE_LIMIT_NORMAL,
} from '@/lib/validation'

// ─── Schéma Zod strict ───
const verifySirenSchema = z.object({
  siren: z.string()
    .trim()
    .min(9, 'SIREN trop court')
    .max(20, 'SIREN trop long') // Tolère les espaces/tirets
    .refine(
      (val) => /^[\d\s-]+$/.test(val),
      { message: 'SIREN ne doit contenir que des chiffres' }
    ),
})

// ─── SIREN connus invalides / tests ───
const INVALID_SIRENS = new Set([
  '000000000',
  '123456789',
  '111111111',
  '999999999',
])

// ═════════════════════════════════════════════════════════════
// POST /api/verify-siren
// Body : { siren: string }
// ═════════════════════════════════════════════════════════════
export async function POST(request: NextRequest) {
  try {
    // ─── 1. Rate limit (10/min - normal car appel externe) ───
    const limited = checkRateLimit(request, {
      ...RATE_LIMIT_NORMAL,
      keyPrefix: 'verify-siren',
    })
    if (limited) return limited

    // ─── 2. Validation Zod ───
    const result = await validateBody(request, verifySirenSchema)
    if (result instanceof NextResponse) return result
    const { siren } = result

    // ─── 3. Clean & valider format SIREN (9 chiffres) ───
    const cleanSiren = siren.replace(/[\s-]/g, '')

    if (cleanSiren.length !== 9 || !/^\d{9}$/.test(cleanSiren)) {
      return NextResponse.json({
        valid: false,
        message: '❌ Le SIREN doit contenir exactement 9 chiffres'
      })
    }

    // ─── 4. Check SIREN connus invalides (tests, fake) ───
    if (INVALID_SIRENS.has(cleanSiren)) {
      return NextResponse.json({
        valid: false,
        message: '❌ SIREN invalide'
      })
    }

    // ─── 5. Validation algorithme Luhn (SIREN officiel) ───
    if (!isValidSirenChecksum(cleanSiren)) {
      return NextResponse.json({
        valid: false,
        message: '❌ SIREN ne respecte pas le format officiel (clé de contrôle invalide)'
      })
    }

    // ─── 6. Appel API gouv avec timeout strict ───
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)

    let response: Response
    try {
      response = await fetch(
        `https://recherche-entreprises.api.gouv.fr/search?q=${cleanSiren}&page=1&per_page=1`,
        {
          headers: { 'Accept': 'application/json' },
          signal: controller.signal,
        }
      )
    } catch (fetchErr: any) {
      clearTimeout(timeout)
      console.error('[verify-siren] API gouv error:', fetchErr.message)
      return NextResponse.json({
        valid: false,
        message: '❌ Service de vérification temporairement indisponible'
      }, { status: 503 })
    } finally {
      clearTimeout(timeout)
    }

    // ─── 7. Check réponse API ───
    if (!response.ok) {
      console.error('[verify-siren] API gouv status:', response.status)
      return NextResponse.json({
        valid: false,
        message: '❌ Service de vérification temporairement indisponible'
      }, { status: 503 })
    }

    // ─── 8. Parse JSON ───
    let data: any
    try {
      data = await response.json()
    } catch (parseErr) {
      console.error('[verify-siren] Parse JSON error:', parseErr)
      return NextResponse.json({
        valid: false,
        message: '❌ Réponse invalide du service'
      }, { status: 502 })
    }

    // ─── 9. Vérifier résultats ───
    if (!data.results || !Array.isArray(data.results) || data.results.length === 0) {
      return NextResponse.json({
        valid: false,
        message: '❌ Entreprise introuvable dans le registre national'
      })
    }

    const company = data.results[0]

    // ✅ Double-check : le SIREN retourné doit matcher le SIREN demandé
    if (company.siren !== cleanSiren) {
      return NextResponse.json({
        valid: false,
        message: '❌ Entreprise introuvable dans le registre national'
      })
    }

    // ─── 10. Vérifier statut actif ───
    const isActive = company.etat_administratif === 'A'
    const companyName = String(company.nom_complet || company.nom_raison_sociale || 'Nom inconnu')
      .substring(0, 200) // Limite anti-injection

    return NextResponse.json({
      valid: isActive,
      companyName,
      siren: cleanSiren,
      message: isActive
        ? `✅ Entreprise active : ${companyName}`
        : '❌ Entreprise inactive ou radiée'
    })

  } catch (error: any) {
    console.error('[verify-siren] Error:', error)
    return NextResponse.json({
      valid: false,
      message: '❌ Erreur lors de la vérification',
      ...(process.env.NODE_ENV === 'development' && { details: error.message }),
    }, { status: 500 })
  }
}

// ═════════════════════════════════════════════════════════════
// Validation algorithme Luhn (clé de contrôle SIREN)
// Source : INSEE - tous les SIREN valides passent ce check
// ═════════════════════════════════════════════════════════════
function isValidSirenChecksum(siren: string): boolean {
  if (siren.length !== 9 || !/^\d{9}$/.test(siren)) return false

  let sum = 0
  for (let i = 0; i < 9; i++) {
    let digit = parseInt(siren[i], 10)
    // Multiplier par 2 les positions paires (index impair = position paire)
    if (i % 2 === 1) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
  }

  return sum % 10 === 0
}
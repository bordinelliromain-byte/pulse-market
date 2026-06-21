// src/app/api/verify-document/route.ts
// ═════════════════════════════════════════════════════════════
// PULSEMARKET — API Verify Document
// Vérifie les documents uploadés (Kbis, RC Pro) via Google Vision OCR
// Anti-malicious upload + validation MIME + magic bytes
// ═════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, RATE_LIMIT_STRICT } from '@/lib/validation'

const GOOGLE_VISION_API_KEY = process.env.GOOGLE_VISION_API_KEY

// ─── Limites strictes ───
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
const ALLOWED_DOC_TYPES = ['kbis', 'assurance', 'rc-pro', 'attestation', 'piece-identite']

// ─── Magic bytes (signatures de fichiers) — anti spoof MIME ───
const MAGIC_BYTES: Record<string, number[][]> = {
  'application/pdf': [[0x25, 0x50, 0x44, 0x46]], // %PDF
  'image/jpeg': [
    [0xFF, 0xD8, 0xFF, 0xE0],
    [0xFF, 0xD8, 0xFF, 0xE1],
    [0xFF, 0xD8, 0xFF, 0xE2],
    [0xFF, 0xD8, 0xFF, 0xE3],
    [0xFF, 0xD8, 0xFF, 0xDB],
  ],
  'image/png': [[0x89, 0x50, 0x4E, 0x47]], // \x89PNG
  'image/webp': [
    // RIFF....WEBP (magic bytes au début + position 8)
    [0x52, 0x49, 0x46, 0x46], // RIFF
  ],
}

// ─── Vérifier que les magic bytes correspondent au MIME annoncé ───
function validateMagicBytes(buffer: ArrayBuffer, mimeType: string): boolean {
  const bytes = new Uint8Array(buffer.slice(0, 16))
  const signatures = MAGIC_BYTES[mimeType]
  if (!signatures) return false

  return signatures.some(sig =>
    sig.every((byte, i) => bytes[i] === byte)
  )
}

// ─── Helpers d'extraction de données du document ───

function extractDates(text: string): Date[] {
  const months: Record<string, number> = {
    janvier: 1, février: 2, mars: 3, avril: 4, mai: 5, juin: 6,
    juillet: 7, août: 8, septembre: 9, octobre: 10, novembre: 11, décembre: 12
  }
  const dates: Date[] = []
  let match

  // Pattern: DD/MM/YYYY ou DD-MM-YYYY ou DD.MM.YYYY
  const p1 = /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/g
  while ((match = p1.exec(text)) !== null) {
    const d = new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]))
    if (!isNaN(d.getTime())) dates.push(d)
  }

  // Pattern: DD mois YYYY
  const p2 = /(\d{1,2})\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+(\d{4})/gi
  while ((match = p2.exec(text)) !== null) {
    const month = months[match[2].toLowerCase()]
    const d = new Date(parseInt(match[3]), month - 1, parseInt(match[1]))
    if (!isNaN(d.getTime())) dates.push(d)
  }

  // Pattern: YYYY-MM-DD
  const p3 = /(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/g
  while ((match = p3.exec(text)) !== null) {
    const d = new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]))
    if (!isNaN(d.getTime())) dates.push(d)
  }

  return dates
}

function extractSiren(text: string): string | null {
  const match = text.match(/\b(\d{3}[\s\.]?\d{3}[\s\.]?\d{3})\b/)
  return match ? match[1].replace(/[\s\.]/g, '') : null
}

function extractBusinessName(text: string): string | null {
  const patterns = [
    /(?:raison sociale|dénomination|société)\s*:?\s*([A-Z][A-Za-z\s&'-]+(?:SARL|SAS|SA|EURL|EI|SASU|SNC)?)/i,
    /([A-Z][A-Z\s&'-]{2,}(?:SARL|SAS|SA|EURL|EI|SASU|SNC))/
  ]
  for (const p of patterns) {
    const m = text.match(p)
    if (m) return m[1].trim().substring(0, 200) // Limite anti-injection
  }
  return null
}

function similarity(a: string, b: string): number {
  const s1 = a.toLowerCase().replace(/[^a-z0-9]/g, '')
  const s2 = b.toLowerCase().replace(/[^a-z0-9]/g, '')
  if (s1 === s2) return 1
  if (s1.includes(s2) || s2.includes(s1)) return 0.8

  const w1 = s1.split(' ')
  const w2 = s2.split(' ')
  return w1.filter(w => w2.includes(w)).length / Math.max(w1.length, w2.length)
}

// ═════════════════════════════════════════════════════════════
// POST /api/verify-document
// FormData : { file, type, siren?, businessName?, otherDocText? }
// ═════════════════════════════════════════════════════════════
export async function POST(req: NextRequest) {
  try {
    // ─── 1. Rate limit STRICT (5/min - coûteux car Google Vision) ───
    const limited = checkRateLimit(req, {
      ...RATE_LIMIT_STRICT,
      keyPrefix: 'verify-document',
    })
    if (limited) return limited

    // ─── 2. Vérifier env vars ───
    if (!GOOGLE_VISION_API_KEY) {
      console.error('[verify-document] GOOGLE_VISION_API_KEY manquant')
      return NextResponse.json({ error: 'Configuration manquante' }, { status: 500 })
    }

    // ─── 3. Parse FormData ───
    let formData: FormData
    try {
      formData = await req.formData()
    } catch (err) {
      return NextResponse.json({ error: 'FormData invalide' }, { status: 400 })
    }

    const file = formData.get('file') as File | null
    const docType = String(formData.get('type') || '').substring(0, 50)
    const userSiren = String(formData.get('siren') || '').substring(0, 20).replace(/\s/g, '')
    const userBusinessName = String(formData.get('businessName') || '').substring(0, 200)
    const otherDocText = String(formData.get('otherDocText') || '').substring(0, 10000)

    // ─── 4. Validation fichier ───
    if (!file) {
      return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 })
    }

    // Type de document
    if (docType && !ALLOWED_DOC_TYPES.includes(docType)) {
      return NextResponse.json({ error: 'Type de document non supporté' }, { status: 400 })
    }

    // Taille
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({
        error: `Fichier trop volumineux (max ${MAX_FILE_SIZE / 1024 / 1024}MB)`
      }, { status: 400 })
    }

    if (file.size < 100) {
      return NextResponse.json({ error: 'Fichier trop petit ou corrompu' }, { status: 400 })
    }

    // MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({
        error: 'Format non supporté (PDF, JPG, PNG, WEBP uniquement)'
      }, { status: 400 })
    }

    // ─── 5. Lire le fichier en buffer ───
    const arrayBuffer = await file.arrayBuffer()

    // ─── 6. ✅ ANTI-SPOOF MIME : vérifier les magic bytes ───
    if (!validateMagicBytes(arrayBuffer, file.type)) {
      console.warn('[verify-document] Magic bytes mismatch:', file.type)
      return NextResponse.json({
        error: 'Fichier corrompu ou type incorrect (MIME spoofing detected)'
      }, { status: 400 })
    }

    // ─── 7. Convertir en base64 pour Google Vision ───
    const base64 = Buffer.from(arrayBuffer).toString('base64')

    // ─── 8. Appel Google Vision avec timeout ───
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000) // 15s max

    let visionRes: Response
    try {
      visionRes = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requests: [{
              image: { content: base64 },
              features: [{ type: 'DOCUMENT_TEXT_DETECTION', maxResults: 1 }]
            }]
          }),
          signal: controller.signal,
        }
      )
    } catch (fetchErr: any) {
      clearTimeout(timeout)
      console.error('[verify-document] Vision API error:', fetchErr.message)
      return NextResponse.json({
        error: 'Service OCR temporairement indisponible'
      }, { status: 503 })
    } finally {
      clearTimeout(timeout)
    }

    if (!visionRes.ok) {
      console.error('[verify-document] Vision API status:', visionRes.status)
      return NextResponse.json({
        error: 'Erreur lors de l\'analyse du document'
      }, { status: 502 })
    }

    // ─── 9. Parse JSON ───
    let visionData: any
    try {
      visionData = await visionRes.json()
    } catch (parseErr) {
      console.error('[verify-document] Parse JSON error:', parseErr)
      return NextResponse.json({ error: 'Réponse OCR invalide' }, { status: 502 })
    }

    const extractedText = String(visionData.responses?.[0]?.fullTextAnnotation?.text || '')

    if (!extractedText) {
      return NextResponse.json({
        success: false,
        error: 'Impossible de lire le document',
        score: 0,
        checks: {},
      })
    }

    // ─── 10. Extraction des données ───
    const dates = extractDates(extractedText)
    const extractedSiren = extractSiren(extractedText)
    const extractedBusinessName = extractBusinessName(extractedText)
    const now = new Date()
    const futureDates = dates.filter(d => d > now).sort((a, b) => a.getTime() - b.getTime())
    const pastDates = dates.filter(d => d <= now).sort((a, b) => b.getTime() - a.getTime())
    const expiryDate = docType === 'assurance' ? (futureDates[0] || null) : null
    const issueDate = pastDates[0] || null

    // ─── 11. Checks de validation ───
    const checks: Record<string, boolean> = {}
    checks.readable = extractedText.length > 50
    checks.sirenMatch = userSiren && extractedSiren
      ? extractedSiren === userSiren
      : extractedSiren !== null
    checks.nameMatch = userBusinessName && extractedBusinessName
      ? similarity(userBusinessName, extractedBusinessName) > 0.6
      : extractedBusinessName !== null
    checks.notExpired = docType === 'assurance'
      ? (expiryDate !== null && expiryDate > now)
      : (issueDate !== null && (now.getTime() - issueDate.getTime()) < 90 * 24 * 60 * 60 * 1000)
    checks.crossValid = otherDocText && extractedBusinessName
      ? (
        similarity(extractedBusinessName, extractBusinessName(otherDocText) || '') > 0.6
        || extractSiren(otherDocText) === extractedSiren
      )
      : true

    const score = Object.values(checks).filter(Boolean).length
    const total = Object.keys(checks).length
    const badge = score === total
      ? 'platinum'
      : score >= total - 1
        ? 'verifie'
        : score >= total - 2
          ? 'partiel'
          : 'incomplet'

    const badgeLabel = {
      platinum: '💎 Dossier Platinum',
      verifie: '✅ Dossier Vérifié',
      partiel: '⚠️ Dossier Partiel',
      incomplet: '❌ Dossier Incomplet'
    }[badge]

    const daysUntilExpiry = expiryDate
      ? Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : null

    return NextResponse.json({
      success: true,
      extractedText: extractedText.substring(0, 500),
      extractedSiren,
      extractedBusinessName,
      expiryDate: expiryDate?.toISOString() || null,
      issueDate: issueDate?.toISOString() || null,
      daysUntilExpiry,
      checks,
      score,
      total,
      badge,
      badgeLabel,
    })

  } catch (err: any) {
    console.error('[verify-document] Error:', err)
    return NextResponse.json({
      error: 'Erreur serveur',
      ...(process.env.NODE_ENV === 'development' && { details: err.message }),
    }, { status: 500 })
  }
}
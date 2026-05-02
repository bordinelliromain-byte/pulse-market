import { NextRequest, NextResponse } from 'next/server'

const GOOGLE_VISION_API_KEY = process.env.GOOGLE_VISION_API_KEY

// ── EXTRACTION DE DATES ────────────────────────────────────────────────────

function extractDates(text: string): Date[] {
  const patterns = [
    // DD/MM/YYYY ou DD-MM-YYYY
    /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/g,
    // DD MOIS YYYY
    /(\d{1,2})\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+(\d{4})/gi,
    // YYYY-MM-DD
    /(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/g,
  ]

  const months: { [key: string]: number } = {
    janvier: 1, février: 2, mars: 3, avril: 4, mai: 5, juin: 6,
    juillet: 7, août: 8, septembre: 9, octobre: 10, novembre: 11, décembre: 12
  }

  const dates: Date[] = []

  // DD/MM/YYYY
  let match
  const p1 = /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/g
  while ((match = p1.exec(text)) !== null) {
    const d = new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]))
    if (!isNaN(d.getTime())) dates.push(d)
  }

  // DD MOIS YYYY
  const p2 = /(\d{1,2})\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+(\d{4})/gi
  while ((match = p2.exec(text)) !== null) {
    const month = months[match[2].toLowerCase()]
    const d = new Date(parseInt(match[3]), month - 1, parseInt(match[1]))
    if (!isNaN(d.getTime())) dates.push(d)
  }

  // YYYY-MM-DD
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
    /([A-Z][A-Z\s&'-]{2,}(?:SARL|SAS|SA|EURL|EI|SASU|SNC))/,
  ]
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) return match[1].trim()
  }
  return null
}

function findExpiryDate(dates: Date[]): Date | null {
  const now = new Date()
  const futureDates = dates.filter(d => d > now).sort((a, b) => a.getTime() - b.getTime())
  return futureDates.length > 0 ? futureDates[0] : null
}

function findMostRecentDate(dates: Date[]): Date | null {
  const now = new Date()
  const pastDates = dates.filter(d => d <= now).sort((a, b) => b.getTime() - a.getTime())
  return pastDates.length > 0 ? pastDates[0] : null
}

// ── CROSS-VALIDATION ───────────────────────────────────────────────────────

function similarity(a: string, b: string): number {
  const s1 = a.toLowerCase().replace(/[^a-z0-9]/g, '')
  const s2 = b.toLowerCase().replace(/[^a-z0-9]/g, '')
  if (s1 === s2) return 1
  if (s1.includes(s2) || s2.includes(s1)) return 0.8
  const words1 = s1.split(' ')
  const words2 = s2.split(' ')
  const common = words1.filter(w => words2.includes(w)).length
  return common / Math.max(words1.length, words2.length)
}

// ── MAIN API ROUTE ─────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const docType = formData.get('type') as string // 'kbis' | 'assurance'
    const userSiren = formData.get('siren') as string || ''
    const userBusinessName = formData.get('businessName') as string || ''
    const otherDocText = formData.get('otherDocText') as string || '' // texte de l'autre doc pour cross-validation

    if (!file) {
      return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 })
    }

    if (!GOOGLE_VISION_API_KEY) {
      return NextResponse.json({ error: 'Google Vision API key manquante' }, { status: 500 })
    }

    // Convertir en base64
    const arrayBuffer = await file.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')
    const mimeType = file.type || 'application/pdf'

    // Appel Google Vision OCR
    const visionRes = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [{
            image: { content: base64 },
            features: [{ type: 'DOCUMENT_TEXT_DETECTION', maxResults: 1 }]
          }]
        })
      }
    )

    const visionData = await visionRes.json()
    const extractedText = visionData.responses?.[0]?.fullTextAnnotation?.text || ''

    if (!extractedText) {
      return NextResponse.json({
        success: false,
        error: 'Impossible de lire le document',
        score: 0,
        checks: {}
      })
    }

    // Extraire les infos
    const dates = extractDates(extractedText)
    const extractedSiren = extractSiren(extractedText)
    const extractedBusinessName = extractBusinessName(extractedText)
    const expiryDate = docType === 'assurance' ? findExpiryDate(dates) : null
    const issueDate = findMostRecentDate(dates)
    const now = new Date()

    // ── CHECKS ──────────────────────────────────────────────────────────────

    const checks: { [key: string]: boolean } = {}

    // 1. Document lisible
    checks.readable = extractedText.length > 50

    // 2. SIREN correspond (si fourni)
    if (userSiren && extractedSiren) {
      checks.sirenMatch = extractedSiren === userSiren.replace(/\s/g, '')
    } else if (extractedSiren) {
      checks.sirenMatch = true // on a extrait un SIREN
    } else {
      checks.sirenMatch = false
    }

    // 3. Nom correspond (si fourni)
    if (userBusinessName && extractedBusinessName) {
      checks.nameMatch = similarity(userBusinessName, extractedBusinessName) > 0.6
    } else {
      checks.nameMatch = extractedBusinessName !== null
    }

    // 4. Document pas expiré (pour RC Pro)
    if (docType === 'assurance') {
      checks.notExpired = expiryDate !== null && expiryDate > now
    } else {
      // Pour Kbis : document récent (moins de 3 mois)
      checks.notExpired = issueDate !== null && (now.getTime() - issueDate.getTime()) < 90 * 24 * 60 * 60 * 1000
    }

    // 5. Cross-validation avec l'autre document
    if (otherDocText && extractedBusinessName) {
      const otherName = extractBusinessName(otherDocText)
      const otherSiren = extractSiren(otherDocText)
      checks.crossValid = (
        (otherName ? similarity(extractedBusinessName, otherName) > 0.6 : false) ||
        (otherSiren && extractedSiren ? otherSiren === extractedSiren : false)
      )
    } else {
      checks.crossValid = true // pas de cross-validation possible
    }

    // ── SCORE & BADGE ────────────────────────────────────────────────────────

    const score = Object.values(checks).filter(Boolean).length
    const total = Object.keys(checks).length

    const badge = score === total ? 'platinum'
      : score >= total - 1 ? 'verifie'
      : score >= total - 2 ? 'partiel'
      : 'incomplet'

    const badgeLabel = {
      platinum: '💎 Dossier Platinum',
      verifie: '✅ Dossier Vérifié',
      partiel: '⚠️ Dossier Partiel',
      incomplet: '❌ Dossier Incomplet',
    }[badge]

    // Jours avant expiration
    let daysUntilExpiry: number | null = null
    if (expiryDate) {
      daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    }

    return NextResponse.json({
      success: true,
      extractedText: extractedText.substring(0, 500), // preview seulement
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
    console.error('Vision API error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
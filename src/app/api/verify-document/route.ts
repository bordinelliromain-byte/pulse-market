import { NextRequest, NextResponse } from 'next/server'

const GOOGLE_VISION_API_KEY = process.env.GOOGLE_VISION_API_KEY
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string, max = 5): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) { rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 }); return true }
  if (entry.count >= max) return false
  entry.count++; return true
}

function extractDates(text: string): Date[] {
  const months: { [key: string]: number } = { janvier: 1, février: 2, mars: 3, avril: 4, mai: 5, juin: 6, juillet: 7, août: 8, septembre: 9, octobre: 10, novembre: 11, décembre: 12 }
  const dates: Date[] = []
  let match
  const p1 = /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/g
  while ((match = p1.exec(text)) !== null) { const d = new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1])); if (!isNaN(d.getTime())) dates.push(d) }
  const p2 = /(\d{1,2})\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+(\d{4})/gi
  while ((match = p2.exec(text)) !== null) { const month = months[match[2].toLowerCase()]; const d = new Date(parseInt(match[3]), month - 1, parseInt(match[1])); if (!isNaN(d.getTime())) dates.push(d) }
  const p3 = /(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/g
  while ((match = p3.exec(text)) !== null) { const d = new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3])); if (!isNaN(d.getTime())) dates.push(d) }
  return dates
}

function extractSiren(text: string): string | null { const match = text.match(/\b(\d{3}[\s\.]?\d{3}[\s\.]?\d{3})\b/); return match ? match[1].replace(/[\s\.]/g, '') : null }
function extractBusinessName(text: string): string | null { const patterns = [/(?:raison sociale|dénomination|société)\s*:?\s*([A-Z][A-Za-z\s&'-]+(?:SARL|SAS|SA|EURL|EI|SASU|SNC)?)/i, /([A-Z][A-Z\s&'-]{2,}(?:SARL|SAS|SA|EURL|EI|SASU|SNC))/]; for (const p of patterns) { const m = text.match(p); if (m) return m[1].trim() } return null }
function similarity(a: string, b: string): number { const s1 = a.toLowerCase().replace(/[^a-z0-9]/g, ''); const s2 = b.toLowerCase().replace(/[^a-z0-9]/g, ''); if (s1 === s2) return 1; if (s1.includes(s2) || s2.includes(s1)) return 0.8; const w1 = s1.split(' '); const w2 = s2.split(' '); return w1.filter(w => w2.includes(w)).length / Math.max(w1.length, w2.length) }

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    if (!checkRateLimit(ip)) return NextResponse.json({ error: 'Trop de requêtes.' }, { status: 429 })

    if (!GOOGLE_VISION_API_KEY) return NextResponse.json({ error: 'Configuration manquante' }, { status: 500 })

    const formData = await req.formData()
    const file = formData.get('file') as File
    const docType = formData.get('type') as string
    const userSiren = formData.get('siren') as string || ''
    const userBusinessName = formData.get('businessName') as string || ''
    const otherDocText = formData.get('otherDocText') as string || ''

    if (!file) return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 })

    // ✅ Limite taille fichier — max 10MB
    if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: 'Fichier trop volumineux (max 10MB)' }, { status: 400 })

    // ✅ Vérif type MIME
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) return NextResponse.json({ error: 'Format non supporté (PDF, JPG, PNG uniquement)' }, { status: 400 })

    const arrayBuffer = await file.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')

    const visionRes = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_API_KEY}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests: [{ image: { content: base64 }, features: [{ type: 'DOCUMENT_TEXT_DETECTION', maxResults: 1 }] }] })
    })

    const visionData = await visionRes.json()
    const extractedText = visionData.responses?.[0]?.fullTextAnnotation?.text || ''
    if (!extractedText) return NextResponse.json({ success: false, error: 'Impossible de lire le document', score: 0, checks: {} })

    const dates = extractDates(extractedText)
    const extractedSiren = extractSiren(extractedText)
    const extractedBusinessName = extractBusinessName(extractedText)
    const now = new Date()
    const futureDates = dates.filter(d => d > now).sort((a, b) => a.getTime() - b.getTime())
    const pastDates = dates.filter(d => d <= now).sort((a, b) => b.getTime() - a.getTime())
    const expiryDate = docType === 'assurance' ? (futureDates[0] || null) : null
    const issueDate = pastDates[0] || null

    const checks: { [key: string]: boolean } = {}
    checks.readable = extractedText.length > 50
    checks.sirenMatch = userSiren && extractedSiren ? extractedSiren === userSiren.replace(/\s/g, '') : extractedSiren !== null
    checks.nameMatch = userBusinessName && extractedBusinessName ? similarity(userBusinessName, extractedBusinessName) > 0.6 : extractedBusinessName !== null
    checks.notExpired = docType === 'assurance' ? (expiryDate !== null && expiryDate > now) : (issueDate !== null && (now.getTime() - issueDate.getTime()) < 90 * 24 * 60 * 60 * 1000)
    checks.crossValid = otherDocText && extractedBusinessName ? (similarity(extractedBusinessName, extractBusinessName(otherDocText) || '') > 0.6 || extractSiren(otherDocText) === extractedSiren) : true

    const score = Object.values(checks).filter(Boolean).length
    const total = Object.keys(checks).length
    const badge = score === total ? 'platinum' : score >= total - 1 ? 'verifie' : score >= total - 2 ? 'partiel' : 'incomplet'
    const badgeLabel = { platinum: '💎 Dossier Platinum', verifie: '✅ Dossier Vérifié', partiel: '⚠️ Dossier Partiel', incomplet: '❌ Dossier Incomplet' }[badge]
    const daysUntilExpiry = expiryDate ? Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null

    return NextResponse.json({ success: true, extractedText: extractedText.substring(0, 500), extractedSiren, extractedBusinessName, expiryDate: expiryDate?.toISOString() || null, issueDate: issueDate?.toISOString() || null, daysUntilExpiry, checks, score, total, badge, badgeLabel })
  } catch (err: any) {
    console.error('Vision API error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
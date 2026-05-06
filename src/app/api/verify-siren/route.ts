import { NextRequest, NextResponse } from 'next/server'

const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string, max = 10): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) { rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 }); return true }
  if (entry.count >= max) return false
  entry.count++; return true
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    if (!checkRateLimit(ip)) return NextResponse.json({ error: 'Trop de requêtes.' }, { status: 429 })

    const { siren } = await request.json()
    if (!siren) return NextResponse.json({ error: 'SIREN manquant' }, { status: 400 })

    const cleanSiren = siren.replace(/[\s-]/g, '')
    if (cleanSiren.length !== 9 || !/^\d{9}$/.test(cleanSiren)) return NextResponse.json({ valid: false, message: '❌ Le SIREN doit contenir exactement 9 chiffres' })
    if (cleanSiren === '000000000' || cleanSiren === '123456789') return NextResponse.json({ valid: false, message: '❌ SIREN invalide' })

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)

    const response = await fetch(
      `https://recherche-entreprises.api.gouv.fr/search?q=${cleanSiren}&page=1&per_page=1`,
      { headers: { 'Accept': 'application/json' }, signal: controller.signal }
    )
    clearTimeout(timeout)

    const data = await response.json()
    if (!data.results || data.results.length === 0) return NextResponse.json({ valid: false, message: '❌ Entreprise introuvable dans le registre national' })

    const company = data.results[0]
    if (company.siren !== cleanSiren) return NextResponse.json({ valid: false, message: '❌ Entreprise introuvable dans le registre national' })

    const isActive = company.etat_administratif === 'A'
    const companyName = company.nom_complet || company.nom_raison_sociale || 'Nom inconnu'

    return NextResponse.json({ valid: isActive, companyName, siren: cleanSiren, message: isActive ? `✅ Entreprise active : ${companyName}` : '❌ Entreprise inactive ou radiée' })
  } catch (error: any) {
    return NextResponse.json({ valid: false, message: '❌ Erreur lors de la vérification' }, { status: 500 })
  }
}
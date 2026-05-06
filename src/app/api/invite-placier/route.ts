import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sanitize } from '@/lib/sanitize'


const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string, max = 5): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) { rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 }); return true }
  if (entry.count >= max) return false
  entry.count++; return true
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    if (!checkRateLimit(ip)) return NextResponse.json({ error: 'Trop de requêtes.' }, { status: 429 })

    const body = await req.json()
    const { email, mairieId, token } = body

    if (!email || typeof email !== 'string' || !email.includes('@') || email.length > 254) return NextResponse.json({ error: 'Email invalide' }, { status: 400 })
    if (!mairieId || typeof mairieId !== 'string') return NextResponse.json({ error: 'mairieId manquant' }, { status: 400 })
    if (!token || typeof token !== 'string' || token.length > 200) return NextResponse.json({ error: 'Token invalide' }, { status: 400 })

    // Vérifier que la mairie existe
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const { data: mairie } = await supabase.from('profiles').select('id, role').eq('id', mairieId).single()
    if (!mairie || mairie.role !== 'organisateur') return NextResponse.json({ error: 'Organisateur introuvable' }, { status: 404 })
    
    const safeEmail = sanitize(email)
    const { error } = await supabase.from('placier_invitations').insert({ email: safeEmail, mairie_id: mairieId, token, used: false })
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Invite placier error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
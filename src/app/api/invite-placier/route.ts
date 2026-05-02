import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { email, mairieId, token } = await req.json()
    const { createClient } = await import('@/lib/supabase')
    const supabase = createClient()
    const { error } = await supabase
      .from('placier_invitations')
      .insert({ email, mairie_id: mairieId, token, used: false })
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
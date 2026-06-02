import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    if (!id) return NextResponse.json({ error: 'ID manquant' }, { status: 400 })

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: app, error } = await supabase
      .from('applications')
      .select(`
        id, status, case_number, paid_at, exposant_id,
        profiles:exposant_id(full_name),
        events:event_id(title, start_date, location_name)
      `)
      .eq('id', id)
      .single()

    if (error || !app) return NextResponse.json({ error: 'not_found' }, { status: 404 })

    const { data: expData } = await supabase
      .from('exposant_data')
      .select('business_name, siren, description')
      .eq('user_id', (app as any).exposant_id)
      .single()

    return NextResponse.json({
      id: app.id,
      status: app.status,
      case_number: app.case_number,
      paid_at: app.paid_at,
      exposant_nom: (app as any).profiles?.full_name || '',
      exposant_business: expData?.business_name || '',
      exposant_siren: expData?.siren || '',
      exposant_produits: expData?.description || '',
      event_title: (app as any).events?.title || '',
      event_date: (app as any).events?.start_date || '',
      event_location: (app as any).events?.location_name || '',
    })
  } catch (err) {
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
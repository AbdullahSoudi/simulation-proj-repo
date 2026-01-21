import { NextResponse } from 'next/server'

import { getSupabaseServerClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const supabase = await getSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const patientId = searchParams.get('patientId')

  if (!patientId) {
    return NextResponse.json({ appointments: [] })
  }

  const { data: appointments } = await supabase
    .from('appointments')
    .select('id, starts_at, visit_type')
    .eq('patient_id', patientId)
    .order('starts_at', { ascending: false })
    .limit(20)

  return NextResponse.json({ appointments: appointments || [] })
}

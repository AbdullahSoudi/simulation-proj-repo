import { NextResponse } from 'next/server'

import { getSupabaseServerClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const patientId = searchParams.get('patientId')?.trim()

  if (!patientId) {
    return NextResponse.json({ episodes: [] })
  }

  const supabase = await getSupabaseServerClient()

  const { data: episodes } = await supabase
    .from('episodes')
    .select('id, procedure_name')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })
    .limit(50)

  const results = (episodes ?? []).map((e: any) => ({
    id: e.id,
    procedure_name: e.procedure_name,
  }))

  return NextResponse.json({ episodes: results })
}

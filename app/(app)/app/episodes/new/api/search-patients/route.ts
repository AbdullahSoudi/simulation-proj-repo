import { NextResponse } from 'next/server'

import { getSupabaseServerClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim() || ''

  if (!q || q.length < 2) {
    return NextResponse.json({ patients: [] })
  }

  const supabase = await getSupabaseServerClient()

  // 1) Find by phone
  const { data: phoneIds } = await supabase
    .from('patient_identities')
    .select('patient_id, phone_e164')
    .ilike('phone_e164', `%${q}%`)
    .eq('is_primary', true)
    .limit(50)

  const phonePatientIds = (phoneIds ?? []).map((r: any) => r.patient_id)
  const phoneMap = new Map<string, string>()
  for (const r of phoneIds ?? []) {
    if ((r as any).patient_id && (r as any).phone_e164) {
      phoneMap.set((r as any).patient_id, (r as any).phone_e164)
    }
  }

  // 2) Find by name
  let nameQuery = supabase
    .from('patients')
    .select('id, full_name')
    .limit(50)

  if (phonePatientIds.length > 0) {
    const { data: nameRows } = await supabase
      .from('patients')
      .select('id, full_name')
      .ilike('full_name', `%${q}%`)
      .limit(50)

    const nameIds = (nameRows ?? []).map((r: any) => r.id).filter(Boolean) as string[]
    const merged = Array.from(new Set([...phonePatientIds, ...nameIds]))
    nameQuery = nameQuery.in('id', merged)
  } else {
    nameQuery = nameQuery.ilike('full_name', `%${q}%`)
  }

  const { data: patients } = await nameQuery

  const results = (patients ?? []).map((p: any) => ({
    id: p.id,
    full_name: p.full_name,
    phone: phoneMap.get(p.id) ?? null,
  }))

  return NextResponse.json({ patients: results })
}

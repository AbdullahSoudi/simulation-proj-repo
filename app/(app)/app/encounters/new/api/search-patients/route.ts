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
  const query = searchParams.get('q') || ''

  if (!query || query.length < 2) {
    return NextResponse.json({ patients: [] })
  }

  // Search by name or phone
  const { data: patients } = await supabase
    .from('patients')
    .select('id, full_name')
    .ilike('full_name', `%${query}%`)
    .limit(10)

  const patientIds = (patients || []).map((p) => p.id)

  let identities: Array<{ patient_id: string; phone_e164: string | null }> = []
  if (patientIds.length > 0) {
    const { data: idData } = await supabase
      .from('patient_identities')
      .select('patient_id, phone_e164')
      .in('patient_id', patientIds)
      .eq('is_primary', true)

    identities = (idData || []) as typeof identities
  }

  // Also search by phone
  const { data: phoneIdentities } = await supabase
    .from('patient_identities')
    .select('patient_id, phone_e164')
    .ilike('phone_e164', `%${query}%`)
    .eq('is_primary', true)
    .limit(10)

  const phonePatientIds = (phoneIdentities || []).map((pi) => pi.patient_id)

  let phonePatients: Array<{ id: string; full_name: string | null }> = []
  if (phonePatientIds.length > 0) {
    const { data: pData } = await supabase
      .from('patients')
      .select('id, full_name')
      .in('id', phonePatientIds)

    phonePatients = (pData || []) as typeof phonePatients
  }

  // Combine and deduplicate
  const allPatients = new Map<string, { id: string; full_name: string | null; phone: string | null }>()

  for (const p of patients || []) {
    const identity = identities.find((i) => i.patient_id === p.id)
    allPatients.set(p.id, {
      id: p.id,
      full_name: p.full_name,
      phone: identity?.phone_e164 || null,
    })
  }

  for (const p of phonePatients) {
    const identity = phoneIdentities?.find((i) => i.patient_id === p.id)
    if (!allPatients.has(p.id)) {
      allPatients.set(p.id, {
        id: p.id,
        full_name: p.full_name,
        phone: identity?.phone_e164 || null,
      })
    }
  }

  return NextResponse.json({ patients: Array.from(allPatients.values()) })
}

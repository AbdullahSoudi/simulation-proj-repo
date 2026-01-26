import { getSupabaseServerClient } from '@/lib/supabase/server'
import { EncountersClient } from './EncountersClient'

type SearchParams = {
  status?: string
  type?: string
  search?: string
}

type EncounterRow = {
  id: string
  patient_id: string
  episode_id: string | null
  type: string
  status: string
  updated_at: string
}

type PatientRow = {
  id: string
  full_name: string | null
}

export default async function EncountersPage({ searchParams }: { searchParams?: SearchParams }) {
  const supabase = await getSupabaseServerClient()

  const statusFilter = searchParams?.status || ''
  const typeFilter = searchParams?.type || ''
  const searchQuery = searchParams?.search || ''

  // Build query
  let encountersQuery = supabase
    .from('encounters')
    .select('id, patient_id, episode_id, type, status, updated_at', {
      count: 'exact',
    })
    .order('updated_at', { ascending: false })

  if (typeFilter) {
    encountersQuery = encountersQuery.eq('type', typeFilter)
  }

  if (searchQuery) {
    // Search by encounter ID or patient name (we'll filter patient names in JS after fetching)
    if (searchQuery.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
      encountersQuery = encountersQuery.eq('id', searchQuery)
    }
  }

  const { data: encounters, error: encountersError, count } = await encountersQuery

  const encounterRows = (encounters ?? []) as Array<{
    id: string
    patient_id: string
    episode_id: string | null
    type: string
    status: string
    updated_at: string
  }>
  const patientIds = Array.from(new Set(encounterRows.map((e) => e.patient_id)))

  // Fetch patient names
  const patientsById = new Map<string, PatientRow>()
  if (patientIds.length > 0) {
    const { data: patients } = await supabase
      .from('patients')
      .select('id, full_name')
      .in('id', patientIds)

    if (patients) {
      for (const p of patients as PatientRow[]) {
        if (p.id) {
          patientsById.set(p.id, p)
        }
      }
    }
  }

  // Filter by patient name if search query provided
  let filteredEncounters = encounterRows
  if (searchQuery && !searchQuery.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
    filteredEncounters = encounterRows.filter((e) => {
      const patient = patientsById.get(e.patient_id)
      const name = patient?.full_name?.toLowerCase() || ''
      return name.includes(searchQuery.toLowerCase())
    })
  }

  // Filter by status if provided (encounters table has status field)
  if (statusFilter) {
    filteredEncounters = filteredEncounters.filter((e) => e.status === statusFilter)
  }

  // Convert Maps to plain objects for serialization
  const patientsByIdObj: Record<string, PatientRow> = {}
  for (const [id, patient] of patientsById) {
    patientsByIdObj[id] = patient
  }

  return (
    <EncountersClient
      encounters={filteredEncounters}
      patientsById={patientsByIdObj}
      total={filteredEncounters.length}
      statusFilter={statusFilter}
      typeFilter={typeFilter}
      searchQuery={searchQuery}
      encountersError={encountersError ? { message: encountersError.message } : null}
    />
  )
}


import { getSupabaseServerClient } from '@/lib/supabase/server'
import { EncountersClient } from './EncountersClient'

type SearchParams = {
  status?: string
  type?: string
  search?: string
}

type EncounterThreadRow = {
  id: string
  patient_id: string
  episode_id: string | null
  appointment_id: string | null
  note_type: string
  created_at: string
}

type LatestVersionRow = {
  thread_id: string
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
  let threadsQuery = supabase
    .from('encounter_threads')
    .select('id, patient_id, episode_id, appointment_id, note_type, created_at', {
      count: 'exact',
    })
    .order('created_at', { ascending: false })

  if (typeFilter) {
    threadsQuery = threadsQuery.eq('note_type', typeFilter)
  }

  if (searchQuery) {
    // Search by thread ID or patient name (we'll filter patient names in JS after fetching)
    if (searchQuery.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
      threadsQuery = threadsQuery.eq('id', searchQuery)
    }
  }

  const { data: threads, error: threadsError, count } = await threadsQuery

  const threadRows = (threads ?? []) as EncounterThreadRow[]
  const patientIds = Array.from(new Set(threadRows.map((t) => t.patient_id)))

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
  let filteredThreads = threadRows
  if (searchQuery && !searchQuery.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
    filteredThreads = threadRows.filter((t) => {
      const patient = patientsById.get(t.patient_id)
      const name = patient?.full_name?.toLowerCase() || ''
      return name.includes(searchQuery.toLowerCase())
    })
  }

  // Fetch latest version per thread
  const threadIds = filteredThreads.map((t) => t.id)
  const latestVersions: Record<string, LatestVersionRow> = {}

  if (threadIds.length > 0) {
    // Get latest version for each thread
    const { data: versions } = await supabase
      .from('encounter_versions')
      .select('thread_id, status, created_at')
      .in('thread_id', threadIds)
      .order('created_at', { ascending: false })

    if (versions) {
      const seen = new Set<string>()
      for (const v of versions as Array<{ thread_id: string; status: string; created_at: string }>) {
        if (!seen.has(v.thread_id)) {
          seen.add(v.thread_id)
          latestVersions[v.thread_id] = {
            thread_id: v.thread_id,
            status: v.status,
            updated_at: v.created_at,
          }
        }
      }
    }
  }

  // Filter by status if provided
  if (statusFilter) {
    filteredThreads = filteredThreads.filter((t) => {
      const latestVersion = latestVersions[t.id]
      return latestVersion?.status === statusFilter
    })
  }

  // Convert Maps to plain objects for serialization
  const patientsByIdObj: Record<string, PatientRow> = {}
  for (const [id, patient] of patientsById) {
    patientsByIdObj[id] = patient
  }

  const total = filteredThreads.length

  return (
    <EncountersClient
      threads={filteredThreads}
      latestVersions={latestVersions}
      patientsById={patientsByIdObj}
      total={total}
      statusFilter={statusFilter}
      typeFilter={typeFilter}
      searchQuery={searchQuery}
      encountersError={threadsError ? { message: threadsError.message } : null}
    />
  )
}


import { getSupabaseServerClient } from '@/lib/supabase/server'
import { ScheduleClient } from './ScheduleClient'

type SearchParams = {
  date?: string
  status?: string
}

type AppointmentRow = {
  id: string
  patient_id: string
  episode_id: string | null
  visit_type: string
  status: string
  starts_at: string
  ends_at: string
  notes: string | null
}

type PatientRow = {
  id: string
  full_name: string | null
}

type IdentityRow = {
  patient_id: string
  phone_e164: string | null
  is_primary: boolean | null
}

type EpisodeRow = {
  id: string
  procedure_name: string | null
}

export default async function SchedulePage({ searchParams }: { searchParams?: SearchParams }) {
  const supabase = await getSupabaseServerClient()

  const dateFilter = searchParams?.date || 'today'
  const statusFilter = searchParams?.status || ''

  // Calculate date range
  const now = new Date()
  let startDate: Date
  let endDate: Date

  if (dateFilter === 'today') {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + 1)
  } else if (dateFilter === 'week') {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + 7)
  } else {
    // Try to parse as date
    const parsed = new Date(dateFilter)
    if (!isNaN(parsed.getTime())) {
      startDate = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate())
      endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + 1)
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + 1)
    }
  }

  // Build query
  let appointmentsQuery = supabase
    .from('appointments')
    .select('id, patient_id, episode_id, visit_type, status, starts_at, ends_at, notes', {
      count: 'exact',
    })
    .gte('starts_at', startDate.toISOString())
    .lt('starts_at', endDate.toISOString())
    .order('starts_at', { ascending: true })

  if (statusFilter) {
    appointmentsQuery = appointmentsQuery.eq('status', statusFilter)
  }

  const { data: appointments, error: appointmentsError, count } = await appointmentsQuery

  const appointmentRows = (appointments ?? []) as AppointmentRow[]
  const patientIds = Array.from(new Set(appointmentRows.map((a) => a.patient_id)))
  const episodeIds = appointmentRows
    .map((a) => a.episode_id)
    .filter((id): id is string => id !== null)

  // Fetch patient names and phones
  const patientsById = new Map<string, PatientRow>()
  const identitiesByPatientId = new Map<string, string>()

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

    const { data: identities } = await supabase
      .from('patient_identities')
      .select('patient_id, phone_e164, is_primary')
      .in('patient_id', patientIds)
      .eq('is_primary', true)

    if (identities) {
      for (const row of identities as IdentityRow[]) {
        if (row.patient_id && row.phone_e164) {
          identitiesByPatientId.set(row.patient_id, row.phone_e164)
        }
      }
    }
  }

  // Fetch episode names
  const episodesById = new Map<string, EpisodeRow>()
  if (episodeIds.length > 0) {
    const { data: episodes } = await supabase
      .from('episodes')
      .select('id, procedure_name')
      .in('id', episodeIds)

    if (episodes) {
      for (const e of episodes as EpisodeRow[]) {
        if (e.id) {
          episodesById.set(e.id, e)
        }
      }
    }
  }

  const total = count ?? 0

  // Convert Maps to plain objects for serialization
  const patientsByIdObj: Record<string, PatientRow> = {}
  for (const [id, patient] of patientsById) {
    patientsByIdObj[id] = patient
  }

  const identitiesByPatientIdObj: Record<string, string> = {}
  for (const [id, phone] of identitiesByPatientId) {
    identitiesByPatientIdObj[id] = phone
  }

  const episodesByIdObj: Record<string, EpisodeRow> = {}
  for (const [id, episode] of episodesById) {
    episodesByIdObj[id] = episode
  }

  return (
    <ScheduleClient
      appointments={appointmentRows}
      patientsById={patientsByIdObj}
      identitiesByPatientId={identitiesByPatientIdObj}
      episodesById={episodesByIdObj}
      total={total}
      dateFilter={dateFilter}
      statusFilter={statusFilter}
      appointmentsError={appointmentsError ? { message: appointmentsError.message } : null}
    />
  )
}

import { NewEncounterForm } from './NewEncounterForm'
import { getSupabaseServerClient } from '@/lib/supabase/server'

type PrefilledPatient = {
  id: string
  full_name: string | null
  phone: string | null
} | null

type PrefilledEpisode = {
  id: string
  procedure_name: string | null
  patient_id: string
} | null

export default async function NewEncounterPage({
  searchParams,
}: {
  searchParams?: { patientId?: string; episodeId?: string }
}) {
  const supabase = await getSupabaseServerClient()

  let prefilledPatient: PrefilledPatient = null
  let prefilledEpisode: PrefilledEpisode = null

  if (searchParams?.patientId) {
    const { data: patient } = await supabase
      .from('patients')
      .select('id, full_name')
      .eq('id', searchParams.patientId)
      .maybeSingle()

    if (patient) {
      const { data: identity } = await supabase
        .from('patient_identities')
        .select('phone_e164')
        .eq('patient_id', patient.id)
        .eq('is_primary', true)
        .maybeSingle()

      prefilledPatient = {
        id: patient.id,
        full_name: patient.full_name,
        phone: identity?.phone_e164 || null,
      }
    }
  }

  if (searchParams?.episodeId && prefilledPatient) {
    const { data: episode } = await supabase
      .from('episodes')
      .select('id, procedure_name, patient_id')
      .eq('id', searchParams.episodeId)
      .eq('patient_id', prefilledPatient.id)
      .maybeSingle()

    if (episode) {
      prefilledEpisode = {
        id: episode.id,
        procedure_name: episode.procedure_name,
        patient_id: episode.patient_id,
      }
    }
  }

  return (
    <NewEncounterForm
      prefilledPatient={prefilledPatient}
      prefilledEpisode={prefilledEpisode}
    />
  )
}

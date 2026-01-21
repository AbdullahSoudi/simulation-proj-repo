import { redirect } from 'next/navigation'

import { PageHeader } from '@/components/ui/page-header'
import { NewAppointmentForm } from './NewAppointmentForm'
import { getSupabaseServerClient } from '@/lib/supabase/server'

type SearchParams = {
  patientId?: string
  episodeId?: string
}

export default async function NewAppointmentPage({ searchParams }: { searchParams?: SearchParams }) {
  const supabase = await getSupabaseServerClient()

  const prefilledPatientId = searchParams?.patientId?.trim()
  const prefilledEpisodeId = searchParams?.episodeId?.trim()

  // If patientId provided, verify it exists
  let prefilledPatient: { id: string; full_name: string | null; phone: string | null } | null = null
  if (prefilledPatientId) {
    const { data: patient } = await supabase
      .from('patients')
      .select('id, full_name')
      .eq('id', prefilledPatientId)
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
        phone: (identity as any)?.phone_e164 ?? null,
      }
    }
  }

  // If episodeId provided, verify it exists and belongs to patient
  let prefilledEpisode: { id: string; procedure_name: string | null; patient_id: string } | null = null
  if (prefilledEpisodeId) {
    const { data: episode } = await supabase
      .from('episodes')
      .select('id, procedure_name, patient_id')
      .eq('id', prefilledEpisodeId)
      .maybeSingle()

    if (episode) {
      prefilledEpisode = {
        id: episode.id,
        procedure_name: (episode as any).procedure_name,
        patient_id: (episode as any).patient_id,
      }

      // If patientId was also provided, ensure they match
      if (prefilledPatientId && prefilledEpisode.patient_id !== prefilledPatientId) {
        prefilledEpisode = null
      } else if (!prefilledPatient && prefilledEpisode.patient_id) {
        // Auto-fill patient from episode
        const { data: patient } = await supabase
          .from('patients')
          .select('id, full_name')
          .eq('id', prefilledEpisode.patient_id)
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
            phone: (identity as any)?.phone_e164 ?? null,
          }
        }
      }
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Appointment"
        description="Schedule a new appointment."
      />

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <NewAppointmentForm
          prefilledPatient={prefilledPatient}
          prefilledEpisode={prefilledEpisode}
        />
      </section>
    </div>
  )
}

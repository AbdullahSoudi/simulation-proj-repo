import { redirect } from 'next/navigation'

import { PageHeader } from '@/components/ui/page-header'
import { NewEpisodeForm } from './NewEpisodeForm'
import { getSupabaseServerClient } from '@/lib/supabase/server'

type SearchParams = {
  patientId?: string
}

export default async function NewEpisodePage({ searchParams }: { searchParams?: SearchParams }) {
  const supabase = await getSupabaseServerClient()

  const prefilledPatientId = searchParams?.patientId?.trim()

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

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Episode"
        description="Create a new surgical care journey."
      />

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <NewEpisodeForm prefilledPatient={prefilledPatient} />
      </section>
    </div>
  )
}

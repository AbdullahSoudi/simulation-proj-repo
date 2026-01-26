import Link from 'next/link'

import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getUserRoleIds } from '@/lib/rbac'
import { PageHeader } from '@/components/ui/page-header'
import { fetchEncounterAction } from '../actions'
import { EncounterDetailClient } from './EncounterDetailClient'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
function isUuid(v: string) {
  return UUID_RE.test(v.trim())
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
      <h2 className="text-sm font-semibold text-[var(--text)]">{title}</h2>
      <div className="mt-3 text-sm text-[var(--text-2)]">{children}</div>
    </section>
  )
}

export default async function EncounterDetailPage({
  params,
}: {
  params: Promise<{ encounterId: string }>
}) {
  const supabase = await getSupabaseServerClient()
  const { encounterId } = await params

  if (!isUuid(encounterId)) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Invalid encounter ID"
          description="The provided encounter ID is not a valid UUID."
          actions={
            <Link href="/app/encounters" className="text-sm font-medium text-[var(--primary-700)] hover:underline">
              Back to Encounters
            </Link>
          }
        />
        <Card title="Error">Invalid encounter ID format.</Card>
      </div>
    )
  }

  try {
    const encounterData = await fetchEncounterAction({ encounterId })

    // Fetch patient
    const { data: patient } = await supabase
      .from('patients')
      .select('id, full_name')
      .eq('id', encounterData.encounter.patient_id)
      .maybeSingle()

    // Fetch orders for this encounter (using encounter_thread_id for backward compatibility)
    const { data: orders } = await supabase
      .from('orders')
      .select('id, type, name, status, ordered_at, received_at, reviewed_at, notes')
      .eq('encounter_thread_id', encounterId)
      .order('ordered_at', { ascending: false })

    // Check if user is doctor
    const { roleIds } = await getUserRoleIds()
    const isDoctor = roleIds.includes('doctor') || roleIds.includes('admin')

    return (
      <EncounterDetailClient
        encounter={encounterData.encounter}
        currentVersion={encounterData.currentVersion as any}
        versions={encounterData.versions as any}
        patient={patient as any}
        orders={(orders ?? []) as any}
        isDoctor={isDoctor}
      />
    )
  } catch (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Encounter not found"
          description={error instanceof Error ? error.message : 'This encounter does not exist or you do not have access.'}
          actions={
            <Link href="/app/encounters" className="text-sm font-medium text-[var(--primary-700)] hover:underline">
              Back to Encounters
            </Link>
          }
        />
        <Card title="Error">
          {error instanceof Error ? error.message : 'Unable to load encounter.'}
        </Card>
      </div>
    )
  }
}

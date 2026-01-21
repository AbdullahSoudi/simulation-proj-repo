import Link from 'next/link'

import { getSupabaseServerClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/page-header'
import { EncounterDetailClient } from './EncounterDetailClient'

type EncounterThreadRow = {
  id: string
  patient_id: string
  episode_id: string | null
  appointment_id: string | null
  note_type: string
  created_at: string
}

type EncounterVersionRow = {
  id: string
  thread_id: string
  version: number
  status: 'draft' | 'finalized'
  content: string
  created_at: string
  created_by: string | null
  finalized_at: string | null
  finalized_by: string | null
}

type PatientRow = {
  id: string
  full_name: string | null
}

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
  params: Promise<{ threadId: string }>
}) {
  const supabase = await getSupabaseServerClient()
  const { threadId } = await params

  if (!isUuid(threadId)) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Invalid thread ID"
          description="The provided thread ID is not a valid UUID."
          actions={
            <Link href="/app/encounters" className="text-sm font-medium text-[var(--primary-700)] hover:underline">
              Back to Encounters
            </Link>
          }
        />
        <Card title="Error">Invalid thread ID format.</Card>
      </div>
    )
  }

  const { data: thread, error: threadError } = await supabase
    .from('encounter_threads')
    .select('id, patient_id, episode_id, appointment_id, note_type, created_at')
    .eq('id', threadId)
    .single()

  if (threadError || !thread) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Encounter not found"
          description="This encounter does not exist or you do not have access."
          actions={
            <Link href="/app/encounters" className="text-sm font-medium text-[var(--primary-700)] hover:underline">
              Back to Encounters
            </Link>
          }
        />
        <Card title="Error">{threadError?.message ?? 'Unable to load encounter.'}</Card>
      </div>
    )
  }

  const t = thread as EncounterThreadRow

  // Fetch patient
  const { data: patient } = await supabase
    .from('patients')
    .select('id, full_name')
    .eq('id', t.patient_id)
    .maybeSingle()

  const p = patient as PatientRow | null

  // Fetch all versions
  const { data: versions, error: versionsError } = await supabase
    .from('encounter_versions')
    .select('id, thread_id, version, status, content, created_at, created_by, finalized_at, finalized_by')
    .eq('thread_id', threadId)
    .order('version', { ascending: true })

  if (versionsError) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Error loading versions"
          description={versionsError.message}
          actions={
            <Link href="/app/encounters" className="text-sm font-medium text-[var(--primary-700)] hover:underline">
              Back to Encounters
            </Link>
          }
        />
      </div>
    )
  }

  const versionRows = (versions ?? []) as EncounterVersionRow[]

  // Find latest draft version
  const latestDraftVersion = versionRows
    .filter((v) => v.status === 'draft')
    .sort((a, b) => b.version - a.version)[0] || null

  return (
    <EncounterDetailClient
      thread={t}
      versions={versionRows}
      patient={p}
      latestDraftVersion={latestDraftVersion}
    />
  )
}

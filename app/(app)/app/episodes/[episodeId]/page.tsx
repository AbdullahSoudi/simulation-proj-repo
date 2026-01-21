import Link from 'next/link'

import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getUserRoleIds } from '@/lib/rbac'
import { PageHeader } from '@/components/ui/page-header'
import { PreOpChecklist } from './PreOpChecklist'
import { AnesthesiaAssessment } from './AnesthesiaAssessment'
import { PostOpFollowup } from './PostOpFollowup'

type EpisodeRow = {
  id: string
  patient_id: string
  status: string
  procedure_name: string | null
  scheduled_at: string | null
  notes: string | null
  created_at: string | null
  updated_at: string | null
}

type PatientRow = {
  id: string
  full_name: string | null
}

type IdentityRow = {
  phone_e164: string | null
  is_primary: boolean | null
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
      <h2 className="text-sm font-semibold text-[var(--text)]">{title}</h2>
      <div className="mt-3 text-sm text-[var(--text-2)]">{children}</div>
    </section>
  )
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
function isUuid(v: string) {
  return UUID_RE.test(v.trim())
}

export default async function EpisodeDetailPage({
  params,
}: {
  params: Promise<{ episodeId: string }>
}) {
  const supabase = await getSupabaseServerClient()
  const { episodeId } = await params

  if (!isUuid(episodeId)) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Invalid episode ID"
          description="The provided episode ID is not a valid UUID."
          actions={
            <Link href="/app/episodes" className="text-sm font-medium text-[var(--primary-700)] hover:underline">
              Back to Episodes
            </Link>
          }
        />
        <Card title="Error">Invalid episode ID format.</Card>
      </div>
    )
  }

  const { data: episode, error: episodeError } = await supabase
    .from('episodes')
    .select('id, patient_id, status, procedure_name, scheduled_at, notes, created_at, updated_at')
    .eq('id', episodeId)
    .single()

  if (episodeError || !episode) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Episode not found"
          description="This episode does not exist or you do not have access."
          actions={
            <Link href="/app/episodes" className="text-sm font-medium text-[var(--primary-700)] hover:underline">
              Back to Episodes
            </Link>
          }
        />
        <Card title="Error">
          {episodeError?.message ?? 'Unable to load episode.'}
        </Card>
      </div>
    )
  }

  const e = episode as EpisodeRow

  // Fetch patient info
  const { data: patient } = await supabase
    .from('patients')
    .select('id, full_name')
    .eq('id', e.patient_id)
    .maybeSingle()

  const { data: identity } = await supabase
    .from('patient_identities')
    .select('phone_e164, is_primary')
    .eq('patient_id', e.patient_id)
    .eq('is_primary', true)
    .maybeSingle()

  const p = patient as PatientRow | null
  const idRow = identity as IdentityRow | null

  // Fetch checklist if exists
  const { data: checklist } = await supabase
    .from('episode_checklists')
    .select('id')
    .eq('episode_id', episodeId)
    .maybeSingle()

  let checklistItems: Array<{
    id: string
    label: string
    sort_order: number
    status: 'pending' | 'done' | 'not_applicable'
    notes: string | null
    completed_at: string | null
  }> = []

  if (checklist) {
    const { data: items } = await supabase
      .from('episode_checklist_items')
      .select('id, label, sort_order, status, notes, completed_at')
      .eq('episode_checklist_id', checklist.id)
      .order('sort_order', { ascending: true })

    checklistItems = (items ?? []) as typeof checklistItems
  }

  // Fetch anesthesia assessment if exists
  const { data: anesthesiaAssessment } = await supabase
    .from('anesthesia_assessments')
    .select('id, episode_id, asa_class, mallampati, comorbidities, allergies, current_meds, fasting_status, planned_anesthesia, notes, is_finalized, finalized_at, finalized_by')
    .eq('episode_id', episodeId)
    .maybeSingle()

  // Check if user can edit (anesthesia or admin role)
  const { roleIds } = await getUserRoleIds()
  const canEditAnesthesia = roleIds.includes('anesthesia') || roleIds.includes('admin')

  // Fetch follow-up plan if exists
  const { data: followupPlan } = await supabase
    .from('episode_followup_plans')
    .select('id')
    .eq('episode_id', episodeId)
    .maybeSingle()

  let followupTasks: Array<{
    id: string
    title: string
    due_at: string
    status: 'pending' | 'done' | 'skipped'
    completed_at: string | null
    notes: string | null
  }> = []

  if (followupPlan) {
    const { data: tasks } = await supabase
      .from('episode_tasks')
      .select('id, title, due_at, status, completed_at, notes')
      .eq('episode_id', episodeId)
      .order('due_at', { ascending: true })

    followupTasks = (tasks ?? []) as typeof followupTasks
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={e.procedure_name ?? 'Episode'}
        description={`Episode ID: ${e.id}`}
        actions={
          <Link href="/app/episodes" className="text-sm font-medium text-[var(--primary-700)] hover:underline">
            Back to Episodes
          </Link>
        }
      />

      <section className="grid gap-4 md:grid-cols-2">
        <Card title="Overview">
          <div className="space-y-2">
            <div>
              <span className="text-[var(--text-3)]">Patient:</span>{' '}
              <Link
                href={`/app/patients/${e.patient_id}`}
                className="font-medium text-[var(--primary-700)] hover:underline"
              >
                {p?.full_name ?? '(Unknown)'}
              </Link>
            </div>
            {idRow?.phone_e164 && (
              <div>
                <span className="text-[var(--text-3)]">Phone:</span>{' '}
                <span className="font-medium text-[var(--text)]">{idRow.phone_e164}</span>
              </div>
            )}
            <div>
              <span className="text-[var(--text-3)]">Procedure:</span>{' '}
              <span className="font-medium text-[var(--text)]">{e.procedure_name ?? '—'}</span>
            </div>
            <div>
              <span className="text-[var(--text-3)]">Status:</span>{' '}
              <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium capitalize bg-[var(--surface-muted)] text-[var(--text-2)]">
                {e.status ?? '—'}
              </span>
            </div>
            <div>
              <span className="text-[var(--text-3)]">Scheduled:</span>{' '}
              <span className="font-medium text-[var(--text)]">
                {e.scheduled_at ? new Date(e.scheduled_at).toLocaleString() : '—'}
              </span>
            </div>
            {e.notes && (
              <div>
                <span className="text-[var(--text-3)]">Notes:</span>{' '}
                <span className="font-medium text-[var(--text)]">{e.notes}</span>
              </div>
            )}
          </div>
        </Card>

        <Card title="Timeline">
          <div className="space-y-2 text-xs text-[var(--text-3)]">
            <div>Created: {e.created_at ? new Date(e.created_at).toLocaleString() : '—'}</div>
            <div>Updated: {e.updated_at ? new Date(e.updated_at).toLocaleString() : '—'}</div>
          </div>
        </Card>
      </section>

      <Card title="Pre-op checklist">
        <PreOpChecklist
          episodeId={episodeId}
          checklistId={checklist?.id ?? null}
          items={checklistItems}
        />
      </Card>

      <Card title="Anesthesia">
        <AnesthesiaAssessment
          episodeId={episodeId}
          assessment={anesthesiaAssessment as any}
          canEdit={canEditAnesthesia}
        />
      </Card>

      <Card title="Post-op Follow-up Plan">
        <PostOpFollowup
          episodeId={episodeId}
          planId={followupPlan?.id ?? null}
          scheduledAt={e.scheduled_at}
          tasks={followupTasks}
        />
      </Card>

      <section className="grid gap-4 md:grid-cols-2">
        <Card title="Intra-op (placeholder)">
          Intra-operative notes and observations will be implemented here.
        </Card>
      </section>

      <Card title="Documents">
        <div className="space-y-2">
          <p className="text-[var(--text-2)]">
            Patient documents are available in the{' '}
            <Link
              href={`/app/patients/${e.patient_id}`}
              className="font-medium text-[var(--primary-700)] hover:underline"
            >
              patient profile
            </Link>
            .
          </p>
          <p className="text-xs text-[var(--text-3)]">
            Episode-specific document linking will be added in a future update.
          </p>
        </div>
      </Card>
    </div>
  )
}

import Link from 'next/link'

import { getSupabaseServerClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/page-header'
import { PatientDocumentsUploader } from './PatientDocumentsUploader'
import { DocumentActions } from './DocumentActionsClient'

type PatientRow = {
  id: string
  full_name: string | null
  gender: string | null
  date_of_birth: string | null
  created_at: string | null
}

type IdentityRow = {
  id: string
  phone_e164: string | null
  verification_status: string | null
  is_primary: boolean | null
  created_at: string | null
}

type DocumentRow = {
  id: string
  type: string | null
  filename: string | null
  created_at: string | null
  uploaded_by: string | null
}

type EpisodeRow = {
  id: string
  status: string
  procedure_name: string | null
  scheduled_at: string | null
  updated_at: string | null
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

export default async function PatientProfilePage({
  params,
}: {
  params: Promise<{ patientId: string }>
}) {
  const supabase = await getSupabaseServerClient()
  const { patientId } = await params

  if (!isUuid(patientId)) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Invalid patient id"
          description="The provided patient id is not a valid UUID."
          actions={
            <Link href="/app/patients" className="text-sm font-medium text-[var(--primary-700)] hover:underline">
              Back to Patients
            </Link>
          }
        />
        <Card title="Error">Invalid patient id format.</Card>
      </div>
    )
  }

  const { data: patient, error: patientError } = await supabase
    .from('patients')
    .select('id, full_name, gender, date_of_birth, created_at')
    .eq('id', patientId)
    .single()

  if (patientError || !patient) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Patient not found"
          description="This patient does not exist or you do not have access."
          actions={
            <Link href="/app/patients" className="text-sm font-medium text-[var(--primary-700)] hover:underline">
              Back to Patients
            </Link>
          }
        />
        <Card title="Error">
          {patientError?.message ?? 'Unable to load patient.'}
        </Card>
      </div>
    )
  }

  const { data: identities } = await supabase
    .from('patient_identities')
    .select('id, phone_e164, verification_status, is_primary, created_at')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })

  const { data: documents, error: documentsError } = await supabase
    .from('documents')
    .select('id, type, filename, created_at, uploaded_by')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })

  const { data: episodes, error: episodesError } = await supabase
    .from('episodes')
    .select('id, status, procedure_name, scheduled_at, updated_at')
    .eq('patient_id', patientId)
    .order('updated_at', { ascending: false })

  // Fetch encounters (last 5)
  const { data: encounters, error: encountersError } = await supabase
    .from('encounters')
    .select('id, type, status, created_at')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })
    .limit(5)

  const encounterRows = (encounters ?? []).map((e) => ({
    id: e.id,
    note_type: e.type,
    created_at: e.created_at,
    latest_version_status: e.status,
  })) as Array<{
    id: string
    note_type: string
    created_at: string
    latest_version_status: string
  }>

  // Fetch upcoming appointments (next 30 days)
  const now = new Date()
  const futureDate = new Date(now)
  futureDate.setDate(futureDate.getDate() + 30)

  const { data: appointments, error: appointmentsError } = await supabase
    .from('appointments')
    .select('id, episode_id, visit_type, status, starts_at, ends_at, notes')
    .eq('patient_id', patientId)
    .gte('starts_at', now.toISOString())
    .lte('starts_at', futureDate.toISOString())
    .order('starts_at', { ascending: true })

  const p = patient as PatientRow
  const idRows = (identities ?? []) as IdentityRow[]
  const docRows = (documents ?? []) as DocumentRow[]
  const episodeRows = (episodes ?? []) as EpisodeRow[]
  const appointmentRows = (appointments ?? []) as Array<{
    id: string
    episode_id: string | null
    visit_type: string
    status: string
    starts_at: string
    ends_at: string
    notes: string | null
  }>

  return (
    <div className="space-y-6">
      <PageHeader
        title={p.full_name ?? 'Patient'}
        description={`Patient ID: ${p.id}`}
        actions={
          <Link href="/app/patients" className="text-sm font-medium text-[var(--primary-700)] hover:underline">
            Back to Patients
          </Link>
        }
      />

      <section className="grid gap-4 md:grid-cols-2">
        <Card title="Overview">
          <div className="space-y-2">
            <div>
              <span className="text-[var(--text-3)]">Full name:</span>{' '}
              <span className="font-medium text-[var(--text)]">{p.full_name ?? '—'}</span>
            </div>
            <div>
              <span className="text-[var(--text-3)]">Gender:</span>{' '}
              <span className="font-medium text-[var(--text)]">{p.gender ?? '—'}</span>
            </div>
            <div>
              <span className="text-[var(--text-3)]">Date of birth:</span>{' '}
              <span className="font-medium text-[var(--text)]">{p.date_of_birth ?? '—'}</span>
            </div>
          </div>
        </Card>

        <Card title="Identities">
          {idRows.length === 0 ? (
            <div>No identities on record.</div>
          ) : (
            <div className="space-y-3">
              {idRows.map((r) => (
                <div key={r.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-medium text-[var(--text)]">{r.phone_e164 ?? '—'}</div>
                    <div className="text-xs text-[var(--text-3)]">
                      {r.is_primary ? 'Primary' : 'Secondary'} • {r.verification_status ?? 'unknown'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card title="Documents">
          <div className="space-y-4">
            <PatientDocumentsUploader patientId={p.id} />

            <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-white">
              {documentsError ? (
                <div className="p-4 text-sm text-[var(--danger-600)]">
                  Failed to load documents: {documentsError.message}
                </div>
              ) : docRows.length === 0 ? (
                <div className="p-4 text-sm text-[var(--text-2)]">No documents yet.</div>
              ) : (
                <table className="min-w-full text-sm">
                  <thead className="bg-[var(--surface-muted)] text-xs font-semibold text-[var(--text-3)]">
                    <tr>
                      <th className="px-4 py-3 text-left">Filename</th>
                      <th className="px-4 py-3 text-left">Type</th>
                      <th className="px-4 py-3 text-left">Uploaded</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {docRows.map((d) => (
                      <tr key={d.id} className="hover:bg-[var(--surface-muted)]/60">
                        <td className="px-4 py-3 font-medium text-[var(--text)]">
                          {d.filename ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-[var(--text-2)]">{d.type ?? '—'}</td>
                        <td className="px-4 py-3 text-[var(--text-2)]">
                          {d.created_at ? new Date(d.created_at).toLocaleString() : '—'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <DocumentActions documentId={d.id} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </Card>
        <Card title="Timeline (placeholder)">
          Timeline feed (appointments, encounters, documents, messages) — coming next.
        </Card>
      </section>

      <Card title="Latest Encounters">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-xs text-[var(--text-3)]">
              {encounterRows.length} {encounterRows.length === 1 ? 'encounter' : 'encounters'}
            </div>
            <Link
              href={`/app/encounters/new?patientId=${p.id}`}
              className="inline-flex h-9 items-center justify-center rounded-lg bg-[var(--primary-600)] px-3 text-sm font-medium text-white hover:bg-[var(--primary-700)]"
            >
              New Encounter
            </Link>
          </div>

          <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-white">
            {encountersError ? (
              <div className="p-4 text-sm text-[var(--danger-600)]">
                Failed to load encounters: {encountersError.message}
              </div>
            ) : encounterRows.length === 0 ? (
              <div className="p-4 text-sm text-[var(--text-2)]">No encounters yet.</div>
            ) : (
              <table className="min-w-full text-sm">
                <thead className="bg-[var(--surface-muted)] text-xs font-semibold text-[var(--text-3)]">
                  <tr>
                    <th className="px-4 py-3 text-left">Type</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Created</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {encounterRows.map((t) => {
                    const status = t.latest_version_status || 'draft'
                    return (
                      <tr key={t.id} className="hover:bg-[var(--surface-muted)]/60">
                        <td className="px-4 py-3 text-[var(--text-2)] capitalize">
                          {t.note_type.replace('_', ' ')}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium capitalize ${
                              status === 'finalized'
                                ? 'bg-[var(--success-100)] text-[var(--success-600)]'
                                : 'bg-[var(--warning-100)] text-[var(--warning-600)]'
                            }`}
                          >
                            {status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[var(--text-2)]">
                          {new Date(t.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/app/encounters/${t.id}`}
                            className="text-sm font-medium text-[var(--primary-700)] hover:underline"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
          {encounterRows.length > 0 && (
            <div className="text-right">
              <Link
                href={`/app/encounters?search=${encodeURIComponent(p.full_name || '')}`}
                className="text-sm font-medium text-[var(--primary-700)] hover:underline"
              >
                View all encounters →
              </Link>
            </div>
          )}
        </div>
      </Card>

      <section className="grid gap-4 md:grid-cols-2">
        <Card title="Episodes">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-xs text-[var(--text-3)]">
                {episodeRows.length} {episodeRows.length === 1 ? 'episode' : 'episodes'}
              </div>
              <Link
                href={`/app/episodes/new?patientId=${p.id}`}
                className="inline-flex h-9 items-center justify-center rounded-lg bg-[var(--primary-600)] px-3 text-sm font-medium text-white hover:bg-[var(--primary-700)]"
              >
                Create episode
              </Link>
            </div>

            <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-white">
              {episodesError ? (
                <div className="p-4 text-sm text-[var(--danger-600)]">
                  Failed to load episodes: {episodesError.message}
                </div>
              ) : episodeRows.length === 0 ? (
                <div className="p-4 text-sm text-[var(--text-2)]">No episodes yet.</div>
              ) : (
                <table className="min-w-full text-sm">
                  <thead className="bg-[var(--surface-muted)] text-xs font-semibold text-[var(--text-3)]">
                    <tr>
                      <th className="px-4 py-3 text-left">Procedure</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Scheduled</th>
                      <th className="px-4 py-3 text-left">Updated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {episodeRows.map((e) => (
                      <tr key={e.id} className="hover:bg-[var(--surface-muted)]/60">
                        <td className="px-4 py-3">
                          <Link
                            href={`/app/episodes/${e.id}`}
                            className="font-medium text-[var(--primary-700)] hover:underline"
                          >
                            {e.procedure_name ?? '—'}
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium capitalize bg-[var(--surface-muted)] text-[var(--text-2)]">
                            {e.status ?? '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[var(--text-2)]">
                          {e.scheduled_at ? new Date(e.scheduled_at).toLocaleString() : '—'}
                        </td>
                        <td className="px-4 py-3 text-[var(--text-2)]">
                          {e.updated_at ? new Date(e.updated_at).toLocaleDateString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </Card>

        <Card title="Appointments">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-xs text-[var(--text-3)]">
                Upcoming (next 30 days)
              </div>
              <Link
                href={`/app/schedule/new?patientId=${p.id}`}
                className="inline-flex h-9 items-center justify-center rounded-lg bg-[var(--primary-600)] px-3 text-sm font-medium text-white hover:bg-[var(--primary-700)]"
              >
                New appointment
              </Link>
            </div>

            <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-white">
              {appointmentsError ? (
                <div className="p-4 text-sm text-[var(--danger-600)]">
                  Failed to load appointments: {appointmentsError.message}
                </div>
              ) : appointmentRows.length === 0 ? (
                <div className="p-4 text-sm text-[var(--text-2)]">No upcoming appointments.</div>
              ) : (
                <table className="min-w-full text-sm">
                  <thead className="bg-[var(--surface-muted)] text-xs font-semibold text-[var(--text-3)]">
                    <tr>
                      <th className="px-4 py-3 text-left">Date & Time</th>
                      <th className="px-4 py-3 text-left">Type</th>
                      <th className="px-4 py-3 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {appointmentRows.map((a) => {
                      const startTime = new Date(a.starts_at)
                      return (
                        <tr key={a.id} className="hover:bg-[var(--surface-muted)]/60">
                          <td className="px-4 py-3">
                            <div className="font-medium text-[var(--text)]">
                              {startTime.toLocaleDateString()}
                            </div>
                            <div className="text-xs text-[var(--text-3)]">
                              {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-[var(--text-2)] capitalize">
                            {a.visit_type ?? '—'}
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium capitalize bg-[var(--surface-muted)] text-[var(--text-2)]">
                              {a.status.replace('_', ' ')}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </Card>
      </section>
    </div>
  )
}


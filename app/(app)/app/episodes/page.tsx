import Link from 'next/link'

import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getSupabaseServerClient } from '@/lib/supabase/server'

type SearchParams = {
  q?: string
  status?: string
  page?: string
}

type EpisodeRow = {
  id: string
  patient_id: string
  status: string
  procedure_name: string | null
  scheduled_at: string | null
  updated_at: string | null
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

function buildEpisodesUrl(params: { q?: string; status?: string; page?: number }) {
  const sp = new URLSearchParams()
  if (params.q) sp.set('q', params.q)
  if (params.status) sp.set('status', params.status)
  if (params.page && params.page > 1) sp.set('page', String(params.page))
  const qs = sp.toString()
  return qs ? `/app/episodes?${qs}` : '/app/episodes'
}

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'planned', label: 'Planned' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'done', label: 'Done' },
  { value: 'cancelled', label: 'Cancelled' },
]

export default async function EpisodesPage({ searchParams }: { searchParams?: SearchParams }) {
  const supabase = await getSupabaseServerClient()

  const qRaw = (searchParams?.q ?? '').trim()
  const statusFilter = searchParams?.status ?? ''
  const page = Math.max(1, Number(searchParams?.page ?? '1') || 1)
  const limit = 20
  const from = (page - 1) * limit
  const to = from + limit - 1

  // 1) Find matching patient IDs by phone if query looks like a phone fragment
  let phoneMatchIds: string[] = []
  if (qRaw) {
    const { data: ids } = await supabase
      .from('patient_identities')
      .select('patient_id')
      .ilike('phone_e164', `%${qRaw}%`)
      .limit(200)

    if (ids && ids.length > 0) {
      phoneMatchIds = (ids as Array<{ patient_id: string }>).map((r) => r.patient_id)
    }
  }

  // 2) Build episodes query
  let episodesQuery = supabase
    .from('episodes')
    .select('id, patient_id, status, procedure_name, scheduled_at, updated_at', { count: 'exact' })
    .order('updated_at', { ascending: false })
    .range(from, to)

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (qRaw) {
    if (uuidRegex.test(qRaw)) {
      episodesQuery = episodesQuery.eq('id', qRaw)
    } else if (phoneMatchIds.length > 0) {
      // Combine name matches + phone matches
      const { data: nameRows } = await supabase
        .from('patients')
        .select('id')
        .ilike('full_name', `%${qRaw}%`)
        .limit(500)

      const nameIds = (nameRows ?? []).map((r: any) => r.id).filter(Boolean) as string[]
      const merged = Array.from(new Set([...phoneMatchIds, ...nameIds]))
      episodesQuery = episodesQuery.in('patient_id', merged)
    } else {
      // Search by procedure_name or patient name
      const { data: nameRows } = await supabase
        .from('patients')
        .select('id')
        .ilike('full_name', `%${qRaw}%`)
        .limit(500)

      const nameIds = (nameRows ?? []).map((r: any) => r.id).filter(Boolean) as string[]
      if (nameIds.length > 0) {
        episodesQuery = episodesQuery.in('patient_id', nameIds)
      } else {
        episodesQuery = episodesQuery.ilike('procedure_name', `%${qRaw}%`)
      }
    }
  }

  if (statusFilter) {
    episodesQuery = episodesQuery.eq('status', statusFilter)
  }

  const { data: episodes, error: episodesError, count } = await episodesQuery

  const episodeRows = (episodes ?? []) as EpisodeRow[]
  const patientIds = Array.from(new Set(episodeRows.map((e) => e.patient_id)))

  // 3) Fetch patient names and primary phones
  let patientsById = new Map<string, PatientRow>()
  let identitiesByPatientId = new Map<string, string>()

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

  const total = count ?? 0
  const hasNext = to + 1 < total

  return (
    <div className="space-y-6">
      <PageHeader
        title="Episodes"
        description="Surgical care journeys and procedures."
        actions={
          <Button asChild>
            <Link href="/app/episodes/new">New Episode</Link>
          </Button>
        }
      />

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-[var(--text)]">Episodes List</h2>
          <div className="text-xs text-[var(--text-3)]">
            {total ? `${total} total` : '0 total'}
          </div>
        </div>

        <form className="mt-4 grid gap-3 md:grid-cols-[2fr_1fr]" action="/app/episodes" method="get">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-[var(--text-3)]">
              Search & Filter
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <Input
                name="q"
                defaultValue={qRaw}
                placeholder="Search procedure / patient / phone / ID"
              />
              <select
                name="status"
                defaultValue={statusFilter}
                className="h-10 rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-[var(--text-3)]">
              Actions
            </div>
            <div className="mt-3 grid gap-2">
              <Button type="submit" className="justify-start">
                Search
              </Button>
              <Button type="button" variant="outline" className="justify-start" asChild>
                <Link href="/app/episodes/new">Create new episode</Link>
              </Button>
            </div>
          </div>
        </form>

        <div className="mt-4 overflow-hidden rounded-xl border border-[var(--border)] bg-white">
          {episodesError ? (
            <div className="p-4 text-sm text-[var(--danger-600)]">
              Failed to load episodes: {episodesError.message}
            </div>
          ) : episodeRows.length === 0 ? (
            <div className="p-4 text-sm text-[var(--text-2)]">No episodes found.</div>
          ) : (
            <table className="min-w-full text-sm">
              <thead className="bg-[var(--surface-muted)] text-xs font-semibold text-[var(--text-3)]">
                <tr>
                  <th className="px-4 py-3 text-left">Patient</th>
                  <th className="px-4 py-3 text-left">Procedure</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Scheduled</th>
                  <th className="px-4 py-3 text-left">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {episodeRows.map((e) => {
                  const patient = patientsById.get(e.patient_id)
                  const phone = identitiesByPatientId.get(e.patient_id)
                  return (
                    <tr key={e.id} className="hover:bg-[var(--surface-muted)]/60">
                      <td className="px-4 py-3">
                        <Link
                          href={`/app/patients/${e.patient_id}`}
                          className="font-medium text-[var(--text)] hover:underline"
                        >
                          {patient?.full_name ?? '(Unknown)'}
                        </Link>
                        {phone && (
                          <div className="text-xs text-[var(--text-3)]">{phone}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-[var(--text)]">
                        <Link
                          href={`/app/episodes/${e.id}`}
                          className="hover:underline"
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
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="text-xs text-[var(--text-3)]">
            Page {page}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              asChild
              disabled={page <= 1}
            >
              <Link href={buildEpisodesUrl({ q: qRaw, status: statusFilter, page: page - 1 })}>
                Previous
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              asChild
              disabled={!hasNext}
            >
              <Link href={buildEpisodesUrl({ q: qRaw, status: statusFilter, page: page + 1 })}>
                Next
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}

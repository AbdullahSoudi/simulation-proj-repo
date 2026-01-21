import Link from 'next/link'

import { PageHeader } from '@/components/ui/page-header'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { getSupabaseServerClient } from '@/lib/supabase/server'

type SearchParams = {
  q?: string
  page?: string
}

type PatientRow = {
  id: string
  full_name: string | null
  gender: string | null
  date_of_birth: string | null
  created_at: string | null
}

type IdentityRow = {
  patient_id: string
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

function buildPatientsUrl(params: { q?: string; page?: number }) {
  const sp = new URLSearchParams()
  if (params.q) sp.set('q', params.q)
  if (params.page && params.page > 1) sp.set('page', String(params.page))
  const qs = sp.toString()
  return qs ? `/app/patients?${qs}` : '/app/patients'
}

export default async function PatientsPage({ searchParams }: { searchParams?: SearchParams }) {
  const supabase = await getSupabaseServerClient()

  const qRaw = (searchParams?.q ?? '').trim()
  const page = Math.max(1, Number(searchParams?.page ?? '1') || 1)
  const limit = 20
  const from = (page - 1) * limit
  const to = from + limit - 1

  // 1) Find matching patient IDs by phone (patient_identities) if query looks like a phone fragment.
  let phoneMatchIds: string[] = []
  if (qRaw) {
    const { data: ids, error } = await supabase
      .from('patient_identities')
      .select('patient_id')
      .ilike('phone_e164', `%${qRaw}%`)
      .limit(200)

    if (!error && ids && ids.length > 0) {
      phoneMatchIds = (ids as Array<{ patient_id: string }>).map((r) => r.patient_id)
    }
  }

  // 2) Fetch patients by name or exact ID; if phone matched, include those IDs too.
  let patientsQuery = supabase
    .from('patients')
    .select('id, full_name, gender, date_of_birth, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (qRaw) {
    if (uuidRegex.test(qRaw)) {
      patientsQuery = patientsQuery.eq('id', qRaw)
    } else if (phoneMatchIds.length > 0) {
      // Combine name matches + phone matches by fetching ID set via OR-like fallback:
      // - name matches via ilike
      // - plus phone matches via id.in(...)
      // Supabase doesn't support cross-table OR easily without schema types, so we do this in two steps.
      const { data: nameRows } = await supabase
        .from('patients')
        .select('id')
        .ilike('full_name', `%${qRaw}%`)
        .limit(500)

      const nameIds = (nameRows ?? []).map((r: any) => r.id).filter(Boolean) as string[]
      const merged = Array.from(new Set([...phoneMatchIds, ...nameIds]))
      patientsQuery = patientsQuery.in('id', merged)
    } else {
      patientsQuery = patientsQuery.ilike('full_name', `%${qRaw}%`)
    }
  }

  const { data: patients, error: patientsError, count } = await patientsQuery

  const patientRows = (patients ?? []) as PatientRow[]
  const patientIds = patientRows.map((p) => p.id)

  // 3) Fetch primary identities for displayed patients
  let identitiesByPatientId = new Map<string, string>()
  if (patientIds.length > 0) {
    const { data: identities, error: identitiesError } = await supabase
      .from('patient_identities')
      .select('patient_id, phone_e164, is_primary')
      .in('patient_id', patientIds)
      .eq('is_primary', true)

    if (!identitiesError && identities) {
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
        title="Patients"
        description="Patient registry and search."
        actions={
          <Button asChild>
            <Link href="/app/patients/new">New Patient</Link>
          </Button>
        }
      />

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-[var(--text)]">Patients List</h2>
          <div className="text-xs text-[var(--text-3)]">
            {total ? `${total} total` : '0 total'}
          </div>
        </div>

        <form className="mt-4 grid gap-3 md:grid-cols-[2fr_1fr]" action="/app/patients" method="get">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-[var(--text-3)]">
              Search
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <Input
                name="q"
                defaultValue={qRaw}
                placeholder="Search patients / phone / ID"
              />
              <Input disabled placeholder="Filters (coming later)" />
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
                <Link href="/app/patients/new">Register new patient</Link>
              </Button>
            </div>
          </div>
        </form>

        <div className="mt-4 overflow-hidden rounded-xl border border-[var(--border)] bg-white">
          {patientsError ? (
            <div className="p-4 text-sm text-[var(--danger-600)]">
              Failed to load patients: {patientsError.message}
            </div>
          ) : patientRows.length === 0 ? (
            <div className="p-4 text-sm text-[var(--text-2)]">No patients found.</div>
          ) : (
            <table className="min-w-full text-sm">
              <thead className="bg-[var(--surface-muted)] text-xs font-semibold text-[var(--text-3)]">
                <tr>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Phone</th>
                  <th className="px-4 py-3 text-left">ID</th>
                  <th className="px-4 py-3 text-left">Gender</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {patientRows.map((p) => (
                  <tr key={p.id} className="hover:bg-[var(--surface-muted)]/60">
                    <td className="px-4 py-3">
                      <Link
                        href={`/app/patients/${p.id}`}
                        className="font-medium text-[var(--text)] hover:underline"
                      >
                        {p.full_name ?? '(No name)'}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-[var(--text-2)]">
                      {identitiesByPatientId.get(p.id) ?? '—'}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[var(--text-2)]">
                      {p.id}
                    </td>
                    <td className="px-4 py-3 text-[var(--text-2)]">{p.gender ?? '—'}</td>
                  </tr>
                ))}
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
              <Link href={buildPatientsUrl({ q: qRaw, page: page - 1 })}>Previous</Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              asChild
              disabled={!hasNext}
            >
              <Link href={buildPatientsUrl({ q: qRaw, page: page + 1 })}>Next</Link>
            </Button>
          </div>
        </div>
      </section>

      <Card title="Patient Profile (core screen)">
        Tabs (max 6): Overview / Timeline / Episodes / Encounters / Documents / Messages — implemented in /app/patients/[patientId].
      </Card>
    </div>
  )
}


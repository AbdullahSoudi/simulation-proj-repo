'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'

type EncounterThreadRow = {
  id: string
  patient_id: string
  episode_id: string | null
  appointment_id: string | null
  note_type: string
  created_at: string
}

type LatestVersionRow = {
  thread_id: string
  status: string
  updated_at: string
}

type PatientRow = {
  id: string
  full_name: string | null
}

type EncounterClientProps = {
  threads: EncounterThreadRow[]
  latestVersions: Record<string, LatestVersionRow>
  patientsById: Record<string, PatientRow>
  total: number
  statusFilter: string
  typeFilter: string
  searchQuery: string
  encountersError: { message: string } | null
}

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'finalized', label: 'Finalized' },
]

const TYPE_OPTIONS = [
  { value: '', label: 'All types' },
  { value: 'consultation', label: 'Consultation' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'pre_op', label: 'Pre-op' },
  { value: 'post_op', label: 'Post-op' },
  { value: 'other', label: 'Other' },
]

export function EncountersClient({
  threads,
  latestVersions,
  patientsById,
  total,
  statusFilter,
  typeFilter,
  searchQuery,
  encountersError,
}: EncounterClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function handleStatusChange(newStatus: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (newStatus) {
      params.set('status', newStatus)
    } else {
      params.delete('status')
    }
    router.push(`/app/encounters?${params.toString()}`)
  }

  function handleTypeChange(newType: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (newType) {
      params.set('type', newType)
    } else {
      params.delete('type')
    }
    router.push(`/app/encounters?${params.toString()}`)
  }

  function handleSearchChange(newQuery: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (newQuery) {
      params.set('search', newQuery)
    } else {
      params.delete('search')
    }
    router.push(`/app/encounters?${params.toString()}`)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Encounters"
        description="Clinical notes and visit documentation."
        actions={
          <Button asChild>
            <Link href="/app/encounters/new">New Encounter</Link>
          </Button>
        }
      />

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-[var(--text)]">Encounter Threads</h2>
          <div className="text-xs text-[var(--text-3)]">
            {total ? `${total} total` : '0 total'}
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-[2fr_1fr_1fr]">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-[var(--text-3)]">
              Search
            </div>
            <div className="mt-3">
              <input
                type="text"
                placeholder="Patient name or thread ID"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="h-10 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none"
              />
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-[var(--text-3)]">
              Status
            </div>
            <div className="mt-3">
              <select
                value={statusFilter}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="h-10 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none"
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
              Type
            </div>
            <div className="mt-3">
              <select
                value={typeFilter}
                onChange={(e) => handleTypeChange(e.target.value)}
                className="h-10 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none"
              >
                {TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-xl border border-[var(--border)] bg-white">
          {encountersError ? (
            <div className="p-4 text-sm text-[var(--danger-600)]">
              Failed to load encounters: {encountersError.message}
            </div>
          ) : threads.length === 0 ? (
            <div className="p-4 text-sm text-[var(--text-2)]">No encounters found.</div>
          ) : (
            <table className="min-w-full text-sm">
              <thead className="bg-[var(--surface-muted)] text-xs font-semibold text-[var(--text-3)]">
                <tr>
                  <th className="px-4 py-3 text-left">Patient</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Updated</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {threads.map((t) => {
                  const patient = patientsById[t.patient_id]
                  const latestVersion = latestVersions[t.id]
                  const status = latestVersion?.status || 'draft'
                  const updatedAt = latestVersion?.updated_at || t.created_at

                  return (
                    <tr key={t.id} className="hover:bg-[var(--surface-muted)]/60">
                      <td className="px-4 py-3">
                        <Link
                          href={`/app/patients/${t.patient_id}`}
                          className="font-medium text-[var(--primary-700)] hover:underline"
                        >
                          {patient?.full_name ?? '(Unknown)'}
                        </Link>
                      </td>
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
                        {new Date(updatedAt).toLocaleDateString()}
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
      </section>
    </div>
  )
}

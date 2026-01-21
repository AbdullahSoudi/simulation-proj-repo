'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { AppointmentStatusActions } from './AppointmentStatusActions'

type AppointmentRow = {
  id: string
  patient_id: string
  episode_id: string | null
  visit_type: string
  status: string
  starts_at: string
  ends_at: string
  notes: string | null
}

type PatientRow = {
  id: string
  full_name: string | null
}

type EpisodeRow = {
  id: string
  procedure_name: string | null
}

type ScheduleClientProps = {
  appointments: AppointmentRow[]
  patientsById: Record<string, PatientRow>
  identitiesByPatientId: Record<string, string>
  episodesById: Record<string, EpisodeRow>
  total: number
  dateFilter: string
  statusFilter: string
  appointmentsError: { message: string } | null
}

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'booked', label: 'Booked' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'checked_in', label: 'Checked In' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'no_show', label: 'No Show' },
]

function buildScheduleUrl(params: { date?: string; status?: string }) {
  const sp = new URLSearchParams()
  if (params.date) sp.set('date', params.date)
  if (params.status) sp.set('status', params.status)
  const qs = sp.toString()
  return qs ? `/app/schedule?${qs}` : '/app/schedule'
}

export function ScheduleClient({
  appointments,
  patientsById,
  identitiesByPatientId,
  episodesById,
  total,
  dateFilter,
  statusFilter,
  appointmentsError,
}: ScheduleClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function handleStatusChange(newStatus: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (newStatus) {
      params.set('status', newStatus)
    } else {
      params.delete('status')
    }
    router.push(`/app/schedule?${params.toString()}`)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Schedule"
        description="Appointments and visit scheduling."
        actions={
          <Button asChild>
            <Link href="/app/schedule/new">New Appointment</Link>
          </Button>
        }
      />

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-[var(--text)]">Appointments</h2>
          <div className="text-xs text-[var(--text-3)]">
            {total ? `${total} total` : '0 total'}
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-[2fr_1fr_1fr]">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-[var(--text-3)]">
              Date Range
            </div>
            <div className="mt-3 flex gap-2">
              <Button
                variant={dateFilter === 'today' ? 'default' : 'outline'}
                size="sm"
                asChild
              >
                <Link href={buildScheduleUrl({ date: 'today', status: statusFilter })}>Today</Link>
              </Button>
              <Button
                variant={dateFilter === 'week' ? 'default' : 'outline'}
                size="sm"
                asChild
              >
                <Link href={buildScheduleUrl({ date: 'week', status: statusFilter })}>
                  Next 7 Days
                </Link>
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-[var(--text-3)]">
              Status
            </div>
            <div className="mt-3">
              <select
                value={statusFilter}
                className="h-10 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none"
                onChange={(e) => handleStatusChange(e.target.value)}
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
            <div className="mt-3">
              <Button type="button" variant="outline" className="w-full justify-start" asChild>
                <Link href="/app/schedule/new">Create appointment</Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-xl border border-[var(--border)] bg-white">
          {appointmentsError ? (
            <div className="p-4 text-sm text-[var(--danger-600)]">
              Failed to load appointments: {appointmentsError.message}
            </div>
          ) : appointments.length === 0 ? (
            <div className="p-4 text-sm text-[var(--text-2)]">No appointments found.</div>
          ) : (
            <table className="min-w-full text-sm">
              <thead className="bg-[var(--surface-muted)] text-xs font-semibold text-[var(--text-3)]">
                <tr>
                  <th className="px-4 py-3 text-left">Time</th>
                  <th className="px-4 py-3 text-left">Patient</th>
                  <th className="px-4 py-3 text-left">Visit Type</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Episode</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {appointments.map((a) => {
                  const patient = patientsById[a.patient_id]
                  const phone = identitiesByPatientId[a.patient_id]
                  const episode = a.episode_id ? episodesById[a.episode_id] : null
                  const startTime = new Date(a.starts_at)
                  const endTime = new Date(a.ends_at)

                  return (
                    <tr key={a.id} className="hover:bg-[var(--surface-muted)]/60">
                      <td className="px-4 py-3">
                        <div className="font-medium text-[var(--text)]">
                          {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="text-xs text-[var(--text-3)]">
                          {endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="text-xs text-[var(--text-3)]">
                          {startTime.toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/app/patients/${a.patient_id}`}
                          className="font-medium text-[var(--primary-700)] hover:underline"
                        >
                          {patient?.full_name ?? '(Unknown)'}
                        </Link>
                        {phone && <div className="text-xs text-[var(--text-3)]">{phone}</div>}
                      </td>
                      <td className="px-4 py-3 text-[var(--text-2)] capitalize">
                        {a.visit_type ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium capitalize bg-[var(--surface-muted)] text-[var(--text-2)]">
                          {a.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {episode ? (
                          <Link
                            href={`/app/episodes/${a.episode_id}`}
                            className="text-sm text-[var(--primary-700)] hover:underline"
                          >
                            {episode.procedure_name ?? 'Episode'}
                          </Link>
                        ) : (
                          <span className="text-[var(--text-3)]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <AppointmentStatusActions appointmentId={a.id} currentStatus={a.status} />
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

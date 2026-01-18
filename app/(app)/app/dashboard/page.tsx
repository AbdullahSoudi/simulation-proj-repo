'use client'
import { PageHeader } from '@/components/ui/page-header'
import { StatCard } from '@/components/ui/stat-card'
import { StatusChip } from '@/components/ui/status-chip'
import { DataTablePlaceholder } from '@/components/ui/data-table-placeholder'
import { useCurrentRole } from '@/components/app-shell/AppShell'
import type { Role } from '@/components/app-shell/AppShell'

const DASHBOARD_COPY: Record<
  Role,
  { title: string; description: string; kpis: string[]; urgentTitle: string; workQueuesTitle: string }
> = {
  reception: {
    title: 'Reception dashboard',
    description: 'Today’s schedule, appointment requests, and unmatched messages.',
    kpis: ['Appointments Today', 'Pending Requests', 'Unmatched Inbox', 'No-shows this week'],
    urgentTitle: 'Unmatched & pending requests',
    workQueuesTitle: 'Reception queues',
  },
  doctor: {
    title: 'Doctor dashboard',
    description: 'What needs your decisions today across episodes and follow-ups.',
    kpis: ['Patients Today', 'Overdue Follow-ups', 'Red Flags', 'Pending Reviews'],
    urgentTitle: 'Urgent (Red flags + Overdue tasks)',
    workQueuesTitle: 'Work queues',
  },
}

export default function DashboardPage() {
  const role = useCurrentRole()
  const config = DASHBOARD_COPY[role]

  return (
    <div className="space-y-6">
      <PageHeader
        title={config.title}
        description={config.description}
        actions={
          <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--text-2)]">
            <div className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-xs">
              Date: Today
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-xs">
              View: Today / Week
            </div>
          </div>
        }
      />

      <section className="grid gap-4 md:grid-cols-4">
        {config.kpis.map((label) => (
          <StatCard key={label} label={label} />
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <h2 className="text-sm font-semibold text-[var(--text)]">{config.urgentTitle}</h2>
          <div className="mt-3 grid gap-2 text-sm text-[var(--text-2)]">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
              Red flags list (patient + episode + reason + <StatusChip kind="red-flag" />) — placeholder
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
              Overdue tasks list — use <StatusChip kind="overdue" /> for status (placeholder)
            </div>
            <div className="text-xs text-[var(--text-3)]">
              “Mark as handled” requires note entry (audit) — placeholder
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <h2 className="text-sm font-semibold text-[var(--text)]">{config.workQueuesTitle}</h2>
          <div className="mt-3 grid gap-2 text-sm text-[var(--text-2)]">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
              Pending Review Queue (count + top 5) — items typically{' '}
              <StatusChip kind="needs-review" /> or <StatusChip kind="submitted" /> — placeholder
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
              Unmatched Inbox (count + top 5) — unresolved items should be visible here — placeholder
            </div>
          </div>
        </section>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <DataTablePlaceholder
          label="Today’s Schedule"
          columns={['Time', 'Patient', 'Type', 'Status']}
        />
        <DataTablePlaceholder
          label="Recent Submissions"
          columns={['Patient', 'Episode', 'Type', 'Status', 'Received at']}
        />
      </section>
    </div>
  )
}


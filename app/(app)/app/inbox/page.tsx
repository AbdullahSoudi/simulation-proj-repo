import { PageHeader } from '@/components/ui/page-header'
import { SplitPane } from '@/components/ui/split-pane'
import { StatusChip } from '@/components/ui/status-chip'
import { DataTablePlaceholder } from '@/components/ui/data-table-placeholder'
import { Button } from '@/components/ui/button'

export default function InboxPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Inbox"
        description="WhatsApp inbox (Matched / Unmatched / Escalated). Layout only, no live data."
      />

      {/* Inbox landing with prominent Unmatched Inbox */}
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <h2 className="text-sm font-semibold text-[var(--text)]">
          Inbox Landing (Matched / Unmatched / Escalated)
        </h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2 text-sm text-[var(--text-2)]">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
            <div>
              Tabs placeholder:&nbsp;
              <span className="font-medium">Matched</span> /{' '}
              <span className="inline-flex items-center gap-2 font-medium">
                Unmatched
                <span className="inline-flex h-5 min-w-[1.5rem] items-center justify-center rounded-full bg-[var(--danger-100)] px-2 text-xs font-semibold text-[var(--danger-600)]">
                  5
                </span>
              </span>{' '}
              / <span className="font-medium">Escalated</span>
            </div>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
            <div>Filters placeholder: Channel, Status, Assigned to</div>
            <div className="mt-2 text-xs text-[var(--text-3)]">
              Optional: &ldquo;Show red flags only&rdquo; filter for messages marked as red flag.
            </div>
          </div>
        </div>
        <div className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-sm text-[var(--text-2)]">
          List items placeholder: sender, preview, media icon, timestamp, status chip (Matched /
          Unmatched / Escalated / Needs triage / Resolved).
        </div>
      </section>

      {/* Split pane: conversation + unmatched resolution panel */}
      <SplitPane
        left={
          <div className="space-y-4">
            <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-[var(--text)]">Inbox List</h2>
                <div className="flex flex-wrap gap-2 text-xs text-[var(--text-3)]">
                  <StatusChip kind="matched" />
                  <StatusChip kind="unmatched" />
                  <StatusChip kind="escalated" />
                  <StatusChip kind="resolved" />
                </div>
              </div>
              <div className="mt-3">
                <DataTablePlaceholder
                  label="Inbox items (placeholder)"
                  columns={['Sender', 'Patient', 'Intent', 'Status', 'Last message', 'Time']}
                />
              </div>
              <p className="mt-2 text-xs text-[var(--text-3)]">
                Intent classification + routing is Phase 2. This is layout only.
              </p>
            </section>

            <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
              <h2 className="text-sm font-semibold text-[var(--text)]">Conversation View (Matched)</h2>
              <div className="mt-3 grid gap-2 text-sm text-[var(--text-2)]">
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                  Thread messages + media thumbnails — placeholder
                </div>
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                  Patient quick card + actions (Open Patient, Create Task, Request photo/lab, Escalate) — placeholder
                </div>
              </div>
            </section>
          </div>
        }
        right={
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
            <h2 className="text-sm font-semibold text-[var(--text)]">
              Unmatched Inbox Item (Resolution Panel)
            </h2>
            <div className="mt-3 grid gap-2 text-sm text-[var(--text-2)]">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                Message + media preview — placeholder
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                <div className="text-xs font-semibold text-[var(--text-3)]">
                  Resolution actions (required)
                </div>
                <p className="mt-2 text-xs text-[var(--text-3)]">
                  Unmatched must be resolved with one action before closing (wireframe rule).
                </p>
                <div className="mt-3 grid gap-2">
                  <Button disabled className="justify-start">
                    Link to existing patient (search)
                  </Button>
                  <Button disabled variant="secondary" className="justify-start">
                    Create new patient (mini form)
                  </Button>
                  <Button disabled variant="outline" className="justify-start">
                    Mark non-patient / spam
                  </Button>
                  <Button disabled variant="destructive" className="justify-start">
                    Escalate to doctor
                  </Button>
                </div>
              </div>
            </div>
          </section>
        }
      />

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <h2 className="text-sm font-semibold text-[var(--text)]">Notes (Phase 0)</h2>
        <p className="mt-3 text-sm text-[var(--text-2)]">
          No WhatsApp integration yet. This page exists to lock layout and workflows early.
        </p>
      </section>
    </div>
  )
}


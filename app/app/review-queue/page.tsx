import { PageHeader } from '@/components/ui/page-header'
import { SplitPane } from '@/components/ui/split-pane'
import { DataTablePlaceholder } from '@/components/ui/data-table-placeholder'
import { StatusChip } from '@/components/ui/status-chip'
import { Button } from '@/components/ui/button'

export default function ReviewQueuePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Review Queue"
        description="Human-in-the-loop AI extraction review. Phase 0: layout only, no data."
      />

      <SplitPane
        left={
          <div className="space-y-3">
            <DataTablePlaceholder
              label="Queue List"
              columns={[
                'Patient',
                'Episode',
                'Source',
                'Type',
                'Confidence',
                'Status',
                'Timestamp',
              ]}
            />
            <p className="text-xs text-[var(--text-3)]">
              Status chips should use <StatusChip kind="needs-review" />,{' '}
              <StatusChip kind="approved" />, <StatusChip kind="overdue" />, or{' '}
              <StatusChip kind="red-flag" /> depending on state (Review Queue only).
            </p>
          </div>
        }
        right={
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
            <h2 className="text-sm font-semibold text-[var(--text)]">
              Review Detail (Split View)
            </h2>
            <div className="mt-3 grid gap-2 text-sm text-[var(--text-2)]">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                Left: source message + media preview — placeholder.
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                <div className="mb-3 text-xs font-semibold text-[var(--text-3)]">
                  Extracted fields table (placeholder)
                </div>
                <div className="mb-3 text-xs text-[var(--text-2)]">
                  Field name | Extracted value | Units | Evidence | Confidence — placeholder.
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button disabled className="bg-[var(--success-600)] hover:bg-[var(--success-600)]">
                    Approve
                  </Button>
                  <Button disabled variant="outline">
                    Edit &amp; Approve
                  </Button>
                  <Button disabled variant="destructive">
                    Reject
                  </Button>
                </div>
                <p className="mt-2 text-xs text-[var(--text-3)]">
                  Buttons are disabled placeholders; actual review actions will enforce human-in-the-loop
                  rules.
                </p>
              </div>
            </div>
          </section>
        }
      />
    </div>
  )
}


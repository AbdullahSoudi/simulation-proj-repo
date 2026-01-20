import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'

export default function EpisodesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Episodes"
        description="Surgical episodes across pre-op, intra-op, post-op, and follow-up (layout only)."
        actions={
          <Button disabled className="justify-start">
            New Episode
          </Button>
        }
      />

      <section className="grid gap-4 md:grid-cols-2">
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <h2 className="text-sm font-semibold text-[var(--text)]">Episode List (cards)</h2>
          <div className="mt-4 grid gap-3">
            {[
              { procedure: 'Procedure A', date: '2026-01-20', status: 'Planned' },
              { procedure: 'Procedure B', date: '2026-01-18', status: 'Pre-op' },
              { procedure: 'Procedure C', date: '2026-01-10', status: 'Follow-up' },
            ].map((e) => (
              <div
                key={e.procedure}
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-[var(--text)]">{e.procedure}</div>
                    <div className="mt-1 text-xs text-[var(--text-3)]">
                      Date: {e.date} • Surgeon: placeholder
                    </div>
                  </div>
                  <div className="text-xs font-medium text-[var(--text-2)]">Status: {e.status}</div>
                </div>

                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between text-xs text-[var(--text-3)]">
                    <span>Pre-op</span>
                    <span>Intra-op</span>
                    <span>Post-op</span>
                    <span>Follow-up</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="h-2 rounded-full bg-[var(--primary-100)]" />
                    <div className="h-2 rounded-full bg-[var(--surface)]" />
                    <div className="h-2 rounded-full bg-[var(--surface)]" />
                    <div className="h-2 rounded-full bg-[var(--surface)]" />
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button disabled size="sm" variant="outline">
                    Open
                  </Button>
                  <Button disabled size="sm" variant="outline">
                    Add checklist item
                  </Button>
                  <Button disabled size="sm" variant="outline">
                    Send follow-up task
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <h2 className="text-sm font-semibold text-[var(--text)]">
            Episode Detail (the product’s heart)
          </h2>
          <div className="mt-3 grid gap-2 text-sm text-[var(--text-2)]">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
              Header placeholder: procedure/date + status dropdown + actions (Add checklist item,
              Send follow-up task, Add note).
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
              Two-column layout placeholder: pathway timeline (Pre-op/Anesthesia/Surgery/Post-op/
              Follow-up) on the left, “What needs attention” (overdue tasks, latest submissions,
              pending AI reviews, red flags) on the right.
            </div>
          </div>
        </section>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <h2 className="text-sm font-semibold text-[var(--text)]">Follow-up Plan (inside episode)</h2>
        <p className="mt-3 text-sm text-[var(--text-2)]">
          Task schedule offsets (Day 2, Day 7…), required response type (photo/numeric/yes-no/text),
          and escalation rules preview (if pain &gt; X, fever &gt; Y) — placeholder.
        </p>
      </section>
    </div>
  )
}


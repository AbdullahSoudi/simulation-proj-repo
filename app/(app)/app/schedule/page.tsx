function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
      <h2 className="text-sm font-semibold text-[var(--text)]">{title}</h2>
      <div className="mt-3 text-sm text-[var(--text-2)]">{children}</div>
    </section>
  )
}

export default function SchedulePage() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--text)]">Schedule</h1>
        <p className="text-sm text-[var(--text-2)]">Placeholder (Phase 0). No scheduling logic yet.</p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <Card title="Calendar View (Day / Week)">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
            Calendar grid placeholder + provider filter placeholder
          </div>
        </Card>
        <Card title="Appointment Detail Drawer">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
            Patient info, reason/notes, status actions (confirm/reschedule/cancel/check-in/complete), send reminder — placeholder
          </div>
        </Card>
      </section>

      <Card title="Schedule List (table)">
        Table placeholder (appointments today / week)
      </Card>
    </div>
  )
}


function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
      <h2 className="text-sm font-semibold text-[var(--text)]">{title}</h2>
      <div className="mt-3 text-sm text-[var(--text-2)]">{children}</div>
    </section>
  )
}

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--text)]">Reports</h1>
        <p className="text-sm text-[var(--text-2)]">Placeholder (Phase 0). Reporting comes later.</p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <Card title="Follow-up adherence per procedure">Placeholder chart/table</Card>
        <Card title="No-show rate">Placeholder chart/table</Card>
        <Card title="Average time to link unmatched inbox">Placeholder chart/table</Card>
        <Card title="Red flag counts (not diagnoses)">Placeholder chart/table</Card>
      </section>
    </div>
  )
}


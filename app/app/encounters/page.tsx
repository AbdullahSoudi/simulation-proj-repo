function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
      <h2 className="text-sm font-semibold text-[var(--text)]">{title}</h2>
      <div className="mt-3 text-sm text-[var(--text-2)]">{children}</div>
    </section>
  )
}

export default function EncountersPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--text)]">Encounters</h1>
        <p className="text-sm text-[var(--text-2)]">Placeholder (Phase 0). EHR-lite comes in Phase 1.</p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <Card title="Encounters List">
          Table of visits + create encounter action — placeholder
        </Card>
        <Card title="Encounter Editor (Doctor)">
          <div className="grid gap-2">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
              Header: patient + date + episode link selector — placeholder
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
              Sections: CC / HPI / Exam / Assessment / Plan — placeholder
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
              Medications + Orders (labs/imaging) + Save draft/Finalize — placeholder
            </div>
          </div>
        </Card>
      </section>
    </div>
  )
}


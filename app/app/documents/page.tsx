function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
      <h2 className="text-sm font-semibold text-[var(--text)]">{title}</h2>
      <div className="mt-3 text-sm text-[var(--text-2)]">{children}</div>
    </section>
  )
}

export default function DocumentsPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--text)]">Documents</h1>
        <p className="text-sm text-[var(--text-2)]">Placeholder (Phase 0). Upload/linking comes in Phase 1.</p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <Card title="Documents List">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
            Filters: Lab / Imaging / Consent / Discharge / Other — placeholder
          </div>
          <div className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
            Document cards with preview + attach to episode/encounter — placeholder
          </div>
        </Card>
        <Card title="Upload (placeholder)">
          Drag/drop + metadata (category, link destination) — placeholder
        </Card>
      </section>
    </div>
  )
}


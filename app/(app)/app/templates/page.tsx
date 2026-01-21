function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
      <h2 className="text-sm font-semibold text-[var(--text)]">{title}</h2>
      <div className="mt-3 text-sm text-[var(--text-2)]">{children}</div>
    </section>
  )
}

export default function TemplatesPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--text)]">Templates</h1>
        <p className="text-sm text-[var(--text-2)]">
          Placeholder (Phase 0). Follow-up plan templates come in Phase 2+.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <Card title="Follow-up Plan Templates">
          Procedure templates + schedule builder + required response type (photo/numeric/yes-no/text) — placeholder
        </Card>
        <Card title="WhatsApp Templates Manager (Admin)">
          Template list + approval status + language variants — placeholder
        </Card>
      </section>
    </div>
  )
}


export default function ContactPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight text-[var(--text)]">Contact</h1>
      <p className="mt-2 text-sm text-[var(--text-2)]">
        Placeholder contact page (Phase 0).
      </p>

      <section className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <h2 className="text-sm font-semibold text-[var(--text)]">Clinic Address</h2>
          <div className="mt-2 text-sm text-[var(--text-2)]">Map + address (placeholder)</div>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <h2 className="text-sm font-semibold text-[var(--text)]">Phone / WhatsApp</h2>
          <div className="mt-2 text-sm text-[var(--text-2)]">Contact links (placeholder)</div>
        </div>
      </section>
    </div>
  )
}


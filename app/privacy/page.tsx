export default function PrivacyPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight text-[var(--text)]">
        Privacy & Consent Policy
      </h1>
      <p className="mt-2 text-sm text-[var(--text-2)]">
        Placeholder policy page (Phase 0). Final copy will be provided by clinic/legal.
      </p>

      <section className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <h2 className="text-sm font-semibold text-[var(--text)]">What we store</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--text-2)]">
          Patient demographics, appointments, documents, and consent records (placeholder summary).
        </p>
      </section>

      <section className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <h2 className="text-sm font-semibold text-[var(--text)]">WhatsApp messaging consent</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--text-2)]">
          Outbound reminders and prompts require explicit consent (placeholder summary).
        </p>
      </section>
    </div>
  )
}


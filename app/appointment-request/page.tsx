export default function AppointmentRequestPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight text-[var(--text)]">
        Appointment Request
      </h1>
      <p className="mt-2 text-sm text-[var(--text-2)]">
        Placeholder form (Phase 0). No submission logic yet.
      </p>

      <section className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <h2 className="text-sm font-semibold text-[var(--text)]">Request Details</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <label className="text-xs font-medium text-[var(--text-2)]">Patient name *</label>
            <input
              disabled
              className="h-11 rounded-xl border border-[var(--border)] bg-white px-3 text-sm outline-none"
              placeholder="Full name"
            />
          </div>
          <div className="grid gap-2">
            <label className="text-xs font-medium text-[var(--text-2)]">Phone *</label>
            <input
              disabled
              className="h-11 rounded-xl border border-[var(--border)] bg-white px-3 text-sm outline-none"
              placeholder="+20..."
            />
          </div>
          <div className="grid gap-2">
            <label className="text-xs font-medium text-[var(--text-2)]">Preferred date/time</label>
            <input
              disabled
              className="h-11 rounded-xl border border-[var(--border)] bg-white px-3 text-sm outline-none"
              placeholder="Optional"
            />
          </div>
          <div className="grid gap-2">
            <label className="text-xs font-medium text-[var(--text-2)]">Reason</label>
            <input
              disabled
              className="h-11 rounded-xl border border-[var(--border)] bg-white px-3 text-sm outline-none"
              placeholder="Optional"
            />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <input disabled type="checkbox" className="h-4 w-4" />
          <span className="text-sm text-[var(--text-2)]">
            I consent to messaging (placeholder)
          </span>
        </div>

        <button
          disabled
          className="mt-6 h-11 rounded-xl bg-[var(--primary-600)] px-5 text-sm font-medium text-white opacity-60"
        >
          Submit request
        </button>
      </section>
    </div>
  )
}


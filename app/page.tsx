import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <div className="mx-auto w-full max-w-5xl px-6 py-16">
        <header className="flex items-center justify-between">
          <div className="text-sm font-semibold tracking-tight">Surgical Clinic OS</div>
          <nav className="flex items-center gap-3 text-sm text-[var(--text-2)]">
            <Link href="/contact" className="hover:text-[var(--text)]">
              Contact
            </Link>
            <Link href="/appointment-request" className="hover:text-[var(--text)]">
              Appointment Request
            </Link>
            <Link href="/privacy" className="hover:text-[var(--text)]">
              Privacy
            </Link>
            <Link
              href="/app/dashboard"
              className="rounded-xl bg-[var(--primary-600)] px-4 py-2 text-white hover:bg-[var(--primary-700)]"
            >
              Open App
            </Link>
          </nav>
        </header>

        <main className="mt-12 grid gap-8 md:grid-cols-2">
          <div className="space-y-4">
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
              One workspace for your surgical clinic’s full care journey.
            </h1>
            <p className="text-base leading-7 text-[var(--text-2)]">
              From first appointment request to post‑operative follow‑up, keep patients, staff, and
              surgical episodes organized in one place.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/app/dashboard"
                className="inline-flex h-11 items-center justify-center rounded-xl bg-[var(--primary-600)] px-5 text-sm font-medium text-white hover:bg-[var(--primary-700)]"
              >
                Go to Dashboard
              </Link>
              <Link
                href="/appointment-request"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-[var(--border)] bg-white px-5 text-sm font-medium text-[var(--text)] hover:bg-[var(--surface-muted)]"
              >
                Request Appointment
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
            <h2 className="text-sm font-semibold text-[var(--text)]">Clinic information</h2>
            <p className="mt-2 text-sm text-[var(--text-2)]">
              Patients will find your clinic address, working hours, and contact channels here.
            </p>
            <p className="mt-4 text-sm text-[var(--text-2)]">
              This initial version focuses on a clear, easy-to-navigate interface. Booking,
              reminders, and follow‑up workflows will connect here as we roll out more features.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}

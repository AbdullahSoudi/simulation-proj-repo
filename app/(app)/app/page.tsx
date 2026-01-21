import Link from 'next/link'

export default function AppIndexPage() {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
      <h1 className="text-2xl font-semibold tracking-tight text-[var(--text)]">App</h1>
      <p className="mt-2 text-sm text-[var(--text-2)]">
        Phase 0 UI shell. Start with the dashboard.
      </p>
      <Link
        href="/app/dashboard"
        className="mt-4 inline-flex h-10 items-center justify-center rounded-xl bg-[var(--primary-600)] px-4 text-sm font-medium text-white hover:bg-[var(--primary-700)]"
      >
        Go to Dashboard
      </Link>
    </div>
  )
}


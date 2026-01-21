import Link from 'next/link'

type ForbiddenPageProps = {
  searchParams?: { reason?: string }
}

export default function ForbiddenPage({ searchParams }: ForbiddenPageProps) {
  const reason = searchParams?.reason ?? 'access'

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--text)]">Access denied</h1>
        <p className="text-sm text-[var(--text-2)]">
          You do not have permission to access this area ({reason}).
        </p>
      </header>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <h2 className="text-sm font-semibold text-[var(--text)]">What you can do</h2>
        <div className="mt-3 space-y-2 text-sm text-[var(--text-2)]">
          <p>
            If you believe this is a mistake, please contact a clinic administrator to review your
            permissions.
          </p>
          <div className="flex flex-wrap gap-3 pt-2 text-sm font-medium">
            <Link href="/app/dashboard" className="text-[var(--primary-700)] hover:underline">
              Go to Dashboard
            </Link>
            <Link href="/app/settings" className="text-[var(--primary-700)] hover:underline">
              Open Settings
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}


import { requireAdmin } from '@/lib/rbac'

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
      <h2 className="text-sm font-semibold text-[var(--text)]">{title}</h2>
      <div className="mt-3 text-sm text-[var(--text-2)]">{children}</div>
    </section>
  )
}

export default async function AdminSettingsPage() {
  const { userId } = await requireAdmin()

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--text)]">Admin Settings</h1>
        <p className="text-sm text-[var(--text-2)]">Admin-only route (tamper test).</p>
      </header>

      <Card title="Admin Settings">
        <div className="space-y-2">
          <div>
            <span className="text-[var(--text-3)]">Current user:</span>{' '}
            <span className="font-medium text-[var(--text)]">{userId ?? 'unknown'}</span>
          </div>
          <div>
            <span className="text-[var(--text-3)]">isAdmin:</span>{' '}
            <span className="font-medium text-[var(--text)]">true</span>
          </div>
        </div>
      </Card>
    </div>
  )
}


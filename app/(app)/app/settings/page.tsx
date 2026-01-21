import Link from 'next/link'

import { getUserRoleIds } from '@/lib/rbac'

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
      <h2 className="text-sm font-semibold text-[var(--text)]">{title}</h2>
      <div className="mt-3 text-sm text-[var(--text-2)]">{children}</div>
    </section>
  )
}

export default async function SettingsPage() {
  const { roleIds } = await getUserRoleIds()
  const isAdmin = roleIds.includes('admin')

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--text)]">Settings</h1>
        <p className="text-sm text-[var(--text-2)]">Placeholder (Phase 0). Configuration comes later.</p>
      </header>

      {isAdmin && (
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <h2 className="mb-2 text-sm font-semibold text-[var(--text)]">Admin</h2>
          <p className="text-sm text-[var(--text-2)]">
            Admin-only tools and configuration live under the Admin Settings page.
          </p>
          <div className="mt-3">
            <Link
              href="/app/settings/admin"
              className="inline-flex h-9 items-center justify-center rounded-lg bg-[var(--primary-600)] px-3 text-sm font-medium text-white hover:bg-[var(--primary-700)]"
            >
              Open Admin Settings
            </Link>
          </div>
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-2">
        <Card title="Clinic info (hours, address, map link)">Placeholder form</Card>
        <Card title="Users & roles">Placeholder table</Card>
        <Card title="Consent text versions">Placeholder editor</Card>
        <Card title="Integrations (WhatsApp keys/webhook settings)">Placeholder config</Card>
      </section>
    </div>
  )
}


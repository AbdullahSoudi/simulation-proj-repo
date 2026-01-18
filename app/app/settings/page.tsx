import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getCurrentUserRole } from '@/lib/auth/getCurrentUserRole'
import { AdminRoleAssignmentPanel } from './AdminRoleAssignmentPanel'

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
      <h2 className="text-sm font-semibold text-[var(--text)]">{title}</h2>
      <div className="mt-3 text-sm text-[var(--text-2)]">{children}</div>
    </section>
  )
}

type RoleRow = {
  id: string
  name: string
}

export default async function SettingsPage() {
  const currentRole = await getCurrentUserRole()
  const isAdmin = currentRole === 'admin'

  let roles: RoleRow[] = []
  if (isAdmin) {
    const supabase = await getSupabaseServerClient()
    const { data, error } = await supabase
      .from('roles')
      .select('id, name')
      .order('id')

    if (!error && data) {
      roles = data as RoleRow[]
    }
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--text)]">Settings</h1>
        <p className="text-sm text-[var(--text-2)]">Placeholder (Phase 0). Configuration comes later.</p>
      </header>

      {isAdmin && (
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <h2 className="text-sm font-semibold text-[var(--text)] mb-4">Admin: Role Assignment</h2>
          <AdminRoleAssignmentPanel roles={roles} />
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


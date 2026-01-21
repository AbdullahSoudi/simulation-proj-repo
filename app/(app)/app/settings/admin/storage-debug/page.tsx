import 'server-only'

import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/rbac'
import { DOCUMENTS_BUCKET } from '@/lib/storage/constants'

type BucketInfo = {
  name: string
}

export default async function StorageDebugPage() {
  // Enforce admin-only access
  await requireAdmin()

  const supabase = getSupabaseAdminClient()

  const { data: buckets, error } = await supabase.storage.listBuckets()

  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  let projectHost: string | undefined
  try {
    projectHost = projectUrl ? new URL(projectUrl).hostname : undefined
  } catch {
    projectHost = undefined
  }

  const bucketNames = (buckets ?? []).map((b) => (b as BucketInfo).name)

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--text)]">
          Storage Debug (Admin)
        </h1>
        <p className="text-sm text-[var(--text-2)]">
          Server-only diagnostic: verifies Supabase Storage connectivity and bucket configuration.
        </p>
      </header>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <h2 className="text-sm font-semibold text-[var(--text)]">Project</h2>
        <div className="mt-3 space-y-1 text-sm text-[var(--text-2)]">
          <div>
            <span className="text-[var(--text-3)]">Host:</span>{' '}
            <span className="font-mono text-[var(--text)]">{projectHost ?? '(unknown)'}</span>
          </div>
          <div>
            <span className="text-[var(--text-3)]">Documents bucket (expected):</span>{' '}
            <span className="font-mono text-[var(--text)]">{DOCUMENTS_BUCKET}</span>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <h2 className="text-sm font-semibold text-[var(--text)]">Buckets</h2>
        {error ? (
          <div className="mt-3 text-sm text-[var(--danger-600)]">
            Failed to list buckets: {error.message}
          </div>
        ) : bucketNames.length === 0 ? (
          <div className="mt-3 text-sm text-[var(--text-2)]">No buckets found.</div>
        ) : (
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[var(--text-2)]">
            {bucketNames.map((name) => (
              <li key={name} className={name === DOCUMENTS_BUCKET ? 'font-semibold text-[var(--text)]' : ''}>
                {name}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}


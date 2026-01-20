type DataTablePlaceholderProps = {
  columns: string[]
  label?: string
}

export function DataTablePlaceholder({ columns, label }: DataTablePlaceholderProps) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
      {label ? (
        <div className="mb-2 text-xs font-medium text-[var(--text-3)] uppercase tracking-wide">
          {label}
        </div>
      ) : null}
      <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]">
        <div className="min-w-full divide-y divide-[var(--border)] text-sm">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(80px,1fr))] bg-[var(--surface-muted)] px-3 py-2 text-xs font-medium text-[var(--text-3)]">
            {columns.map((c) => (
              <div key={c} className="truncate">
                {c}
              </div>
            ))}
          </div>
          <div className="px-3 py-4 text-xs text-[var(--text-3)]">
            Placeholder table — no data yet.
          </div>
        </div>
      </div>
    </div>
  )
}


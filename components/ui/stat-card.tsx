type StatCardProps = {
  label: string
  value?: string | number
  helper?: string
}

export function StatCard({ label, value = '—', helper }: StatCardProps) {
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="text-xs font-medium text-[var(--text-3)] uppercase tracking-wide">
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold text-[var(--text)]">{value}</div>
      {helper ? (
        <div className="mt-1 text-xs text-[var(--text-2)]">{helper}</div>
      ) : null}
    </section>
  )
}


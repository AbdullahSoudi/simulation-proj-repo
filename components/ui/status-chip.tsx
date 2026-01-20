import type { ReactNode } from 'react'

export type StatusKind =
  | 'scheduled'
  | 'pending'
  | 'submitted'
  | 'needs-review'
  | 'approved'
  | 'overdue'
  | 'red-flag'
  // Inbox-specific lifecycle
  | 'matched'
  | 'unmatched'
  | 'escalated'
  | 'needs-triage'
  | 'resolved'

type StatusChipProps = {
  kind: StatusKind
  icon?: ReactNode
}

const LABELS: Record<StatusKind, string> = {
  scheduled: 'Scheduled',
  pending: 'Pending patient',
  submitted: 'Submitted',
  'needs-review': 'Needs review',
  approved: 'Approved',
  overdue: 'Overdue',
  'red-flag': 'Red Flag',
  matched: 'Matched',
  unmatched: 'Unmatched',
  'needs-triage': 'Needs triage',
  escalated: 'Escalated',
  resolved: 'Resolved',
}

const CLASSES: Record<StatusKind, string> = {
  scheduled:
    'bg-[var(--surface-muted)] text-[var(--text-2)] border border-[var(--border)]',
  pending:
    'bg-[var(--info-100)] text-[var(--info-600)] border border-[var(--info-100)]',
  submitted:
    'bg-[var(--info-100)] text-[var(--info-600)] border border-[var(--info-100)]',
  'needs-review':
    'bg-[var(--warning-100)] text-[var(--warning-600)] border border-[var(--warning-100)]',
  approved:
    'bg-[var(--success-100)] text-[var(--success-600)] border border-[var(--success-100)]',
  overdue:
    'bg-[var(--danger-100)] text-[var(--danger-600)] border border-[var(--danger-100)]',
  'red-flag':
    'bg-[var(--danger-100)] text-[var(--danger-600)] border border-[var(--danger-100)]',
  matched:
    'bg-[var(--surface-muted)] text-[var(--text-2)] border border-[var(--border)]',
  unmatched:
    'bg-[var(--warning-100)] text-[var(--warning-600)] border border-[var(--warning-100)]',
  'needs-triage':
    'bg-[var(--warning-100)] text-[var(--warning-600)] border border-[var(--warning-100)]',
  escalated:
    'bg-[var(--danger-100)] text-[var(--danger-600)] border border-[var(--danger-100)]',
  resolved:
    'bg-[var(--success-100)] text-[var(--success-600)] border border-[var(--success-100)]',
}

export function StatusChip({ kind, icon }: StatusChipProps) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium',
        CLASSES[kind],
      ].join(' ')}
    >
      {icon}
      {LABELS[kind]}
    </span>
  )
}


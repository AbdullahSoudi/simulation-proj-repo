'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { generateChecklistAction, updateChecklistItemAction } from './checklistActions'

type ChecklistItem = {
  id: string
  label: string
  sort_order: number
  status: 'pending' | 'done' | 'not_applicable'
  notes: string | null
  completed_at: string | null
}

type PreOpChecklistProps = {
  episodeId: string
  checklistId: string | null
  items: ChecklistItem[]
}

export function PreOpChecklist({ episodeId, checklistId, items }: PreOpChecklistProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const doneCount = items.filter((i) => i.status === 'done').length
  const totalCount = items.length

  async function handleGenerate() {
    setError(null)
    startTransition(async () => {
      try {
        await generateChecklistAction(episodeId)
        router.refresh()
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to generate checklist.'
        setError(msg)
      }
    })
  }

  async function handleStatusChange(itemId: string, newStatus: 'pending' | 'done' | 'not_applicable') {
    setError(null)
    startTransition(async () => {
      try {
        await updateChecklistItemAction(itemId, newStatus)
        router.refresh()
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to update item.'
        setError(msg)
      }
    })
  }

  if (!checklistId) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[var(--text)]">Pre-op Checklist</h3>
            <p className="mt-1 text-xs text-[var(--text-3)]">
              Generate a pre-operative checklist for this episode.
            </p>
          </div>
        </div>
        {error && (
          <div className="rounded-xl border border-[var(--danger-200)] bg-[var(--danger-50)] p-3 text-sm text-[var(--danger-700)]">
            {error}
          </div>
        )}
        <Button onClick={handleGenerate} disabled={isPending}>
          {isPending ? 'Generating...' : 'Generate Checklist'}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[var(--text)]">Pre-op Checklist</h3>
          <p className="mt-1 text-xs text-[var(--text-3)]">
            {doneCount} of {totalCount} completed
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-[var(--danger-200)] bg-[var(--danger-50)] p-3 text-sm text-[var(--danger-700)]">
          {error}
        </div>
      )}

      {items.length === 0 ? (
        <div className="text-sm text-[var(--text-2)]">No checklist items found.</div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-[var(--surface-muted)] text-xs font-semibold text-[var(--text-3)]">
              <tr>
                <th className="px-4 py-3 text-left">Item</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-[var(--surface-muted)]/60">
                  <td className="px-4 py-3">
                    <div className="font-medium text-[var(--text)]">{item.label}</div>
                    {item.notes && (
                      <div className="mt-1 text-xs text-[var(--text-3)]">{item.notes}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium capitalize ${
                        item.status === 'done'
                          ? 'bg-[var(--success-100)] text-[var(--success-600)]'
                          : item.status === 'not_applicable'
                            ? 'bg-[var(--surface-muted)] text-[var(--text-3)]'
                            : 'bg-[var(--warning-100)] text-[var(--warning-600)]'
                      }`}
                    >
                      {item.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {item.status !== 'pending' && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(item.id, 'pending')}
                          disabled={isPending}
                        >
                          Reset
                        </Button>
                      )}
                      {item.status !== 'done' && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(item.id, 'done')}
                          disabled={isPending}
                        >
                          Mark Done
                        </Button>
                      )}
                      {item.status !== 'not_applicable' && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(item.id, 'not_applicable')}
                          disabled={isPending}
                        >
                          N/A
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

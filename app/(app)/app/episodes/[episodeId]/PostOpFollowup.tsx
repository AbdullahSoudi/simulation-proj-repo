'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { generateFollowupPlanAction, updateTaskStatusAction } from './followupActions'

type Task = {
  id: string
  title: string
  due_at: string
  status: 'pending' | 'done' | 'skipped'
  completed_at: string | null
  notes: string | null
}

type PostOpFollowupProps = {
  episodeId: string
  planId: string | null
  scheduledAt: string | null
  tasks: Task[]
}

export function PostOpFollowup({ episodeId, planId, scheduledAt, tasks }: PostOpFollowupProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const pendingCount = tasks.filter((t) => t.status === 'pending').length
  const overdueCount = tasks.filter(
    (t) => t.status === 'pending' && new Date(t.due_at) < new Date()
  ).length
  const doneCount = tasks.filter((t) => t.status === 'done').length
  const totalCount = tasks.length

  async function handleGenerate() {
    setError(null)
    startTransition(async () => {
      try {
        await generateFollowupPlanAction(episodeId)
        router.refresh()
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to generate follow-up plan.'
        setError(msg)
      }
    })
  }

  async function handleStatusChange(taskId: string, newStatus: 'pending' | 'done' | 'skipped') {
    setError(null)
    startTransition(async () => {
      try {
        await updateTaskStatusAction(taskId, newStatus)
        router.refresh()
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to update task.'
        setError(msg)
      }
    })
  }

  if (!planId) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[var(--text)]">Post-op Follow-up Plan</h3>
            <p className="mt-1 text-xs text-[var(--text-3)]">
              Generate a follow-up plan with scheduled tasks for this episode.
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-[var(--danger-200)] bg-[var(--danger-50)] p-3 text-sm text-[var(--danger-700)]">
            {error}
          </div>
        )}

        {!scheduledAt && (
          <div className="rounded-xl border border-[var(--warning-200)] bg-[var(--warning-50)] p-3 text-sm text-[var(--warning-700)]">
            Set surgery date/time first before generating a follow-up plan.
          </div>
        )}

        <Button onClick={handleGenerate} disabled={isPending || !scheduledAt}>
          {isPending ? 'Generating...' : 'Generate Follow-up Plan'}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[var(--text)]">Post-op Follow-up Plan</h3>
          <p className="mt-1 text-xs text-[var(--text-3)]">
            {totalCount > 0 ? (
              <>
                {doneCount} done • {pendingCount} pending
                {overdueCount > 0 && (
                  <span className="ml-1 font-medium text-[var(--danger-600)]">
                    • {overdueCount} overdue
                  </span>
                )}
              </>
            ) : (
              'No tasks yet.'
            )}
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-[var(--danger-200)] bg-[var(--danger-50)] p-3 text-sm text-[var(--danger-700)]">
          {error}
        </div>
      )}

      {tasks.length === 0 ? (
        <div className="text-sm text-[var(--text-2)]">No follow-up tasks found.</div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-[var(--surface-muted)] text-xs font-semibold text-[var(--text-3)]">
              <tr>
                <th className="px-4 py-3 text-left">Due</th>
                <th className="px-4 py-3 text-left">Title</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {tasks.map((task) => {
                const isOverdue = task.status === 'pending' && new Date(task.due_at) < new Date()
                return (
                  <tr
                    key={task.id}
                    className={`hover:bg-[var(--surface-muted)]/60 ${
                      isOverdue ? 'bg-[var(--danger-50)]/30' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-[var(--text)]">
                        {new Date(task.due_at).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-[var(--text-3)]">
                        {new Date(task.due_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                      {isOverdue && (
                        <div className="mt-1 text-xs font-medium text-[var(--danger-600)]">
                          Overdue
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-[var(--text)]">{task.title}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium capitalize ${
                          task.status === 'done'
                            ? 'bg-[var(--success-100)] text-[var(--success-600)]'
                            : task.status === 'skipped'
                              ? 'bg-[var(--surface-muted)] text-[var(--text-3)]'
                              : 'bg-[var(--warning-100)] text-[var(--warning-600)]'
                        }`}
                      >
                        {task.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {task.status !== 'done' && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusChange(task.id, 'done')}
                            disabled={isPending}
                          >
                            Mark Done
                          </Button>
                        )}
                        {task.status !== 'skipped' && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusChange(task.id, 'skipped')}
                            disabled={isPending}
                          >
                            Skip
                          </Button>
                        )}
                        {task.status !== 'pending' && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusChange(task.id, 'pending')}
                            disabled={isPending}
                          >
                            Reset
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import {
  updateEncounterVersionAction,
  finalizeEncounterVersionAction,
  createNewVersionAction,
} from '../actions'

type EncounterThreadRow = {
  id: string
  patient_id: string
  episode_id: string | null
  appointment_id: string | null
  note_type: string
  created_at: string
}

type EncounterVersionRow = {
  id: string
  thread_id: string
  version: number
  status: 'draft' | 'finalized'
  content: string
  created_at: string
  created_by: string | null
  finalized_at: string | null
  finalized_by: string | null
}

type PatientRow = {
  id: string
  full_name: string | null
}

type EncounterDetailClientProps = {
  thread: EncounterThreadRow
  versions: EncounterVersionRow[]
  patient: PatientRow | null
  latestDraftVersion: EncounterVersionRow | null
}

export function EncounterDetailClient({
  thread,
  versions,
  patient,
  latestDraftVersion,
}: EncounterDetailClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [content, setContent] = useState(latestDraftVersion?.content || '')
  const [error, setError] = useState<string | null>(null)
  const [isFinalizing, setIsFinalizing] = useState(false)
  const [isCreatingVersion, setIsCreatingVersion] = useState(false)

  const canEdit = latestDraftVersion && latestDraftVersion.status === 'draft'

  async function handleSaveDraft() {
    if (!latestDraftVersion) {
      setError('No draft version found.')
      return
    }

    setError(null)
    startTransition(async () => {
      try {
        await updateEncounterVersionAction({
          versionId: latestDraftVersion.id,
          content: content,
        })
        router.refresh()
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to save draft.'
        setError(msg)
      }
    })
  }

  async function handleFinalize() {
    if (!latestDraftVersion) {
      setError('No draft version found.')
      return
    }

    if (!confirm('Are you sure you want to finalize this encounter? Finalized versions cannot be edited.')) {
      return
    }

    setIsFinalizing(true)
    setError(null)
    startTransition(async () => {
      try {
        await finalizeEncounterVersionAction({
          versionId: latestDraftVersion.id,
        })
        router.refresh()
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to finalize encounter.'
        setError(msg)
      } finally {
        setIsFinalizing(false)
      }
    })
  }

  async function handleCreateNewVersion() {
    setIsCreatingVersion(true)
    setError(null)
    startTransition(async () => {
      try {
        await createNewVersionAction({
          threadId: thread.id,
        })
        router.refresh()
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to create new version.'
        setError(msg)
      } finally {
        setIsCreatingVersion(false)
      }
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Encounter: ${thread.note_type.replace('_', ' ')}`}
        description={patient ? `Patient: ${patient.full_name}` : 'Encounter thread'}
        actions={
          <Button variant="outline" asChild>
            <Link href="/app/encounters">Back to Encounters</Link>
          </Button>
        }
      />

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <h2 className="text-sm font-semibold text-[var(--text)]">Thread Info</h2>
          <div className="mt-3 space-y-2 text-sm text-[var(--text-2)]">
            <div>
              <span className="text-[var(--text-3)]">Patient:</span>{' '}
              <Link
                href={`/app/patients/${thread.patient_id}`}
                className="font-medium text-[var(--primary-700)] hover:underline"
              >
                {patient?.full_name ?? '(Unknown)'}
              </Link>
            </div>
            <div>
              <span className="text-[var(--text-3)]">Type:</span>{' '}
              <span className="font-medium text-[var(--text)] capitalize">
                {thread.note_type.replace('_', ' ')}
              </span>
            </div>
            {thread.episode_id && (
              <div>
                <span className="text-[var(--text-3)]">Episode:</span>{' '}
                <Link
                  href={`/app/episodes/${thread.episode_id}`}
                  className="font-medium text-[var(--primary-700)] hover:underline"
                >
                  View Episode
                </Link>
              </div>
            )}
            {thread.appointment_id && (
              <div>
                <span className="text-[var(--text-3)]">Appointment:</span>{' '}
                <Link
                  href={`/app/schedule`}
                  className="font-medium text-[var(--primary-700)] hover:underline"
                >
                  View Schedule
                </Link>
              </div>
            )}
            <div>
              <span className="text-[var(--text-3)]">Created:</span>{' '}
              <span className="font-medium text-[var(--text)]">
                {new Date(thread.created_at).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <h2 className="text-sm font-semibold text-[var(--text)]">Version History</h2>
          <div className="mt-3 space-y-2">
            {versions.length === 0 ? (
              <div className="text-sm text-[var(--text-2)]">No versions yet.</div>
            ) : (
              versions.map((v) => (
                <div
                  key={v.id}
                  className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-3"
                >
                  <div>
                    <div className="text-sm font-medium text-[var(--text)]">Version {v.version}</div>
                    <div className="text-xs text-[var(--text-3)]">
                      {v.status === 'finalized' && v.finalized_at
                        ? `Finalized ${new Date(v.finalized_at).toLocaleDateString()}`
                        : `Created ${new Date(v.created_at).toLocaleDateString()}`}
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium capitalize ${
                      v.status === 'finalized'
                        ? 'bg-[var(--success-100)] text-[var(--success-600)]'
                        : 'bg-[var(--warning-100)] text-[var(--warning-600)]'
                    }`}
                  >
                    {v.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--text)]">
            {latestDraftVersion ? `Version ${latestDraftVersion.version} (Draft)` : 'No Draft Version'}
          </h2>
          {!canEdit && latestDraftVersion === null && (
            <Button onClick={handleCreateNewVersion} disabled={isCreatingVersion}>
              {isCreatingVersion ? 'Creating...' : 'New Version'}
            </Button>
          )}
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-[var(--danger-200)] bg-[var(--danger-50)] p-3 text-sm text-[var(--danger-700)]">
            {error}
          </div>
        )}

        {canEdit ? (
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-2">Content</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={15}
                className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none resize-none"
                placeholder="Enter clinical note content..."
              />
            </div>
            <div className="flex gap-3">
              <Button onClick={handleSaveDraft} disabled={isPending}>
                {isPending ? 'Saving...' : 'Save Draft'}
              </Button>
              <Button onClick={handleFinalize} disabled={isPending || isFinalizing} variant="default">
                {isFinalizing ? 'Finalizing...' : 'Finalize'}
              </Button>
            </div>
          </div>
        ) : latestDraftVersion ? (
          <div className="mt-4">
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-4">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-3)]">
                Finalized Version (Read-only)
              </div>
              <div className="whitespace-pre-wrap text-sm text-[var(--text-2)]">
                {latestDraftVersion.content || '(Empty)'}
              </div>
            </div>
            <div className="mt-4">
              <Button onClick={handleCreateNewVersion} disabled={isCreatingVersion}>
                {isCreatingVersion ? 'Creating...' : 'Create New Version'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-4 text-sm text-[var(--text-2)]">
            No draft version available. Create a new version to continue editing.
          </div>
        )}
      </section>
    </div>
  )
}

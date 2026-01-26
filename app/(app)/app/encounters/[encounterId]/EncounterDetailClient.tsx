'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { saveEncounterDraftAction, finalizeEncounterAction } from '../actions'
// Orders section will be integrated separately - keeping encounter focus for now

type EncounterRow = {
  id: string
  patient_id: string
  episode_id: string | null
  type: string
  status: string
  current_version_id: string | null
  created_at: string
  updated_at: string
}

type EncounterVersionRow = {
  id: string
  version_no: number
  status: 'draft' | 'finalized'
  chief_complaint: string
  history: string
  exam: string
  assessment: string
  plan: string
  created_at: string
  created_by: string | null
  finalized_at: string | null
  finalized_by: string | null
}

type VersionSummaryRow = {
  id: string
  version_no: number
  status: string
  created_at: string
  created_by: string | null
  finalized_at: string | null
  finalized_by: string | null
}

type PatientRow = {
  id: string
  full_name: string | null
}

type OrderRow = {
  id: string
  type: string
  name: string
  status: string
  ordered_at: string
  received_at: string | null
  reviewed_at: string | null
  notes: string | null
}

type EncounterDetailClientProps = {
  encounter: EncounterRow
  currentVersion: EncounterVersionRow | null
  versions: VersionSummaryRow[]
  patient: PatientRow | null
  orders: OrderRow[]
  isDoctor: boolean
}

export function EncounterDetailClient({
  encounter,
  currentVersion,
  versions,
  patient,
  orders,
  isDoctor,
}: EncounterDetailClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [soap, setSoap] = useState({
    chief_complaint: currentVersion?.chief_complaint || '',
    history: currentVersion?.history || '',
    exam: currentVersion?.exam || '',
    assessment: currentVersion?.assessment || '',
    plan: currentVersion?.plan || '',
  })
  const [error, setError] = useState<string | null>(null)
  const [isFinalizing, setIsFinalizing] = useState(false)

  const canEdit = encounter.status === 'draft' && currentVersion?.status === 'draft'
  const canFinalize = isDoctor && canEdit

  async function handleSaveDraft() {
    setError(null)
    startTransition(async () => {
      try {
        await saveEncounterDraftAction({
          encounterId: encounter.id,
          soap,
        })
        router.refresh()
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to save draft.'
        setError(msg)
      }
    })
  }

  async function handleFinalize() {
    if (!confirm('Are you sure you want to finalize this encounter? Finalized encounters cannot be edited.')) {
      return
    }

    setIsFinalizing(true)
    setError(null)
    startTransition(async () => {
      try {
        await finalizeEncounterAction({
          encounterId: encounter.id,
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

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Encounter: ${encounter.type.replace('_', ' ')}`}
        description={patient ? `Patient: ${patient.full_name}` : 'Encounter'}
        actions={
          <Button variant="outline" asChild>
            <Link href="/app/encounters">Back to Encounters</Link>
          </Button>
        }
      />

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <h2 className="text-sm font-semibold text-[var(--text)]">Encounter Info</h2>
          <div className="mt-3 space-y-2 text-sm text-[var(--text-2)]">
            <div>
              <span className="text-[var(--text-3)]">Patient:</span>{' '}
              <Link
                href={`/app/patients/${encounter.patient_id}`}
                className="font-medium text-[var(--primary-700)] hover:underline"
              >
                {patient?.full_name ?? '(Unknown)'}
              </Link>
            </div>
            <div>
              <span className="text-[var(--text-3)]">Type:</span>{' '}
              <span className="font-medium text-[var(--text)] capitalize">
                {encounter.type.replace('_', ' ')}
              </span>
            </div>
            <div>
              <span className="text-[var(--text-3)]">Status:</span>{' '}
              <span
                className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium capitalize ${
                  encounter.status === 'finalized'
                    ? 'bg-[var(--success-100)] text-[var(--success-600)]'
                    : 'bg-[var(--warning-100)] text-[var(--warning-600)]'
                }`}
              >
                {encounter.status}
              </span>
            </div>
            {encounter.episode_id && (
              <div>
                <span className="text-[var(--text-3)]">Episode:</span>{' '}
                <Link
                  href={`/app/episodes/${encounter.episode_id}`}
                  className="font-medium text-[var(--primary-700)] hover:underline"
                >
                  View Episode
                </Link>
              </div>
            )}
            <div>
              <span className="text-[var(--text-3)]">Updated:</span>{' '}
              <span className="font-medium text-[var(--text)]">
                {new Date(encounter.updated_at).toLocaleString()}
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
                    <div className="text-sm font-medium text-[var(--text)]">Version {v.version_no}</div>
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
            {currentVersion ? `Version ${currentVersion.version_no} (${currentVersion.status})` : 'No Current Version'}
          </h2>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-[var(--danger-200)] bg-[var(--danger-50)] p-3 text-sm text-[var(--danger-700)]">
            {error}
          </div>
        )}

        {canEdit ? (
          <div className="mt-4 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[var(--text)]">Chief Complaint</label>
                <textarea
                  value={soap.chief_complaint}
                  onChange={(e) => setSoap({ ...soap, chief_complaint: e.target.value })}
                  rows={3}
                  className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none resize-none"
                  placeholder="Enter chief complaint..."
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[var(--text)]">History</label>
                <textarea
                  value={soap.history}
                  onChange={(e) => setSoap({ ...soap, history: e.target.value })}
                  rows={3}
                  className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none resize-none"
                  placeholder="Enter history..."
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[var(--text)]">Exam</label>
              <textarea
                value={soap.exam}
                onChange={(e) => setSoap({ ...soap, exam: e.target.value })}
                rows={4}
                className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none resize-none"
                placeholder="Enter examination findings..."
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[var(--text)]">Assessment</label>
              <textarea
                value={soap.assessment}
                onChange={(e) => setSoap({ ...soap, assessment: e.target.value })}
                rows={4}
                className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none resize-none"
                placeholder="Enter assessment..."
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[var(--text)]">Plan</label>
              <textarea
                value={soap.plan}
                onChange={(e) => setSoap({ ...soap, plan: e.target.value })}
                rows={4}
                className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none resize-none"
                placeholder="Enter plan..."
              />
            </div>
            <div className="flex gap-3">
              <Button onClick={handleSaveDraft} disabled={isPending}>
                {isPending ? 'Saving...' : 'Save Draft'}
              </Button>
              {canFinalize && (
                <Button onClick={handleFinalize} disabled={isPending || isFinalizing} variant="default">
                  {isFinalizing ? 'Finalizing...' : 'Finalize'}
                </Button>
              )}
            </div>
          </div>
        ) : currentVersion ? (
          <div className="mt-4">
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-4 space-y-4">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-3)]">
                Finalized Version (Read-only)
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <div className="text-xs font-semibold text-[var(--text-3)] mb-1">Chief Complaint</div>
                  <div className="text-sm text-[var(--text-2)] whitespace-pre-wrap">
                    {currentVersion.chief_complaint || '(Empty)'}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-[var(--text-3)] mb-1">History</div>
                  <div className="text-sm text-[var(--text-2)] whitespace-pre-wrap">
                    {currentVersion.history || '(Empty)'}
                  </div>
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-[var(--text-3)] mb-1">Exam</div>
                <div className="text-sm text-[var(--text-2)] whitespace-pre-wrap">
                  {currentVersion.exam || '(Empty)'}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-[var(--text-3)] mb-1">Assessment</div>
                <div className="text-sm text-[var(--text-2)] whitespace-pre-wrap">
                  {currentVersion.assessment || '(Empty)'}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-[var(--text-3)] mb-1">Plan</div>
                <div className="text-sm text-[var(--text-2)] whitespace-pre-wrap">
                  {currentVersion.plan || '(Empty)'}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-4 text-sm text-[var(--text-2)]">
            No current version available.
          </div>
        )}
      </section>

      {orders.length > 0 && (
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <h2 className="text-sm font-semibold text-[var(--text)]">Orders</h2>
          <div className="mt-3 text-sm text-[var(--text-2)]">
            {orders.length} {orders.length === 1 ? 'order' : 'orders'} linked to this encounter.
          </div>
        </section>
      )}
    </div>
  )
}

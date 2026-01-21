'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  createAnesthesiaAssessmentAction,
  updateAnesthesiaAssessmentAction,
  finalizeAnesthesiaAssessmentAction,
} from './anesthesiaActions'

type AnesthesiaAssessmentData = {
  id: string
  episode_id: string
  asa_class: string | null
  mallampati: string | null
  comorbidities: Record<string, any> | null
  allergies: string | null
  current_meds: string | null
  fasting_status: string | null
  planned_anesthesia: string | null
  notes: string | null
  is_finalized: boolean
  finalized_at: string | null
  finalized_by: string | null
}

type AnesthesiaAssessmentProps = {
  episodeId: string
  assessment: AnesthesiaAssessmentData | null
  canEdit: boolean
}

export function AnesthesiaAssessment({ episodeId, assessment, canEdit }: AnesthesiaAssessmentProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [showFinalizeConfirm, setShowFinalizeConfirm] = useState(false)

  const [asaClass, setAsaClass] = useState(assessment?.asa_class || '')
  const [mallampati, setMallampati] = useState(assessment?.mallampati || '')
  const [allergies, setAllergies] = useState(assessment?.allergies || '')
  const [currentMeds, setCurrentMeds] = useState(assessment?.current_meds || '')
  const [fastingStatus, setFastingStatus] = useState(assessment?.fasting_status || '')
  const [plannedAnesthesia, setPlannedAnesthesia] = useState(assessment?.planned_anesthesia || '')
  const [notes, setNotes] = useState(assessment?.notes || '')

  const isFinalized = assessment?.is_finalized ?? false
  const isReadOnly = isFinalized || !canEdit

  async function handleCreate() {
    setError(null)
    startTransition(async () => {
      try {
        await createAnesthesiaAssessmentAction({
          episodeId,
          asaClass: asaClass.trim() || null,
          mallampati: mallampati.trim() || null,
          allergies: allergies.trim() || null,
          currentMeds: currentMeds.trim() || null,
          fastingStatus: fastingStatus.trim() || null,
          plannedAnesthesia: plannedAnesthesia.trim() || null,
          notes: notes.trim() || null,
        })
        router.refresh()
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to create assessment.'
        setError(msg)
      }
    })
  }

  async function handleSave() {
    if (!assessment) return

    setError(null)
    startTransition(async () => {
      try {
        await updateAnesthesiaAssessmentAction({
          assessmentId: assessment.id,
          asaClass: asaClass.trim() || null,
          mallampati: mallampati.trim() || null,
          allergies: allergies.trim() || null,
          currentMeds: currentMeds.trim() || null,
          fastingStatus: fastingStatus.trim() || null,
          plannedAnesthesia: plannedAnesthesia.trim() || null,
          notes: notes.trim() || null,
        })
        router.refresh()
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to save assessment.'
        setError(msg)
      }
    })
  }

  async function handleFinalize() {
    if (!assessment) return

    setError(null)
    startTransition(async () => {
      try {
        await finalizeAnesthesiaAssessmentAction(assessment.id)
        setShowFinalizeConfirm(false)
        router.refresh()
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to finalize assessment.'
        setError(msg)
      }
    })
  }

  if (!assessment && !canEdit) {
    return (
      <div className="text-sm text-[var(--text-2)]">
        No anesthesia assessment available. Only anesthesia clinicians and administrators can create assessments.
      </div>
    )
  }

  if (!assessment) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[var(--text)]">Anesthesia Assessment</h3>
            <p className="mt-1 text-xs text-[var(--text-3)]">Create a pre-anesthesia assessment for this episode.</p>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-[var(--danger-200)] bg-[var(--danger-50)] p-3 text-sm text-[var(--danger-700)]">
            {error}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleCreate()
          }}
          className="space-y-4"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="block text-xs font-medium text-[var(--text-2)]">ASA Class</label>
              <Input
                value={asaClass}
                onChange={(e) => setAsaClass(e.target.value)}
                placeholder="e.g. ASA I, ASA II"
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-medium text-[var(--text-2)]">Mallampati</label>
              <Input
                value={mallampati}
                onChange={(e) => setMallampati(e.target.value)}
                placeholder="e.g. Class I, Class II"
                disabled={isPending}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="block text-xs font-medium text-[var(--text-2)]">Allergies</label>
              <Input
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                placeholder="List known allergies"
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-medium text-[var(--text-2)]">Current Medications</label>
              <Input
                value={currentMeds}
                onChange={(e) => setCurrentMeds(e.target.value)}
                placeholder="List current medications"
                disabled={isPending}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="block text-xs font-medium text-[var(--text-2)]">Fasting Status</label>
              <Input
                value={fastingStatus}
                onChange={(e) => setFastingStatus(e.target.value)}
                placeholder="e.g. Yes/8h, NPO since midnight"
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-medium text-[var(--text-2)]">Planned Anesthesia</label>
              <Input
                value={plannedAnesthesia}
                onChange={(e) => setPlannedAnesthesia(e.target.value)}
                placeholder="e.g. GA, Spinal, Local, Sedation"
                disabled={isPending}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-medium text-[var(--text-2)]">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none"
              placeholder="Additional assessment notes..."
              disabled={isPending}
            />
          </div>

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Creating...' : 'Create Assessment'}
            </Button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[var(--text)]">Anesthesia Assessment</h3>
          {isFinalized && (
            <span className="mt-1 inline-flex items-center rounded-full bg-[var(--success-100)] px-2 py-1 text-xs font-medium text-[var(--success-600)]">
              Finalized
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-[var(--danger-200)] bg-[var(--danger-50)] p-3 text-sm text-[var(--danger-700)]">
          {error}
        </div>
      )}

      {showFinalizeConfirm && (
        <div className="rounded-xl border border-[var(--warning-200)] bg-[var(--warning-50)] p-4">
          <p className="text-sm font-medium text-[var(--warning-700)] mb-2">
            Finalize this assessment?
          </p>
          <p className="text-xs text-[var(--text-3)] mb-3">
            Once finalized, this assessment cannot be edited. This action cannot be undone.
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              onClick={handleFinalize}
              disabled={isPending}
            >
              {isPending ? 'Finalizing...' : 'Confirm Finalize'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowFinalizeConfirm(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (!isFinalized) handleSave()
        }}
        className="space-y-4"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="block text-xs font-medium text-[var(--text-2)]">ASA Class</label>
            <Input
              value={asaClass}
              onChange={(e) => setAsaClass(e.target.value)}
              placeholder="e.g. ASA I, ASA II"
              disabled={isReadOnly || isPending}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-[var(--text-2)]">Mallampati</label>
            <Input
              value={mallampati}
              onChange={(e) => setMallampati(e.target.value)}
              placeholder="e.g. Class I, Class II"
              disabled={isReadOnly || isPending}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="block text-xs font-medium text-[var(--text-2)]">Allergies</label>
            <Input
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
              placeholder="List known allergies"
              disabled={isReadOnly || isPending}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-[var(--text-2)]">Current Medications</label>
            <Input
              value={currentMeds}
              onChange={(e) => setCurrentMeds(e.target.value)}
              placeholder="List current medications"
              disabled={isReadOnly || isPending}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="block text-xs font-medium text-[var(--text-2)]">Fasting Status</label>
            <Input
              value={fastingStatus}
              onChange={(e) => setFastingStatus(e.target.value)}
              placeholder="e.g. Yes/8h, NPO since midnight"
              disabled={isReadOnly || isPending}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-[var(--text-2)]">Planned Anesthesia</label>
            <Input
              value={plannedAnesthesia}
              onChange={(e) => setPlannedAnesthesia(e.target.value)}
              placeholder="e.g. GA, Spinal, Local, Sedation"
              disabled={isReadOnly || isPending}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-medium text-[var(--text-2)]">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none"
            placeholder="Additional assessment notes..."
            disabled={isReadOnly || isPending}
          />
        </div>

        {!isFinalized && canEdit && (
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving...' : 'Save Draft'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowFinalizeConfirm(true)}
              disabled={isPending}
            >
              Finalize
            </Button>
          </div>
        )}

        {isFinalized && (
          <div className="text-xs text-[var(--text-3)]">
            Finalized{' '}
            {assessment.finalized_at
              ? `on ${new Date(assessment.finalized_at).toLocaleString()}`
              : ''}
          </div>
        )}
      </form>
    </div>
  )
}

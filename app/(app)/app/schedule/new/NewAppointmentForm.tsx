'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createAppointmentAction } from '../actions'

type PrefilledPatient = {
  id: string
  full_name: string | null
  phone: string | null
} | null

type PrefilledEpisode = {
  id: string
  procedure_name: string | null
  patient_id: string
} | null

type PatientOption = {
  id: string
  full_name: string | null
  phone: string | null
}

type EpisodeOption = {
  id: string
  procedure_name: string | null
}

export function NewAppointmentForm({
  prefilledPatient,
  prefilledEpisode,
}: {
  prefilledPatient: PrefilledPatient
  prefilledEpisode: PrefilledEpisode
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [patientSearch, setPatientSearch] = useState('')
  const [selectedPatient, setSelectedPatient] = useState<PrefilledPatient>(prefilledPatient)
  const [patientOptions, setPatientOptions] = useState<PatientOption[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedEpisode, setSelectedEpisode] = useState<PrefilledEpisode>(prefilledEpisode)
  const [episodeOptions, setEpisodeOptions] = useState<EpisodeOption[]>([])
  const [isLoadingEpisodes, setIsLoadingEpisodes] = useState(false)
  const [visitType, setVisitType] = useState('consultation')
  const [startsAt, setStartsAt] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function searchPatients(query: string) {
    if (!query.trim() || query.length < 2) {
      setPatientOptions([])
      return
    }

    setIsSearching(true)
    try {
      const res = await fetch(`/app/schedule/new/api/search-patients?q=${encodeURIComponent(query)}`)
      if (!res.ok) {
        throw new Error('Failed to search patients')
      }
      const data = await res.json()
      setPatientOptions(data.patients || [])
    } catch (err) {
      console.error('Patient search error:', err)
      setPatientOptions([])
    } finally {
      setIsSearching(false)
    }
  }

  async function loadEpisodes(patientId: string) {
    setIsLoadingEpisodes(true)
    try {
      const res = await fetch(`/app/schedule/new/api/search-episodes?patientId=${encodeURIComponent(patientId)}`)
      if (!res.ok) {
        throw new Error('Failed to load episodes')
      }
      const data = await res.json()
      setEpisodeOptions(data.episodes || [])
    } catch (err) {
      console.error('Episode load error:', err)
      setEpisodeOptions([])
    } finally {
      setIsLoadingEpisodes(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!selectedPatient) {
      setError('Please select a patient.')
      return
    }

    if (!startsAt || !endsAt) {
      setError('Start and end times are required.')
      return
    }

    const start = new Date(startsAt)
    const end = new Date(endsAt)

    if (end <= start) {
      setError('End time must be after start time.')
      return
    }

    startTransition(async () => {
      try {
        await createAppointmentAction({
          patientId: selectedPatient.id,
          episodeId: selectedEpisode?.id || null,
          visitType: visitType || 'consultation',
          startsAt: start.toISOString(),
          endsAt: end.toISOString(),
          notes: notes.trim() || null,
        })
        router.push('/app/schedule')
        router.refresh()
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to create appointment.'
        setError(msg)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-xl border border-[var(--danger-200)] bg-[var(--danger-50)] p-3 text-sm text-[var(--danger-700)]">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <label className="block text-sm font-medium text-[var(--text)]">
          Patient <span className="text-[var(--danger-600)]">*</span>
        </label>
        {selectedPatient ? (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-[var(--text)]">
                  {selectedPatient.full_name ?? '(No name)'}
                </div>
                {selectedPatient.phone && (
                  <div className="text-xs text-[var(--text-3)]">{selectedPatient.phone}</div>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedPatient(null)
                  setSelectedEpisode(null)
                  setPatientSearch('')
                  setPatientOptions([])
                  setEpisodeOptions([])
                }}
              >
                Change
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <Input
              type="text"
              placeholder="Search by name or phone..."
              value={patientSearch}
              onChange={(e) => {
                const q = e.target.value
                setPatientSearch(q)
                searchPatients(q)
              }}
              disabled={isPending}
            />
            {isSearching && (
              <div className="text-xs text-[var(--text-3)]">Searching...</div>
            )}
            {patientOptions.length > 0 && (
              <div className="max-h-48 space-y-1 overflow-y-auto rounded-xl border border-[var(--border)] bg-white p-2">
                {patientOptions.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setSelectedPatient(p)
                      setPatientSearch('')
                      setPatientOptions([])
                      loadEpisodes(p.id)
                    }}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-3 text-left text-sm hover:bg-[var(--surface)]"
                  >
                    <div className="font-medium text-[var(--text)]">
                      {p.full_name ?? '(No name)'}
                    </div>
                    {p.phone && (
                      <div className="text-xs text-[var(--text-3)]">{p.phone}</div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {selectedPatient && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[var(--text)]">Episode (optional)</label>
          {selectedEpisode ? (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
              <div className="flex items-center justify-between">
                <div className="font-medium text-[var(--text)]">
                  {selectedEpisode.procedure_name ?? 'Episode'}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedEpisode(null)
                  }}
                >
                  Remove
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {isLoadingEpisodes ? (
                <div className="text-xs text-[var(--text-3)]">Loading episodes...</div>
              ) : episodeOptions.length > 0 ? (
                <div className="max-h-32 space-y-1 overflow-y-auto rounded-xl border border-[var(--border)] bg-white p-2">
                  {episodeOptions.map((e) => (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => setSelectedEpisode({ id: e.id, procedure_name: e.procedure_name, patient_id: selectedPatient.id })}
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-2 text-left text-sm hover:bg-[var(--surface)]"
                    >
                      {e.procedure_name ?? 'Episode'}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-[var(--text-3)]">No episodes found for this patient.</div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[var(--text)]">
            Start time <span className="text-[var(--danger-600)]">*</span>
          </label>
          <Input
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            disabled={isPending}
            required
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-[var(--text)]">
            End time <span className="text-[var(--danger-600)]">*</span>
          </label>
          <Input
            type="datetime-local"
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
            disabled={isPending}
            required
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[var(--text)]">Visit type</label>
          <select
            value={visitType}
            onChange={(e) => setVisitType(e.target.value)}
            disabled={isPending}
            className="h-10 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none"
          >
            <option value="consultation">Consultation</option>
            <option value="follow_up">Follow-up</option>
            <option value="pre_op">Pre-op</option>
            <option value="post_op">Post-op</option>
            <option value="procedure">Procedure</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-[var(--text)]">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={isPending}
          rows={3}
          className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none"
          placeholder="Optional notes..."
        />
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Creating...' : 'Create Appointment'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}

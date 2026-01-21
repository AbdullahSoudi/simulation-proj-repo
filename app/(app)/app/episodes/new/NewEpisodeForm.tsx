'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createEpisodeAction } from './actions'

type PrefilledPatient = {
  id: string
  full_name: string | null
  phone: string | null
} | null

type PatientOption = {
  id: string
  full_name: string | null
  phone: string | null
}

export function NewEpisodeForm({ prefilledPatient }: { prefilledPatient: PrefilledPatient }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [patientSearch, setPatientSearch] = useState('')
  const [selectedPatient, setSelectedPatient] = useState<PrefilledPatient>(prefilledPatient)
  const [patientOptions, setPatientOptions] = useState<PatientOption[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [procedureName, setProcedureName] = useState('')
  const [status, setStatus] = useState('planned')
  const [scheduledAt, setScheduledAt] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function searchPatients(query: string) {
    if (!query.trim() || query.length < 2) {
      setPatientOptions([])
      return
    }

    setIsSearching(true)
    try {
      const res = await fetch(`/app/episodes/new/api/search-patients?q=${encodeURIComponent(query)}`)
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!selectedPatient) {
      setError('Please select a patient.')
      return
    }

    if (!procedureName.trim()) {
      setError('Procedure name is required.')
      return
    }

    startTransition(async () => {
      try {
        await createEpisodeAction({
          patientId: selectedPatient.id,
          procedureName: procedureName.trim(),
          status: status || 'planned',
          scheduledAt: scheduledAt.trim() || null,
          notes: notes.trim() || null,
        })
        router.push(`/app/episodes`)
        router.refresh()
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to create episode.'
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
                  setPatientSearch('')
                  setPatientOptions([])
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

      <div className="space-y-2">
        <label className="block text-sm font-medium text-[var(--text)]">
          Procedure name <span className="text-[var(--danger-600)]">*</span>
        </label>
        <Input
          type="text"
          placeholder="e.g. Laparoscopic cholecystectomy"
          value={procedureName}
          onChange={(e) => setProcedureName(e.target.value)}
          disabled={isPending}
          required
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[var(--text)]">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            disabled={isPending}
            className="h-10 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none"
          >
            <option value="planned">Planned</option>
            <option value="scheduled">Scheduled</option>
            <option value="done">Done</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-[var(--text)]">
            Scheduled date/time
          </label>
          <Input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            disabled={isPending}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-[var(--text)]">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={isPending}
          rows={4}
          className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none"
          placeholder="Optional notes..."
        />
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Creating...' : 'Create Episode'}
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

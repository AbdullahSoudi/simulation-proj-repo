'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createEncounterAction } from '../actions'

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

type PrefilledAppointment = {
  id: string
  starts_at: string
  visit_type: string
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

type AppointmentOption = {
  id: string
  starts_at: string
  visit_type: string
}

export function NewEncounterForm({
  prefilledPatient,
  prefilledEpisode,
  prefilledAppointment,
}: {
  prefilledPatient: PrefilledPatient
  prefilledEpisode: PrefilledEpisode
  prefilledAppointment: PrefilledAppointment
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
  const [selectedAppointment, setSelectedAppointment] = useState<PrefilledAppointment>(prefilledAppointment)
  const [appointmentOptions, setAppointmentOptions] = useState<AppointmentOption[]>([])
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(false)
  const [noteType, setNoteType] = useState('consultation')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (selectedPatient && !prefilledEpisode) {
      loadEpisodes(selectedPatient.id)
    }
  }, [selectedPatient])

  useEffect(() => {
    if (selectedPatient && !prefilledAppointment) {
      loadAppointments(selectedPatient.id)
    }
  }, [selectedPatient])

  async function searchPatients(query: string) {
    if (!query.trim() || query.length < 2) {
      setPatientOptions([])
      return
    }

    setIsSearching(true)
    try {
      const res = await fetch(`/app/encounters/new/api/search-patients?q=${encodeURIComponent(query)}`)
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
      const res = await fetch(`/app/encounters/new/api/search-episodes?patientId=${encodeURIComponent(patientId)}`)
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

  async function loadAppointments(patientId: string) {
    setIsLoadingAppointments(true)
    try {
      const res = await fetch(`/app/encounters/new/api/search-appointments?patientId=${encodeURIComponent(patientId)}`)
      if (!res.ok) {
        throw new Error('Failed to load appointments')
      }
      const data = await res.json()
      setAppointmentOptions(data.appointments || [])
    } catch (err) {
      console.error('Appointment load error:', err)
      setAppointmentOptions([])
    } finally {
      setIsLoadingAppointments(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!selectedPatient) {
      setError('Please select a patient.')
      return
    }

    startTransition(async () => {
      try {
        const threadId = await createEncounterAction({
          patientId: selectedPatient.id,
          episodeId: selectedEpisode?.id || null,
          appointmentId: selectedAppointment?.id || null,
          noteType: noteType || 'consultation',
        })
        router.push(`/app/encounters/${threadId}`)
        router.refresh()
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to create encounter.'
        setError(msg)
      }
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Encounter"
        description="Create a new clinical note thread."
        actions={
          <Button variant="outline" asChild>
            <a href="/app/encounters">Back to Encounters</a>
          </Button>
        }
      />

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
            <div className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-3">
              <div>
                <div className="font-medium text-[var(--text)]">{selectedPatient.full_name}</div>
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
                  setSelectedAppointment(null)
                  setEpisodeOptions([])
                  setAppointmentOptions([])
                }}
              >
                Change
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="Search by name or phone..."
                value={patientSearch}
                onChange={(e) => {
                  setPatientSearch(e.target.value)
                  searchPatients(e.target.value)
                }}
                disabled={isSearching}
              />
              {patientOptions.length > 0 && (
                <div className="rounded-lg border border-[var(--border)] bg-white">
                  {patientOptions.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setSelectedPatient(p)
                        setPatientSearch('')
                        setPatientOptions([])
                        loadEpisodes(p.id)
                        loadAppointments(p.id)
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-[var(--surface-muted)]"
                    >
                      <div className="font-medium text-[var(--text)]">{p.full_name}</div>
                      {p.phone && <div className="text-xs text-[var(--text-3)]">{p.phone}</div>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {selectedPatient && (
          <>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[var(--text)]">Episode (optional)</label>
              <select
                value={selectedEpisode?.id || ''}
                onChange={(e) => {
                  const episode = episodeOptions.find((ep) => ep.id === e.target.value)
                  setSelectedEpisode(episode ? { id: episode.id, procedure_name: episode.procedure_name, patient_id: selectedPatient.id } : null)
                }}
                className="h-10 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none"
                disabled={isLoadingEpisodes}
              >
                <option value="">None</option>
                {episodeOptions.map((ep) => (
                  <option key={ep.id} value={ep.id}>
                    {ep.procedure_name || 'Episode'}
                  </option>
                ))}
              </select>
              {isLoadingEpisodes && (
                <p className="text-xs text-[var(--text-3)]">Loading episodes...</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-[var(--text)]">Appointment (optional)</label>
              <select
                value={selectedAppointment?.id || ''}
                onChange={(e) => {
                  const appointment = appointmentOptions.find((apt) => apt.id === e.target.value)
                  setSelectedAppointment(
                    appointment
                      ? {
                          id: appointment.id,
                          starts_at: appointment.starts_at,
                          visit_type: appointment.visit_type,
                          patient_id: selectedPatient.id,
                        }
                      : null
                  )
                }}
                className="h-10 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none"
                disabled={isLoadingAppointments}
              >
                <option value="">None</option>
                {appointmentOptions.map((apt) => (
                  <option key={apt.id} value={apt.id}>
                    {new Date(apt.starts_at).toLocaleString()} - {apt.visit_type}
                  </option>
                ))}
              </select>
              {isLoadingAppointments && (
                <p className="text-xs text-[var(--text-3)]">Loading appointments...</p>
              )}
            </div>
          </>
        )}

        <div className="space-y-2">
          <label className="block text-sm font-medium text-[var(--text)]">
            Note Type <span className="text-[var(--danger-600)]">*</span>
          </label>
          <select
            value={noteType}
            onChange={(e) => setNoteType(e.target.value)}
            className="h-10 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none"
            required
          >
            <option value="consultation">Consultation</option>
            <option value="follow_up">Follow-up</option>
            <option value="pre_op">Pre-op</option>
            <option value="post_op">Post-op</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Creating...' : 'Create Encounter'}
          </Button>
          <Button type="button" variant="outline" asChild>
            <a href="/app/encounters">Cancel</a>
          </Button>
        </div>
      </form>
    </div>
  )
}

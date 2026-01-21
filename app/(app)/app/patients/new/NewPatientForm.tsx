'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

import { createPatientAction } from './actions'

export function NewPatientForm() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [phoneE164, setPhoneE164] = useState('')
  const [gender, setGender] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [consent, setConsent] = useState(false)

  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    setIsSaving(true)

    try {
      await createPatientAction({
        fullName,
        phoneE164,
        gender: gender || undefined,
        dateOfBirth: dateOfBirth || undefined,
        consent,
      })
      // createPatientAction redirects on success
      router.refresh()
    } catch (err) {
      const text = err instanceof Error ? err.message : 'Failed to create patient.'
      setMessage(text)
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {message ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-sm text-[var(--danger-600)]">
          {message}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--text)]">
            Full name <span className="text-[var(--danger-600)]">*</span>
          </label>
          <Input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Patient full name"
            required
            disabled={isSaving}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--text)]">
            Phone (E.164) <span className="text-[var(--danger-600)]">*</span>
          </label>
          <Input
            value={phoneE164}
            onChange={(e) => setPhoneE164(e.target.value)}
            placeholder="+2010..."
            required
            disabled={isSaving}
          />
          <p className="text-xs text-[var(--text-3)]">
            Stored as an identity record (not as the patient primary key).
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--text)]">Gender</label>
          <Input
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            placeholder="Optional"
            disabled={isSaving}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--text)]">Date of birth</label>
          <Input
            type="date"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            disabled={isSaving}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            disabled={isSaving}
          />
          <div className="space-y-1">
            <div className="text-sm font-medium text-[var(--text)]">
              WhatsApp messaging consent (MVP)
            </div>
            <p className="text-xs text-[var(--text-3)]">
              If consent storage is not available yet in DB, we will not claim it was recorded.
            </p>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Creating…' : 'Create patient'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push('/app/patients')} disabled={isSaving}>
          Cancel
        </Button>
      </div>
    </form>
  )
}


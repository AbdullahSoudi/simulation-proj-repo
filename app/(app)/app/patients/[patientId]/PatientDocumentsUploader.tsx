'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { uploadDocumentAction } from './documentActions'

export function PatientDocumentsUploader({ patientId }: { patientId: string }) {
  const [file, setFile] = useState<File | null>(null)
  const [type, setType] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)

    if (!file) {
      setMessage('Please choose a file to upload.')
      return
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('patientId', patientId)
      formData.append('type', type)
      formData.append('file', file)
      await uploadDocumentAction(formData)
      setMessage('Document uploaded successfully.')
      setFile(null)
      setType('')
      ;(e.target as HTMLFormElement).reset()
    } catch (err) {
      const text = err instanceof Error ? err.message : 'Failed to upload document.'
      setMessage(text)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      {message ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-3 text-xs text-[var(--text-2)]">
          {message}
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-[2fr_1fr]">
        <div className="space-y-2">
          <label className="text-xs font-medium text-[var(--text-2)]">File</label>
          <Input
            type="file"
            accept="application/pdf,image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            disabled={isUploading}
          />
          <p className="text-[10px] text-[var(--text-3)]">
            PDF or image. Stored in a private bucket; access is via signed URLs only.
          </p>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium text-[var(--text-2)]">Type / category</label>
          <Input
            placeholder="e.g. lab, imaging, consent"
            value={type}
            onChange={(e) => setType(e.target.value)}
            disabled={isUploading}
          />
        </div>
      </div>

      <Button type="submit" size="sm" disabled={isUploading}>
        {isUploading ? 'Uploading…' : 'Upload document'}
      </Button>
    </form>
  )
}


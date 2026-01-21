'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'

import { getDocumentSignedUrlAction } from './documentActions'

export function DocumentActions({ documentId }: { documentId: string }) {
  const [isLoading, setIsLoading] = useState(false)

  async function handleView() {
    setIsLoading(true)
    try {
      const url = await getDocumentSignedUrlAction(documentId)
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (err) {
      const text = err instanceof Error ? err.message : 'Failed to open document.'
      alert(text)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      onClick={handleView}
      disabled={isLoading}
    >
      {isLoading ? 'Opening…' : 'View'}
    </Button>
  )
}


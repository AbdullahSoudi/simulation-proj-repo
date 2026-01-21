'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { updateAppointmentStatusAction } from './actions'

type AppointmentStatusActionsProps = {
  appointmentId: string
  currentStatus: string
}

const STATUS_FLOW: Record<string, string[]> = {
  booked: ['confirmed', 'cancelled'],
  confirmed: ['checked_in', 'cancelled'],
  checked_in: ['completed', 'no_show'],
  completed: [],
  cancelled: [],
  no_show: [],
}

export function AppointmentStatusActions({
  appointmentId,
  currentStatus,
}: AppointmentStatusActionsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const nextStatuses = STATUS_FLOW[currentStatus] || []

  async function handleStatusChange(newStatus: string) {
    startTransition(async () => {
      try {
        await updateAppointmentStatusAction({
          appointmentId,
          status: newStatus as any,
        })
        router.refresh()
      } catch (err) {
        const text = err instanceof Error ? err.message : 'Failed to update status.'
        alert(text)
      }
    })
  }

  if (nextStatuses.length === 0) {
    return <span className="text-xs text-[var(--text-3)]">Final</span>
  }

  return (
    <div className="flex items-center justify-end gap-2">
      {nextStatuses.map((status) => (
        <Button
          key={status}
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handleStatusChange(status)}
          disabled={isPending}
        >
          {status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
        </Button>
      ))}
    </div>
  )
}

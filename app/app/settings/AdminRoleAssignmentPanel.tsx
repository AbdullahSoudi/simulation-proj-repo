'use client'

import { FormEvent, useState, useTransition } from 'react'
import { assignRoleAction } from './assignRoleAction'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type Role = {
  id: string
  name: string
}

type Props = {
  roles: Role[]
}

export function AdminRoleAssignmentPanel({ roles }: Props) {
  const [targetUserId, setTargetUserId] = useState('')
  const [roleId, setRoleId] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setMessage(null)

    if (!targetUserId.trim() || !roleId) {
      setMessage({ type: 'error', text: 'Please fill in both fields' })
      return
    }

    // Basic UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(targetUserId.trim())) {
      setMessage({ type: 'error', text: 'Invalid UUID format' })
      return
    }

    startTransition(async () => {
      const result = await assignRoleAction(targetUserId.trim(), roleId)
      if (result.success) {
        setMessage({ type: 'success', text: `Role "${roleId}" assigned successfully` })
        setTargetUserId('')
        setRoleId('')
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to assign role' })
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-2">
        <label className="text-xs font-medium text-[var(--text-2)]" htmlFor="target-user-id">
          Target User ID (UUID)
        </label>
        <Input
          id="target-user-id"
          type="text"
          value={targetUserId}
          onChange={(e) => setTargetUserId(e.target.value)}
          placeholder="72e1d251-3646-455a-9bed-acf8c7e006ff"
          disabled={isPending}
        />
      </div>

      <div className="grid gap-2">
        <label className="text-xs font-medium text-[var(--text-2)]" htmlFor="role-id">
          Role
        </label>
        <select
          id="role-id"
          value={roleId}
          onChange={(e) => setRoleId(e.target.value)}
          disabled={isPending}
          className="h-9 w-full rounded-md border border-[var(--border)] bg-white px-3 text-sm outline-none disabled:opacity-50"
        >
          <option value="">Select a role...</option>
          {roles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name} ({role.id})
            </option>
          ))}
        </select>
      </div>

      {message && (
        <div
          className={`rounded-md px-3 py-2 text-xs ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
              : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
          }`}
        >
          {message.text}
        </div>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Assigning...' : 'Assign Role'}
      </Button>
    </form>
  )
}

'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'

type OrderRow = {
  id: string
  patient_id: string
  episode_id: string | null
  encounter_thread_id: string | null
  type: string
  name: string
  status: string
  ordered_at: string
  received_at: string | null
  reviewed_at: string | null
}

type PatientRow = {
  id: string
  full_name: string | null
}

type OrdersClientProps = {
  orders: OrderRow[]
  patientsById: Record<string, PatientRow>
  total: number
  statusFilter: string
  typeFilter: string
  searchQuery: string
  ordersError: { message: string } | null
}

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'ordered', label: 'Ordered' },
  { value: 'received', label: 'Received' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'cancelled', label: 'Cancelled' },
]

const TYPE_OPTIONS = [
  { value: '', label: 'All types' },
  { value: 'lab', label: 'Lab' },
  { value: 'imaging', label: 'Imaging' },
]

export function OrdersClient({
  orders,
  patientsById,
  total,
  statusFilter,
  typeFilter,
  searchQuery,
  ordersError,
}: OrdersClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function handleStatusChange(newStatus: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (newStatus) {
      params.set('status', newStatus)
    } else {
      params.delete('status')
    }
    router.push(`/app/orders?${params.toString()}`)
  }

  function handleTypeChange(newType: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (newType) {
      params.set('type', newType)
    } else {
      params.delete('type')
    }
    router.push(`/app/orders?${params.toString()}`)
  }

  function handleSearchChange(newQuery: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (newQuery) {
      params.set('search', newQuery)
    } else {
      params.delete('search')
    }
    router.push(`/app/orders?${params.toString()}`)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders"
        description="Lab and imaging orders across the clinic."
      />

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-[var(--text)]">Orders</h2>
          <div className="text-xs text-[var(--text-3)]">
            {total ? `${total} total` : '0 total'}
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-[2fr_1fr_1fr]">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-[var(--text-3)]">
              Search
            </div>
            <div className="mt-3">
              <input
                type="text"
                placeholder="Patient name or order name"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="h-10 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none"
              />
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-[var(--text-3)]">
              Status
            </div>
            <div className="mt-3">
              <select
                value={statusFilter}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="h-10 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-[var(--text-3)]">
              Type
            </div>
            <div className="mt-3">
              <select
                value={typeFilter}
                onChange={(e) => handleTypeChange(e.target.value)}
                className="h-10 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none"
              >
                {TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-xl border border-[var(--border)] bg-white">
          {ordersError ? (
            <div className="p-4 text-sm text-[var(--danger-600)]">
              Failed to load orders: {ordersError.message}
            </div>
          ) : orders.length === 0 ? (
            <div className="p-4 text-sm text-[var(--text-2)]">No orders found.</div>
          ) : (
            <table className="min-w-full text-sm">
              <thead className="bg-[var(--surface-muted)] text-xs font-semibold text-[var(--text-3)]">
                <tr>
                  <th className="px-4 py-3 text-left">Patient</th>
                  <th className="px-4 py-3 text-left">Order Name</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Ordered</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {orders.map((order) => {
                  const patient = patientsById[order.patient_id]
                  return (
                    <tr key={order.id} className="hover:bg-[var(--surface-muted)]/60">
                      <td className="px-4 py-3">
                        <Link
                          href={`/app/patients/${order.patient_id}`}
                          className="font-medium text-[var(--primary-700)] hover:underline"
                        >
                          {patient?.full_name ?? '(Unknown)'}
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-medium text-[var(--text)]">{order.name}</td>
                      <td className="px-4 py-3 text-[var(--text-2)] capitalize">{order.type}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium capitalize ${
                            order.status === 'reviewed'
                              ? 'bg-[var(--success-100)] text-[var(--success-600)]'
                              : order.status === 'received'
                                ? 'bg-[var(--info-100)] text-[var(--info-600)]'
                                : order.status === 'cancelled'
                                  ? 'bg-[var(--surface-muted)] text-[var(--text-3)]'
                                  : 'bg-[var(--warning-100)] text-[var(--warning-600)]'
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[var(--text-2)]">
                        {new Date(order.ordered_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {order.encounter_thread_id ? (
                          <Link
                            href={`/app/encounters/${order.encounter_thread_id}`}
                            className="text-sm font-medium text-[var(--primary-700)] hover:underline"
                          >
                            View Encounter
                          </Link>
                        ) : (
                          <span className="text-xs text-[var(--text-3)]">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  )
}

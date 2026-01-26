import { getSupabaseServerClient } from '@/lib/supabase/server'
import { OrdersClient } from './OrdersClient'

type SearchParams = {
  status?: string
  type?: string
  search?: string
}

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

export default async function OrdersPage({ searchParams }: { searchParams?: SearchParams }) {
  const supabase = await getSupabaseServerClient()

  const statusFilter = searchParams?.status || ''
  const typeFilter = searchParams?.type || ''
  const searchQuery = searchParams?.search || ''

  // Build query
  let ordersQuery = supabase
    .from('orders')
    .select('id, patient_id, episode_id, encounter_thread_id, type, name, status, ordered_at, received_at, reviewed_at', {
      count: 'exact',
    })
    .order('ordered_at', { ascending: false })

  if (typeFilter) {
    ordersQuery = ordersQuery.eq('type', typeFilter)
  }

  if (statusFilter) {
    ordersQuery = ordersQuery.eq('status', statusFilter)
  }

  const { data: orders, error: ordersError, count } = await ordersQuery

  const orderRows = (orders ?? []) as OrderRow[]
  const patientIds = Array.from(new Set(orderRows.map((o) => o.patient_id)))

  // Fetch patient names
  const patientsById = new Map<string, PatientRow>()
  if (patientIds.length > 0) {
    const { data: patients } = await supabase
      .from('patients')
      .select('id, full_name')
      .in('id', patientIds)

    if (patients) {
      for (const p of patients as PatientRow[]) {
        if (p.id) {
          patientsById.set(p.id, p)
        }
      }
    }
  }

  // Filter by search query (patient name or order name)
  let filteredOrders = orderRows
  if (searchQuery) {
    filteredOrders = orderRows.filter((o) => {
      const patient = patientsById.get(o.patient_id)
      const patientName = patient?.full_name?.toLowerCase() || ''
      const orderName = o.name.toLowerCase()
      return patientName.includes(searchQuery.toLowerCase()) || orderName.includes(searchQuery.toLowerCase())
    })
  }

  // Convert Maps to plain objects for serialization
  const patientsByIdObj: Record<string, PatientRow> = {}
  for (const [id, patient] of patientsById) {
    patientsByIdObj[id] = patient
  }

  const total = filteredOrders.length

  return (
    <OrdersClient
      orders={filteredOrders}
      patientsById={patientsByIdObj}
      total={total}
      statusFilter={statusFilter}
      typeFilter={typeFilter}
      searchQuery={searchQuery}
      ordersError={ordersError ? { message: ordersError.message } : null}
    />
  )
}

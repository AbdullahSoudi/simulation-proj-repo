'use server'

import { revalidatePath } from 'next/cache'

import { getSupabaseActionClient } from '@/lib/supabase/server'

type CreateAppointmentInput = {
  patientId: string
  episodeId?: string | null
  visitType: string
  startsAt: string
  endsAt: string
  notes?: string | null
}

export async function createAppointmentAction(input: CreateAppointmentInput): Promise<void> {
  const supabase = await getSupabaseActionClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated.')
  }

  const startsAt = new Date(input.startsAt)
  const endsAt = new Date(input.endsAt)

  if (endsAt <= startsAt) {
    throw new Error('End time must be after start time.')
  }

  const { error } = await supabase.from('appointments').insert({
    patient_id: input.patientId,
    episode_id: input.episodeId || null,
    visit_type: input.visitType || 'consultation',
    status: 'booked',
    starts_at: startsAt.toISOString(),
    ends_at: endsAt.toISOString(),
    notes: input.notes?.trim() || null,
    updated_at: new Date().toISOString(),
  } as any)

  if (error) {
    throw new Error(error.message || 'Failed to create appointment.')
  }

  revalidatePath('/app/schedule')
  if (input.patientId) {
    revalidatePath(`/app/patients/${input.patientId}`)
  }
  if (input.episodeId) {
    revalidatePath(`/app/episodes/${input.episodeId}`)
  }
}

type UpdateAppointmentStatusInput = {
  appointmentId: string
  status: 'booked' | 'confirmed' | 'checked_in' | 'completed' | 'cancelled' | 'no_show'
}

export async function updateAppointmentStatusAction(
  input: UpdateAppointmentStatusInput
): Promise<void> {
  const supabase = await getSupabaseActionClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated.')
  }

  const { data: appointment } = await supabase
    .from('appointments')
    .select('patient_id, episode_id')
    .eq('id', input.appointmentId)
    .maybeSingle()

  if (!appointment) {
    throw new Error('Appointment not found.')
  }

  const { error } = await supabase
    .from('appointments')
    .update({
      status: input.status,
      updated_at: new Date().toISOString(),
    } as any)
    .eq('id', input.appointmentId)

  if (error) {
    throw new Error(error.message || 'Failed to update appointment status.')
  }

  revalidatePath('/app/schedule')
  if ((appointment as any).patient_id) {
    revalidatePath(`/app/patients/${(appointment as any).patient_id}`)
  }
  if ((appointment as any).episode_id) {
    revalidatePath(`/app/episodes/${(appointment as any).episode_id}`)
  }
}

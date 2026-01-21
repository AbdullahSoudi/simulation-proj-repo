'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

import { getSupabaseActionClient } from '@/lib/supabase/server'

type CreateEpisodeInput = {
  patientId: string
  procedureName: string
  status: string
  scheduledAt: string | null
  notes: string | null
}

export async function createEpisodeAction(input: CreateEpisodeInput): Promise<void> {
  const procedureName = input.procedureName.trim()
  if (!procedureName) {
    throw new Error('Procedure name is required.')
  }

  const supabase = await getSupabaseActionClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated.')
  }

  const { data: episode, error } = await supabase
    .from('episodes')
    .insert({
      patient_id: input.patientId,
      procedure_name: procedureName,
      status: input.status || 'planned',
      scheduled_at: input.scheduledAt || null,
      notes: input.notes || null,
      updated_at: new Date().toISOString(),
    } as any)
    .select('id')
    .single()

  if (error || !episode?.id) {
    throw new Error(error?.message || 'Failed to create episode.')
  }

  revalidatePath('/app/episodes')
  redirect(`/app/episodes/${episode.id}`)
}

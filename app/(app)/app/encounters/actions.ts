'use server'

import { revalidatePath } from 'next/cache'

import { getSupabaseActionClient } from '@/lib/supabase/server'

type CreateEncounterInput = {
  patientId: string
  episodeId?: string | null
  appointmentId?: string | null
  noteType: string
}

export async function createEncounterAction(input: CreateEncounterInput): Promise<string> {
  const supabase = await getSupabaseActionClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated.')
  }

  // 1) Create thread
  const { data: thread, error: threadError } = await supabase
    .from('encounter_threads')
    .insert({
      patient_id: input.patientId,
      episode_id: input.episodeId || null,
      appointment_id: input.appointmentId || null,
      note_type: input.noteType || 'consultation',
    } as any)
    .select('id')
    .single()

  if (threadError || !thread?.id) {
    throw new Error(threadError?.message || 'Failed to create encounter thread.')
  }

  // 2) Create version 1 (draft)
  const { error: versionError } = await supabase.from('encounter_versions').insert({
    thread_id: thread.id,
    version: 1,
    status: 'draft',
    content: '',
    created_by: user.id,
  } as any)

  if (versionError) {
    throw new Error(versionError.message || 'Failed to create encounter version.')
  }

  revalidatePath('/app/encounters')
  revalidatePath(`/app/encounters/${thread.id}`)
  if (input.patientId) {
    revalidatePath(`/app/patients/${input.patientId}`)
  }
  if (input.episodeId) {
    revalidatePath(`/app/episodes/${input.episodeId}`)
  }

  return thread.id
}

type UpdateEncounterVersionInput = {
  versionId: string
  content: string
}

export async function updateEncounterVersionAction(
  input: UpdateEncounterVersionInput
): Promise<void> {
  const supabase = await getSupabaseActionClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated.')
  }

  // Verify version exists and is draft
  const { data: version, error: fetchError } = await supabase
    .from('encounter_versions')
    .select('id, status, thread_id')
    .eq('id', input.versionId)
    .maybeSingle()

  if (fetchError || !version) {
    throw new Error('Encounter version not found.')
  }

  if (version.status !== 'draft') {
    throw new Error('Cannot update finalized encounter version.')
  }

  const { error: updateError } = await supabase
    .from('encounter_versions')
    .update({
      content: input.content.trim(),
    } as any)
    .eq('id', input.versionId)

  if (updateError) {
    throw new Error(updateError.message || 'Failed to update encounter version.')
  }

  revalidatePath(`/app/encounters/${(version as any).thread_id}`)
}

type FinalizeEncounterVersionInput = {
  versionId: string
}

export async function finalizeEncounterVersionAction(
  input: FinalizeEncounterVersionInput
): Promise<void> {
  const supabase = await getSupabaseActionClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated.')
  }

  // Verify version exists and is draft
  const { data: version, error: fetchError } = await supabase
    .from('encounter_versions')
    .select('id, status, thread_id')
    .eq('id', input.versionId)
    .maybeSingle()

  if (fetchError || !version) {
    throw new Error('Encounter version not found.')
  }

  if (version.status !== 'draft') {
    throw new Error('Encounter version is already finalized.')
  }

  const { error: finalizeError } = await supabase
    .from('encounter_versions')
    .update({
      status: 'finalized',
      finalized_at: new Date().toISOString(),
      finalized_by: user.id,
    } as any)
    .eq('id', input.versionId)

  if (finalizeError) {
    throw new Error(finalizeError.message || 'Failed to finalize encounter version.')
  }

  revalidatePath(`/app/encounters/${(version as any).thread_id}`)
  revalidatePath('/app/encounters')
}

type CreateNewVersionInput = {
  threadId: string
}

export async function createNewVersionAction(input: CreateNewVersionInput): Promise<string> {
  const supabase = await getSupabaseActionClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated.')
  }

  // Get latest version to copy content
  const { data: latestVersion, error: fetchError } = await supabase
    .from('encounter_versions')
    .select('version, content')
    .eq('thread_id', input.threadId)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (fetchError) {
    throw new Error('Failed to fetch latest version.')
  }

  const newVersion = (latestVersion?.version || 0) + 1

  // Create new draft version
  const { data: newVersionData, error: createError } = await supabase
    .from('encounter_versions')
    .insert({
      thread_id: input.threadId,
      version: newVersion,
      status: 'draft',
      content: latestVersion?.content || '',
      created_by: user.id,
    } as any)
    .select('id')
    .single()

  if (createError || !newVersionData?.id) {
    throw new Error(createError?.message || 'Failed to create new version.')
  }

  revalidatePath(`/app/encounters/${input.threadId}`)

  return newVersionData.id
}

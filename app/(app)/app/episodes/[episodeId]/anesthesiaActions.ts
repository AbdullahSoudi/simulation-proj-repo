'use server'

import { revalidatePath } from 'next/cache'

import { getSupabaseActionClient } from '@/lib/supabase/server'
import { requireAnesthesiaOrAdmin } from '@/lib/rbac'

type CreateAnesthesiaAssessmentInput = {
  episodeId: string
  asaClass?: string | null
  mallampati?: string | null
  comorbidities?: Record<string, any> | null
  allergies?: string | null
  currentMeds?: string | null
  fastingStatus?: string | null
  plannedAnesthesia?: string | null
  notes?: string | null
}

type UpdateAnesthesiaAssessmentInput = {
  assessmentId: string
  asaClass?: string | null
  mallampati?: string | null
  comorbidities?: Record<string, any> | null
  allergies?: string | null
  currentMeds?: string | null
  fastingStatus?: string | null
  plannedAnesthesia?: string | null
  notes?: string | null
}

export async function createAnesthesiaAssessmentAction(
  input: CreateAnesthesiaAssessmentInput
): Promise<void> {
  await requireAnesthesiaOrAdmin()

  const supabase = await getSupabaseActionClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated.')
  }

  // Check if assessment already exists
  const { data: existing } = await supabase
    .from('anesthesia_assessments')
    .select('id')
    .eq('episode_id', input.episodeId)
    .maybeSingle()

  if (existing) {
    throw new Error('Anesthesia assessment already exists for this episode.')
  }

  const { error } = await supabase.from('anesthesia_assessments').insert({
    episode_id: input.episodeId,
    asa_class: input.asaClass || null,
    mallampati: input.mallampati || null,
    comorbidities: input.comorbidities || null,
    allergies: input.allergies || null,
    current_meds: input.currentMeds || null,
    fasting_status: input.fastingStatus || null,
    planned_anesthesia: input.plannedAnesthesia || null,
    notes: input.notes || null,
    is_finalized: false,
    updated_at: new Date().toISOString(),
  } as any)

  if (error) {
    throw new Error(error.message || 'Failed to create anesthesia assessment.')
  }

  revalidatePath(`/app/episodes/${input.episodeId}`)
}

export async function updateAnesthesiaAssessmentAction(
  input: UpdateAnesthesiaAssessmentInput
): Promise<void> {
  await requireAnesthesiaOrAdmin()

  const supabase = await getSupabaseActionClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated.')
  }

  // Check if assessment exists and is not finalized
  const { data: assessment } = await supabase
    .from('anesthesia_assessments')
    .select('id, is_finalized, episode_id')
    .eq('id', input.assessmentId)
    .maybeSingle()

  if (!assessment) {
    throw new Error('Anesthesia assessment not found.')
  }

  if ((assessment as any).is_finalized) {
    throw new Error('Cannot update finalized assessment.')
  }

  const { error } = await supabase
    .from('anesthesia_assessments')
    .update({
      asa_class: input.asaClass ?? null,
      mallampati: input.mallampati ?? null,
      comorbidities: input.comorbidities ?? null,
      allergies: input.allergies ?? null,
      current_meds: input.currentMeds ?? null,
      fasting_status: input.fastingStatus ?? null,
      planned_anesthesia: input.plannedAnesthesia ?? null,
      notes: input.notes ?? null,
      updated_at: new Date().toISOString(),
    } as any)
    .eq('id', input.assessmentId)

  if (error) {
    throw new Error(error.message || 'Failed to update anesthesia assessment.')
  }

  revalidatePath(`/app/episodes/${(assessment as any).episode_id}`)
}

export async function finalizeAnesthesiaAssessmentAction(assessmentId: string): Promise<void> {
  await requireAnesthesiaOrAdmin()

  const supabase = await getSupabaseActionClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated.')
  }

  // Check if assessment exists and is not already finalized
  const { data: assessment } = await supabase
    .from('anesthesia_assessments')
    .select('id, is_finalized, episode_id')
    .eq('id', assessmentId)
    .maybeSingle()

  if (!assessment) {
    throw new Error('Anesthesia assessment not found.')
  }

  if ((assessment as any).is_finalized) {
    throw new Error('Assessment is already finalized.')
  }

  const { error } = await supabase
    .from('anesthesia_assessments')
    .update({
      is_finalized: true,
      finalized_at: new Date().toISOString(),
      finalized_by: user.id,
      updated_at: new Date().toISOString(),
    } as any)
    .eq('id', assessmentId)

  if (error) {
    throw new Error(error.message || 'Failed to finalize anesthesia assessment.')
  }

  revalidatePath(`/app/episodes/${(assessment as any).episode_id}`)
}

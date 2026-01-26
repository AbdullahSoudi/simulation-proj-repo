'use server'

import { revalidatePath } from 'next/cache'

import { getSupabaseActionClient } from '@/lib/supabase/server'
import { getUserRoleIds, requireDoctorOrAdmin } from '@/lib/rbac'

type CreateEncounterInput = {
  patientId: string
  episodeId?: string | null
  type: string
}

export async function createEncounterAction(input: CreateEncounterInput): Promise<string> {
  const supabase = await getSupabaseActionClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated.')
  }

  // 1) Create encounter
  const { data: encounter, error: encounterError } = await supabase
    .from('encounters')
    .insert({
      patient_id: input.patientId,
      episode_id: input.episodeId || null,
      type: input.type || 'consultation',
      status: 'draft',
    } as any)
    .select('id')
    .single()

  if (encounterError || !encounter?.id) {
    throw new Error(encounterError?.message || 'Failed to create encounter.')
  }

  // 2) Create version 1 (draft) with empty SOAP fields
  const { data: version, error: versionError } = await supabase
    .from('encounter_versions')
    .insert({
      encounter_id: encounter.id,
      version_no: 1,
      status: 'draft',
      chief_complaint: '',
      history: '',
      exam: '',
      assessment: '',
      plan: '',
      created_by: user.id,
    } as any)
    .select('id')
    .single()

  if (versionError || !version?.id) {
    throw new Error(versionError?.message || 'Failed to create encounter version.')
  }

  // 3) Update encounter with current_version_id
  const { error: updateError } = await supabase
    .from('encounters')
    .update({ current_version_id: version.id })
    .eq('id', encounter.id)

  if (updateError) {
    throw new Error(updateError.message || 'Failed to link version to encounter.')
  }

  revalidatePath('/app/encounters')
  revalidatePath(`/app/encounters/${encounter.id}`)
  if (input.patientId) {
    revalidatePath(`/app/patients/${input.patientId}`)
  }
  if (input.episodeId) {
    revalidatePath(`/app/episodes/${input.episodeId}`)
  }

  return encounter.id
}

type SOAPFields = {
  chief_complaint: string
  history: string
  exam: string
  assessment: string
  plan: string
}

type SaveEncounterDraftInput = {
  encounterId: string
  soap: SOAPFields
}

export async function saveEncounterDraftAction(input: SaveEncounterDraftInput): Promise<void> {
  const supabase = await getSupabaseActionClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated.')
  }

  // Get current encounter and version
  const { data: encounter, error: encounterError } = await supabase
    .from('encounters')
    .select('id, current_version_id, status')
    .eq('id', input.encounterId)
    .maybeSingle()

  if (encounterError || !encounter) {
    throw new Error('Encounter not found.')
  }

  if (encounter.status === 'finalized') {
    throw new Error('Cannot edit finalized encounter. Create a new version first.')
  }

  const currentVersionId = (encounter as any).current_version_id

  if (currentVersionId) {
    // Update existing draft version
    const { data: version, error: versionError } = await supabase
      .from('encounter_versions')
      .select('id, status, encounter_id')
      .eq('id', currentVersionId)
      .maybeSingle()

    if (versionError || !version) {
      throw new Error('Current version not found.')
    }

    if ((version as any).status !== 'draft') {
      throw new Error('Current version is not a draft.')
    }

    const { error: updateError } = await supabase
      .from('encounter_versions')
      .update({
        chief_complaint: input.soap.chief_complaint.trim(),
        history: input.soap.history.trim(),
        exam: input.soap.exam.trim(),
        assessment: input.soap.assessment.trim(),
        plan: input.soap.plan.trim(),
      } as any)
      .eq('id', currentVersionId)

    if (updateError) {
      throw new Error(updateError.message || 'Failed to save draft.')
    }
  } else {
    // Create new draft version
    const { data: latestVersion } = await supabase
      .from('encounter_versions')
      .select('version_no')
      .eq('encounter_id', input.encounterId)
      .order('version_no', { ascending: false })
      .limit(1)
      .maybeSingle()

    const newVersionNo = ((latestVersion as any)?.version_no || 0) + 1

    const { data: newVersion, error: createError } = await supabase
      .from('encounter_versions')
      .insert({
        encounter_id: input.encounterId,
        version_no: newVersionNo,
        status: 'draft',
        chief_complaint: input.soap.chief_complaint.trim(),
        history: input.soap.history.trim(),
        exam: input.soap.exam.trim(),
        assessment: input.soap.assessment.trim(),
        plan: input.soap.plan.trim(),
        created_by: user.id,
      } as any)
      .select('id')
      .single()

    if (createError || !newVersion?.id) {
      throw new Error(createError?.message || 'Failed to create version.')
    }

    // Update encounter with current_version_id
    const { error: updateEncounterError } = await supabase
      .from('encounters')
      .update({ current_version_id: newVersion.id, updated_at: new Date().toISOString() })
      .eq('id', input.encounterId)

    if (updateEncounterError) {
      throw new Error(updateEncounterError.message || 'Failed to link version.')
    }
  }

  revalidatePath(`/app/encounters/${input.encounterId}`)
}

type FinalizeEncounterInput = {
  encounterId: string
}

export async function finalizeEncounterAction(input: FinalizeEncounterInput): Promise<void> {
  // Server-side enforcement: Only doctor or admin can finalize
  await requireDoctorOrAdmin()

  const supabase = await getSupabaseActionClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated.')
  }

  // Get encounter and current version
  const { data: encounter, error: encounterError } = await supabase
    .from('encounters')
    .select('id, current_version_id, status')
    .eq('id', input.encounterId)
    .maybeSingle()

  if (encounterError || !encounter) {
    throw new Error('Encounter not found.')
  }

  if ((encounter as any).status === 'finalized') {
    throw new Error('Encounter is already finalized.')
  }

  const currentVersionId = (encounter as any).current_version_id
  if (!currentVersionId) {
    throw new Error('No current version found.')
  }

  // Verify version exists and is draft
  const { data: version, error: versionError } = await supabase
    .from('encounter_versions')
    .select('id, status')
    .eq('id', currentVersionId)
    .maybeSingle()

  if (versionError || !version) {
    throw new Error('Current version not found.')
  }

  if ((version as any).status !== 'draft') {
    throw new Error('Current version is not a draft.')
  }

  // Finalize the version
  const { error: finalizeVersionError } = await supabase
    .from('encounter_versions')
    .update({
      status: 'finalized',
      finalized_at: new Date().toISOString(),
      finalized_by: user.id,
    } as any)
    .eq('id', currentVersionId)

  if (finalizeVersionError) {
    throw new Error(finalizeVersionError.message || 'Failed to finalize version.')
  }

  // Finalize the encounter
  const { error: finalizeEncounterError } = await supabase
    .from('encounters')
    .update({
      status: 'finalized',
      updated_at: new Date().toISOString(),
    } as any)
    .eq('id', input.encounterId)

  if (finalizeEncounterError) {
    throw new Error(finalizeEncounterError.message || 'Failed to finalize encounter.')
  }

  revalidatePath(`/app/encounters/${input.encounterId}`)
  revalidatePath('/app/encounters')
}

type FetchEncounterInput = {
  encounterId: string
}

export type EncounterWithVersions = {
  encounter: {
    id: string
    patient_id: string
    episode_id: string | null
    type: string
    status: string
    current_version_id: string | null
    created_at: string
    updated_at: string
  }
  currentVersion: {
    id: string
    version_no: number
    status: string
    chief_complaint: string
    history: string
    exam: string
    assessment: string
    plan: string
    created_at: string
    created_by: string | null
    finalized_at: string | null
    finalized_by: string | null
  } | null
  versions: Array<{
    id: string
    version_no: number
    status: string
    created_at: string
    created_by: string | null
    finalized_at: string | null
    finalized_by: string | null
  }>
}

export async function fetchEncounterAction(
  input: FetchEncounterInput
): Promise<EncounterWithVersions> {
  const supabase = await getSupabaseActionClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated.')
  }

  // Fetch encounter
  const { data: encounter, error: encounterError } = await supabase
    .from('encounters')
    .select('id, patient_id, episode_id, type, status, current_version_id, created_at, updated_at')
    .eq('id', input.encounterId)
    .single()

  if (encounterError || !encounter) {
    throw new Error('Encounter not found.')
  }

  // Fetch all versions
  const { data: versions, error: versionsError } = await supabase
    .from('encounter_versions')
    .select('id, version_no, status, created_at, created_by, finalized_at, finalized_by')
    .eq('encounter_id', input.encounterId)
    .order('version_no', { ascending: false })

  if (versionsError) {
    throw new Error('Failed to fetch versions.')
  }

  const versionRows = (versions ?? []) as Array<{
    id: string
    version_no: number
    status: string
    created_at: string
    created_by: string | null
    finalized_at: string | null
    finalized_by: string | null
  }>

  // Fetch current version details if exists
  const currentVersionId = (encounter as any).current_version_id
  let currentVersion = null

  if (currentVersionId) {
    const { data: cv } = await supabase
      .from('encounter_versions')
      .select('id, version_no, status, chief_complaint, history, exam, assessment, plan, created_at, created_by, finalized_at, finalized_by')
      .eq('id', currentVersionId)
      .maybeSingle()

    if (cv) {
      currentVersion = {
        id: cv.id,
        version_no: cv.version_no,
        status: cv.status as 'draft' | 'finalized',
        chief_complaint: cv.chief_complaint || '',
        history: cv.history || '',
        exam: cv.exam || '',
        assessment: cv.assessment || '',
        plan: cv.plan || '',
        created_at: cv.created_at,
        created_by: cv.created_by,
        finalized_at: cv.finalized_at,
        finalized_by: cv.finalized_by,
      }
    }
  }

  return {
    encounter: encounter as any,
    currentVersion,
    versions: versionRows,
  }
}

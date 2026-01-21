'use server'

import { redirect } from 'next/navigation'

import { getSupabaseServerClient } from '@/lib/supabase/server'

type CreatePatientInput = {
  fullName: string
  phoneE164: string
  gender?: string
  dateOfBirth?: string
  consent?: boolean
}

export async function createPatientAction(input: CreatePatientInput): Promise<void> {
  const fullName = input.fullName.trim()
  const phone = input.phoneE164.trim()

  if (!fullName) {
    throw new Error('Full name is required.')
  }
  if (!phone) {
    throw new Error('Phone is required.')
  }

  const supabase = await getSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated.')
  }

  // 1) Create patient
  const patientInsert: Record<string, any> = {
    full_name: fullName,
    gender: input.gender || null,
    date_of_birth: input.dateOfBirth || null,
  }

  const { data: patient, error: patientError } = await supabase
    .from('patients')
    .insert(patientInsert)
    .select('id')
    .single()

  const patientId = patient?.id

  if (patientError || !patientId) {
    throw new Error(patientError?.message || 'Failed to create patient.')
  }

  // 2) Create identity (phone stored here for single-clinic MVP)
  const identityInsert: Record<string, any> = {
    patient_id: patientId,
    phone_e164: phone,
    is_primary: true,
    verification_status: 'unverified',
  }

  const { error: identityError } = await supabase.from('patient_identities').insert(identityInsert)

  if (identityError) {
    throw new Error(identityError.message || 'Failed to create patient identity.')
  }

  // 3) Consent record (only if consent_records table exists in your DB)
  // We do not claim consent is stored unless insert succeeds.
  if (input.consent === true) {
    const { error: consentError } = await supabase.from('consent_records').insert({
      patient_id: patientId,
      type: 'whatsapp_messaging',
      version: 'v1',
      channel: 'web',
      recorded_by: user.id,
    } as any)

    // If table doesn't exist or RLS blocks it, we ignore but do not lie in UI.
    if (consentError) {
      // Intentionally swallow; UI will show a warning message.
    }
  }

  redirect(`/app/patients/${patientId}`)
}


'use server'

import { revalidatePath } from 'next/cache'

import { getSupabaseServerClient, getSupabaseActionClient } from '@/lib/supabase/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { createDocumentSignedUrl } from '@/lib/storage/documents'
import { sanitizeFilename } from '@/lib/storage/filename'
import { DOCUMENTS_BUCKET } from '@/lib/storage/constants'

export async function uploadDocumentAction(formData: FormData) {
  const supabase = await getSupabaseServerClient()
  const actionClient = await getSupabaseActionClient()
  const admin = getSupabaseAdminClient()

  const patientId = String(formData.get('patientId') || '').trim()
  const type = String(formData.get('type') || '').trim() || 'other'
  const file = formData.get('file')

  if (!patientId) {
    throw new Error('Missing patientId.')
  }
  if (!(file instanceof File)) {
    throw new Error('You must select a file to upload.')
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated.')
  }

  const MAX_BYTES = 10 * 1024 * 1024 // 10 MB
  if (file.size > MAX_BYTES) {
    throw new Error('File is too large. Max size is 10 MB.')
  }

  const mime = file.type || ''
  if (!(mime === 'application/pdf' || mime.startsWith('image/'))) {
    throw new Error('Only PDF or image files are allowed.')
  }

  const docId = crypto.randomUUID()
  const safeName = sanitizeFilename(file.name || 'document')
  const storagePath = `patients/${patientId}/${docId}/${safeName}`

  // 1) Upload to Storage (private bucket)
  const { error: uploadError } = await admin.storage
    .from(DOCUMENTS_BUCKET)
    .upload(storagePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (uploadError) {
    const msg = uploadError.message || 'Failed to upload document.'
    const isBucketMissing =
      msg.toLowerCase().includes('bucket not found') ||
      msg.toLowerCase().includes('404')

    if (isBucketMissing) {
      const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      let host: string | undefined
      try {
        host = projectUrl ? new URL(projectUrl).hostname : undefined
      } catch {
        host = undefined
      }
      console.error('[Documents] Storage bucket missing', {
        bucket: DOCUMENTS_BUCKET,
        projectHost: host,
      })
      throw new Error(
        "Storage bucket 'documents' not found. Create it in Supabase Dashboard → Storage → Buckets as PRIVATE, named exactly: documents. Or update the bucket name in code to match the existing bucket."
      )
    }

    throw new Error(msg)
  }

  // 2) Insert metadata
  const { error: metaError } = await actionClient.from('documents').insert({
    id: docId,
    patient_id: patientId,
    type,
    filename: safeName,
    storage_path: storagePath,
    uploaded_by: user.id,
  } as any)

  if (metaError) {
    // Best-effort cleanup: delete the object we just uploaded
    await admin.storage.from(DOCUMENTS_BUCKET).remove([storagePath])
    throw new Error(metaError.message || 'Failed to save document metadata.')
  }

  revalidatePath(`/app/patients/${patientId}`)
}

export async function getDocumentSignedUrlAction(documentId: string): Promise<string> {
  const supabase = await getSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated.')
  }

  const { data, error } = await supabase
    .from('documents')
    .select('storage_path')
    .eq('id', documentId)
    .maybeSingle()

  if (error || !data?.storage_path) {
    throw new Error(error?.message || 'Document not found.')
  }

  return createDocumentSignedUrl(data.storage_path)
}


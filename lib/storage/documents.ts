import 'server-only'

import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { DOCUMENTS_BUCKET } from '@/lib/storage/constants'

/**
 * Creates a signed URL for a document stored in the private "documents" bucket.
 * - storagePath: object path in the bucket (e.g. "patients/<patientId>/<docId>/<filename>")
 * - expiresInSeconds: validity in seconds (default 1 hour)
 */
export async function createDocumentSignedUrl(
  storagePath: string,
  expiresInSeconds = 3600
): Promise<string> {
  const supabase = getSupabaseAdminClient()

  const { data, error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .createSignedUrl(storagePath, expiresInSeconds)

  if (error || !data?.signedUrl) {
    throw new Error(error?.message || 'Failed to create document signed URL')
  }

  return data.signedUrl
}


import 'server-only'

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let adminClient: SupabaseClient | null = null

/**
 * Server-only Supabase client using SUPABASE_SERVICE_ROLE_KEY.
 * - Use ONLY in server actions, background jobs, or migrations.
 * - MUST NOT be imported from client components or client bundles.
 */
export function getSupabaseAdminClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing Supabase service role configuration. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set on the SERVER and restart/redeploy the app.'
    )
  }

  if (!adminClient) {
    adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        // Service role keys should not be used in the browser and should not persist sessions.
        persistSession: false,
      },
    })
  }

  return adminClient
}


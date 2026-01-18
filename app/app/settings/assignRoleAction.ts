'use server'

import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getCurrentUserRole } from '@/lib/auth/getCurrentUserRole'

type Result = {
  success: boolean
  error?: string
}

/**
 * Server action to assign a role to a user.
 * Only callable by admins.
 */
export async function assignRoleAction(targetUserId: string, roleId: string): Promise<Result> {
  // Validate inputs
  if (!targetUserId || !roleId) {
    return { success: false, error: 'Missing required fields' }
  }

  // UUID format validation
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(targetUserId)) {
    return { success: false, error: 'Invalid UUID format for target user ID' }
  }

  // Check if caller is admin
  const currentRole = await getCurrentUserRole()
  if (currentRole !== 'admin') {
    return { success: false, error: 'Forbidden: admin role required' }
  }

  // Validate role exists
  const supabase = await getSupabaseServerClient()
  const { data: roleData, error: roleError } = await supabase
    .from('roles')
    .select('id')
    .eq('id', roleId)
    .maybeSingle()

  if (roleError || !roleData) {
    return { success: false, error: `Role "${roleId}" does not exist` }
  }

  // Call RPC to assign role
  const { error: rpcError } = await supabase.rpc('assign_role', {
    target_user_id: targetUserId,
    new_role_id: roleId,
  })

  if (rpcError) {
    return { success: false, error: rpcError.message || 'Failed to assign role' }
  }

  return { success: true }
}

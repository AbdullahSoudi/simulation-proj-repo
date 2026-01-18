import 'server-only'

import { getSupabaseServerClient } from '@/lib/supabase/server'

type UserRoleRow = {
  role_id: string
}

/**
 * Returns the primary role_id for the current authenticated user, or null.
 * Priority order:
 *   1) admin
 *   2) doctor
 *   3) reception
   *   4) nurse
 *   5) anesthesia
 */
export async function getCurrentUserRole(): Promise<string | null> {
  const supabase = await getSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: roles, error } = await supabase
    .from('user_roles')
    .select('role_id')
    .eq('user_id', user.id)

  if (error || !roles || roles.length === 0) {
    return null
  }

  const roleIds = (roles as UserRoleRow[]).map((r) => r.role_id)

  if (roleIds.includes('admin')) return 'admin'
  if (roleIds.includes('doctor')) return 'doctor'
  if (roleIds.includes('reception')) return 'reception'
  if (roleIds.includes('nurse')) return 'nurse'
  if (roleIds.includes('anesthesia')) return 'anesthesia'

  return null
}


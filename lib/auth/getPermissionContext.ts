import 'server-only'

import { getSupabaseServerClient } from '@/lib/supabase/server'

export type PermissionContext = {
  userId: string | null
  roleIds: string[]
  isAdmin: boolean
}

export async function getPermissionContext(): Promise<PermissionContext> {
  const supabase = await getSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { userId: null, roleIds: [], isAdmin: false }
  }

  let roleIds: string[] = []
  const { data: userRoles, error } = await supabase
    .from('user_roles')
    .select('role_id')
    .eq('user_id', user.id)

  if (!error && userRoles && userRoles.length > 0) {
    roleIds = userRoles.map((r: { role_id: string }) => r.role_id)
  }

  return {
    userId: user.id,
    roleIds,
    isAdmin: roleIds.includes('admin'),
  }
}


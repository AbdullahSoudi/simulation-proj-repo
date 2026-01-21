import 'server-only'

import { getSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export type UserRoleContext = {
  userId: string | null
  roleIds: string[]
  isAdmin: boolean
}

export async function getUserRoleIds(): Promise<UserRoleContext> {
  const supabase = await getSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { userId: null, roleIds: [], isAdmin: false }
  }

  const { data: userRoles, error } = await supabase
    .from('user_roles')
    .select('role_id')
    .eq('user_id', user.id)

  let roleIds: string[] = []

  if (!error && userRoles && userRoles.length > 0) {
    roleIds = userRoles.map((r: { role_id: string }) => r.role_id)
  }

  const isAdmin = roleIds.includes('admin')

  return { userId: user.id, roleIds, isAdmin }
}

export async function requireAdmin() {
  const ctx = await getUserRoleIds()

  if (!ctx.isAdmin) {
    redirect('/app/forbidden?reason=admin')
  }

  return ctx
}



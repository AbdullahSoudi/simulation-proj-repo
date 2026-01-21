import { ReactNode } from 'react'
import { redirect } from 'next/navigation'

import { AppShell } from '@/components/app-shell/AppShell'
import { getSupabaseServerClient } from '@/lib/supabase/server'

type AppGroupLayoutProps = {
  children: ReactNode
}

export default async function AppGroupLayout({ children }: AppGroupLayoutProps) {
  const supabase = await getSupabaseServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  // Fetch user roles from DB
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let roleIds: string[] = []
  if (user) {
    const { data: userRoles, error } = await supabase
      .from('user_roles')
      .select('role_id')
      .eq('user_id', user.id)

    if (!error && userRoles && userRoles.length > 0) {
      roleIds = userRoles.map((r: { role_id: string }) => r.role_id)
    }
  }

  const isAdmin = roleIds.includes('admin')

  return <AppShell isAdmin={isAdmin}>{children}</AppShell>
}


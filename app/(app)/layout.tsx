import { ReactNode } from 'react'
import { redirect } from 'next/navigation'

import { AppShell } from '@/components/app-shell/AppShell'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getUserRoleIds } from '@/lib/rbac'

type AppGroupLayoutProps = {
  children: ReactNode
}

export default async function AppGroupLayout({ children }: AppGroupLayoutProps) {
  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { isAdmin } = await getUserRoleIds()

  return <AppShell isAdmin={isAdmin}>{children}</AppShell>
}


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

  return <AppShell>{children}</AppShell>
}


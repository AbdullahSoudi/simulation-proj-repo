'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createContext, useContext, useMemo, useState } from 'react'

export type Role = 'reception' | 'doctor'

type NavItem = {
  href: string
  label: string
  group: 'Work' | 'Clinical' | 'Automation' | 'Insights' | 'Admin'
}

const NAV_ITEMS: NavItem[] = [
  // WORK
  { group: 'Work', href: '/app/dashboard', label: 'Dashboard' },
  { group: 'Work', href: '/app/inbox', label: 'Inbox (5)' },
  { group: 'Work', href: '/app/schedule', label: 'Schedule' },
  { group: 'Work', href: '/app/patients', label: 'Patients' },

  // CLINICAL
  { group: 'Clinical', href: '/app/episodes', label: 'Episodes' },
  { group: 'Clinical', href: '/app/encounters', label: 'Encounters' },
  { group: 'Clinical', href: '/app/documents', label: 'Documents' },

  // AUTOMATION
  { group: 'Automation', href: '/app/review-queue', label: 'Review Queue' },
  { group: 'Automation', href: '/app/templates', label: 'Templates' },

  // INSIGHTS
  { group: 'Insights', href: '/app/reports', label: 'Reports' },

  // ADMIN
  { group: 'Admin', href: '/app/settings', label: 'Settings' },
]

const ROLE_NAV: Record<Role, string[]> = {
  reception: [
    '/app/dashboard',
    '/app/inbox',
    '/app/schedule',
    '/app/patients',
    '/app/documents',
    '/app/templates',
    '/app/settings',
  ],
  doctor: [
    '/app/dashboard',
    '/app/inbox',
    '/app/schedule',
    '/app/patients',
    '/app/episodes',
    '/app/encounters',
    '/app/documents',
    '/app/review-queue',
    '/app/templates',
    '/app/reports',
    '/app/settings',
  ],
}

const RoleContext = createContext<Role>('reception')
export const useCurrentRole = () => useContext(RoleContext)

function GroupTitle({ children }: { children: React.ReactNode }) {
  return <div className="px-3 pb-2 pt-6 text-xs font-semibold uppercase tracking-wide text-[var(--text-3)]">{children}</div>
}

function NavLink({
  href,
  label,
  active,
}: {
  href: string
  label: string
  active: boolean
}) {
  return (
    <Link
      href={href}
      className={[
        'flex h-10 items-center rounded-lg px-3 text-sm',
        active
          ? 'bg-[var(--primary-100)] text-[var(--text)]'
          : 'text-[var(--text-2)] hover:bg-[var(--surface-muted)] hover:text-[var(--text)]',
      ].join(' ')}
    >
      {label}
    </Link>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [role, setRole] = useState<Role>('reception')

  const grouped = useMemo(() => {
    const allowed = new Set(ROLE_NAV[role])
    const visible = NAV_ITEMS.filter((i) => allowed.has(i.href))
    const groups: Array<NavItem['group']> = ['Work', 'Clinical', 'Automation', 'Insights', 'Admin']
    return groups.map((g) => ({
      group: g,
      items: visible.filter((i) => i.group === g),
    }))
  }, [role])

  return (
    <RoleContext.Provider value={role}>
      <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
        <div className="grid min-h-screen grid-cols-1 md:grid-cols-[280px_1fr]">
          <aside className="border-b border-[var(--border)] bg-[var(--surface)] md:border-b-0 md:border-r">
            <div className="flex h-16 items-center justify-between px-4">
              <div className="text-sm font-semibold tracking-tight">Surgical Clinic OS</div>
            </div>

            <div className="px-4 pb-4">
              <label className="block text-xs font-medium text-[var(--text-2)]">Current role</label>
              <select
                className="mt-2 h-10 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none"
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
              >
                <option value="reception">Reception</option>
                <option value="doctor">Doctor</option>
              </select>
            </div>

            <nav className="px-2 pb-6">
              {grouped.map(({ group, items }) =>
                items.length ? (
                  <div key={group}>
                    <GroupTitle>{group}</GroupTitle>
                    <div className="grid gap-1 px-1">
                      {items.map((it) => (
                        <NavLink
                          key={it.href}
                          href={it.href}
                          label={it.label}
                          active={pathname === it.href}
                        />
                      ))}
                    </div>
                  </div>
                ) : null
              )}
            </nav>
          </aside>

          <div className="min-w-0">
            <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur">
              <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-3 px-4">
                <input
                  className="h-10 w-full max-w-xl rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none"
                  placeholder="Global search: patients / phone / ID"
                  disabled
                />
              </div>
            </header>

            <main className="mx-auto w-full max-w-7xl px-4 py-6">{children}</main>
          </div>
        </div>
      </div>
    </RoleContext.Provider>
  )
}


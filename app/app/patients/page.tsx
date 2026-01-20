import { PageHeader } from '@/components/ui/page-header'
import { DataTablePlaceholder } from '@/components/ui/data-table-placeholder'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function PatientsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Patients"
        description="Patient registry and search. Phase 0: layout only, no data."
        actions={
          <Button disabled>New Patient</Button>
        }
      />

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <h2 className="text-sm font-semibold text-[var(--text)]">Patients List</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-[2fr_1fr]">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-[var(--text-3)]">
              Search &amp; filters
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <Input disabled placeholder="Search patients / phone / ID" />
              <Input disabled placeholder="Filters (age / sex / last visit / active episode)" />
            </div>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-[var(--text-3)]">
              Actions
            </div>
            <div className="mt-3 grid gap-2">
              <Button disabled className="justify-start">
                Register new patient
              </Button>
              <Button disabled variant="outline" className="justify-start">
                Filter by flags
              </Button>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <DataTablePlaceholder
            columns={['Name', 'Phone', 'ID', 'Active episode?', 'Last visit', 'Flags']}
            label="Patients table (placeholder)"
          />
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <h2 className="text-sm font-semibold text-[var(--text)]">New Patient Form (Reception)</h2>
        <div className="mt-3 grid gap-2 text-sm text-[var(--text-2)]">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
            Required: full name, phone, DOB/age, gender — placeholder.
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
            Consent checkbox + phone verification (OTP) — placeholder.
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <h2 className="text-sm font-semibold text-[var(--text)]">Patient Profile (core screen)</h2>
        <p className="mt-3 text-sm text-[var(--text-2)]">
          Tabs (max 6): Overview / Timeline / Episodes / Encounters / Documents / Messages —
          placeholder.
        </p>
      </section>
    </div>
  )
}


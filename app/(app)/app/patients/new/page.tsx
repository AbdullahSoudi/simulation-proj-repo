import { PageHeader } from '@/components/ui/page-header'
import { NewPatientForm } from './NewPatientForm'

export default function NewPatientPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="New Patient"
        description="Create a patient record. Phone is stored as an identity record."
      />

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <NewPatientForm />
      </section>
    </div>
  )
}


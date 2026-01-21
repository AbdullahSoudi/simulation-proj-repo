-- Encounter MVP: EHR-lite with draft/finalize + versioning
-- Single-clinic pilot: RLS allows authenticated to SELECT/INSERT/UPDATE; DELETE denied.
-- Finalized versions are immutable (enforced via trigger).

create extension if not exists pgcrypto;

-- 1) Encounter threads (one per visit/encounter)
create table if not exists public.encounter_threads (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  episode_id uuid null references public.episodes(id) on delete set null,
  appointment_id uuid null references public.appointments(id) on delete set null,
  note_type text not null default 'consultation',
  created_at timestamptz not null default now()
);

create index if not exists encounter_threads_patient_id_idx on public.encounter_threads (patient_id);
create index if not exists encounter_threads_episode_id_idx on public.encounter_threads (episode_id);
create index if not exists encounter_threads_appointment_id_idx on public.encounter_threads (appointment_id);
create index if not exists encounter_threads_note_type_idx on public.encounter_threads (note_type);
create index if not exists encounter_threads_created_at_idx on public.encounter_threads (created_at);

-- 2) Encounter versions (versioned notes per thread)
create table if not exists public.encounter_versions (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.encounter_threads(id) on delete cascade,
  version int not null,
  status text not null default 'draft' check (status in ('draft', 'finalized')),
  content text not null default '',
  created_at timestamptz not null default now(),
  created_by uuid null references auth.users(id),
  finalized_at timestamptz null,
  finalized_by uuid null references auth.users(id),
  unique(thread_id, version)
);

create index if not exists encounter_versions_thread_id_idx on public.encounter_versions (thread_id);
create index if not exists encounter_versions_thread_status_idx on public.encounter_versions (thread_id, status);
create index if not exists encounter_versions_created_at_idx on public.encounter_versions (created_at);

-- RLS
alter table public.encounter_threads enable row level security;
alter table public.encounter_versions enable row level security;

-- Policies: SELECT/INSERT/UPDATE for authenticated; DELETE denied
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'encounter_threads' and policyname = 'encounter_threads_select_authenticated'
  ) then
    create policy encounter_threads_select_authenticated
      on public.encounter_threads
      for select
      to authenticated
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'encounter_threads' and policyname = 'encounter_threads_insert_authenticated'
  ) then
    create policy encounter_threads_insert_authenticated
      on public.encounter_threads
      for insert
      to authenticated
      with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'encounter_threads' and policyname = 'encounter_threads_update_authenticated'
  ) then
    create policy encounter_threads_update_authenticated
      on public.encounter_threads
      for update
      to authenticated
      using (true)
      with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'encounter_versions' and policyname = 'encounter_versions_select_authenticated'
  ) then
    create policy encounter_versions_select_authenticated
      on public.encounter_versions
      for select
      to authenticated
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'encounter_versions' and policyname = 'encounter_versions_insert_authenticated'
  ) then
    create policy encounter_versions_insert_authenticated
      on public.encounter_versions
      for insert
      to authenticated
      with check (true);
  end if;

  -- UPDATE policy: only allow updates to draft versions
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'encounter_versions' and policyname = 'encounter_versions_update_draft_only'
  ) then
    create policy encounter_versions_update_draft_only
      on public.encounter_versions
      for update
      to authenticated
      using (status = 'draft')
      with check (status = 'draft');
  end if;
end$$;

-- Trigger: Prevent updates to finalized versions (additional safety)
create or replace function public.prevent_finalized_update()
returns trigger as $$
begin
  if old.status = 'finalized' then
    raise exception 'Cannot update finalized encounter version. Create a new version instead.';
  end if;
  return new;
end;
$$ language plpgsql;

do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'encounter_versions_prevent_finalized_update'
  ) then
    create trigger encounter_versions_prevent_finalized_update
      before update on public.encounter_versions
      for each row
      execute function public.prevent_finalized_update();
  end if;
end$$;

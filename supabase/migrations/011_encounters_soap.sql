-- Encounter EHR-lite: Migrate from encounter_threads to encounters with SOAP fields
-- This migration creates the new schema while preserving existing data if possible.
-- If encounter_threads exists, we'll migrate data; otherwise create fresh tables.

create extension if not exists pgcrypto;

-- Check if episodes table exists (for FK constraint)
do $$
begin
  -- Create new encounters table (replaces encounter_threads)
  if not exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'encounters') then
    create table public.encounters (
      id uuid primary key default gen_random_uuid(),
      patient_id uuid not null references public.patients(id) on delete cascade,
      episode_id uuid null,
      type text not null default 'consultation',
      status text not null default 'draft' check (status in ('draft', 'finalized')),
      current_version_id uuid null,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    -- Add episode FK if episodes table exists
    if exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'episodes') then
      alter table public.encounters
        add constraint encounters_episode_id_fkey
        foreign key (episode_id) references public.episodes(id) on delete set null;
    end if;

    create index if not exists encounters_patient_id_idx on public.encounters (patient_id);
    create index if not exists encounters_episode_id_idx on public.encounters (episode_id);
    create index if not exists encounters_status_idx on public.encounters (status);
    create index if not exists encounters_type_idx on public.encounters (type);
    create index if not exists encounters_created_at_idx on public.encounters (created_at);
  end if;
end$$;

-- Migrate encounter_versions to new schema with SOAP fields
do $$
begin
  -- Drop old encounter_versions if it exists with old schema (thread_id)
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'encounter_versions' and column_name = 'thread_id'
  ) then
    -- Migrate data from encounter_threads to encounters if needed
    insert into public.encounters (id, patient_id, episode_id, type, status, created_at, updated_at)
    select
      id,
      patient_id,
      episode_id,
      note_type,
      'draft',
      created_at,
      created_at
    from public.encounter_threads
    where not exists (select 1 from public.encounters where encounters.id = encounter_threads.id)
    on conflict (id) do nothing;

    -- Drop old encounter_versions table (will recreate with new schema)
    drop table if exists public.encounter_versions cascade;
  end if;

  -- Create new encounter_versions table with SOAP fields
  if not exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'encounter_versions') then
    create table public.encounter_versions (
      id uuid primary key default gen_random_uuid(),
      encounter_id uuid not null references public.encounters(id) on delete cascade,
      version_no int not null,
      status text not null default 'draft' check (status in ('draft', 'finalized')),
      chief_complaint text not null default '',
      history text not null default '',
      exam text not null default '',
      assessment text not null default '',
      plan text not null default '',
      created_at timestamptz not null default now(),
      created_by uuid null references auth.users(id),
      finalized_at timestamptz null,
      finalized_by uuid null references auth.users(id),
      unique(encounter_id, version_no)
    );

    create index if not exists encounter_versions_encounter_id_idx on public.encounter_versions (encounter_id);
    create index if not exists encounter_versions_encounter_status_idx on public.encounter_versions (encounter_id, status);
    create index if not exists encounter_versions_created_at_idx on public.encounter_versions (created_at);
  end if;
end$$;

-- RLS for encounters
alter table public.encounters enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'encounters' and policyname = 'encounters_select_authenticated'
  ) then
    create policy encounters_select_authenticated
      on public.encounters
      for select
      to authenticated
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'encounters' and policyname = 'encounters_insert_authenticated'
  ) then
    create policy encounters_insert_authenticated
      on public.encounters
      for insert
      to authenticated
      with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'encounters' and policyname = 'encounters_update_authenticated'
  ) then
    create policy encounters_update_authenticated
      on public.encounters
      for update
      to authenticated
      using (true)
      with check (true);
  end if;
end$$;

-- RLS for encounter_versions
alter table public.encounter_versions enable row level security;

do $$
begin
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

-- Trigger: Prevent updates to finalized versions
create or replace function public.prevent_finalized_encounter_version_update()
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
  drop trigger if exists encounter_versions_prevent_finalized_update on public.encounter_versions;
  create trigger encounter_versions_prevent_finalized_update
    before update on public.encounter_versions
    for each row
    execute function public.prevent_finalized_encounter_version_update();
end$$;

-- Updated_at trigger for encounters (if set_updated_at() exists)
do $$
begin
  if exists (
    select 1 from pg_proc p
    join pg_namespace n on p.pronamespace = n.oid
    where n.nspname = 'public' and p.proname = 'set_updated_at'
  ) then
    drop trigger if exists encounters_updated_at on public.encounters;
    create trigger encounters_updated_at
      before update on public.encounters
      for each row
      execute function public.set_updated_at();
  end if;
end$$;

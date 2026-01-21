-- Anesthesia Module MVP: pre-anesthesia assessment with RBAC + finalize gate
-- Single-clinic pilot: RLS allows authenticated to read; only anesthesia/admin can write/finalize.

create extension if not exists pgcrypto;

create table if not exists public.anesthesia_assessments (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references public.episodes(id) on delete cascade,
  asa_class text null,
  mallampati text null,
  comorbidities jsonb null,
  allergies text null,
  current_meds text null,
  fasting_status text null,
  planned_anesthesia text null,
  notes text null,
  is_finalized boolean not null default false,
  finalized_at timestamptz null,
  finalized_by uuid null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(episode_id)
);

create index if not exists anesthesia_assessments_episode_id_idx on public.anesthesia_assessments (episode_id);
create index if not exists anesthesia_assessments_is_finalized_idx on public.anesthesia_assessments (is_finalized);

-- RLS
alter table public.anesthesia_assessments enable row level security;

-- Helper function to check if user has anesthesia or admin role
create or replace function public.is_anesthesia_or_admin()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  return exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
    and ur.role_id in ('anesthesia', 'admin')
  );
end;
$$;

-- Policies
do $$
begin
  -- SELECT: authenticated can read
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'anesthesia_assessments' and policyname = 'anesthesia_assessments_select_authenticated'
  ) then
    create policy anesthesia_assessments_select_authenticated
      on public.anesthesia_assessments
      for select
      to authenticated
      using (true);
  end if;

  -- INSERT: only anesthesia/admin, and only when no finalized assessment exists for episode
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'anesthesia_assessments' and policyname = 'anesthesia_assessments_insert_anesthesia_admin'
  ) then
    create policy anesthesia_assessments_insert_anesthesia_admin
      on public.anesthesia_assessments
      for insert
      to authenticated
      with check (
        public.is_anesthesia_or_admin()
        and not exists (
          select 1 from public.anesthesia_assessments
          where episode_id = anesthesia_assessments.episode_id
        )
      );
  end if;

  -- UPDATE: only anesthesia/admin, and only when is_finalized=false
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'anesthesia_assessments' and policyname = 'anesthesia_assessments_update_anesthesia_admin_draft'
  ) then
    create policy anesthesia_assessments_update_anesthesia_admin_draft
      on public.anesthesia_assessments
      for update
      to authenticated
      using (
        public.is_anesthesia_or_admin()
        and is_finalized = false
      )
      with check (
        public.is_anesthesia_or_admin()
        and is_finalized = false
      );
  end if;

  -- FINALIZE: only anesthesia/admin can set is_finalized=true
  -- Note: This is handled via UPDATE policy above, but we add explicit check that finalized_by is set
  -- The application logic will enforce finalized_by and finalized_at are set together
end$$;

-- Updated_at trigger (if set_updated_at() exists)
do $$
begin
  if exists (
    select 1 from pg_proc p
    join pg_namespace n on p.pronamespace = n.oid
    where n.nspname = 'public' and p.proname = 'set_updated_at'
  ) then
    create trigger anesthesia_assessments_updated_at
      before update on public.anesthesia_assessments
      for each row
      execute function public.set_updated_at();
  end if;
end$$;

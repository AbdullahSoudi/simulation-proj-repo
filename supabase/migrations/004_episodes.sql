-- Episodes MVP: surgical care journey tracking
-- Single-clinic pilot: RLS allows authenticated staff to SELECT/INSERT/UPDATE; DELETE denied.

create extension if not exists pgcrypto;

create table if not exists public.episodes (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  status text not null default 'planned' check (status in ('planned', 'scheduled', 'done', 'cancelled')),
  procedure_name text not null,
  scheduled_at timestamptz null,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists episodes_patient_id_idx on public.episodes (patient_id);
create index if not exists episodes_status_idx on public.episodes (status);
create index if not exists episodes_scheduled_at_idx on public.episodes (scheduled_at);
create index if not exists episodes_created_at_idx on public.episodes (created_at);

-- RLS
alter table public.episodes enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'episodes' and policyname = 'episodes_select_authenticated'
  ) then
    create policy episodes_select_authenticated
      on public.episodes
      for select
      to authenticated
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'episodes' and policyname = 'episodes_insert_authenticated'
  ) then
    create policy episodes_insert_authenticated
      on public.episodes
      for insert
      to authenticated
      with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'episodes' and policyname = 'episodes_update_authenticated'
  ) then
    create policy episodes_update_authenticated
      on public.episodes
      for update
      to authenticated
      using (true)
      with check (true);
  end if;
end$$;

-- Updated_at trigger (if set_updated_at() exists, use it; otherwise manual update on change)
do $$
begin
  if exists (
    select 1 from pg_proc p
    join pg_namespace n on p.pronamespace = n.oid
    where n.nspname = 'public' and p.proname = 'set_updated_at'
  ) then
    create trigger episodes_updated_at
      before update on public.episodes
      for each row
      execute function public.set_updated_at();
  end if;
end$$;

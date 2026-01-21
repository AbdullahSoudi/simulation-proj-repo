-- Scheduling MVP: appointments table
-- Single-clinic pilot: RLS allows authenticated to SELECT/INSERT/UPDATE; DELETE denied.

create extension if not exists pgcrypto;

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  episode_id uuid null references public.episodes(id) on delete set null,
  visit_type text not null default 'consultation',
  status text not null default 'booked' check (status in ('booked', 'confirmed', 'checked_in', 'completed', 'cancelled', 'no_show')),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists appointments_starts_at_idx on public.appointments (starts_at);
create index if not exists appointments_patient_id_idx on public.appointments (patient_id);
create index if not exists appointments_episode_id_idx on public.appointments (episode_id);
create index if not exists appointments_status_idx on public.appointments (status);

-- RLS
alter table public.appointments enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'appointments' and policyname = 'appointments_select_authenticated'
  ) then
    create policy appointments_select_authenticated
      on public.appointments
      for select
      to authenticated
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'appointments' and policyname = 'appointments_insert_authenticated'
  ) then
    create policy appointments_insert_authenticated
      on public.appointments
      for insert
      to authenticated
      with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'appointments' and policyname = 'appointments_update_authenticated'
  ) then
    create policy appointments_update_authenticated
      on public.appointments
      for update
      to authenticated
      using (true)
      with check (true);
  end if;
end$$;

-- Updated_at trigger (if set_updated_at() exists)
do $$
begin
  if exists (
    select 1 from pg_proc p
    join pg_namespace n on p.pronamespace = n.oid
    where n.nspname = 'public' and p.proname = 'set_updated_at'
  ) then
    create trigger appointments_updated_at
      before update on public.appointments
      for each row
      execute function public.set_updated_at();
  end if;
end$$;

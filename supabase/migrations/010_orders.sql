-- Orders MVP: Lab/Imaging orders with status tracking
-- Single-clinic pilot: RLS allows authenticated to SELECT/INSERT/UPDATE; DELETE denied.

create extension if not exists pgcrypto;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  episode_id uuid null references public.episodes(id) on delete set null,
  encounter_thread_id uuid null references public.encounter_threads(id) on delete set null,
  type text not null default 'lab' check (type in ('lab', 'imaging')),
  name text not null,
  status text not null default 'ordered' check (status in ('ordered', 'received', 'reviewed', 'cancelled')),
  ordered_at timestamptz not null default now(),
  received_at timestamptz null,
  reviewed_at timestamptz null,
  notes text null,
  result_document_id uuid null references public.documents(id) on delete set null,
  created_by uuid null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_patient_id_idx on public.orders (patient_id);
create index if not exists orders_episode_id_idx on public.orders (episode_id);
create index if not exists orders_encounter_thread_id_idx on public.orders (encounter_thread_id);
create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_type_idx on public.orders (type);
create index if not exists orders_ordered_at_idx on public.orders (ordered_at);

-- RLS
alter table public.orders enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'orders' and policyname = 'orders_select_authenticated'
  ) then
    create policy orders_select_authenticated
      on public.orders
      for select
      to authenticated
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'orders' and policyname = 'orders_insert_authenticated'
  ) then
    create policy orders_insert_authenticated
      on public.orders
      for insert
      to authenticated
      with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'orders' and policyname = 'orders_update_authenticated'
  ) then
    create policy orders_update_authenticated
      on public.orders
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
    create trigger orders_updated_at
      before update on public.orders
      for each row
      execute function public.set_updated_at();
  end if;
end$$;

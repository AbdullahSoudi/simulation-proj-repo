-- Pre-Op Checklist MVP: templates + per-episode instances
-- Single-clinic pilot: RLS allows authenticated staff to SELECT/INSERT/UPDATE; DELETE denied.

create extension if not exists pgcrypto;

-- 1) Checklist templates
create table if not exists public.checklist_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null default 'preop',
  version text not null default 'v1',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 2) Template items
create table if not exists public.checklist_template_items (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.checklist_templates(id) on delete cascade,
  label text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists checklist_template_items_template_id_idx on public.checklist_template_items (template_id);
create index if not exists checklist_template_items_sort_order_idx on public.checklist_template_items (sort_order);

-- 3) Episode checklists (one per episode)
create table if not exists public.episode_checklists (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references public.episodes(id) on delete cascade,
  template_id uuid not null references public.checklist_templates(id),
  created_at timestamptz not null default now(),
  unique(episode_id)
);

create index if not exists episode_checklists_episode_id_idx on public.episode_checklists (episode_id);
create index if not exists episode_checklists_template_id_idx on public.episode_checklists (template_id);

-- 4) Episode checklist items
create table if not exists public.episode_checklist_items (
  id uuid primary key default gen_random_uuid(),
  episode_checklist_id uuid not null references public.episode_checklists(id) on delete cascade,
  label text not null,
  sort_order int not null default 0,
  status text not null default 'pending' check (status in ('pending', 'done', 'not_applicable')),
  notes text null,
  completed_at timestamptz null,
  completed_by uuid null references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists episode_checklist_items_checklist_id_idx on public.episode_checklist_items (episode_checklist_id);
create index if not exists episode_checklist_items_status_idx on public.episode_checklist_items (status);
create index if not exists episode_checklist_items_sort_order_idx on public.episode_checklist_items (sort_order);

-- RLS for all tables
alter table public.checklist_templates enable row level security;
alter table public.checklist_template_items enable row level security;
alter table public.episode_checklists enable row level security;
alter table public.episode_checklist_items enable row level security;

-- Policies: SELECT/INSERT/UPDATE for authenticated; DELETE denied
do $$
begin
  -- checklist_templates
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'checklist_templates' and policyname = 'checklist_templates_select_authenticated'
  ) then
    create policy checklist_templates_select_authenticated on public.checklist_templates for select to authenticated using (true);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'checklist_templates' and policyname = 'checklist_templates_insert_authenticated'
  ) then
    create policy checklist_templates_insert_authenticated on public.checklist_templates for insert to authenticated with check (true);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'checklist_templates' and policyname = 'checklist_templates_update_authenticated'
  ) then
    create policy checklist_templates_update_authenticated on public.checklist_templates for update to authenticated using (true) with check (true);
  end if;

  -- checklist_template_items
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'checklist_template_items' and policyname = 'checklist_template_items_select_authenticated'
  ) then
    create policy checklist_template_items_select_authenticated on public.checklist_template_items for select to authenticated using (true);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'checklist_template_items' and policyname = 'checklist_template_items_insert_authenticated'
  ) then
    create policy checklist_template_items_insert_authenticated on public.checklist_template_items for insert to authenticated with check (true);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'checklist_template_items' and policyname = 'checklist_template_items_update_authenticated'
  ) then
    create policy checklist_template_items_update_authenticated on public.checklist_template_items for update to authenticated using (true) with check (true);
  end if;

  -- episode_checklists
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'episode_checklists' and policyname = 'episode_checklists_select_authenticated'
  ) then
    create policy episode_checklists_select_authenticated on public.episode_checklists for select to authenticated using (true);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'episode_checklists' and policyname = 'episode_checklists_insert_authenticated'
  ) then
    create policy episode_checklists_insert_authenticated on public.episode_checklists for insert to authenticated with check (true);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'episode_checklists' and policyname = 'episode_checklists_update_authenticated'
  ) then
    create policy episode_checklists_update_authenticated on public.episode_checklists for update to authenticated using (true) with check (true);
  end if;

  -- episode_checklist_items
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'episode_checklist_items' and policyname = 'episode_checklist_items_select_authenticated'
  ) then
    create policy episode_checklist_items_select_authenticated on public.episode_checklist_items for select to authenticated using (true);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'episode_checklist_items' and policyname = 'episode_checklist_items_insert_authenticated'
  ) then
    create policy episode_checklist_items_insert_authenticated on public.episode_checklist_items for insert to authenticated with check (true);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'episode_checklist_items' and policyname = 'episode_checklist_items_update_authenticated'
  ) then
    create policy episode_checklist_items_update_authenticated on public.episode_checklist_items for update to authenticated using (true) with check (true);
  end if;
end$$;

-- Seed: Pre-Op Basic template (idempotent)
do $$
declare
  template_id_val uuid;
begin
  -- Create template if not exists
  insert into public.checklist_templates (name, type, version, is_active)
  select 'Pre-Op Basic', 'preop', 'v1', true
  where not exists (
    select 1 from public.checklist_templates where name = 'Pre-Op Basic' and type = 'preop' and version = 'v1'
  )
  returning id into template_id_val;

  -- Get template ID (either newly created or existing)
  if template_id_val is null then
    select id into template_id_val from public.checklist_templates where name = 'Pre-Op Basic' and type = 'preop' and version = 'v1' limit 1;
  end if;

  -- Insert template items if template exists and has no items yet
  if template_id_val is not null and not exists (
    select 1 from public.checklist_template_items where template_id = template_id_val
  ) then
    insert into public.checklist_template_items (template_id, label, sort_order) values
      (template_id_val, 'Complete Blood Count (CBC)', 1),
      (template_id_val, 'Coagulation studies (PT/INR, PTT)', 2),
      (template_id_val, 'Electrocardiogram (ECG)', 3),
      (template_id_val, 'Chest X-ray (if indicated)', 4),
      (template_id_val, 'Fasting instructions reviewed', 5),
      (template_id_val, 'Medication review completed', 6),
      (template_id_val, 'Consent form signed', 7),
      (template_id_val, 'Anesthesia assessment pending', 8),
      (template_id_val, 'Pre-op labs reviewed', 9),
      (template_id_val, 'Allergies confirmed', 10),
      (template_id_val, 'Surgical site marked (if applicable)', 11),
      (template_id_val, 'Pre-op instructions provided to patient', 12);
  end if;
end$$;

-- Post-Op & Follow-up Plan MVP: template-driven episode tasks
-- Single-clinic pilot: RLS allows authenticated to SELECT/INSERT/UPDATE; DELETE denied.

create extension if not exists pgcrypto;

-- 1) Follow-up templates
create table if not exists public.followup_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  version text not null default 'v1',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 2) Template items
create table if not exists public.followup_template_items (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.followup_templates(id) on delete cascade,
  title text not null,
  offset_days int not null,
  channel text not null default 'internal',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists followup_template_items_template_id_idx on public.followup_template_items (template_id);
create index if not exists followup_template_items_sort_order_idx on public.followup_template_items (sort_order);

-- 3) Episode follow-up plans (one per episode)
create table if not exists public.episode_followup_plans (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references public.episodes(id) on delete cascade,
  template_id uuid not null references public.followup_templates(id),
  created_at timestamptz not null default now(),
  unique(episode_id)
);

create index if not exists episode_followup_plans_episode_id_idx on public.episode_followup_plans (episode_id);
create index if not exists episode_followup_plans_template_id_idx on public.episode_followup_plans (template_id);

-- 4) Episode tasks
create table if not exists public.episode_tasks (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references public.episodes(id) on delete cascade,
  plan_id uuid null references public.episode_followup_plans(id) on delete set null,
  title text not null,
  due_at timestamptz not null,
  status text not null default 'pending' check (status in ('pending', 'done', 'skipped')),
  completed_at timestamptz null,
  completed_by uuid null references auth.users(id),
  notes text null,
  created_at timestamptz not null default now()
);

create index if not exists episode_tasks_episode_id_idx on public.episode_tasks (episode_id);
create index if not exists episode_tasks_due_at_idx on public.episode_tasks (due_at);
create index if not exists episode_tasks_status_idx on public.episode_tasks (status);

-- RLS
alter table public.followup_templates enable row level security;
alter table public.followup_template_items enable row level security;
alter table public.episode_followup_plans enable row level security;
alter table public.episode_tasks enable row level security;

-- Policies: SELECT/INSERT/UPDATE for authenticated; DELETE denied
do $$
begin
  -- followup_templates
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'followup_templates' and policyname = 'followup_templates_select_authenticated'
  ) then
    create policy followup_templates_select_authenticated on public.followup_templates for select to authenticated using (true);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'followup_templates' and policyname = 'followup_templates_insert_authenticated'
  ) then
    create policy followup_templates_insert_authenticated on public.followup_templates for insert to authenticated with check (true);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'followup_templates' and policyname = 'followup_templates_update_authenticated'
  ) then
    create policy followup_templates_update_authenticated on public.followup_templates for update to authenticated using (true) with check (true);
  end if;

  -- followup_template_items
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'followup_template_items' and policyname = 'followup_template_items_select_authenticated'
  ) then
    create policy followup_template_items_select_authenticated on public.followup_template_items for select to authenticated using (true);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'followup_template_items' and policyname = 'followup_template_items_insert_authenticated'
  ) then
    create policy followup_template_items_insert_authenticated on public.followup_template_items for insert to authenticated with check (true);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'followup_template_items' and policyname = 'followup_template_items_update_authenticated'
  ) then
    create policy followup_template_items_update_authenticated on public.followup_template_items for update to authenticated using (true) with check (true);
  end if;

  -- episode_followup_plans
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'episode_followup_plans' and policyname = 'episode_followup_plans_select_authenticated'
  ) then
    create policy episode_followup_plans_select_authenticated on public.episode_followup_plans for select to authenticated using (true);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'episode_followup_plans' and policyname = 'episode_followup_plans_insert_authenticated'
  ) then
    create policy episode_followup_plans_insert_authenticated on public.episode_followup_plans for insert to authenticated with check (true);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'episode_followup_plans' and policyname = 'episode_followup_plans_update_authenticated'
  ) then
    create policy episode_followup_plans_update_authenticated on public.episode_followup_plans for update to authenticated using (true) with check (true);
  end if;

  -- episode_tasks
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'episode_tasks' and policyname = 'episode_tasks_select_authenticated'
  ) then
    create policy episode_tasks_select_authenticated on public.episode_tasks for select to authenticated using (true);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'episode_tasks' and policyname = 'episode_tasks_insert_authenticated'
  ) then
    create policy episode_tasks_insert_authenticated on public.episode_tasks for insert to authenticated with check (true);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'episode_tasks' and policyname = 'episode_tasks_update_authenticated'
  ) then
    create policy episode_tasks_update_authenticated on public.episode_tasks for update to authenticated using (true) with check (true);
  end if;
end$$;

-- Seed: Post-Op Standard template (idempotent)
do $$
declare
  template_id_val uuid;
begin
  -- Create template if not exists
  insert into public.followup_templates (name, version, is_active)
  select 'Post-Op Standard', 'v1', true
  where not exists (
    select 1 from public.followup_templates where name = 'Post-Op Standard' and version = 'v1'
  )
  returning id into template_id_val;

  -- Get template ID (either newly created or existing)
  if template_id_val is null then
    select id into template_id_val from public.followup_templates where name = 'Post-Op Standard' and version = 'v1' limit 1;
  end if;

  -- Insert template items if template exists and has no items yet
  if template_id_val is not null and not exists (
    select 1 from public.followup_template_items where template_id = template_id_val
  ) then
    insert into public.followup_template_items (template_id, title, offset_days, channel, sort_order) values
      (template_id_val, 'Post-op day 1 check-in', 1, 'internal', 1),
      (template_id_val, 'Wound assessment (day 3)', 3, 'internal', 2),
      (template_id_val, 'Week 1 follow-up', 7, 'internal', 3),
      (template_id_val, 'Suture removal (if applicable)', 14, 'internal', 4),
      (template_id_val, '2-week progress review', 14, 'internal', 5),
      (template_id_val, '1-month follow-up', 30, 'internal', 6),
      (template_id_val, 'Final assessment (if needed)', 60, 'internal', 7);
  end if;
end$$;

create table public.organization_listening_settings (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  reminders_enabled boolean not null default false,
  reminder_times text[] not null default array['09:00', '13:00', '17:00']::text[],
  max_daily_measurements smallint not null default 3 check (max_daily_measurements between 3 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (cardinality(reminder_times) between 1 and 5)
);

alter table public.organization_listening_settings enable row level security;

create policy "organization_listening_settings: member select"
  on public.organization_listening_settings for select
  using (organization_id in (select public.user_organization_ids()));

create policy "organization_listening_settings: owner/manager insert"
  on public.organization_listening_settings for insert
  with check (
    organization_id in (
      select organization_id from public.organization_members
      where user_id = auth.uid()
      and role in ('owner', 'manager')
    )
  );

create policy "organization_listening_settings: owner/manager update"
  on public.organization_listening_settings for update
  using (
    organization_id in (
      select organization_id from public.organization_members
      where user_id = auth.uid()
      and role in ('owner', 'manager')
    )
  )
  with check (
    organization_id in (
      select organization_id from public.organization_members
      where user_id = auth.uid()
      and role in ('owner', 'manager')
    )
  );

grant select, insert, update on public.organization_listening_settings to authenticated;
grant all on public.organization_listening_settings to service_role;

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null,
  endpoint text not null,
  subscription jsonb not null,
  user_agent text,
  device_label text,
  last_seen_at timestamptz not null default timezone('utc', now()),
  last_success_at timestamptz,
  last_error_at timestamptz,
  disabled_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint push_subscriptions_endpoint_key unique (endpoint)
);

create index push_subscriptions_org_user_idx
  on public.push_subscriptions (organization_id, user_id)
  where disabled_at is null;

alter table public.push_subscriptions enable row level security;

grant select, insert, update, delete on public.push_subscriptions to authenticated;

create policy "push_subscriptions: own select"
  on public.push_subscriptions for select
  using (auth.uid() = user_id);

create policy "push_subscriptions: own insert"
  on public.push_subscriptions for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.organization_members om
      where om.user_id = auth.uid()
        and om.organization_id = push_subscriptions.organization_id
    )
  );

create policy "push_subscriptions: own update"
  on public.push_subscriptions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "push_subscriptions: own delete"
  on public.push_subscriptions for delete
  using (auth.uid() = user_id);

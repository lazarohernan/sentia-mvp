create table public.organization_roles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 2 and 80),
  permissions text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    permissions <@ array[
      'summary',
      'comments',
      'alerts',
      'branches',
      'team',
      'settings',
      'listening'
    ]::text[]
  ),
  check (cardinality(permissions) > 0)
);

create unique index organization_roles_org_lower_name_uidx
  on public.organization_roles (organization_id, lower(name));

create index organization_roles_organization_id_idx
  on public.organization_roles (organization_id);

alter table public.organization_roles enable row level security;

create policy "organization_roles: member select"
  on public.organization_roles for select
  using (organization_id in (select public.user_organization_ids()));

create policy "organization_roles: owner/manager insert"
  on public.organization_roles for insert
  with check (
    organization_id in (
      select organization_id from public.organization_members
      where user_id = auth.uid()
      and role in ('owner', 'manager')
    )
  );

create policy "organization_roles: owner/manager update"
  on public.organization_roles for update
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

create policy "organization_roles: owner/manager delete"
  on public.organization_roles for delete
  using (
    organization_id in (
      select organization_id from public.organization_members
      where user_id = auth.uid()
      and role in ('owner', 'manager')
    )
  );

grant select, insert, update, delete on public.organization_roles to authenticated;
grant all on public.organization_roles to service_role;

alter table public.organization_members
  add column organization_role_id uuid references public.organization_roles(id) on delete set null;

create index organization_members_organization_role_id_idx
  on public.organization_members (organization_role_id);

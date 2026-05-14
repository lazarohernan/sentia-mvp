-- ============================================================
-- 11. NOTIFICATIONS
-- Executive and operational summaries persisted per organization.
-- ============================================================
create table public.notifications (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations on delete cascade,
  branch_id         uuid references public.branches on delete set null,
  audience_type     text not null check (audience_type in ('organization', 'role', 'user')),
  audience_role     text check (audience_role in ('owner', 'manager', 'collaborator')),
  recipient_user_id uuid references public.profiles on delete cascade,
  category          text not null check (category in ('summary', 'alert', 'digest', 'task')),
  tone              text not null check (tone in ('success', 'warning', 'danger')),
  title             text not null check (char_length(title) between 3 and 160),
  detail            text not null check (char_length(detail) between 3 and 1000),
  href              text,
  metadata          jsonb not null default '{}'::jsonb,
  source_table      text,
  source_id         uuid,
  is_read           boolean not null default false,
  read_at           timestamptz,
  created_at        timestamptz not null default now(),
  constraint notifications_audience_target_check check (
    (audience_type = 'organization' and audience_role is null and recipient_user_id is null)
    or (audience_type = 'role' and audience_role is not null and recipient_user_id is null)
    or (audience_type = 'user' and audience_role is null and recipient_user_id is not null)
  ),
  constraint notifications_read_state_check check (
    (is_read = false and read_at is null)
    or (is_read = true and read_at is not null)
  )
);

create index notifications_organization_created_idx
  on public.notifications (organization_id, created_at desc);

create index notifications_recipient_created_idx
  on public.notifications (recipient_user_id, created_at desc)
  where recipient_user_id is not null;

create index notifications_branch_created_idx
  on public.notifications (branch_id, created_at desc)
  where branch_id is not null;

create index notifications_unread_idx
  on public.notifications (organization_id, is_read, created_at desc);

alter table public.notifications enable row level security;

create policy "notifications: accessible recipient select"
  on public.notifications for select
  using (
    organization_id in (select public.user_organization_ids())
    and (
      audience_type = 'organization'
      or (
        audience_type = 'role'
        and exists (
          select 1
          from public.organization_members om
          where om.user_id = auth.uid()
            and om.organization_id = notifications.organization_id
            and om.role = notifications.audience_role
        )
      )
      or (
        audience_type = 'user'
        and recipient_user_id = auth.uid()
      )
    )
  );

create policy "notifications: owner/manager insert"
  on public.notifications for insert
  with check (
    organization_id in (
      select organization_id
      from public.organization_members
      where user_id = auth.uid()
        and role in ('owner', 'manager')
    )
  );

create policy "notifications: owner/manager update"
  on public.notifications for update
  using (
    organization_id in (
      select organization_id
      from public.organization_members
      where user_id = auth.uid()
        and role in ('owner', 'manager')
    )
  )
  with check (
    organization_id in (
      select organization_id
      from public.organization_members
      where user_id = auth.uid()
        and role in ('owner', 'manager')
    )
  );

create policy "notifications: owner/manager delete"
  on public.notifications for delete
  using (
    organization_id in (
      select organization_id
      from public.organization_members
      where user_id = auth.uid()
        and role in ('owner', 'manager')
    )
  );

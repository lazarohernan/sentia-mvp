-- ============================================================
-- RLS hardening: functions, feedback ingress, notifications, indexes
-- ============================================================

-- 1. Harden helper + onboarding RPC (fixed search_path, input validation)
create or replace function public.user_organization_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id
  from public.organization_members
  where user_id = auth.uid()
$$;

create or replace function public.create_user_organization(
  p_full_name   text,
  p_org_name    text,
  p_org_slug    text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_full_name text := trim(p_full_name);
  v_org_name text := trim(p_org_name);
  v_org_slug text := lower(trim(p_org_slug));
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if length(v_full_name) < 2 or length(v_full_name) > 120 then
    raise exception 'Invalid full name';
  end if;

  if length(v_org_name) < 2 or length(v_org_name) > 120 then
    raise exception 'Invalid organization name';
  end if;

  if v_org_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' or length(v_org_slug) < 2 then
    raise exception 'Invalid organization slug';
  end if;

  insert into public.profiles (id, full_name)
  values (auth.uid(), v_full_name)
  on conflict (id) do update
    set full_name = excluded.full_name;

  insert into public.organizations (name, slug)
  values (v_org_name, v_org_slug)
  returning id into v_org_id;

  insert into public.organization_members (user_id, organization_id, role)
  values (auth.uid(), v_org_id, 'owner');

  return v_org_id;
end;
$$;

revoke all on function public.user_organization_ids() from public;
revoke all on function public.create_user_organization(text, text, text) from public;

grant execute on function public.user_organization_ids() to authenticated, service_role;
grant execute on function public.create_user_organization(text, text, text) to authenticated, service_role;

-- 2. Feedback: block direct client inserts (API uses service_role)
drop policy if exists "feedback_submissions: anon insert" on public.feedback_submissions;

-- 3. Notifications: allow org members to persist org-wide operational summaries
create policy "notifications: member insert org summaries"
  on public.notifications for insert
  with check (
    organization_id in (select public.user_organization_ids())
    and audience_type = 'organization'
    and audience_role is null
    and recipient_user_id is null
    and category in ('summary', 'alert', 'digest')
    and char_length(title) between 3 and 160
    and char_length(detail) between 3 and 1000
  );

-- Prevent duplicate persisted notifications per organization
create unique index if not exists notifications_org_dedupe_key_uidx
  on public.notifications (organization_id, ((metadata->>'dedupe_key')))
  where (metadata->>'dedupe_key') is not null;

-- 4. RLS performance indexes (policy hot paths)
create index if not exists organization_members_user_id_idx
  on public.organization_members (user_id);

create index if not exists branches_organization_id_idx
  on public.branches (organization_id);

create index if not exists feedback_submissions_branch_id_idx
  on public.feedback_submissions (branch_id);

create index if not exists feedback_submissions_branch_created_idx
  on public.feedback_submissions (branch_id, created_at desc);

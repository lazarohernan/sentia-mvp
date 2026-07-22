-- ============================================================
-- Harden grants, RPC self-registration, and storage listing
-- Does not delete data. Invite-only: create_user_organization
-- is no longer callable by authenticated clients.
-- ============================================================

-- 1) Public tables: anon should not hold table privileges.
--    Public feedback writes go through service_role APIs.
do $$
declare
  r record;
begin
  for r in
    select tablename
    from pg_tables
    where schemaname = 'public'
  loop
    execute format('revoke all on table public.%I from anon', r.tablename);
  end loop;
end $$;

-- Keep authenticated privileges needed by PostgREST + RLS.
-- (Default grants already exist; reaffirm common DML without TRUNCATE/REFERENCES noise.)
do $$
declare
  r record;
begin
  for r in
    select tablename
    from pg_tables
    where schemaname = 'public'
  loop
    execute format(
      'revoke truncate, references, trigger on table public.%I from authenticated',
      r.tablename
    );
  end loop;
end $$;

-- 2) Self-serve org creation: invite-only product.
--    Keep function for possible service_role/admin use; block client RPC.
revoke all on function public.create_user_organization(text, text, text) from public;
revoke all on function public.create_user_organization(text, text, text) from anon;
revoke all on function public.create_user_organization(text, text, text) from authenticated;
grant execute on function public.create_user_organization(text, text, text) to service_role;

-- RLS helper must remain callable by authenticated (used in policies).
revoke all on function public.user_organization_ids() from public;
revoke all on function public.user_organization_ids() from anon;
grant execute on function public.user_organization_ids() to authenticated, service_role;

-- 3) Storage: public bucket URLs do not need a broad SELECT policy that allows listing.
drop policy if exists "organization logos: public read" on storage.objects;

-- Members can still read their org folder when authenticated (dashboard preview).
create policy "organization logos: member read own org"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'organization-logos'
    and exists (
      select 1
      from public.organization_members om
      where om.user_id = auth.uid()
        and (storage.foldername(name))[1] = om.organization_id::text
    )
  );

-- 4) Hot-path FK indexes flagged by advisors (safe, non-destructive).
create index if not exists feedback_submissions_assigned_user_id_idx
  on public.feedback_submissions (assigned_user_id)
  where assigned_user_id is not null;

create index if not exists feedback_follow_up_actions_actor_user_id_idx
  on public.feedback_follow_up_actions (actor_user_id)
  where actor_user_id is not null;

create index if not exists feedback_follow_up_actions_organization_id_idx
  on public.feedback_follow_up_actions (organization_id);

create index if not exists agent_reports_actor_user_id_idx
  on public.agent_reports (actor_user_id)
  where actor_user_id is not null;

-- Allow organization members to read basic profile info of teammates.
create policy "profiles: org member select"
  on public.profiles for select
  using (
    id in (
      select om.user_id
      from public.organization_members om
      where om.organization_id in (select public.user_organization_ids())
    )
  );

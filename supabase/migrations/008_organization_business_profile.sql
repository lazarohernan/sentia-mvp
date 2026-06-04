-- ============================================================
-- Organization business profile + logo storage
-- ============================================================

alter table public.organizations
  add column if not exists logo_url text,
  add column if not exists tagline text,
  add column if not exists description text,
  add column if not exists contact_email text,
  add column if not exists contact_phone text,
  add column if not exists website_url text,
  add column if not exists address text;

create policy "organizations: owner/manager update"
  on public.organizations for update
  using (
    id in (
      select organization_id
      from public.organization_members
      where user_id = auth.uid()
        and role in ('owner', 'manager')
    )
  )
  with check (
    id in (
      select organization_id
      from public.organization_members
      where user_id = auth.uid()
        and role in ('owner', 'manager')
    )
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'organization-logos',
  'organization-logos',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "organization logos: public read"
  on storage.objects for select
  using (bucket_id = 'organization-logos');

create policy "organization logos: owner/manager insert"
  on storage.objects for insert
  with check (
    bucket_id = 'organization-logos'
    and auth.uid() is not null
    and exists (
      select 1
      from public.organization_members om
      where om.user_id = auth.uid()
        and om.role in ('owner', 'manager')
        and (storage.foldername(name))[1] = om.organization_id::text
    )
  );

create policy "organization logos: owner/manager update"
  on storage.objects for update
  using (
    bucket_id = 'organization-logos'
    and auth.uid() is not null
    and exists (
      select 1
      from public.organization_members om
      where om.user_id = auth.uid()
        and om.role in ('owner', 'manager')
        and (storage.foldername(name))[1] = om.organization_id::text
    )
  )
  with check (
    bucket_id = 'organization-logos'
    and auth.uid() is not null
    and exists (
      select 1
      from public.organization_members om
      where om.user_id = auth.uid()
        and om.role in ('owner', 'manager')
        and (storage.foldername(name))[1] = om.organization_id::text
    )
  );

create policy "organization logos: owner/manager delete"
  on storage.objects for delete
  using (
    bucket_id = 'organization-logos'
    and auth.uid() is not null
    and exists (
      select 1
      from public.organization_members om
      where om.user_id = auth.uid()
        and om.role in ('owner', 'manager')
        and (storage.foldername(name))[1] = om.organization_id::text
    )
  );

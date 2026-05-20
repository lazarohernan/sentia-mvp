-- Allow organization members to mark accessible notifications as read.
create policy "notifications: accessible recipient mark read"
  on public.notifications for update
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
  )
  with check (
    organization_id in (select public.user_organization_ids())
    and is_read = true
    and read_at is not null
  );

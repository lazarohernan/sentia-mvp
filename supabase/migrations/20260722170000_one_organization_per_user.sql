-- Un usuario pertenece a un solo negocio.
-- Antes el PK era (user_id, organization_id) y permitía multi-org.

create unique index if not exists organization_members_user_id_uidx
  on public.organization_members (user_id);
